import { Link } from 'react-router-dom'
import { Users, Target, TrendingUp, Clock, Play } from 'lucide-react'
import heroImage from '../assets/reference/home-hero-reference.png'

// ── Static data ───────────────────────────────────────────────────────────────
const NAV_LINKS = ['Home', 'Features', 'Pricing', 'About', 'Contact']

const STATS = [
  { icon: Users,      value: '10K+',   label: 'Active Traders'  },
  { icon: Target,     value: '98.7%',  label: 'Accuracy'        },
  { icon: TrendingUp, value: '$2.4B+', label: 'Trading Volume'  },
  { icon: Clock,      value: '24/7',   label: 'AI Support'      },
]

// ── Logo SVG ─────────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <svg viewBox="0 0 34 34" fill="none" className="w-8 h-8 shrink-0" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <polygon points="17,2 32,31 2,31" fill="url(#lm)" />
      <polygon points="17,10 26,29 8,29"  fill="#070E20" />
      <rect x="10" y="21" width="14" height="2.5" fill="url(#lm)" />
    </svg>
  )
}

// ── Home ─────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="home-grid min-h-screen bg-[#070E20] text-white overflow-hidden flex flex-col">

      {/* Very subtle ambient — not dominant */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-20 right-[15%] w-[480px] h-[480px] bg-blue-900/18 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-[5%]  w-[300px] h-[300px] bg-violet-900/12 rounded-full blur-[90px]"  />
      </div>

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="relative z-50 h-14 flex items-center border-b border-white/[0.07] bg-[#070E20]/80 backdrop-blur-xl shrink-0">
        <div className="max-w-7xl mx-auto px-8 w-full flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 select-none">
            <LogoMark />
            <div className="leading-none">
              <span className="block text-[12px] font-black tracking-[0.18em] text-white">ALPHA</span>
              <span className="block text-[8px]  font-bold  tracking-[0.25em] text-indigo-400 mt-[1px]">VISION</span>
            </div>
          </Link>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link}
                href={link === 'Home' ? '#' : `#${link.toLowerCase()}`}
                className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors"
              >
                {link}
              </a>
            ))}
          </div>

          {/* Sign In */}
          <Link
            to="/login"
            className="px-4 py-1.5 text-[12px] font-semibold text-white border border-indigo-500/40 rounded-md hover:bg-indigo-500/10 hover:border-indigo-400/60 transition-all shrink-0"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* ── Hero body ───────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 max-w-7xl mx-auto px-8 w-full flex items-center">
          <div className="grid lg:grid-cols-2 gap-6 xl:gap-10 items-center w-full py-8 lg:py-4">

            {/* ── LEFT: text block ────────────────────────────────────────── */}
            <div className="flex flex-col gap-5">

              {/* Badge */}
              <span className="inline-flex w-fit items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-indigo-400 uppercase border border-indigo-500/25 bg-indigo-500/8 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
                AI Trading Intelligence
              </span>

              {/* TWO-LINE heading — never split into 3 */}
              <h1 className="font-black leading-[1.05] tracking-tight text-[2.6rem] sm:text-[3rem] lg:text-[3.4rem] xl:text-[3.8rem]">
                <span className="block text-white">AI-POWERED</span>
                <span className="block text-white whitespace-nowrap">TRADING PLATFORM</span>
              </h1>

              {/* Subtitle */}
              <p className="text-[15px] sm:text-base font-semibold text-slate-300 tracking-wide">
                Analyze. Predict. Trade. Win.
              </p>

              {/* Description */}
              <p className="text-sm text-slate-500 leading-relaxed max-w-[400px]">
                Alpha Vision uses advanced AI algorithms to analyze the market and help you make
                smarter trading decisions.
              </p>

              {/* CTA row */}
              <div className="flex items-center gap-4 pt-1">
                <Link
                  to="/signup"
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold rounded-lg transition-all shadow-[0_0_22px_rgba(99,102,241,0.38)] hover:shadow-[0_0_32px_rgba(99,102,241,0.55)]"
                >
                  Get Started
                </Link>
                <button
                  type="button"
                  className="flex items-center gap-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors group"
                >
                  <span className="w-8 h-8 rounded-full border border-slate-600/80 group-hover:border-indigo-500/50 bg-slate-800/50 flex items-center justify-center transition-colors">
                    <Play size={9} fill="currentColor" className="ml-0.5" />
                  </span>
                  Watch Demo
                </button>
              </div>
            </div>

            {/* ── RIGHT: bull image — no card, blends into dark background ── */}
            <div className="relative flex items-center justify-center lg:justify-end">

              {/* Behind-image glow layers — subtle, not dominant */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
                <div className="w-[380px] h-[380px] bg-blue-700/14 rounded-full blur-[80px]" />
              </div>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
                <div className="w-[230px] h-[230px] bg-indigo-600/10 rounded-full blur-[55px]" />
              </div>

              {/* The bull — no wrapper card, drop-shadow keeps it integrated */}
              <img
                src={heroImage}
                alt="AI Trading Bull"
                className="relative z-10 w-full max-w-[480px] lg:max-w-[540px] xl:max-w-[600px] drop-shadow-[0_0_55px_rgba(70,100,255,0.32)] select-none"
                draggable={false}
              />
            </div>
          </div>
        </div>

        {/* ── Stats strip ─────────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-white/[0.07] bg-[#060C1C]/85 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/[0.07]">
              {STATS.map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center gap-3 px-5 xl:px-8 py-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Icon size={13} className="text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[18px] font-black text-white leading-none">{value}</p>
                    <p className="text-[11px] text-slate-500 mt-[3px] font-medium truncate">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
