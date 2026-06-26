import { ref, computed } from 'vue'
import { supabase } from '../services/supabase'

const rawLogs = ref([])
const isLoading = ref(false)
const error = ref(null)

export function useActivityDB() {
  async function fetchActivityLogs() {
    isLoading.value = true
    error.value = null
    try {
      const { data, error: dbError } = await supabase
        .from('activity_logs')
        .select('*')
        .order('logged_date', { ascending: false })

      if (dbError) throw dbError
      rawLogs.value = data || []
    } catch (err) {
      console.error('Error fetching activity logs:', err)
      error.value = err.message || 'Gagal mengambil data aktivitas.'
    } finally {
      isLoading.value = false
    }
  }

  // Aggregate logs by logged_date
  const activityLogs = computed(() => {
    const groups = {}

    rawLogs.value.forEach(log => {
      const date = log.logged_date
      if (!groups[date]) {
        groups[date] = {
          logged_date: date,
          main_sleep_duration: 0,
          nap_sleep_duration: 0,
          sleep_duration_minutes: 0,
          deep_sleep_minutes: 0,
          screen_time_minutes: 0,
          wakatime_coding_hours: 0,
          steps_count: 0,
          heart_rates: [],
          stress_scores: [],
        }
      }

      const g = groups[date]
      
      // Hitung durasi tidur dari session_start & session_end (format ISO/timestamp)
      let duration = 0
      if (log.session_start && log.session_end) {
        const startStr = String(log.session_start).replace(' ', 'T')
        const endStr = String(log.session_end).replace(' ', 'T')
        const start = new Date(startStr)
        const end = new Date(endStr)
        const diffMs = end.getTime() - start.getTime()
        if (!isNaN(diffMs) && diffMs > 0) {
          duration = Math.round(diffMs / 60000)
        }
      } else {
        duration = Number(log.sleep_duration_minutes) || 0
      }

      const type = (log.sleep_type || '').toLowerCase()
      if (/utama/.test(type)) {
        g.main_sleep_duration += duration
      } else {
        // Mendeteksi 'siang' atau 'ekstra'
        g.nap_sleep_duration += duration
      }
      
      g.sleep_duration_minutes += duration
      g.deep_sleep_minutes += Number(log.deep_sleep_minutes) || 0

      if (log.screen_time_minutes != null) {
        g.screen_time_minutes = Math.max(g.screen_time_minutes, Number(log.screen_time_minutes))
      }
      if (log.wakatime_coding_hours != null) {
        g.wakatime_coding_hours += Number(log.wakatime_coding_hours)
      }
      if (log.steps_count != null) {
        g.steps_count += Number(log.steps_count)
      }
      if (log.resting_heart_rate != null) {
        g.heart_rates.push(Number(log.resting_heart_rate))
      }
      if (log.stress_level_score != null) {
        g.stress_scores.push(Number(log.stress_level_score))
      }
    })

    // Map groups to array and calculate averages for arrays
    return Object.values(groups)
      .map(g => {
        const avgHeartRate = g.heart_rates.length
          ? Math.round(g.heart_rates.reduce((a, b) => a + b, 0) / g.heart_rates.length)
          : null
        const avgStress = g.stress_scores.length
          ? Math.round(g.stress_scores.reduce((a, b) => a + b, 0) / g.stress_scores.length)
          : null

        return {
          logged_date: g.logged_date,
          sleep_duration_minutes: g.sleep_duration_minutes,
          main_sleep_duration: g.main_sleep_duration,
          nap_sleep_duration: g.nap_sleep_duration,
          deep_sleep_minutes: g.deep_sleep_minutes,
          screen_time_minutes: g.screen_time_minutes || null,
          wakatime_coding_hours: g.wakatime_coding_hours || null,
          steps_count: g.steps_count || null,
          resting_heart_rate: avgHeartRate || 68, // Default fallback if missing
          stress_level_score: avgStress || 35,   // Default fallback if missing
        }
      })
      .sort((a, b) => b.logged_date.localeCompare(a.logged_date))
  })

  // Calculate weekly statistics based on aggregated daily logs (last 7 logs)
  const weeklyStats = computed(() => {
    const last7Logs = activityLogs.value.slice(0, 7)
    if (!last7Logs.length) {
      return {
        avgSleep: 420,
        avgScreenTime: 360,
        avgCoding: 4.0,
        avgSteps: 5000,
        avgHeartRate: 70,
        avgStress: 40,
      }
    }

    const sums = { sleep: 0, screen: 0, coding: 0, steps: 0, hr: 0, stress: 0 }
    const counts = { sleep: 0, screen: 0, coding: 0, steps: 0, hr: 0, stress: 0 }

    last7Logs.forEach(l => {
      if (l.sleep_duration_minutes != null) {
        sums.sleep += l.sleep_duration_minutes
        counts.sleep++
      }
      if (l.screen_time_minutes != null) {
        sums.screen += l.screen_time_minutes
        counts.screen++
      }
      if (l.wakatime_coding_hours != null) {
        sums.coding += l.wakatime_coding_hours
        counts.coding++
      }
      if (l.steps_count != null) {
        sums.steps += l.steps_count
        counts.steps++
      }
      if (l.resting_heart_rate != null) {
        sums.hr += l.resting_heart_rate
        counts.hr++
      }
      if (l.stress_level_score != null) {
        sums.stress += l.stress_level_score
        counts.stress++
      }
    })

    return {
      avgSleep: counts.sleep ? Math.round(sums.sleep / counts.sleep) : 420,
      avgScreenTime: counts.screen ? Math.round(sums.screen / counts.screen) : 360,
      avgCoding: counts.coding ? Number((sums.coding / counts.coding).toFixed(1)) : 4.0,
      avgSteps: counts.steps ? Math.round(sums.steps / counts.steps) : 5000,
      avgHeartRate: counts.hr ? Math.round(sums.hr / counts.hr) : 70,
      avgStress: counts.stress ? Math.round(sums.stress / counts.stress) : 40,
    }
  })

  // Return the first log for "today's summary" or fallback
  const todayLog = computed(() => {
    return activityLogs.value[0] || {
      logged_date: new Date().toISOString().split('T')[0],
      sleep_duration_minutes: 420,
      main_sleep_duration: 420,
      nap_sleep_duration: 0,
      deep_sleep_minutes: 90,
      screen_time_minutes: 180,
      wakatime_coding_hours: 2.5,
      steps_count: 3500,
      resting_heart_rate: 68,
      stress_level_score: 30,
    }
  })

  return {
    rawLogs,
    activityLogs,
    weeklyStats,
    todayLog,
    isLoading,
    error,
    fetchActivityLogs,
  }
}
