<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { Brain, Repeat } from 'lucide-vue-next'
import AIInsightCard from '../components/shared/AIInsightCard.vue'
import RadarWidget from '../components/dashboard/RadarWidget.vue'
import QuickStats from '../components/dashboard/QuickStats.vue'
import { user, getGreeting } from '../data/user'
import { getValidToken, fetchEventsForDate } from '../services/googleCalendar'
import { getLocalEvents } from '../services/localCalendar'
import { useFormatters } from '../composables/useFormatters'
import { useFinanceDB } from '../composables/useFinanceDB'
import { useActivityDB } from '../composables/useActivityDB'
import { useAIInsight } from '../composables/useAIInsight'

const { formatTime, formatCompact, formatMinutesToHours } = useFormatters()
const greeting = getGreeting()

const { totalBalance, todaySpending, dailyBudget } = useFinanceDB()
const { todayLog } = useActivityDB()
const { insight: aiInsight, isLoading: aiLoading, source: aiSource, fetchInsight } = useAIInsight()

const todayEvents = ref([])
const isLoading = ref(true)

onMounted(() => {
  loadTodayEvents()
  window.addEventListener('local-events-updated', loadTodayEvents)
})

onUnmounted(() => {
  window.removeEventListener('local-events-updated', loadTodayEvents)
})

async function loadTodayEvents() {
  isLoading.value = true
  try {
    let googleEvents = []
    if (await getValidToken()) {
      googleEvents = await fetchEventsForDate(new Date())
    }
    const localEvents = getLocalEvents().filter(e => {
      const eDate = new Date(e.start)
      const today = new Date()
      return eDate.getDate() === today.getDate() && 
             eDate.getMonth() === today.getMonth() && 
             eDate.getFullYear() === today.getFullYear()
    })
    
    todayEvents.value = [...googleEvents, ...localEvents].sort((a, b) => new Date(a.start) - new Date(b.start))
  } catch (err) {
    console.error('Failed to load events on dashboard:', err)
    const localEvents = getLocalEvents().filter(e => {
      const eDate = new Date(e.start)
      const today = new Date()
      return eDate.getDate() === today.getDate() && 
             eDate.getMonth() === today.getMonth() && 
             eDate.getFullYear() === today.getFullYear()
    })
    todayEvents.value = localEvents.sort((a, b) => new Date(a.start) - new Date(b.start))
  } finally {
    isLoading.value = false
  }
}

const insightMessage = computed(() => aiInsight.value || 'Memuat insight...')

function loadAIInsight(forceRefresh = false) {
  const ctx = {
    sleepHours: todayLog.value?.sleep_duration_minutes ? Math.round(todayLog.value.sleep_duration_minutes / 60 * 10) / 10 : 0,
    steps: todayLog.value?.steps_count || 0,
    stress: todayLog.value?.stress_level_score || 0,
    eventsCount: todayEvents.value.length,
    balance: totalBalance.value || 0,
    todaySpending: todaySpending.value || 0,
    dailyBudget: dailyBudget.value || 0,
  }
  fetchInsight('dashboard', ctx, forceRefresh)
}

// Load AI insight after events are loaded
watch([todayEvents, todayLog], () => {
  if (!isLoading.value) {
    loadAIInsight()
  }
}, { deep: true })

const categoryColors = {
  akademik: 'bg-blue-400',
  coding: 'bg-green-400',
  meeting: 'bg-purple-400',
  deadline: 'bg-red-400',
  personal: 'bg-yellow-400'
}
</script>

<template>
  <div class="stagger-children">
    <!-- Greeting -->
    <div class="px-4 pt-3 pb-1">
      <p class="text-xs text-surface-500 font-medium">{{ greeting }},</p>
      <h2 class="text-lg font-bold text-white">{{ user.fullName }} 👋</h2>
    </div>

    <!-- AI Insight -->
    <AIInsightCard
      title="AI Daily Briefing"
      :message="insightMessage"
      :loading="aiLoading"
      :source="aiSource"
      timestamp="Baru saja"
      :icon="Brain"
      @refresh="loadAIInsight(true)"
    />

    <!-- Radar Widget -->
    <RadarWidget :events="todayEvents" />

    <!-- Quick Stats -->
    <div class="mt-4">
      <div class="px-4 mb-3">
        <h3 class="text-sm font-semibold text-surface-500">Quick Stats</h3>
      </div>
      <QuickStats />
    </div>

    <!-- Today's Schedule Preview -->
    <div class="mt-4 mx-4 mb-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-surface-500">Jadwal Hari Ini</h3>
        <router-link to="/calendar" class="text-xs text-primary-400 font-medium hover:text-primary-300 transition-colors">
          Lihat Semua →
        </router-link>
      </div>
      <div v-if="isLoading" class="space-y-2 animate-pulse">
        <div v-for="i in 3" :key="i" class="surface-card-sm p-3 flex items-center gap-3">
          <div class="w-1 h-10 rounded-full bg-surface-700/50 shrink-0"></div>
          <div class="flex-1 min-w-0 space-y-2">
            <div class="h-3.5 bg-surface-700/40 rounded-lg w-2/3"></div>
            <div class="h-2.5 bg-surface-700/30 rounded-lg w-1/3"></div>
          </div>
        </div>
      </div>
      <div v-else-if="todayEvents.length === 0" class="surface-card-sm p-4 text-center">
        <p class="text-sm text-surface-500">Tidak ada jadwal hari ini 🎉</p>
      </div>
      <div v-else class="space-y-2">
        <div v-for="event in todayEvents.slice(0, 3)" :key="event.id" class="surface-card-sm p-3 flex items-center gap-3">
          <div class="w-1 h-10 rounded-full" :class="categoryColors[event.category] || 'bg-yellow-400'"></div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ event.title }}</p>
            <p class="text-xs text-surface-500">
              {{ formatTime(event.start) }} 
              <span v-if="event.end && event.end !== event.start">- {{ formatTime(event.end) }}</span>
              <span v-if="event.location"> • {{ event.location }}</span>
            </p>
          </div>
          <span v-if="event.rrule" class="text-xs text-surface-500" title="Jadwal Berulang">
            <Repeat class="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
