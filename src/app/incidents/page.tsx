"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

interface Incident {
  id: string;
  type: string;
  status: string;
  severity: string;
  responseTimeMs: number;
  createdAt: string;
  txHash: string;
  protocol: {
    name: string;
  };
}

export default function IncidentsPage() {
  const { userId } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      // Mock fetch
      setIncidents([
        {
          id: "inc_1",
          type: "reentrancy",
          status: "contained",
          severity: "critical",
          responseTimeMs: 4200,
          createdAt: new Date().toISOString(),
          txHash: "0x8a2f...3c9e",
          protocol: { name: "Vault V3" }
        }
      ]);
      setLoading(false);
    };
    fetchIncidents();
  }, [userId]);

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-black text-white font-black text-3xl animate-pulse italic">VIBRANIUM LOADING...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2 uppercase italic">Incident History</h1>
          <p className="text-zinc-500 font-medium">Detailed audit trail of all detected and contained threats.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {incidents.length > 0 ? (
          incidents.map((inc) => (
            <Link key={inc.id} href={`/incidents/${inc.id}`} className="group p-8 rounded-2xl border border-zinc-900 bg-zinc-950/50 flex items-center justify-between hover:border-red-500/50 transition-all">
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Severity</span>
                  <span className="px-3 py-1 bg-red-500 text-white text-[10px] font-black rounded uppercase">{inc.severity}</span>
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight group-hover:text-red-500 transition-colors">{inc.type} Exploit</h3>
                  <p className="text-sm text-zinc-500 font-mono">{inc.txHash}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-12">
                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Response</p>
                  <p className="font-black text-white italic">{inc.responseTimeMs}ms</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Status</p>
                  <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-black rounded uppercase border border-green-500/20">
                    {inc.status}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">
                  →
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="p-24 text-center border-2 border-dashed border-zinc-900 rounded-3xl">
            <p className="text-zinc-500 font-black text-xl uppercase italic">No incidents detected. All shields holding.</p>
          </div>
        )}
      </div>
    </div>
  );
}
