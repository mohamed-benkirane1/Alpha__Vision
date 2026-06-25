import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, PieChart, Newspaper, MessageSquare, TrendingUp,
  FlaskConical, Bot, CreditCard, Settings, LogOut,
  Menu, X, Bell, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import LogoMark from '../ui/LogoMark'
import Card  from '../ui/Card'
import Badge from '../ui/Badge'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const getInitial = (name) => (name?.trim()?.[0] || 'A').toUpperCase()

/** NYSE : lundi–vendredi 13h30–20h00 UTC */
function isMarketOpen() {
  const now    = new Date()
  const utcDay  = now.getUTCDay()   // 0=dim, 6=sam
  const utcHour = now.getUTCHours()
  const utcMin  = now.getUTCMinutes()
  const totalMin = utcHour * 60 + utcMin
  if (utcDay === 0 || utcDay === 6) return false
  return totalMin >= 810 && totalMin < 1200  // 13h30=810min, 20h00=1200min
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────────────────────────────────────

const NAV_MAIN = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/portfolio', label: 'Portfolio', icon: PieChart        },
  { to: '/trading',   label: 'Trading',   icon: TrendingUp      },
  { to: '/news',      label: 'News',      icon: Newspaper       },
]

const NAV_TOOLS = [
  { to: '/chatbot',     label: 'AI Chatbot',  icon: MessageSquare },
  { to: '/backtesting', label: 'Backtesting', icon: FlaskConical  },
  { to: '/bot',         label: 'Trading Bot', icon: Bot           },
  { to: '/payments',    label: 'Payments',    icon: CreditCard    },
  { to: '/settings',    label: 'Settings',    icon: Settings      },
]

function NavItem({ to, label, icon: Icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-body font-medium
         transition-all duration-200 overflow-hidden ${
          isActive
            ? 'bg-rose-500/10 text-white border-l-2 border-app-accent pl-[14px] shadow-[0_0_18px_rgba(225,29,72,0.08)]'
            : 'text-white/40 hover:text-white/80 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full bg-rose-400 shadow-[0_0_10px_rgba(225,29,72,0.90)]" />
          )}
          <Icon
            size={16}
            className={`shrink-0 transition-all duration-200 ${
              isActive
                ? 'text-rose-400'
                : 'text-white/30 group-hover:text-rose-400 group-hover:scale-110'
            }`}
          />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}

function NavGroup({ label, links, onLinkClick }) {
  return (
    <div>
      <p className="px-4 mb-1.5 text-caption bg-gradient-to-r from-rose-400/55 to-red-400/45
                    bg-clip-text text-transparent uppercase tracking-widest font-black">
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

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar content
// ─────────────────────────────────────────────────────────────────────────────

function SidebarContent({ onLinkClick, onLogout, user }) {
  const displayName = user?.name || 'Alpha User'
  const planLabel   = user?.plan ? `${user.plan} Plan` : 'Free plan'

  // ── User menu dropdown ───────────────────────────────────────────────
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    if (!showUserMenu) return
    const handleOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [showUserMenu])

  return (
    <div className="flex flex-col h-full">

      {/* ── Logo ───────────────────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-700/10 blur-sm -z-10" />
            <div className="w-9 h-9 rounded-xl bg-[#0d0118] border border-rose-500/22 flex items-center justify-center shadow-[0_0_18px_rgba(225,29,72,0.28)]">
              <LogoMark size={22} />
            </div>
          </div>
          <div className="leading-none">
            <span className="block text-label font-black tracking-widest text-white">ALPHA</span>
            <span className="block text-caption font-bold tracking-widest text-rose-400 mt-[2px]">VISION</span>
          </div>
          <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-caption text-emerald-400 font-black tracking-wider">LIVE</span>
          </div>
        </div>
      </div>

      <div className="mx-5 mb-5 h-px bg-gradient-to-r from-transparent via-rose-500/16 to-transparent" />

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 space-y-5 overflow-y-auto pb-2 sidebar-scroll">
        <NavGroup label="Main"  links={NAV_MAIN}  onLinkClick={onLinkClick} />
        <NavGroup label="Tools" links={NAV_TOOLS} onLinkClick={onLinkClick} />
      </nav>

      {/* ── User section ────────────────────────────────────────────────── */}
      <div className="px-3 py-4">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-3" />

        {/* Avatar card — dropdown au clic */}
        <div className="relative" ref={userMenuRef}>
          {/* Dropdown user menu */}
          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-full left-0 right-0 mb-2 z-50"
              >
                <Card padding="none" className="border border-white/[0.08] overflow-hidden">
                  {/* Info utilisateur */}
                  <div className="px-3 py-2.5 border-b border-white/[0.06]">
                    <p className="text-body-sm font-medium text-white truncate">{user?.email || displayName}</p>
                    <p className="text-caption text-white/35">Compte Alpha Vision</p>
                  </div>
                  {/* Paramètres */}
                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-body-sm text-white/55
                               hover:text-white hover:bg-white/[0.05] transition-colors"
                  >
                    <Settings size={13} className="shrink-0" />
                    Paramètres
                  </Link>
                  {/* Déconnexion */}
                  <button
                    onClick={() => { setShowUserMenu(false); onLogout() }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-body-sm
                               text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.08]
                               transition-colors border-t border-white/[0.04]"
                  >
                    <LogOut size={13} className="shrink-0" />
                    Déconnexion
                  </button>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bouton avatar */}
          <button
            type="button"
            onClick={() => setShowUserMenu((v) => !v)}
            className="flex items-center gap-3 w-full px-3.5 py-3 rounded-xl
                       bg-white/[0.03] border border-white/[0.06] mb-2
                       hover:bg-white/[0.05] transition-colors group text-left"
          >
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-600 to-red-700
                              flex items-center justify-center text-body-sm font-black text-white
                              shadow-[0_0_12px_rgba(225,29,72,0.35)]">
                {getInitial(displayName)}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full
                              bg-emerald-400 border-[1.5px] border-[#040710]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-semibold text-white truncate">{displayName}</p>
              <p className="text-caption text-white/30 truncate">{planLabel}</p>
            </div>
            <ChevronRight
              size={12}
              className={`text-white/20 group-hover:text-white/40 transition-all duration-200 shrink-0 ${
                showUserMenu ? 'rotate-90' : ''
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main layout
// ─────────────────────────────────────────────────────────────────────────────

export default function MainLayout() {
  const [mobileOpen,        setMobileOpen]        = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [marketOpen,        setMarketOpen]        = useState(isMarketOpen)

  const notifRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  // Actualise l'état marché toutes les minutes
  useEffect(() => {
    const interval = setInterval(() => setMarketOpen(isMarketOpen()), 60_000)
    return () => clearInterval(interval)
  }, [])

  // Ferme le dropdown notifications au clic extérieur
  useEffect(() => {
    if (!showNotifications) return
    const handleOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [showNotifications])

  const handleLogout = async () => {
    await logout()
    setMobileOpen(false)
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#06020c] text-white flex">

      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-20 right-[8%]  w-[800px] h-[600px] bg-rose-600/[0.03] rounded-full blur-[180px]" />
        <div className="absolute bottom-0  left-[10%] w-[600px] h-[450px] bg-red-700/[0.02] rounded-full blur-[150px]" />
      </div>

      {/* ── Sidebar desktop ──────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 fixed inset-y-0 left-0
                        bg-[#040710]/97 border-r border-white/[0.055] backdrop-blur-2xl z-30">
        <SidebarContent onLogout={handleLogout} user={user} />
      </aside>

      {/* ── Mobile drawer ────────────────────────────────────────────────── */}
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
              className="fixed inset-y-0 left-0 w-60 bg-[#040710] border-r border-white/[0.06] z-50 lg:hidden flex flex-col"
            >
              <button
                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg
                           text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <X size={14} />
              </button>
              <SidebarContent
                onLinkClick={() => setMobileOpen(false)}
                onLogout={handleLogout}
                user={user}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Contenu principal ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-60 min-w-0 relative z-10">

        {/* ── Topbar ──────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 h-14 bg-[#070E20]/92 backdrop-blur-2xl
                           border-b border-white/[0.045] px-5 flex items-center justify-between gap-4">

          {/* Burger mobile */}
          <button
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg
                       text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={18} />
          </button>

          {/* Label plateforme (desktop) */}
          <div className="hidden lg:flex items-center">
            <p className="text-caption text-white/25 uppercase tracking-wider font-black">
              Alpha Vision Platform
            </p>
          </div>

          {/* Actions droite */}
          <div className="flex items-center gap-2.5 ml-auto">

            {/* Badge marché — heure réelle */}
            <div className="hidden sm:block">
              <Badge variant={marketOpen ? 'success' : 'neutral'} dot size="sm">
                {marketOpen ? 'Marchés ouverts' : 'Marchés fermés'}
              </Badge>
            </div>

            {/* Cloche notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative w-8 h-8 flex items-center justify-center rounded-lg
                           text-white/40 hover:text-white hover:bg-white/[0.05] transition-colors"
                aria-label="Notifications"
              >
                <Bell size={15} />
                {/* Dot rouge */}
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 ring-[1.5px] ring-[#070E20]" />
              </button>

              {/* Dropdown notifications */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-full mt-2 w-80 z-50"
                  >
                    <Card padding="none" className="border border-white/[0.08] overflow-hidden shadow-card-hover">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                        <span className="text-body font-medium text-white">Notifications</span>
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-white/30 hover:text-white transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="py-10 text-center">
                        <Bell size={22} className="text-white/15 mx-auto mb-2.5" />
                        <p className="text-body-sm text-white/30 font-medium">Aucune notification</p>
                        <p className="text-caption text-white/20 mt-1">
                          Les alertes de trading apparaîtront ici
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-5 bg-white/[0.08]" />

            {/* Avatar topbar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-600 to-red-700
                            flex items-center justify-center text-body-sm font-black select-none
                            shadow-[0_0_12px_rgba(225,29,72,0.35)]">
              {getInitial(user?.name)}
            </div>
          </div>
        </header>

        {/* ── Page content ──────────────────────────────────────────────── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.20, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
