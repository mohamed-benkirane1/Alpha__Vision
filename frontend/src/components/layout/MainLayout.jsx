import { Outlet, NavLink } from 'react-router-dom'

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/trading', label: 'Trading' },
  { to: '/news', label: 'News' },
  { to: '/chatbot', label: 'Chatbot' },
  { to: '/backtesting', label: 'Backtesting' },
  { to: '/bot', label: 'Bot' },
  { to: '/settings', label: 'Settings' },
]

function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-6">
        <span className="text-indigo-400 font-bold text-lg mr-4">Alpha Vision</span>
        {navLinks.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `text-sm transition-colors ${isActive ? 'text-indigo-400 font-semibold' : 'text-gray-400 hover:text-white'}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
