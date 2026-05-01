import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  PieChart,
  Newspaper,
  MessageSquare,
  TrendingUp,
  FlaskConical,
  Bot,
  Settings,
  LogOut,
  Zap,
  Menu,
  X,
} from 'lucide-react'

const navLinks = [
  { to: '/dashboard', label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/portfolio', label: 'Portfolio',    icon: PieChart },
  { to: '/trading',   label: 'Trading',      icon: TrendingUp },
  { to: '/news',      label: 'News',         icon: Newspaper },
  { to: '/chatbot',   label: 'AI Chatbot',   icon: MessageSquare },
  { to: '/backtesting', label: 'Backtesting', icon: FlaskConical },
  { to: '/bot',       label: 'Trading Bot',  icon: Bot },
  { to: '/settings',  label: 'Settings',     icon: Settings },
]

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
    isActive
      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
  }`

function SidebarContent({ onLinkClick }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <Zap size={15} className="text-white" />
          </div>
          <span className="font-bold text-white text-base tracking-tight">
            Alpha Vision
          </span>
        </div>
        <div className="mt-2.5 ml-0.5">
          <span className="text-[11px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
            AI Trading
          </span>
        </div>
      </div>

      <div className="mx-4 mb-4 h-px bg-gray-800/70" />

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navLinks.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={linkClass} onClick={onLinkClick}>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 mt-2">
        <div className="h-px bg-gray-800/70 mb-3" />
        <button className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-400/5 border border-transparent transition-all duration-150">
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  )
}

function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 bg-gray-900/70 border-r border-gray-800/60 backdrop-blur-sm z-30">
        <SidebarContent />
      </aside>

      {/* ── Mobile sidebar drawer ── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 border-r border-gray-800 z-50 lg:hidden flex flex-col">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              <X size={18} />
            </button>
            <SidebarContent onLinkClick={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      {/* ── Content area ── */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">

        {/* Topbar */}
        <header className="sticky top-0 z-20 h-14 bg-gray-950/80 backdrop-blur-sm border-b border-gray-800/60 px-5 flex items-center justify-between gap-4">
          {/* Hamburger (mobile) */}
          <button
            className="lg:hidden text-gray-400 hover:text-white transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Left label (desktop) */}
          <div className="hidden lg:block">
            <p className="text-[11px] text-gray-500 uppercase tracking-widest">Platform</p>
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-3 ml-auto">
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Markets open
            </span>
            <div className="w-px h-4 bg-gray-700" />
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold select-none">
              A
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
