/**
 * Canonical formatting utilities — source unique pour toute l'app.
 * Importer depuis ici, ne jamais redéfinir localement dans les composants.
 */

// ── Number helpers ─────────────────────────────────────────────────────────────

/** Retourne le nombre fini ou null si invalide. */
export function getValidNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/** Retourne le nombre fini ou le fallback (défaut: 0). */
export function toNumber(value, fallback = 0) {
  const n = getValidNumber(value)
  return n !== null ? n : fallback
}

// ── Currency ───────────────────────────────────────────────────────────────────

/**
 * Formate une valeur monétaire.
 * @param {*}      value
 * @param {string} [currency='USD']
 * @param {number} [decimals=2]
 * @param {boolean} [sign=false] — préfixe +/- si true
 */
export function formatCurrency(value, { currency = 'USD', decimals = 2, sign = false } = {}) {
  const n = getValidNumber(value)
  if (n === null) return '--'
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(sign ? Math.abs(n) : n)
  if (!sign) return formatted
  return `${n >= 0 ? '+' : '-'}${formatted}`
}

/**
 * Formate un montant en cents (Stripe) vers la devise affichable.
 * @param {*}      value  — montant en cents (ex: 2999 → 29.99)
 * @param {string} [currency='EUR']
 */
export function formatCurrencyFromCents(value, currency = 'EUR') {
  const n = getValidNumber(value)
  if (n === null) return '--'
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(n / 100)
}

/**
 * Formate en notation compacte K/M/B (volumes, grandes valeurs).
 * @param {*} value
 */
export function formatCurrencyCompact(value) {
  const n = getValidNumber(value)
  if (n === null) return '--'
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(n)
}

// ── Price (crypto/forex avec décimales variables) ──────────────────────────────

/**
 * Formate un prix de marché — adapte les décimales selon la magnitude.
 * ≥100: 2 décimales | ≥1: 4 décimales | <1: 6 décimales
 */
export function formatPrice(value) {
  const n = getValidNumber(value)
  if (n === null) return '--'
  const maxDecimals = Math.min(Math.max(n >= 100 ? 2 : n >= 1 ? 4 : 6, 0), 8)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals,
  }).format(n)
}

// ── Percent ────────────────────────────────────────────────────────────────────

/**
 * Formate un pourcentage avec signe.
 * @param {*}      value
 * @param {number} [decimals=2]
 */
export function formatPercent(value, decimals = 2) {
  const n = getValidNumber(value)
  if (n === null) return '--'
  return `${n >= 0 ? '+' : ''}${n.toFixed(decimals)}%`
}

// ── Date / time ────────────────────────────────────────────────────────────────

/**
 * Formate une date/heure.
 * @param {*}      value
 * @param {'full'|'date'|'time'} [format='full']
 *   - 'full'  → "Jun 24, 02:30"
 *   - 'date'  → "Jun 24"
 *   - 'time'  → "02:30"
 */
export function formatDateTime(value, format = 'full') {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'

  const opts = {
    full:  { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' },
    date:  { month: 'short', day: '2-digit' },
    time:  { hour: '2-digit', minute: '2-digit' },
    long:  { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' },
  }

  return new Intl.DateTimeFormat('en-US', opts[format] ?? opts.full).format(date)
}

// ── Number display ─────────────────────────────────────────────────────────────

/**
 * Formate un nombre avec séparateurs de milliers (ex: 1,234,567).
 * @param {*}      value
 * @param {number} [maxDecimals=8]
 */
export function formatNumber(value, maxDecimals = 8) {
  const n = getValidNumber(value)
  if (n === null) return '--'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: maxDecimals }).format(n)
}

// ── Volume (Compact alias) ─────────────────────────────────────────────────────
export const formatVolume = formatCurrencyCompact
