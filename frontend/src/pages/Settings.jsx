import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User, Mail, Lock, Globe, Bell, Shield, Cpu, AlertTriangle,
  CheckCircle, Zap, ChevronRight, ToggleLeft, ToggleRight,
} from 'lucide-react'

const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}
const stagger = { visible: { transition: { staggerChildren: 0.07 } } }

const API_STATUS = [
  { label: 'Backend API',      endpoint: 'localhost:5001/api',    status: 'connected', latency: '12ms'  },
  { label: 'Market Data',      endpoint: 'binance.com/api/v3',    status: 'connected', latency: '45ms'  },
  { label: 'News Service',     endpoint: 'gnews.io/api/v4',       status: 'connected', latency: '78ms'  },
  { label: 'AI Service',       endpoint: 'ai.alphavision.local',  status: 'active',    latency: '120ms' },
]

function Toggle({ on, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-1 text-sm transition-colors ${on ? 'text-indigo-400' : 'text-gray-500'}`}
    >
      {on ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
    </button>
  )
}

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={15} className="text-indigo-400" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
  )
}

function Settings() {
  const [prefs, setPrefs] = useState({
    emailAlerts:    true,
    pushNotifs:     false,
    tradingSignals: true,
    weeklyReport:   true,
  })

  const toggle = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }))

  return (
    <div className="space-y-6 max-w-3xl">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your account, preferences and integrations</p>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-5">

        {/* ── Profile ──────────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-5 backdrop-blur-sm">
          <SectionHeader icon={User} title="Profile" description="Your public identity on Alpha Vision" />

          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold text-white shrink-0 select-none">
              A
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Alpha User</p>
              <p className="text-xs text-gray-500">user@alphavision.app</p>
              <span className="inline-block mt-1.5 text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">
                Pro Plan
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Full name',  icon: User,  value: 'Alpha User',             placeholder: 'Your name'  },
              { label: 'Email',      icon: Mail,  value: 'user@alphavision.app',   placeholder: 'Your email' },
            ].map((f) => (
              <div key={f.label}>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">{f.label}</label>
                <div className="relative">
                  <f.icon size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    defaultValue={f.value}
                    placeholder={f.placeholder}
                    className="w-full bg-gray-900 border border-gray-800 text-white text-sm rounded-lg pl-9 pr-4 py-2.5 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">New password</label>
            <div className="relative">
              <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="password"
                placeholder="Leave blank to keep current"
                className="w-full bg-gray-900 border border-gray-800 text-white text-sm rounded-lg pl-9 pr-4 py-2.5 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors">
              Save changes
            </button>
          </div>
        </motion.div>

        {/* ── Preferences ──────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-5 backdrop-blur-sm">
          <SectionHeader icon={Globe} title="Preferences" description="Customize your trading experience" />

          <div className="space-y-1">
            {[
              { key: 'emailAlerts',    label: 'Email alerts',          desc: 'Receive important account notifications by email'  },
              { key: 'pushNotifs',     label: 'Push notifications',    desc: 'Browser notifications for price alerts'            },
              { key: 'tradingSignals', label: 'AI trading signals',    desc: 'Get notified when the bot generates a new signal'  },
              { key: 'weeklyReport',   label: 'Weekly portfolio report', desc: 'A summary of your portfolio performance each week' },
            ].map((item, i, arr) => (
              <div
                key={item.key}
                className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? 'border-b border-gray-800/50' : ''}`}
              >
                <div>
                  <p className="text-sm text-white font-medium">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                <Toggle on={prefs[item.key]} onToggle={() => toggle(item.key)} />
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-800/50 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Language</label>
              <select className="w-full bg-gray-900 border border-gray-800 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors">
                <option>English</option>
                <option>Français</option>
                <option>العربية</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Currency</label>
              <select className="w-full bg-gray-900 border border-gray-800 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors">
                <option>USD ($)</option>
                <option>EUR (€)</option>
                <option>MAD (د.م.)</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* ── API Status ───────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-5 backdrop-blur-sm">
          <SectionHeader icon={Cpu} title="API Status" description="Live connection status of all integrated services" />

          <div className="space-y-2">
            {API_STATUS.map((svc) => (
              <div
                key={svc.label}
                className="flex items-center justify-between px-4 py-3 bg-gray-900/60 border border-gray-800/40 rounded-lg hover:border-gray-700/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{svc.label}</p>
                    <p className="text-[11px] text-gray-600 font-mono">{svc.endpoint}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-500 font-mono">{svc.latency}</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold capitalize">
                    {svc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Security ─────────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-5 backdrop-blur-sm">
          <SectionHeader icon={Shield} title="Security" description="Manage your account security settings" />

          <div className="space-y-2">
            {[
              { label: 'Two-factor authentication',  desc: 'Add an extra layer of security to your account', badge: 'Recommended' },
              { label: 'Active sessions',             desc: 'View and manage your active login sessions',     badge: '1 active'     },
              { label: 'Login history',               desc: 'Review recent logins and detect suspicious activity', badge: null      },
            ].map((item) => (
              <button
                key={item.label}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-900/60 border border-gray-800/40 rounded-lg hover:border-gray-700/60 transition-colors text-left group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    {item.badge && (
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-medium">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Danger Zone ──────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="bg-gray-900/50 border border-red-500/20 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle size={15} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
              <p className="text-xs text-gray-500 mt-0.5">These actions are irreversible. Proceed with caution.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-4 py-3 border border-red-500/15 rounded-lg bg-red-500/5">
              <div>
                <p className="text-sm font-medium text-white">Reset portfolio</p>
                <p className="text-xs text-gray-500 mt-0.5">Clear all simulated trades and reset your balance to $10,000</p>
              </div>
              <button className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-semibold rounded-lg transition-colors shrink-0 ml-4">
                Reset
              </button>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border border-red-500/15 rounded-lg bg-red-500/5">
              <div>
                <p className="text-sm font-medium text-white">Delete account</p>
                <p className="text-xs text-gray-500 mt-0.5">Permanently delete your account and all associated data</p>
              </div>
              <button className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-semibold rounded-lg transition-colors shrink-0 ml-4">
                Delete
              </button>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  )
}

export default Settings
