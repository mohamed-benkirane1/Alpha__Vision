import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard, PieChart, Newspaper, MessageSquare, TrendingUp,
  FlaskConical, Bot, Settings, LogOut, Zap, Menu, X, Bell,
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
  { to: '/settings',   label: 'Settings',    icon: Settings      },
]

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
    isActive
      ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 shadow-[0_0_14px_rgba(99,102,241,0.18)]'
      : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
  }`

function NavGroup({ label, links, onLinkClick }) {
  return (
    <div>
      <p className="px-4 mb-2 text-[10px] text-slate-600 uppercase tracking-widest font-semibold">{label}</p>
      {links.map(({ to, label: lbl, icon: Icon }) => (
        <NavLink key={to} to={to} className={linkClass} onClick={onLinkClick}>
          <Icon size={16} />
          {lbl}
        </NavLink>
      ))}
    </div>
  )
}

function SidebarContent({ onLinkClick }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-[0_0_18px_rgba(99,102,241,0.45)]">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm tracking-tight">Alpha Vision</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-medium">Markets live</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-5 mb-4 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-5 overflow-y-auto pb-2">
        <NavGroup label="Main" links={NAV_MAIN} onLinkClick={onLinkClick} />
        <NavGroup label="Tools" links={NAV_TOOLS} onLinkClick={onLinkClick} />
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4">
        <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent mb-3" />
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-slate-700/30 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.3)]">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Alpha User</p>
            <p className="text-[11px] text-slate-500 truncate">Pro Plan</p>
          </div>
        </div>
        <button className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/5 border border-transparent transition-all duration-200">
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </div>
  )
}

function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#060D1C] text-white flex">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 bg-[#0A1628]/95 border-r border-indigo-500/10 backdrop-blur-xl z-30">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-[#0A1628] border-r border-indigo-500/10 z-50 lg:hidden flex flex-col">
            <button className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors" onClick={() => setMobileOpen(false)}>
              <X size={18} />
            </button>
            <SidebarContent onLinkClick={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      {/* Content area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64 min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-20 h-14 bg-[#060D1C]/90 backdrop-blur-xl border-b border-slate-700/30 px-5 flex items-center justify-between gap-4">
          <button className="lg:hidden text-slate-400 hover:text-white transition-colors" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>

          <div className="hidden lg:block">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Alpha Vision Platform</p>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Markets open</span>
            </div>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors">
              <Bell size={16} />
            </button>
            <div className="w-px h-5 bg-slate-700/50" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold select-none shadow-[0_0_10px_rgba(99,102,241,0.3)]">
              A
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
