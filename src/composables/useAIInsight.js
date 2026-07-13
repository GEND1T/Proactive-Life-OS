import { ref } from 'vue'

/**
 * useAIInsight composable
 * Generates personalized AI insights for each module.
 * Strategy:
 * 1. Try Gemini API via backend /api/ai/insight
 * 2. Fallback to smart rule-based insights generated from real data
 * 3. Cache insights for 1 hour to minimize API calls
 */

const insightCache = {}
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

function getCached(module) {
  const entry = insightCache[module]
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    delete insightCache[module]
    return null
  }
  return entry
}

function setCache(module, insight, source) {
  insightCache[module] = { insight, source, timestamp: Date.now() }
}

// ---------- Smart Rule-Based Insight Engine ----------

function generateDashboardInsight(ctx) {
  const insights = []
  const sleepH = ctx.sleepHours || 0
  const steps = ctx.steps || 0
  const stress = ctx.stress || 0
  const spending = ctx.todaySpending || 0
  const budget = ctx.dailyBudget || 50000

  if (sleepH < 6) {
    insights.push(`⚠️ Tidurmu hanya ${sleepH} jam semalam. Kurang tidur bisa menurunkan konsentrasi hingga 40%. Prioritaskan istirahat malam ini sebelum jam 23:00.`)
  } else if (sleepH >= 8) {
    insights.push(`✅ Kualitas tidurmu bagus (${sleepH} jam)! Energi tinggi hari ini — manfaatkan untuk mengerjakan tugas paling berat lebih dulu.`)
  }

  if (stress > 70) {
    insights.push(`🧘 Stress level-mu ${stress}/100, cukup tinggi. Coba ambil jeda 10 menit untuk stretching atau pernapasan dalam sebelum melanjutkan aktivitas.`)
  }

  if (spending > budget * 0.8) {
    const pct = Math.round((spending / budget) * 100)
    insights.push(`💸 Kamu sudah menggunakan ${pct}% budget harianmu. Pertimbangkan untuk menahan pengeluaran sisa hari ini.`)
  }

  if (steps < 3000) {
    insights.push(`🚶 Baru ${steps.toLocaleString('id-ID')} langkah hari ini. Target 10.000 — coba jalan kaki ke kampus atau naik tangga untuk menambah langkah.`)
  }

  if (insights.length === 0) {
    insights.push(`👋 Hari ini terlihat seimbang! Tidur ${sleepH}j, stress ${stress}/100, langkah ${steps.toLocaleString('id-ID')}. Tetap jaga momentum produktivitasmu!`)
  }

  return insights[0]
}

function generateFinanceInsight(ctx) {
  const balance = ctx.balance || 0
  const spending = ctx.todaySpending || 0
  const budget = ctx.dailyBudget || 50000
  const pct = ctx.spendingPercentage || 0
  const topCat = ctx.topCategory || 'Lainnya'

  if (pct >= 100) {
    return `🚨 Budget harian sudah terlampaui (${pct}%). Kategori terbesar: ${topCat}. Coba evaluasi apakah ada pengeluaran impulsif yang bisa dihindari besok.`
  }
  if (pct >= 70) {
    return `⚠️ Budget harianmu sudah ${pct}% terpakai. Sisa Rp ${(budget - spending).toLocaleString('id-ID')} untuk hari ini. Tahan pengeluaran kecuali kebutuhan mendesak.`
  }
  if (pct <= 30 && spending > 0) {
    return `💰 Pengeluaran hari ini baru ${pct}% dari budget — sangat hemat! Sisa budget bisa dialokasikan ke tabungan darurat atau investasi kecil.`
  }
  if (balance < 500000) {
    return `📉 Saldo total tinggal Rp ${balance.toLocaleString('id-ID')}. Perlu perhatian ekstra untuk pengeluaran minggu ini. Evaluasi langganan yang bisa dipotong.`
  }
  return `📊 Pengeluaran hari ini Rp ${spending.toLocaleString('id-ID')} dari budget Rp ${budget.toLocaleString('id-ID')} (${pct}%). Pengeluaran terbesar di kategori ${topCat}.`
}

function generateCalendarInsight(ctx) {
  const count = ctx.eventsCount || 0
  const cats = ctx.categories || ''

  if (count === 0) {
    return `📅 Tidak ada jadwal hari ini — waktu bagus untuk deep work atau mengejar tugas yang tertunda. Buat rencana untuk besok supaya tidak kehilangan momentum.`
  }
  if (count >= 5) {
    return `🔥 Hari yang padat dengan ${count} kegiatan (${cats})! Pastikan ada jeda 10-15 menit antar kegiatan untuk menghindari burnout.`
  }
  if (count <= 2) {
    return `📋 Hanya ${count} jadwal hari ini. Manfaatkan waktu kosong untuk project pribadi, olahraga, atau belajar skill baru yang sudah lama ditunda.`
  }
  return `📅 Ada ${count} kegiatan hari ini: ${cats}. Atur prioritas dari yang paling penting dan alokasikan buffer time untuk tugas mendadak.`
}

function generateLifeLogsInsight(ctx) {
  const sleepH = ctx.sleepHours || 0
  const deepSleep = ctx.deepSleepMinutes || 0
  const steps = ctx.steps || 0
  const screenH = ctx.screenTimeHours || 0
  const codingH = ctx.codingHours || 0
  const stress = ctx.stress || 0
  const hr = ctx.heartRate || 68

  if (screenH > 8) {
    return `📱 Screen time ${screenH} jam — di atas batas sehat (6 jam). Coba aktifkan mode fokus atau screen-free time 1 jam sebelum tidur untuk kualitas tidur lebih baik.`
  }
  if (sleepH < 6 && stress > 50) {
    return `😴 Kombinasi kurang tidur (${sleepH}j) dan stress tinggi (${stress}/100) bisa berdampak pada kesehatan. Prioritaskan tidur lebih awal malam ini.`
  }
  if (codingH > 6) {
    return `💻 ${codingH} jam coding hari ini — produktif! Tapi jangan lupa istirahat mata (aturan 20-20-20) dan stretching setiap 45 menit untuk menjaga kesehatan.`
  }
  if (steps >= 8000) {
    return `🏃 ${steps.toLocaleString('id-ID')} langkah — hampir mencapai target! Tubuh yang aktif meningkatkan konsentrasi dan mood. Teruskan!`
  }
  if (deepSleep < 60 && sleepH >= 7) {
    return `🌙 Tidurmu ${sleepH} jam tapi deep sleep hanya ${deepSleep} menit. Coba hindari layar 30 menit sebelum tidur dan kurangi kafein setelah jam 14:00.`
  }
  return `📊 Tidur ${sleepH}j, ${steps.toLocaleString('id-ID')} langkah, ${codingH}j coding, screen time ${screenH}j. ${stress > 40 ? 'Stress cukup tinggi — jangan lupa relaksasi.' : 'Kondisi kesehatan dalam zona aman.'}`
}

function generateHabitsInsight(ctx) {
  const total = ctx.totalHabits || 0
  const routine = ctx.routineCount || 0
  const suggestion = ctx.suggestionCount || 0
  const avgPts = ctx.avgPoints || 0
  const nearEvo = ctx.nearEvolution || 0

  if (nearEvo > 0) {
    return `🌟 ${nearEvo} kebiasaan hampir berevolusi menjadi ROUTINE (poin ≥ 7)! Sedikit lagi — konsistensi 2-3 hari ke depan akan mengunci evolusi. Jangan putus sekarang!`
  }
  if (routine > suggestion) {
    return `🏆 ${routine} dari ${total} kebiasaanmu sudah menjadi ROUTINE — luar biasa! Kamu sudah membangun fondasi kuat. Pertimbangkan menambah tantangan baru.`
  }
  if (avgPts < 4) {
    return `💪 Rata-rata poin masih ${avgPts}/10 — tapi setiap langkah kecil berarti! Fokus pada 1-2 kebiasaan paling penting dulu, jangan sekaligus banyak.`
  }
  if (total === 0) {
    return `🌱 Belum ada kebiasaan yang di-track. Mulai dari 1 kebiasaan sederhana (misalnya minum air 8 gelas/hari) dan bangun dari sana!`
  }
  return `📈 ${total} kebiasaan aktif dengan rata-rata poin ${avgPts}/10. ${routine} sudah ROUTINE, ${suggestion} masih SUGGESTION. Terus tingkatkan konsistensi harian!`
}

const ruleBasedGenerators = {
  dashboard: generateDashboardInsight,
  finance: generateFinanceInsight,
  calendar: generateCalendarInsight,
  lifelogs: generateLifeLogsInsight,
  habits: generateHabitsInsight,
}

// ---------- Main Composable ----------

export function useAIInsight() {
  const insight = ref('')
  const isLoading = ref(false)
  const source = ref('') // 'gemini', 'rules', 'cache'

  /**
   * Fetch AI insight for a module.
   * @param {string} module - 'dashboard' | 'finance' | 'calendar' | 'lifelogs' | 'habits'
   * @param {object} context - Data context specific to the module
   * @param {boolean} forceRefresh - Skip cache
   */
  async function fetchInsight(module, context, forceRefresh = false) {
    // Check cache first
    if (!forceRefresh) {
      const cached = getCached(module)
      if (cached) {
        insight.value = cached.insight
        source.value = 'cache'
        return
      }
    }

    isLoading.value = true

    // Try Gemini API first
    try {
      const apiBase = import.meta.env.PROD ? '' : 'http://localhost:3001'
      const response = await fetch(`${apiBase}/api/ai/insight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module, context }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.insight) {
          insight.value = data.insight
          source.value = 'gemini'
          setCache(module, data.insight, 'gemini')
          isLoading.value = false
          return
        }
      }
    } catch (err) {
      console.warn('Gemini API unavailable, using rule-based fallback:', err.message)
    }

    // Fallback to rule-based engine
    const generator = ruleBasedGenerators[module]
    if (generator) {
      const generated = generator(context)
      insight.value = generated
      source.value = 'rules'
      setCache(module, generated, 'rules')
    } else {
      insight.value = '🤖 Insight tidak tersedia untuk modul ini.'
      source.value = 'none'
    }

    isLoading.value = false
  }

  function clearInsight() {
    insight.value = ''
    source.value = ''
  }

  return {
    insight,
    isLoading,
    source,
    fetchInsight,
    clearInsight,
  }
}
