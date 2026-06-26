import { ref, computed } from 'vue'

export function useFormatters() {
  function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  function formatCompact(amount) {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}jt`
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}rb`
    return amount.toString()
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  function formatDateFull(dateStr) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  function formatTime(dateStr) {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  function formatTimeRange(start, end) {
    return `${formatTime(start)} - ${formatTime(end)}`
  }

  function formatMinutesToHours(minutes) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h === 0) return `${m}m`
    if (m === 0) return `${h}j`
    return `${h}j ${m}m`
  }

  function formatRelativeTime(dateStr) {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Baru saja'
    if (diffMins < 60) return `${diffMins} menit lalu`
    if (diffHours < 24) return `${diffHours} jam lalu`
    if (diffDays < 7) return `${diffDays} hari lalu`
    return formatDate(dateStr)
  }

  function getDayName(date) {
    return new Date(date).toLocaleDateString('id-ID', { weekday: 'short' })
  }

  function getDayNumber(date) {
    return new Date(date).getDate()
  }

  function isToday(date) {
    const today = new Date()
    const d = new Date(date)
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
  }

  return {
    formatCurrency,
    formatCompact,
    formatDate,
    formatDateFull,
    formatTime,
    formatTimeRange,
    formatMinutesToHours,
    formatRelativeTime,
    getDayName,
    getDayNumber,
    isToday,
  }
}
