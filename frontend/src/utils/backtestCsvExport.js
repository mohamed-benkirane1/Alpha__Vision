const CSV_COLUMNS = [
  'exportedAt',
  'createdAt',
  'symbol',
  'strategy',
  'interval',
  'startDate',
  'endDate',
  'initialCapital',
  'positionSize',
  'totalReturn',
  'winRate',
  'maxDrawdown',
  'numberOfTrades',
  'finalBalance',
]

const todayStamp = () => new Date().toISOString().slice(0, 10)

const cleanFilePart = (value, fallback = 'export') => {
  const text = String(value || fallback).trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-')
  return text || fallback
}

const csvCell = (value) => {
  if (value === null || value === undefined) return ''
  const text = String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const buildCsv = (rows) => [
  CSV_COLUMNS.join(','),
  ...rows.map((row) => CSV_COLUMNS.map((key) => csvCell(row[key])).join(',')),
].join('\r\n')

const downloadCsv = (filename, rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('No rows available for CSV export.')
  }

  const blob = new Blob([buildCsv(rows)], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

const getInterval = (params = {}) => params.interval || params.timeframe || '1d'

export function exportSingleBacktestCsv(response = {}) {
  const params = response.params || {}
  const results = response.results || {}
  const exportedAt = new Date().toISOString()
  const symbol = params.symbol || 'UNKNOWN'
  const filename = `alpha-vision-backtest-${cleanFilePart(symbol)}-${todayStamp()}.csv`

  downloadCsv(filename, [{
    exportedAt,
    createdAt: response.timestamp || '',
    symbol,
    strategy: params.strategy || '',
    interval: getInterval(params),
    startDate: params.startDate || '',
    endDate: params.endDate || '',
    initialCapital: params.initialCapital ?? '',
    positionSize: params.positionSize ?? '',
    totalReturn: results.totalReturn ?? '',
    winRate: results.winRate ?? '',
    maxDrawdown: results.maxDrawdown ?? '',
    numberOfTrades: results.totalTrades ?? '',
    finalBalance: results.finalCapital ?? '',
  }])

  return filename
}

export function exportBacktestCompareCsv(result = {}) {
  const params = result.params || {}
  const exportedAt = new Date().toISOString()
  const symbol = params.symbol || 'UNKNOWN'
  const rows = (Array.isArray(result.comparisons) ? result.comparisons : []).map((row) => ({
    exportedAt,
    createdAt: result.timestamp || '',
    symbol,
    strategy: row.strategy || '',
    interval: getInterval(params),
    startDate: params.startDate || '',
    endDate: params.endDate || '',
    initialCapital: params.initialCapital ?? '',
    positionSize: params.positionSize ?? '',
    totalReturn: row.totalReturn ?? '',
    winRate: row.winRate ?? '',
    maxDrawdown: row.maxDrawdown ?? '',
    numberOfTrades: row.numberOfTrades ?? '',
    finalBalance: row.finalBalance ?? '',
  }))
  const filename = `alpha-vision-backtest-compare-${cleanFilePart(symbol)}-${todayStamp()}.csv`

  downloadCsv(filename, rows)
  return filename
}
