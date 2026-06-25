import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  BadgeCheck,
  Clock,
  Cpu,
  Globe,
  Lock,
  Mail,
  RefreshCw,
  Shield,
  User,
} from 'lucide-react'
import { getProfile, updateProfile } from '../services/authService'
import { useAuth } from '../context/useAuth'
import { formatDateTime } from '../utils/formatters'

const fadeUp = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.07 } } }
const fieldCls = 'w-full bg-[#060D1C]/80 border border-white/[0.09] text-white text-body rounded-xl py-2.5 placeholder-slate-700 focus:outline-none focus:border-rose-500/50 focus:shadow-[0_0_14px_rgba(225,29,72,0.12)] transition-all duration-200 disabled:opacity-55'

function SectionHeader({ icon: Icon, title, description, badge }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <Icon size={14} className="text-rose-400" />
        </div>
        <div>
          <h2 className="text-body font-bold text-white">{title}</h2>
          <p className="text-body-sm text-slate-600 mt-0.5 font-medium">{description}</p>
        </div>
      </div>
      {badge && (
        <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-caption font-black uppercase tracking-wider text-slate-400">
          {badge}
        </span>
      )}
    </div>
  )
}

function ComingSoonRow({ title, description }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3">
      <div>
        <p className="text-body font-bold text-white">{title}</p>
        <p className="text-body-sm text-slate-600 mt-0.5 font-medium">{description}</p>
      </div>
      <span className="shrink-0 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-caption font-black uppercase tracking-wider text-amber-300">
        Coming soon
      </span>
    </div>
  )
}


function getInitial(name) {
  return (typeof name === 'string' && name.trim() ? name.trim()[0] : '?').toUpperCase()
}

function MetaItem({ label, value }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
      <p className="text-caption text-slate-600 mb-1 font-bold uppercase tracking-wider">{label}</p>
      <p className="text-body font-black text-white break-words">{value || '--'}</p>
    </div>
  )
}

export default function Settings() {
  const { user: authUser, refreshUser } = useAuth()
  const [profile, setProfile] = useState(authUser || null)
  const [name, setName] = useState(authUser?.name || '')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [warnings, setWarnings] = useState([])

  const loadProfile = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    const response = await getProfile()

    if (response.success && response.user) {
      setProfile(response.user)
      setName(response.user.name || '')
      setWarnings(response.warnings || [])
    } else {
      setError(response.error || 'Unable to load profile.')
    }

    if (refresh) setRefreshing(false)
    else setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => loadProfile(), 0)
    return () => window.clearTimeout(timer)
  }, [loadProfile])

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    const trimmedName = name.trim()

    if (trimmedName.length < 2 || trimmedName.length > 80) {
      setError('Name must be between 2 and 80 characters.')
      setSuccess(null)
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    const response = await updateProfile({ name: trimmedName })

    if (response.success && response.user) {
      setProfile(response.user)
      setName(response.user.name || '')
      setWarnings(response.warnings || [])
      setSuccess(response.message || 'Profile updated successfully.')
      await refreshUser()
    } else {
      setError(response.error || 'Unable to update profile.')
    }

    setSaving(false)
  }

  const plan = profile?.plan || '--'

  return (
    <div className="space-y-5 max-w-3xl">
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-display-sm font-black text-white">Settings</h1>
            <p className="text-body-sm text-slate-500 mt-0.5 font-medium">Real account data first. Unconnected settings are labelled.</p>
          </div>
          <button
            type="button"
            onClick={() => loadProfile({ refresh: true })}
            disabled={loading || refreshing || saving}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-caption font-black uppercase tracking-wider text-slate-400 transition hover:border-white/[0.16] hover:text-white disabled:opacity-45"
          >
            <RefreshCw size={10} className={refreshing ? 'animate-spin' : ''} />
            Refresh profile
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-body-sm font-semibold text-amber-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3 text-body-sm font-semibold text-emerald-300">
          <BadgeCheck size={14} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {warnings.map((warning) => (
        <div key={warning} className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-body-sm font-semibold text-amber-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{warning}</span>
        </div>
      ))}

      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-4">
        <motion.div variants={fadeUp} className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.28)]">
          <SectionHeader icon={User} title="Profile" description="Loaded from the authenticated backend user record" badge="Connected" />

          {loading && !profile ? (
            <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center">
              <span className="w-6 h-6 border-2 border-white/20 border-t-rose-400 rounded-full animate-spin mb-3" />
              <p className="text-body font-bold text-slate-500">Loading profile...</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-4 mb-5">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 flex items-center justify-center text-heading font-black text-white shrink-0 select-none shadow-[0_0_20px_rgba(225,29,72,0.30)]">
                    {getInitial(profile?.name)}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0a1628]" />
                </div>
                <div>
                  <p className="text-body font-black text-white">{profile?.name || '--'}</p>
                  <p className="text-body-sm text-slate-600 font-medium">{profile?.email || '--'}</p>
                  <span className="inline-block mt-1.5 text-caption bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-black uppercase">
                    {plan} plan
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <MetaItem label="Email" value={profile?.email || '--'} />
                <MetaItem label="Role" value={profile?.role || '--'} />
                <MetaItem label="Created" value={formatDateTime(profile?.createdAt)} />
                <MetaItem label="Last profile update" value={formatDateTime(profile?.updatedAt)} />
                <MetaItem label="Plan" value={plan} />
                <MetaItem label="Plan expires" value={formatDateTime(profile?.planExpiresAt)} />
              </div>

              <form onSubmit={handleProfileSubmit} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <label className="block text-caption font-black text-slate-600 mb-1.5 uppercase tracking-wide">Display name</label>
                <div className="relative">
                  <User size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    disabled={saving || loading}
                    maxLength={80}
                    placeholder="Your name"
                    className={`${fieldCls} pl-9 pr-4`}
                  />
                </div>
                <p className="text-label text-slate-600 mt-2 font-medium">
                  Email, plan, balance, role and provider fields cannot be edited from profile settings.
                </p>
                <div className="mt-4 flex justify-end">
                  <motion.button
                    type="submit"
                    disabled={saving || loading || !name.trim()}
                    whileHover={{ scale: saving ? 1 : 1.02 }}
                    whileTap={{ scale: saving ? 1 : 0.97 }}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 disabled:opacity-55 disabled:cursor-not-allowed text-white text-body-sm font-black rounded-xl transition-all shadow-[0_0_14px_rgba(225,29,72,0.28)]"
                  >
                    {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {saving ? 'Saving...' : 'Save profile'}
                  </motion.button>
                </div>
              </form>
            </>
          )}
        </motion.div>

        <motion.div variants={fadeUp} className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.28)]">
          <SectionHeader icon={Lock} title="Password" description="Password changes need a dedicated protected backend endpoint" badge="Not connected" />
          <ComingSoonRow title="Change password" description="No backend change-password route exists yet, so Settings does not show a fake success form." />
        </motion.div>

        <motion.div variants={fadeUp} className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.28)]">
          <SectionHeader icon={Globe} title="Preferences" description="Notification and locale preferences are not persisted yet" badge="Not connected" />
          <div className="space-y-2">
            <ComingSoonRow title="Notification preferences" description="Email alerts, browser notifications and weekly reports need backend preference storage." />
            <ComingSoonRow title="Language and currency" description="No persisted locale or currency preference exists in the user model." />
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.28)]">
          <SectionHeader icon={Cpu} title="Connected Account APIs" description="Routes used by this settings page" badge="Backend" />
          <div className="space-y-2">
            {[
              { icon: User, title: 'Current user', detail: 'GET /api/auth/me', status: 'Connected' },
              { icon: Mail, title: 'Profile update', detail: 'PATCH /api/auth/profile - name only', status: 'Connected' },
              { icon: Shield, title: 'Plan field', detail: 'Read from authenticated user data', status: 'Connected' },
            ].map((item) => (
              <div key={item.title} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3">
                <div className="flex items-center gap-3">
                  <item.icon size={13} className="text-rose-400" />
                  <div>
                    <p className="text-body font-bold text-white">{item.title}</p>
                    <p className="text-label text-slate-600 font-mono">{item.detail}</p>
                  </div>
                </div>
                <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-caption font-black uppercase tracking-wider text-emerald-300">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.28)]">
          <SectionHeader icon={Shield} title="Security and Account Actions" description="Sections without backend support are labelled instead of simulated" badge="Coming soon" />
          <div className="space-y-2">
            <ComingSoonRow title="Two-factor authentication" description="No 2FA enrollment backend exists yet." />
            <ComingSoonRow title="Active sessions and login history" description="Session management and audit history endpoints are not connected." />
            <ComingSoonRow title="Account deletion and portfolio reset" description="No safe delete/reset workflow is exposed from Settings." />
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="rounded-2xl border border-white/[0.07] bg-[#0a1628]/70 px-4 py-3 text-label font-semibold text-slate-500">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-1.5"><Clock size={11} className="text-rose-400" /> Last profile payload: {formatDateTime(profile?.updatedAt || profile?.createdAt)}</span>
            <span className="inline-flex items-center gap-1.5"><Shield size={11} className="text-rose-400" /> Sensitive fields are not rendered.</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
