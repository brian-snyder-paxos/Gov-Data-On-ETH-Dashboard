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
							<path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 000 16Zm2.28-10.78a.75.75 0 0 0-1.06-1.06L10 7.94 8.78 6.72a.75.75 0 1 0-1.06 1.06L8.94 9l-1.22 1.22a.75.75 0 1 0 1.06 1.06L10 10.06l1.22 1.22a.75.75 0 1 0 1.06-1.06L11.06 9l1.22-1.22Z" clipRule="evenodd" />
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

	const formatGrowthRate = (rate: number): string => {
		const sign = rate >= 0 ? "+" : "";
		return `${sign}${rate.toFixed(1)}%`;
	};

	const getGrowthColor = (rate: number): string => {
		if (rate > 3) return "text-green-400";
		if (rate > 1) return "text-blue-400";
		if (rate > 0) return "text-yellow-400";
		return "text-red-400";
	};

	const QuarterlyChart = ({ quarters }: { quarters: NonNullable<typeof data>["quarters"] }) => {
		const maxRate = Math.max(...quarters.map(q => Math.abs(q.gdpGrowthRate)));
		const scale = 100 / Math.max(maxRate, 4); // Minimum scale for visibility

		return (
			<div className="bg-neutral-900/40 rounded-lg p-6 border border-white/5">
				<h3 className="text-sm font-medium text-neutral-300 mb-4">Quarterly GDP Growth (Annualized)</h3>
				<div className="flex items-end justify-between gap-2 h-32">
					{quarters.map((quarter, index) => {
						const height = Math.abs(quarter.gdpGrowthRate) * scale;
						const isPositive = quarter.gdpGrowthRate >= 0;
						
						return (
							<div key={quarter.quarter} className="flex-1 flex flex-col items-center gap-2">
								<div className="relative flex-1 flex items-end justify-center w-full">
									<div 
										className={`w-full max-w-8 rounded-t transition-all duration-500 ${
											isPositive 
												? "bg-gradient-to-t from-green-600 to-green-400" 
												: "bg-gradient-to-t from-red-600 to-red-400"
										}`}
										style={{ height: `${Math.max(height, 4)}%` }}
									/>
								</div>
								<div className="text-center">
									<div className={`text-sm font-medium ${getGrowthColor(quarter.gdpGrowthRate)}`}>
										{formatGrowthRate(quarter.gdpGrowthRate)}
									</div>
									<div className="text-xs text-neutral-500 mt-1">
										{quarter.quarter}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100">
			<div className="container mx-auto px-6 py-8 max-w-6xl">
				{/* Header */}
				<header className="mb-8">
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
						<div>
							<h1 className="text-3xl md:text-4xl font-bold tracking-tight">
								US GDP Growth
							</h1>
							<p className="text-neutral-400 mt-1">
								Real-time on-chain economic data verification
							</p>
						</div>
						<div className="text-right">
							<Link 
								href={`https://etherscan.io/address/${CONTRACT_ADDRESS}`} 
								className="inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 transition-colors text-sm"
								target="_blank" 
								rel="noreferrer"
							>
								<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
									<path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
									<path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
								</svg>
								View Contract
							</Link>
						</div>
					</div>
				</header>

				{errorMessage ? (
					<div className="rounded-xl border border-red-500/30 bg-red-950/20 text-red-300 p-6">
						<div className="flex items-start gap-3">
							<svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
							</svg>
							<div>
								<div className="font-semibold">Failed to read on-chain data</div>
								<div className="mt-2 text-sm opacity-90">{errorMessage}</div>
								<p className="mt-3 text-xs text-red-400/80">
									Check your RPC_URL and ensure the contract is deployed on Ethereum mainnet.
								</p>
							</div>
						</div>
					</div>
				) : (
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* Current Quarter - Hero Section */}
						<div className="lg:col-span-2">
							<div className="bg-neutral-900/40 backdrop-blur rounded-xl border border-white/10 p-8">
								<div className="text-center">
									<div className="text-sm text-neutral-400 mb-2">
										{data!.currentQuarter.quarter} • {data!.interpretation}
									</div>
									<div className={`text-7xl md:text-8xl font-black tracking-tight mb-4 ${getGrowthColor(data!.currentQuarter.gdpGrowthRate)}`}>
										{formatGrowthRate(data!.currentQuarter.gdpGrowthRate)}
									</div>
									<div className="text-neutral-300 text-lg">
										Annualized growth rate
									</div>
									{data!.currentQuarter.recordDateUTC && (
										<div className="text-neutral-500 text-sm mt-2">
											Recorded: {new Date(data!.currentQuarter.recordDateUTC).toLocaleDateString('en-US', {
												year: 'numeric',
												month: 'long',
												day: 'numeric'
											})}
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Data Source & Verification */}
						<div className="space-y-6">
							<div className="bg-neutral-900/40 rounded-xl border border-white/10 p-6">
								<h3 className="text-sm font-medium text-neutral-300 mb-4">Data Verification</h3>
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-neutral-400 text-sm">Status</span>
										{badge(data!.verification.status)}
									</div>
									<div>
										<div className="text-neutral-400 text-xs mb-1">Source</div>
										<a 
											href={data!.pdfUrl} 
											target="_blank" 
											rel="noreferrer" 
											className="text-sky-400 hover:text-sky-300 transition-colors text-sm break-all"
										>
											{data!.metadata.dataSource}
										</a>
									</div>
								</div>
							</div>

							<div className="bg-neutral-900/40 rounded-xl border border-white/10 p-6">
								<h3 className="text-sm font-medium text-neutral-300 mb-4">Technical Details</h3>
								<div className="space-y-3 text-sm">
									<div>
										<div className="text-neutral-400 text-xs">Raw Value</div>
										<div className="font-mono text-neutral-300">{data!.currentQuarter.gdpRaw}</div>
									</div>
									<div>
										<div className="text-neutral-400 text-xs">On-Chain Hash</div>
										<div className="font-mono text-neutral-300 break-all text-xs">{data!.onChainHash}</div>
									</div>
									{data!.verification.computedHash && (
										<div>
											<div className="text-neutral-400 text-xs">Computed Hash</div>
											<div className="font-mono text-neutral-300 break-all text-xs">{data!.verification.computedHash}</div>
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Quarterly Chart */}
						{data!.quarters.length > 1 && (
							<div className="lg:col-span-3">
								<QuarterlyChart quarters={data!.quarters} />
							</div>
						)}

						{/* Quarterly Data Grid */}
						<div className="lg:col-span-3">
							<div className="bg-neutral-900/40 rounded-xl border border-white/10 p-6">
								<h3 className="text-lg font-semibold text-neutral-100 mb-6">2025 Quarterly Performance</h3>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									{['Q2 2025', 'Q3 2025', 'Q4 2025'].map((quarterLabel) => {
										const quarterData = data!.quarters.find(q => q.quarter === quarterLabel);
										const isAvailable = quarterData?.isAvailable || false;
										const isCurrent = quarterData?.quarter === data!.currentQuarter.quarter;
										
										return (
											<div 
												key={quarterLabel}
												className={`p-4 rounded-lg border transition-all duration-200 ${
													isCurrent 
														? 'border-blue-500/50 bg-blue-950/20' 
														: isAvailable 
															? 'border-white/10 bg-neutral-800/40 hover:bg-neutral-800/60' 
															: 'border-neutral-700/50 bg-neutral-800/20'
												}`}
											>
												<div className="text-center">
													<div className="text-neutral-400 text-xs mb-2">
														{quarterLabel}
														{isCurrent && <span className="ml-2 text-blue-400">• Current</span>}
													</div>
													{isAvailable ? (
														<>
															<div className={`text-2xl font-bold ${getGrowthColor(quarterData!.gdpGrowthRate)}`}>
																{formatGrowthRate(quarterData!.gdpGrowthRate)}
															</div>
															<div className="text-neutral-500 text-xs mt-1">
																Raw: {quarterData!.gdpRaw}
															</div>
														</>
													) : (
														<div className="text-neutral-600 text-sm">
															Awaiting data
														</div>
													)}
												</div>
											</div>
										);
									})}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Footer */}
				<footer className="mt-12 text-center text-neutral-500 text-sm">
					<p>
						GDP data sourced from {data?.metadata.dataSource || "U.S. Bureau of Economic Analysis"} • 
						Cryptographically verified on Ethereum
					</p>
				</footer>
			</div>
		</div>
	);
}
