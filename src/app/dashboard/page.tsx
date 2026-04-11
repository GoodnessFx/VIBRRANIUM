"use client";

import { useState, useEffect } from "react";
import { UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";

export default function EnhancedDashboard() {
  const { userId } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, fetch current protocol from user data
    const fetchDashboard = async () => {
      // Mock protocol ID for demo
      const res = await fetch("/api/dashboard/default-id");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
      setLoading(false);
    };
    fetchDashboard();
  }, [userId]);

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-black text-white font-black text-3xl animate-pulse italic">VIBRANIUM MONITORING...</div>;

  const hasIncident = data?.stats?.lastIncident?.status === "active";

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fade-in">
      {/* Shield Status Banner */}
      <div className={`p-8 rounded-2xl flex items-center justify-between border ${
        hasIncident 
          ? "bg-red-500/10 border-red-500/50 animate-pulse" 
          : "bg-zinc-950/50 border-zinc-900"
      }`}>
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${
            hasIncident ? "border-red-500 bg-red-500/20" : "border-green-500 bg-green-500/20"
          }`}>
            <span className={`text-2xl font-black ${hasIncident ? "text-red-500" : "text-green-500"}`}>
              {hasIncident ? "!" : "✓"}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight uppercase">
              Shield Status: <span className={hasIncident ? "text-red-500" : "text-green-500"}>
                {hasIncident ? "INCIDENT IN PROGRESS" : "ACTIVE"}
              </span>
            </h2>
            <p className="text-zinc-500 font-medium">Monitoring {data?.stats?.activeMonitors || 0} contracts on Ethereum Mainnet.</p>
          </div>
        </div>
        {hasIncident && (
          <Link href="/incidents" className="px-6 py-3 bg-red-500 text-white font-black rounded-full hover:bg-red-600 transition-all">
            VIEW INCIDENT
          </Link>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="TVL Protected" value={`$${(data?.stats?.totalTvl || 0).toLocaleString()}`} />
        <StatCard label="Txs Monitored (24h)" value="142,853" />
        <StatCard label="Threats Contained" value={data?.stats?.totalIncidents || 0} />
        <StatCard label="Avg Response Time" value="4.2s" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Live Transaction Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black tracking-tight uppercase">Live Transaction Feed</h3>
            <div className="flex gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Real-time</span>
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/50 overflow-hidden">
            <table className="w-full text-left">
              <thead className="border-b border-zinc-900 bg-black/50">
                <tr className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                  <th className="px-6 py-4">TX Hash</th>
                  <th className="px-6 py-4">Contract</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                <TxRow hash="0x8a2f...3c9e" contract="Vault V3" score={12} time="2s ago" />
                <TxRow hash="0x1d4c...b7a2" contract="Swap Router" score={45} time="15s ago" />
                <TxRow hash="0x5e9b...f2d1" contract="Vault V3" score={8} time="1m ago" />
                <TxRow hash="0x9c3a...e8f4" contract="Lending Pool" score={72} time="3m ago" />
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links / Alerts */}
        <div className="space-y-8">
          <div className="space-y-6">
            <h3 className="text-xl font-black tracking-tight uppercase">Active Contracts</h3>
            <div className="space-y-4">
              {data?.protocol?.contracts.map((c: any) => (
                <div key={c.id} className="p-4 rounded-xl border border-zinc-900 bg-black flex items-center justify-between hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-bold text-sm">{c.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{c.address.slice(0, 6)}...{c.address.slice(-4)}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-zinc-900 px-2 py-1 rounded text-zinc-400">ETH</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="p-8 rounded-2xl border border-zinc-900 bg-zinc-950/50 group hover:border-zinc-700 transition-all">
      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2 group-hover:text-zinc-400">{label}</p>
      <p className="text-3xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function TxRow({ hash, contract, score, time }: { hash: string, contract: string, score: number, time: string }) {
  const getScoreColor = (s: number) => {
    if (s < 30) return "bg-green-500/10 text-green-500";
    if (s < 70) return "bg-yellow-500/10 text-yellow-500";
    return "bg-red-500/10 text-red-500";
  };

  return (
    <tr className="text-xs group hover:bg-zinc-900/30 transition-colors">
      <td className="px-6 py-4 font-mono text-zinc-500 group-hover:text-zinc-300">{hash}</td>
      <td className="px-6 py-4 font-bold">{contract}</td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded text-[10px] font-black ${getScoreColor(score)}`}>
          {score}
        </span>
      </td>
      <td className="px-6 py-4 text-right text-zinc-500">{time}</td>
    </tr>
  );
}
