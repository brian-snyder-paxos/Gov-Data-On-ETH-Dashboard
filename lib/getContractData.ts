import "server-only";

import axios from "axios";
import { JsonRpcProvider, Contract } from "ethers";
import crypto from "node:crypto";

export const CONTRACT_ADDRESS = "0x36ccdF11044f60F196e981970d592a7DE567ed7b" as const;
export const PDF_URL = "https://www.bea.gov/sites/default/files/2025-08/gdp2q25-2nd.pdf" as const;
export const INTERPRETATION_RULE = "Increments of tenths" as const;
export const CONTRACT_ABI = [
	"function gdp_q2_2025() view returns (uint256)",
	"function gdp_pdf_hash() view returns (bytes32)",
	"function timestamp() view returns (uint256)",
] as const;

export type ContractData = {
	gdpFigure: number; // 3.3
	gdpRaw: string; // "33"
	interpretation: string; // "Increments of tenths"
	recordDateUTC: string; // formatted date string
	onChainHash: string; // 0x... hash from the contract
	pdfUrl: string; // The PDF URL
	verification: {
		status: "VERIFIED" | "MISMATCH" | "SOURCE_MISSING";
		computedHash: string | null; // The hash computed from the fetch, or null on error
	};
};

function assertEnv(name: string, value: string | undefined): string {
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

export async function getContractData(): Promise<ContractData> {
	const rpcUrl = assertEnv("RPC_URL", process.env.RPC_URL);

	const provider = new JsonRpcProvider(rpcUrl);
	const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

	// Ensure there is actually contract code at the address on this chain
	const code = await provider.getCode(CONTRACT_ADDRESS);
	if (!code || code === "0x") {
		throw new Error("No contract bytecode found at address on this chain. Verify CONTRACT_ADDRESS and RPC_URL (Ethereum mainnet).");
	}

	let gdpRawBig: bigint;
	let hashBytes32: string;
	let tsBig: bigint;
	try {
		[gdpRawBig, hashBytes32, tsBig] = await Promise.all([
			contract.gdp_q2_2025(),
			contract.gdp_pdf_hash(),
			contract.timestamp(),
		]);
	} catch (err: any) {
		const msg = err?.reason || err?.shortMessage || err?.message || "On-chain call failed";
		throw new Error(`On-chain read failed: ${msg}`);
	}

	const timestampMs = Number(tsBig) * 1000;
	const recordDateUTC = new Date(timestampMs).toUTCString();

	const gdpRaw = gdpRawBig.toString();
	const gdpFigure = Number(gdpRawBig) / 10;
	const onChainHash = hashBytes32; // already 0x... string

	let status: ContractData["verification"]["status"] = "SOURCE_MISSING";
	let computedHash: string | null = null;

	try {
		const response = await axios.get<ArrayBuffer>(PDF_URL, { responseType: "arraybuffer" });
		if (response.status === 200) {
			const buffer = Buffer.from(response.data as ArrayBuffer);
			computedHash = crypto.createHash("sha256").update(buffer).digest("hex");
			const normalizedOnChain = onChainHash.replace(/^0x/, "").toLowerCase();
			status = computedHash === normalizedOnChain ? "VERIFIED" : "MISMATCH";
		} else {
			status = "SOURCE_MISSING";
		}
	} catch {
		status = "SOURCE_MISSING";
		computedHash = null;
	}

	return {
		gdpFigure,
		gdpRaw,
		interpretation: INTERPRETATION_RULE,
		recordDateUTC,
		onChainHash,
		pdfUrl: PDF_URL,
		verification: { status, computedHash },
	};
} 