import Link from "next/link";
import { UserButton, auth } from "@clerk/nextjs";

export default function Home() {
  const { userId } = auth();

  return (
    <div className="flex flex-col min-h-screen bg-black text-white font-sans selection:bg-zinc-800">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-zinc-900 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <span className="text-black font-black text-xl">V</span>
          </div>
          <span className="text-xl font-bold tracking-tighter">VIBRANIUM</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="#docs" className="hover:text-white transition-colors">Docs</Link>
        </div>

        <div className="flex items-center gap-4">
          {userId ? (
            <>
              <Link 
                href="/dashboard" 
                className="text-sm font-medium px-4 py-2 bg-white text-black rounded-full hover:bg-zinc-200 transition-colors"
              >
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <>
              <Link href="/sign-in" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link 
                href="/sign-up" 
                className="text-sm font-medium px-4 py-2 bg-white text-black rounded-full hover:bg-zinc-200 transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative px-8 pt-24 pb-32 overflow-hidden">
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-xs font-medium text-zinc-400 mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Monitoring 5 Chains · Under 10s Response
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[0.9] animate-slide-up">
              THE AUTONOMOUS <br />
              <span className="text-zinc-500">CONTRACT GUARDIAN.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed animate-slide-up delay-100">
              Existing tools alert you. <span className="text-white font-semibold">VIBRANIUM acts.</span> Detect exploit patterns in real-time and pause vulnerable contracts before funds are drained.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up delay-200">
              <Link 
                href="/sign-up" 
                className="w-full sm:w-auto px-8 py-4 bg-white text-black text-lg font-bold rounded-full hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95"
              >
                Protect My Protocol
              </Link>
              <Link 
                href="#how-it-works" 
                className="w-full sm:w-auto px-8 py-4 border border-zinc-800 text-white text-lg font-bold rounded-full hover:bg-zinc-900 transition-all"
              >
                Watch Demo
              </Link>
            </div>
          </div>
          
          {/* Background Gradient */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-black to-black -z-10 blur-3xl opacity-50"></div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="px-8 py-32 bg-zinc-950/50 border-t border-zinc-900">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Simple, transparent pricing.</h2>
              <p className="text-zinc-400">All plans include a 14-day free trial. Annual billing: 2 months free.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Starter */}
              <div className="p-8 rounded-2xl border border-zinc-800 bg-black flex flex-col transition-all hover:border-zinc-700">
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-2">Starter</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">$500</span>
                    <span className="text-zinc-500">/mo</span>
                  </div>
                </div>
                <ul className="space-y-4 text-zinc-400 mb-8 flex-1">
                  <li className="flex items-center gap-2">✓ Up to $10M TVL</li>
                  <li className="flex items-center gap-2">✓ 3 Contracts</li>
                  <li className="flex items-center gap-2">✓ 1 Chain</li>
                  <li className="flex items-center gap-2">✓ Real-time Monitoring</li>
                </ul>
                <Link href="/sign-up?plan=starter" className="w-full py-3 text-center border border-zinc-800 rounded-full font-bold hover:bg-white hover:text-black transition-all">
                  Get Started
                </Link>
              </div>

              {/* Growth */}
              <div className="p-8 rounded-2xl border-2 border-white bg-black flex flex-col relative shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)]">
                <div className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                  Most Popular
                </div>
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-2">Growth</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">$2,000</span>
                    <span className="text-zinc-500">/mo</span>
                  </div>
                </div>
                <ul className="space-y-4 text-zinc-400 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-white font-medium">✓ Up to $100M TVL</li>
                  <li className="flex items-center gap-2 text-white font-medium">✓ Unlimited Contracts</li>
                  <li className="flex items-center gap-2 text-white font-medium">✓ All Chains</li>
                  <li className="flex items-center gap-2 text-white font-medium">✓ Custom Alert Logic</li>
                  <li className="flex items-center gap-2 text-white font-medium">✓ Forensic Reports</li>
                </ul>
                <Link href="/sign-up?plan=growth" className="w-full py-3 text-center bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-all">
                  Get Started
                </Link>
              </div>

              {/* Enterprise */}
              <div className="p-8 rounded-2xl border border-zinc-800 bg-black flex flex-col transition-all hover:border-zinc-700">
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">$5,000</span>
                    <span className="text-zinc-500">/mo</span>
                  </div>
                </div>
                <ul className="space-y-4 text-zinc-400 mb-8 flex-1">
                  <li className="flex items-center gap-2">✓ $100M+ TVL</li>
                  <li className="flex items-center gap-2">✓ Dedicated Monitoring Node</li>
                  <li className="flex items-center gap-2">✓ SLA Guarantee</li>
                  <li className="flex items-center gap-2">✓ Custom Integrations</li>
                  <li className="flex items-center gap-2">✓ 24/7 Priority Support</li>
                </ul>
                <Link href="/contact" className="w-full py-3 text-center border border-zinc-800 rounded-full font-bold hover:bg-white hover:text-black transition-all">
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-8 py-12 border-t border-zinc-900 bg-black text-zinc-500 text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center">
              <span className="text-zinc-400 font-black text-sm">V</span>
            </div>
            <span className="font-bold tracking-tighter text-zinc-400">VIBRANIUM</span>
            <span className="ml-4">© 2026 VIBRANIUM Security. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-8">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/twitter" className="hover:text-white transition-colors">Twitter</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
