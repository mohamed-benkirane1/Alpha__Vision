import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertTriangle, BadgeCheck, Clock, CreditCard, Lock,
  RefreshCw, Settings2, Shield, Trash2, User,
} from 'lucide-react'
import { getProfile, updateProfile } from '../services/authService'
import { useAuth }                   from '../context/useAuth'
import { Card, Button, Badge }       from '../components/ui'
import { formatDateTime }            from '../utils/formatters'

const fadeUp  = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.07 } } }
const fieldCls = 'w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-body placeholder:text-white/30 focus:outline-none focus:border-app-accent/50 focus:bg-white/[0.06] transition-all duration-200 disabled:opacity-55'

function getInitial(name) {
  return (typeof name === 'string' && name.trim() ? name.trim()[0] : '?').toUpperCase()
}

function ComingSoonRow({ title, description }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3">
      <div>
        <p className="text-body font-bold text-white">{title}</p>
        <p className="text-body-sm text-white/35 mt-0.5">{description}</p>
      </div>
      <span className="shrink-0 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-caption font-black uppercase tracking-wider text-amber-300">
        Bientôt
      </span>
    </div>
  )
}

const NAV_ITEMS = [
  { id: 'profile',      label: 'Profil',          icon: User       },
  { id: 'security',     label: 'Sécurité',         icon: Lock       },
  { id: 'subscription', label: 'Abonnement',       icon: CreditCard },
  { id: 'danger',       label: 'Zone de danger',   icon: Trash2     },
]

const PLAN_LABEL   = { free: 'Gratuit', pro: 'Pro', elite: 'Élite' }
const PLAN_VARIANT = { free: 'neutral', pro: 'accent', elite: 'warning' }

export default function Settings() {
  const { user: authUser, refreshUser } = useAuth()
  const [activeSection, setActiveSection] = useState('profile')
  const [profile,       setProfile]       = useState(authUser || null)
  const [name,          setName]          = useState(authUser?.name || '')
  const [loading,       setLoading]       = useState(true)
  const [refreshing,    setRefreshing]    = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState(null)
  const [success,       setSuccess]       = useState(null)
  const [warnings,      setWarnings]      = useState([])

  const loadProfile = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true); else setLoading(true)
    setError(null)
    const response = await getProfile()
    if (response.success && response.user) {
      setProfile(response.user)
      setName(response.user.name || '')
      setWarnings(response.warnings || [])
    } else {
      setError(response.error || 'Impossible de charger le profil.')
    }
    if (refresh) setRefreshing(false); else setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => loadProfile(), 0)
    return () => window.clearTimeout(timer)
  }, [loadProfile])

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (trimmedName.length < 2 || trimmedName.length > 80) {
      setError('Le nom doit contenir entre 2 et 80 caractères.')
      setSuccess(null)
      return
    }
    setSaving(true); setError(null); setSuccess(null)
    const response = await updateProfile({ name: trimmedName })
    if (response.success && response.user) {
      setProfile(response.user)
      setName(response.user.name || '')
      setWarnings(response.warnings || [])
      setSuccess(response.message || 'Profil mis à jour.')
      await refreshUser()
    } else {
      setError(response.error || 'Impossible de mettre à jour le profil.')
    }
    setSaving(false)
  }

  const plan = profile?.plan || 'free'

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-label uppercase tracking-wider text-white/40 mb-1">Compte</p>
            <h1 className="text-display-sm font-black text-white">Paramètres</h1>
            <p className="text-body text-white/40">Gérez votre compte et vos préférences</p>
          </div>
          <Button variant="secondary" size="sm"
            onClick={() => loadProfile({ refresh: true })}
            disabled={loading || refreshing || saving}
            loading={refreshing}
          >
            <RefreshCw size={12} className="mr-1.5" />
            Actualiser
          </Button>
        </div>
      </motion.div>

      {/* ── Feedback banners ─────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-body-sm font-semibold text-amber-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" /><span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3 text-body-sm font-semibold text-emerald-300">
          <BadgeCheck size={14} className="mt-0.5 shrink-0" /><span>{success}</span>
        </div>
      )}
      {warnings.map((w) => (
        <div key={w} className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-body-sm font-semibold text-amber-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" /><span>{w}</span>
        </div>
      ))}

      {/* ── Mobile : tabs horizontaux scrollables ──────────────────────── */}
      <div className="flex lg:hidden overflow-x-auto gap-2 pb-1 -mx-1 px-1">
        {NAV_ITEMS.map(({ id, label }) => (
          <button
            key={id} type="button"
            onClick={() => setActiveSection(id)}
            className={`flex-shrink-0 px-4 py-2 rounded-pill text-body-sm font-medium transition-colors whitespace-nowrap ${
              activeSection === id
                ? 'bg-rose-600 text-white shadow-glow-rose'
                : 'bg-white/[0.05] text-white/50 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Layout 2 colonnes (desktop) ─────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Nav sidebar desktop (lg only) */}
        <motion.div variants={fadeUp} className="hidden lg:block">
          <Card padding="sm" className="h-fit">
            <nav className="space-y-0.5">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id} type="button"
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-body font-medium transition-all duration-200 text-left ${
                    activeSection === id
                      ? 'bg-rose-500/10 text-white border-l-2 border-app-accent pl-[10px]'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon size={15} className={activeSection === id ? 'text-rose-400' : 'text-white/30'} />
                  {label}
                </button>
              ))}
            </nav>
          </Card>
        </motion.div>

        {/* Contenu */}
        <motion.div variants={fadeUp} className="lg:col-span-3 space-y-5">

          {/* ── PROFIL ─────────────────────────────────────────────────── */}
          {activeSection === 'profile' && (
            <Card padding="lg">
              <h2 className="text-heading-sm font-semibold text-white mb-6">Informations du profil</h2>

              {loading && !profile ? (
                <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
                  <span className="w-6 h-6 border-2 border-white/20 border-t-rose-400 rounded-full animate-spin mb-3" />
                  <p className="text-body font-bold text-white/40">Chargement...</p>
                </div>
              ) : (
                <>
                  {/* Avatar + infos */}
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 flex items-center justify-center text-heading font-black text-white shrink-0 select-none shadow-[0_0_20px_rgba(225,29,72,0.30)]">
                        {getInitial(profile?.name)}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0a1628]" />
                    </div>
                    <div>
                      <p className="text-body font-black text-white">{profile?.name || '--'}</p>
                      <p className="text-body-sm text-white/40">{profile?.email || '--'}</p>
                      <div className="mt-1.5">
                        <Badge variant={PLAN_VARIANT[plan] || 'neutral'} size="sm">
                          {PLAN_LABEL[plan] || plan}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Meta grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {[
                      ['Email', profile?.email],
                      ['Rôle', profile?.role],
                      ['Compte créé', formatDateTime(profile?.createdAt)],
                      ['Dernière mise à jour', formatDateTime(profile?.updatedAt)],
                      ['Plan', PLAN_LABEL[plan] || plan],
                      ['Expiration plan', formatDateTime(profile?.planExpiresAt)],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                        <p className="text-caption text-white/30 mb-1 font-bold uppercase tracking-wider">{label}</p>
                        <p className="text-body font-black text-white break-words">{value || '--'}</p>
                      </div>
                    ))}
                  </div>

                  {/* Formulaire nom */}
                  <form onSubmit={handleProfileSubmit} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
                    <div>
                      <label className="text-label uppercase tracking-wide text-white/50 mb-1.5 block">
                        Nom affiché
                      </label>
                      <div className="relative">
                        <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                        <input
                          type="text" value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={saving || loading} maxLength={80}
                          placeholder="Votre nom"
                          className={`${fieldCls} pl-10`}
                        />
                      </div>
                      <p className="text-label text-white/25 mt-1.5">Email, plan et rôle ne peuvent pas être modifiés ici.</p>
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" variant="primary" size="md"
                        disabled={saving || loading || !name.trim()}
                        loading={saving}
                      >
                        {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </Card>
          )}

          {/* ── SÉCURITÉ ──────────────────────────────────────────────── */}
          {activeSection === 'security' && (
            <Card padding="lg">
              <h2 className="text-heading-sm font-semibold text-white mb-6">Sécurité</h2>
              <div className="space-y-3">
                <ComingSoonRow
                  title="Changer le mot de passe"
                  description="Aucun endpoint backend de changement de mot de passe n'est encore connecté depuis les paramètres."
                />
                <ComingSoonRow
                  title="Authentification à deux facteurs"
                  description="L'enregistrement 2FA nécessite un backend dédié non encore implémenté."
                />
                <ComingSoonRow
                  title="Sessions actives"
                  description="La gestion des sessions et l'historique de connexion ne sont pas encore exposés."
                />
              </div>
            </Card>
          )}

          {/* ── ABONNEMENT ────────────────────────────────────────────── */}
          {activeSection === 'subscription' && (
            <Card padding="lg">
              <h2 className="text-heading-sm font-semibold text-white mb-6">Abonnement</h2>

              <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                  <CreditCard size={20} className="text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm text-white/40 mb-1">Plan actuel</p>
                  <div className="flex items-center gap-2">
                    <p className="text-heading-sm font-bold text-white capitalize">{PLAN_LABEL[plan] || plan}</p>
                    <Badge variant={PLAN_VARIANT[plan] || 'neutral'} size="sm">
                      {PLAN_LABEL[plan] || plan}
                    </Badge>
                  </div>
                  {profile?.planExpiresAt && (
                    <p className="text-label text-white/30 mt-0.5">
                      Expire le {formatDateTime(profile.planExpiresAt, 'date')}
                    </p>
                  )}
                </div>
              </div>

              {plan === 'free' ? (
                <div className="space-y-3">
                  <p className="text-body text-white/40">Passez à Pro ou Elite pour débloquer des fonctionnalités avancées.</p>
                  <Button as={Link} to="/payments" variant="primary" size="md">
                    Voir les plans →
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-body-sm text-white/40">
                    Votre abonnement {PLAN_LABEL[plan]} est actif.
                    La resiliation se gere depuis la page Paiements et prend effet a la fin de la periode en cours.
                  </p>
                  <Button as={Link} to="/payments" variant="secondary" size="md">
                    Gerer l'abonnement
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* ── DANGER ZONE ──────────────────────────────────────────── */}
          {activeSection === 'danger' && (
            <Card padding="lg" className="border-red-500/20">
              <div className="flex items-start gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <Trash2 size={15} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-heading-sm font-semibold text-red-400">Zone de danger</h2>
                  <p className="text-body-sm text-white/40 mt-0.5">Ces actions sont irréversibles. Procédez avec prudence.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4 rounded-xl border border-red-500/15 bg-red-500/[0.05] px-4 py-4">
                  <div>
                    <p className="text-body font-bold text-white">Supprimer mon compte</p>
                    <p className="text-body-sm text-white/40 mt-0.5">
                      Supprime définitivement votre compte et toutes les données associées.
                      Cette action est irréversible.
                    </p>
                  </div>
                  <Button variant="danger" size="sm" disabled className="shrink-0">
                    Supprimer
                  </Button>
                </div>
                <p className="text-label text-white/25 px-1">
                  La suppression de compte nécessite un endpoint backend sécurisé non encore disponible.
                </p>
              </div>
            </Card>
          )}

          {/* ── Footer meta ────────────────────────────────────────────── */}
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-label text-white/25">
              <span className="flex items-center gap-1.5">
                <Clock size={10} className="text-rose-400" />
                Profil mis à jour : {formatDateTime(profile?.updatedAt || profile?.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Shield size={10} className="text-rose-400" />
                Champs sensibles non affichés
              </span>
              <span className="flex items-center gap-1.5">
                <Settings2 size={10} className="text-rose-400" />
                v{profile?.plan || 'free'} plan
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
