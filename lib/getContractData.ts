import "server-only";

import axios from "axios";
import { JsonRpcProvider, Contract } from "ethers";
import crypto from "node:crypto";

export const CONTRACT_ADDRESS = "0x36ccdF11044f60F196e981970d592a7DE567ed7b" as const;
export const PDF_URL = "https://www.bea.gov/sites/default/files/2025-08/gdp2q25-2nd.pdf" as const;
export const INTERPRETATION_RULE = "Quarterly GDP Growth (Annualized)" as const;

// Enhanced ABI for quarterly data (Q1 2025 removed as data unavailable)
export const CONTRACT_ABI = [
	"function gdp_q2_2025() view returns (uint256)",
	"function gdp_q3_2025() view returns (uint256)",
	"function gdp_q4_2025() view returns (uint256)",
	"function gdp_pdf_hash() view returns (bytes32)",
	"function timestamp() view returns (uint256)",
] as const;

export type QuarterData = {
	quarter: string; // "Q2 2025"
	gdpGrowthRate: number; // 3.3 (as percentage)
	gdpRaw: string; // "33"
	isAvailable: boolean; // whether this quarter has data
	recordDateUTC?: string; // when this quarter was recorded
};

export type ContractData = {
	currentQuarter: QuarterData;
	quarters: QuarterData[]; // All available quarters
	interpretation: string;
	onChainHash: string;
	pdfUrl: string;
	verification: {
		status: "VERIFIED" | "MISMATCH" | "SOURCE_MISSING";
		computedHash: string | null;
	};
	metadata: {
		lastUpdated: string;
		contractAddress: string;
		dataSource: string;
	};
};

function assertEnv(name: string, value: string | undefined): string {
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

function getErrorMessage(err: unknown): string {
	if (err && typeof err === 'object') {
		if ('reason' in err && typeof err.reason === 'string') return err.reason;
		if ('shortMessage' in err && typeof err.shortMessage === 'string') return err.shortMessage;
		if ('message' in err && typeof err.message === 'string') return err.message;
	}
	return "On-chain call failed";
}

async function fetchQuarterData(contract: Contract, quarterFunction: string, quarterLabel: string): Promise<QuarterData> {
	try {
		const rawValue: bigint = await contract[quarterFunction]();
		const gdpGrowthRate = Number(rawValue) / 10;
		return {
			quarter: quarterLabel,
			gdpGrowthRate,
			gdpRaw: rawValue.toString(),
			isAvailable: true,
		};
	} catch {
		return {
			quarter: quarterLabel,
			gdpGrowthRate: 0,
			gdpRaw: "0",
			isAvailable: false,
		};
	}
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

	// Fetch all quarterly data
	const [q2Data, q3Data, q4Data] = await Promise.all([
		fetchQuarterData(contract, "gdp_q2_2025", "Q2 2025"),
		fetchQuarterData(contract, "gdp_q3_2025", "Q3 2025"),
		fetchQuarterData(contract, "gdp_q4_2025", "Q4 2025"),
	]);

	// Find the most recent quarter with data
	const quarters = [q2Data, q3Data, q4Data];
	const availableQuarters = quarters.filter(q => q.isAvailable);
	const currentQuarter = availableQuarters[availableQuarters.length - 1] || q2Data;

	// Get metadata (timestamp and hash from the most recent quarter)
	let hashBytes32: string;
	let tsBig: bigint;
	try {
		[hashBytes32, tsBig] = await Promise.all([
			contract.gdp_pdf_hash(),
			contract.timestamp(),
		]);
	} catch (err: unknown) {
		const msg = getErrorMessage(err);
		throw new Error(`On-chain read failed: ${msg}`);
	}

	const timestampMs = Number(tsBig) * 1000;
	const recordDateUTC = new Date(timestampMs).toUTCString();
	
	// Add timestamp to current quarter
	if (currentQuarter.isAvailable) {
		currentQuarter.recordDateUTC = recordDateUTC;
	}

	const onChainHash = hashBytes32;

	// PDF verification (same as before)
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
		currentQuarter,
		quarters: quarters.filter(q => q.isAvailable),
		interpretation: INTERPRETATION_RULE,
		onChainHash,
		pdfUrl: PDF_URL,
		verification: { status, computedHash },
		metadata: {
			lastUpdated: recordDateUTC,
			contractAddress: CONTRACT_ADDRESS,
			dataSource: "U.S. Bureau of Economic Analysis",
		},
	};
} 