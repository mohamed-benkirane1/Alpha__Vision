import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User, Mail, Lock, Globe, Bell, Shield, Cpu, AlertTriangle,
  CheckCircle, Zap, ChevronRight,
} from 'lucide-react'

const fadeUp  = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.07 } } }

const API_STATUS = [
  { label: 'Backend API',  endpoint: 'localhost:5001/api',   status: 'connected', latency: '12ms'  },
  { label: 'Market Data',  endpoint: 'binance.com/api/v3',   status: 'connected', latency: '45ms'  },
  { label: 'News Service', endpoint: 'gnews.io/api/v4',      status: 'connected', latency: '78ms'  },
  { label: 'AI Service',   endpoint: 'ai.alphavision.local', status: 'active',    latency: '120ms' },
]

function NeonToggle({ on, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full border transition-all duration-300 ${
        on
          ? 'bg-rose-600/80 border-rose-500/50 shadow-[0_0_10px_rgba(225,29,72,0.40)]'
          : 'bg-white/[0.05] border-white/[0.10]'
      }`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 shadow-sm ${
        on
          ? 'left-[22px] bg-white'
          : 'left-0.5 bg-slate-600'
      }`} />
    </button>
  )
}

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-rose-400" />
      </div>
      <div>
        <h2 className="text-sm font-bold text-white">{title}</h2>
        <p className="text-xs text-slate-600 mt-0.5 font-medium">{description}</p>
      </div>
    </div>
  )
}

const fieldCls = 'w-full bg-[#060D1C]/80 border border-white/[0.09] text-white text-sm rounded-xl py-2.5 placeholder-slate-700 focus:outline-none focus:border-rose-500/50 focus:shadow-[0_0_14px_rgba(225,29,72,0.12)] transition-all duration-200'

export default function Settings() {
  const [prefs, setPrefs] = useState({
    emailAlerts:    true,
    pushNotifs:     false,
    tradingSignals: true,
    weeklyReport:   true,
  })

  const toggle = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }))

  return (
    <div className="space-y-5 max-w-3xl">

      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <h1 className="text-2xl font-black text-white">Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">Manage your account, preferences and integrations</p>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-4">

        {/* Profile */}
        <motion.div variants={fadeUp}
          className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.28)]">
          <SectionHeader icon={User} title="Profile" description="Your public identity on Alpha Vision" />

          <div className="flex items-center gap-4 mb-5">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 flex items-center justify-center text-xl font-black text-white shrink-0 select-none shadow-[0_0_20px_rgba(225,29,72,0.30)]">
                A
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0a1628]" />
            </div>
            <div>
              <p className="text-sm font-black text-white">Alpha User</p>
              <p className="text-xs text-slate-600 font-medium">user@alphavision.app</p>
              <span className="inline-block mt-1.5 text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-black">
                Pro Plan
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Full name', icon: User, value: 'Alpha User',           placeholder: 'Your name'  },
              { label: 'Email',     icon: Mail, value: 'user@alphavision.app', placeholder: 'Your email' },
            ].map((f) => (
              <div key={f.label}>
                <label className="block text-[10px] font-black text-slate-600 mb-1.5 uppercase tracking-[0.1em]">{f.label}</label>
                <div className="relative">
                  <f.icon size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                  <input
                    type="text"
                    defaultValue={f.value}
                    placeholder={f.placeholder}
                    className={fieldCls + ' pl-9 pr-4'}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <label className="block text-[10px] font-black text-slate-600 mb-1.5 uppercase tracking-[0.1em]">New password</label>
            <div className="relative">
              <Lock size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
              <input
                type="password"
                placeholder="Leave blank to keep current"
                className={fieldCls + ' pl-9 pr-4'}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="px-5 py-2 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white text-xs font-black rounded-xl transition-all shadow-[0_0_14px_rgba(225,29,72,0.28)]"
            >
              Save changes
            </motion.button>
          </div>
        </motion.div>

        {/* Preferences */}
        <motion.div variants={fadeUp}
          className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.28)]">
          <SectionHeader icon={Globe} title="Preferences" description="Customize your trading experience" />

          <div className="space-y-0">
            {[
              { key: 'emailAlerts',    label: 'Email alerts',          desc: 'Receive important account notifications by email'  },
              { key: 'pushNotifs',     label: 'Push notifications',    desc: 'Browser notifications for price alerts'            },
              { key: 'tradingSignals', label: 'AI trading signals',    desc: 'Get notified when the bot generates a new signal'  },
              { key: 'weeklyReport',   label: 'Weekly portfolio report', desc: 'A summary of your portfolio performance each week' },
            ].map((item, i, arr) => (
              <div
                key={item.key}
                className={`flex items-center justify-between py-3.5 ${i < arr.length - 1 ? 'border-b border-white/[0.05]' : ''}`}
              >
                <div>
                  <p className="text-sm text-white font-bold">{item.label}</p>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">{item.desc}</p>
                </div>
                <NeonToggle on={prefs[item.key]} onToggle={() => toggle(item.key)} />
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/[0.05] grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Language', options: ['English', 'Français', 'العربية'] },
              { label: 'Currency', options: ['USD ($)', 'EUR (€)', 'MAD (د.م.)'] },
            ].map((sel) => (
              <div key={sel.label}>
                <label className="block text-[10px] font-black text-slate-600 mb-1.5 uppercase tracking-[0.1em]">{sel.label}</label>
                <select className={fieldCls + ' px-3.5 cursor-pointer'} style={{ backgroundImage: 'none' }}>
                  {sel.options.map((o) => <option key={o} className="bg-[#0a1628]">{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        </motion.div>

        {/* API Status */}
        <motion.div variants={fadeUp}
          className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.28)]">
          <SectionHeader icon={Cpu} title="API Status" description="Live connection status of all integrated services" />

          <div className="space-y-2">
            {API_STATUS.map((svc) => (
              <motion.div
                key={svc.label}
                whileHover={{ x: 2, backgroundColor: 'rgba(255,255,255,0.03)' }}
                className="flex items-center justify-between px-4 py-3 bg-white/[0.025] border border-white/[0.06] rounded-xl transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
                  <div>
                    <p className="text-sm font-bold text-white">{svc.label}</p>
                    <p className="text-[10px] text-slate-700 font-mono">{svc.endpoint}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-600 font-mono">{svc.latency}</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/22 px-2 py-0.5 rounded-full font-black capitalize">
                    {svc.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Security */}
        <motion.div variants={fadeUp}
          className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.28)]">
          <SectionHeader icon={Shield} title="Security" description="Manage your account security settings" />

          <div className="space-y-2">
            {[
              { label: 'Two-factor authentication',  desc: 'Add an extra layer of security to your account', badge: 'Recommended' },
              { label: 'Active sessions',             desc: 'View and manage your active login sessions',     badge: '1 active'     },
              { label: 'Login history',               desc: 'Review recent logins and detect suspicious activity', badge: null      },
            ].map((item) => (
              <motion.button
                key={item.label}
                whileHover={{ x: 2, backgroundColor: 'rgba(255,255,255,0.03)' }}
                className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.025] border border-white/[0.06] rounded-xl transition-all duration-200 text-left group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">{item.label}</p>
                    {item.badge && (
                      <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded-lg font-black">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">{item.desc}</p>
                </div>
                <ChevronRight size={13} className="text-slate-700 group-hover:text-slate-400 transition-colors shrink-0" />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div variants={fadeUp}
          className="bg-[#0a1628]/88 border border-rose-500/20 rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(244,63,94,0.06)]">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle size={14} className="text-rose-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-rose-400">Danger Zone</h2>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">These actions are irreversible. Proceed with caution.</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              { label: 'Reset portfolio',  desc: 'Clear all simulated trades and reset your balance to $10,000', btn: 'Reset'  },
              { label: 'Delete account',   desc: 'Permanently delete your account and all associated data',      btn: 'Delete' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between px-4 py-3 border border-rose-500/14 rounded-xl bg-rose-500/[0.04]">
                <div>
                  <p className="text-sm font-bold text-white">{item.label}</p>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">{item.desc}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-3 py-1.5 bg-rose-600/18 hover:bg-rose-600/28 text-rose-400 border border-rose-500/28 text-xs font-black rounded-xl transition-all shrink-0 ml-4"
                >
                  {item.btn}
                </motion.button>
              </div>
            ))}
          </div>
        </motion.div>

      </motion.div>
    </div>
  )
}
