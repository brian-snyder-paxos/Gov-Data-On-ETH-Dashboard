import Link from "next/link";
import { getContractData, CONTRACT_ADDRESS } from "@/lib/getContractData";

export const dynamic = "force-dynamic";

export default async function Home() {
	let data: Awaited<ReturnType<typeof getContractData>> | null = null;
	let errorMessage: string | null = null;
	try {
		data = await getContractData();
	} catch (err: unknown) {
		errorMessage = (err as Error)?.message || "Failed to load contract data.";
	}

	const badge = (status: NonNullable<typeof data>["verification"]["status"]) => {
		switch (status) {
			case "VERIFIED":
				return (
					<span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/30 px-2 py-1 text-xs font-medium">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
							<path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-7.5 9.5a.75.75 0 0 1-1.127.06l-3.5-3.75a.75.75 0 1 1 1.09-1.03l2.893 3.1 6.963-8.82a.75.75 0 0 1 1.038-.112Z" clipRule="evenodd" />
						</svg>
						VERIFIED
					</span>
				);
			case "MISMATCH":
				return (
					<span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-1 text-xs font-medium">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
							<path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm2.28-10.78a.75.75 0 0 0-1.06-1.06L10 7.94 8.78 6.72a.75.75 0 1 0-1.06 1.06L8.94 9l-1.22 1.22a.75.75 0 1 0 1.06 1.06L10 10.06l1.22 1.22a.75.75 0 1 0 1.06-1.06L11.06 9l1.22-1.22Z" clipRule="evenodd" />
						</svg>
						MISMATCH
					</span>
				);
			case "SOURCE_MISSING":
			default:
				return (
					<span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 px-2 py-1 text-xs font-medium">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
							<path fillRule="evenodd" d="M8.485 2.495a2 2 0 0 1 3.03 0l6.364 7.071a2 2 0 0 1-1.515 3.333H3.636A2 2 0 0 1 2.12 9.566l6.364-7.07ZM10 7a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 10 7Zm0 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
						</svg>
						SOURCE_MISSING
					</span>
				);
		}
	};

	return (
		<div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
			<div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur p-6 md:p-8 shadow-xl">
				<header className="mb-6">
					<h1 className="text-2xl md:text-3xl font-semibold tracking-tight">On-Chain Economic Record</h1>
					<p className="mt-1 text-sm text-neutral-400">
						Contract: <span className="font-mono">HashStorage</span> · {" "}
						<Link href={`https://etherscan.io/address/${CONTRACT_ADDRESS}`} className="text-sky-400 hover:underline" target="_blank" rel="noreferrer">
							View on Etherscan
						</Link>
					</p>
				</header>

				{errorMessage ? (
					<div className="rounded-lg border border-red-500/30 bg-red-950/30 text-red-300 p-4">
						<div className="font-medium">Failed to read on-chain data</div>
						<div className="mt-1 text-sm break-all">{errorMessage}</div>
						<p className="mt-2 text-xs text-red-400/80">Check your RPC_URL and that the address is a deployed contract on Ethereum mainnet.</p>
					</div>
				) : (
					<>
						<section className="text-center mb-8">
							<div className="text-6xl md:text-7xl font-extrabold tracking-tight">{data!.gdpFigure.toFixed(1)}</div>
							<div className="mt-2 text-neutral-400">{data!.interpretation}</div>
						</section>

						<section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
							<div className="rounded-lg border border-white/10 p-4 bg-neutral-900/60">
								<div className="text-xs uppercase text-neutral-400">Record Date (UTC)</div>
								<div className="mt-1 font-mono">{data!.recordDateUTC}</div>
							</div>
							<div className="rounded-lg border border-white/10 p-4 bg-neutral-900/60 md:col-span-2">
								<div className="text-xs uppercase text-neutral-400">On-Chain Hash</div>
								<div className="mt-1 font-mono break-all">{data!.onChainHash}</div>
							</div>
							<div className="rounded-lg border border-white/10 p-4 bg-neutral-900/60">
								<div className="text-xs uppercase text-neutral-400">Raw Integer</div>
								<div className="mt-1 font-mono">{data!.gdpRaw}</div>
							</div>
						</section>

						<section className="rounded-lg border border-white/10 p-4 bg-neutral-900/60">
							<div className="flex items-center justify-between flex-wrap gap-3">
								<div>
									<div className="text-xs uppercase text-neutral-400">Source</div>
									<a href={data!.pdfUrl} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline break-all">{data!.pdfUrl}</a>
								</div>
								<div>{badge(data!.verification.status)}</div>
							</div>
							{data!.verification.computedHash && (
								<div className="mt-3">
									<div className="text-xs uppercase text-neutral-400">Computed Hash</div>
									<div className="mt-1 font-mono break-all text-neutral-300">{data!.verification.computedHash}</div>
								</div>
							)}
						</section>
					</>
				)}
			</div>
		</div>
	);
}
