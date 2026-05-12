import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, PieChart, Newspaper, MessageSquare, TrendingUp,
  FlaskConical, Bot, Settings, LogOut, Menu, X, Bell, ChevronRight,
} from 'lucide-react'

const NAV_MAIN = [
  { to: '/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/portfolio', label: 'Portfolio',   icon: PieChart        },
  { to: '/trading',   label: 'Trading',     icon: TrendingUp      },
  { to: '/news',      label: 'News',        icon: Newspaper       },
]

const NAV_TOOLS = [
  { to: '/chatbot',     label: 'AI Chatbot',  icon: MessageSquare },
  { to: '/backtesting', label: 'Backtesting', icon: FlaskConical  },
  { to: '/bot',         label: 'Trading Bot', icon: Bot           },
  { to: '/settings',    label: 'Settings',    icon: Settings      },
]

function NavItem({ to, label, icon: Icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 overflow-hidden ${
          isActive
            ? 'bg-gradient-to-r from-rose-500/14 to-red-500/5 text-rose-300 border border-rose-500/25 shadow-[0_0_20px_rgba(225,29,72,0.09)]'
            : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full bg-rose-400 shadow-[0_0_8px_rgba(225,29,72,0.9)]" />
          )}
          <Icon
            size={16}
            className={`shrink-0 transition-all duration-200 ${
              isActive ? 'text-rose-400' : 'group-hover:scale-110'
            }`}
          />
          {label}
        </>
      )}
    </NavLink>
  )
}

function NavGroup({ label, links, onLinkClick }) {
  return (
    <div>
      <p className="px-4 mb-1.5 text-[10px] bg-gradient-to-r from-rose-400/55 to-red-400/55 bg-clip-text text-transparent uppercase tracking-[0.16em] font-black">
        {label}
      </p>
      <div className="space-y-0.5">
        {links.map(({ to, label: lbl, icon }) => (
          <NavItem key={to} to={to} label={lbl} icon={icon} onClick={onLinkClick} />
        ))}
      </div>
    </div>
  )
}

function SidebarContent({ onLinkClick }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 34 34" fill="none" className="w-8 h-8 shrink-0" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="lgSb" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#e11d48" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>
            <polygon points="17,2 32,31 2,31" fill="url(#lgSb)" />
            <polygon points="17,10 26,29 8,29" fill="#04010a" />
            <rect x="10" y="21" width="14" height="2.5" fill="url(#lgSb)" />
          </svg>
          <div className="leading-none">
            <span className="block text-[12px] font-black tracking-[0.16em] text-white">ALPHA</span>
            <span className="block text-[9px]  font-bold  tracking-[0.22em] text-rose-400 mt-[2px]">VISION</span>
          </div>
          <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] text-emerald-400 font-black tracking-wider">LIVE</span>
          </div>
        </div>
      </div>

      <div className="mx-5 mb-5 h-px bg-gradient-to-r from-transparent via-rose-500/18 to-transparent" />

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-5 overflow-y-auto pb-2 sidebar-scroll">
        <NavGroup label="Main"  links={NAV_MAIN}  onLinkClick={onLinkClick} />
        <NavGroup label="Tools" links={NAV_TOOLS} onLinkClick={onLinkClick} />
      </nav>

      {/* User section */}
      <div className="px-3 py-4">
        <div className="h-px bg-gradient-to-r from-transparent via-slate-700/35 to-transparent mb-3" />
        <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-2 cursor-pointer hover:bg-white/[0.05] transition-colors group">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-600 to-red-700 flex items-center justify-center text-xs font-black text-white shadow-[0_0_12px_rgba(225,29,72,0.4)]">
              A
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-[1.5px] border-[#04010a]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">Alpha User</p>
            <p className="text-[10px] text-slate-600 truncate">Pro Plan · Active</p>
          </div>
          <ChevronRight size={12} className="text-slate-700 group-hover:text-slate-500 transition-colors shrink-0" />
        </div>
        <button className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all duration-200">
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#06020c] text-white flex">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 fixed inset-y-0 left-0 bg-[#04010a]/96 border-r border-white/[0.055] backdrop-blur-2xl z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay + drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 w-60 bg-[#04010a] border-r border-white/[0.06] z-50 lg:hidden flex flex-col"
            >
              <button
                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-white hover:bg-white/[0.06] transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <X size={14} />
              </button>
              <SidebarContent onLinkClick={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Content area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-60 min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-20 h-14 bg-[#06020c]/92 backdrop-blur-2xl border-b border-white/[0.045] px-5 flex items-center justify-between gap-4">
          <button
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={18} />
          </button>

          <div className="hidden lg:flex items-center gap-2">
            <p className="text-[10px] text-slate-700 uppercase tracking-[0.14em] font-black">Alpha Vision Platform</p>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/8 border border-emerald-500/14">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-bold tracking-wide">Markets open</span>
            </div>

            <div className="relative">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.05] transition-colors">
                <Bell size={15} />
              </button>
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 ring-[1.5px] ring-[#06020c]" />
            </div>

            <div className="w-px h-5 bg-slate-800" />

            <div className="relative cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-600 to-red-700 flex items-center justify-center text-xs font-black select-none shadow-[0_0_12px_rgba(225,29,72,0.4)]">
                A
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-[1.5px] border-[#06020c]" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
