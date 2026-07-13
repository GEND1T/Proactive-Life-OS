<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { 
  Footprints, Heart, Brain, Moon, Code, Sparkles, Smartphone, Plus
} from 'lucide-vue-next'
import AIInsightCard from '../components/shared/AIInsightCard.vue'
import StatCard from '../components/shared/StatCard.vue'
import SleepChart from '../components/lifelogs/SleepChart.vue'
import CodingChart from '../components/lifelogs/CodingChart.vue'
import AddActivityLogModal from '../components/lifelogs/AddActivityLogModal.vue'
import { useActivityDB } from '../composables/useActivityDB'
import { useFormatters } from '../composables/useFormatters'
import { useAIInsight } from '../composables/useAIInsight'

const { formatMinutesToHours } = useFormatters()
const { todayLog, weeklyStats, fetchActivityLogs } = useActivityDB()
const { insight: aiInsight, isLoading: aiLoading, source: aiSource, fetchInsight } = useAIInsight()

const showAddLogModal = ref(false)

onMounted(() => {
  fetchActivityLogs()
})

const stepsPercentage = computed(() => Math.min(100, Math.round(((todayLog.value?.steps_count || 0) / 10000) * 100)))
const sleepPercentage = computed(() => Math.min(100, Math.round(((todayLog.value?.sleep_duration_minutes || 0) / 480) * 100)))
const screenPercentage = computed(() => Math.min(100, Math.round(((todayLog.value?.screen_time_minutes || 0) / 360) * 100)))
const isScreenTimeOver = computed(() => (todayLog.value?.screen_time_minutes || 0) > 360)

const lifeLogsInsightMessage = computed(() => aiInsight.value || 'Memuat insight...')

function loadLifeLogsInsight(forceRefresh = false) {
  const log = todayLog.value || {}
  const ctx = {
    sleepHours: log.sleep_duration_minutes ? Math.round(log.sleep_duration_minutes / 60 * 10) / 10 : 0,
    deepSleepMinutes: log.deep_sleep_minutes || 0,
    steps: log.steps_count || 0,
    screenTimeHours: log.screen_time_minutes ? Math.round(log.screen_time_minutes / 60 * 10) / 10 : 0,
    codingHours: log.wakatime_coding_hours || 0,
    heartRate: log.resting_heart_rate || 0,
    stress: log.stress_level_score || 0,
  }
  fetchInsight('lifelogs', ctx, forceRefresh)
}

watch(todayLog, () => {
  loadLifeLogsInsight()
}, { deep: true })
</script>

<template>
  <div class="stagger-children">
    <!-- AI Insight -->
    <AIInsightCard
      title="AI Health Analysis"
      :message="lifeLogsInsightMessage"
      :loading="aiLoading"
      :source="aiSource"
      timestamp="Baru saja"
      :icon="Sparkles"
      @refresh="loadLifeLogsInsight(true)"
    />

    <!-- Mini Stats Row -->
    <div class="grid grid-cols-3 gap-3 mx-4 mb-4">
      <!-- Steps Card -->
      <div class="surface-card-sm p-3.5 flex items-center justify-between border border-white/5 bg-surface-800/20 backdrop-blur-md rounded-2xl hover:scale-[1.01] transition-transform">
        <div>
          <p class="text-[10px] text-surface-500 font-semibold uppercase tracking-wider">Langkah</p>
          <p class="text-base font-bold text-white mt-1">{{ todayLog.steps_count?.toLocaleString() || 0 }}</p>
        </div>
        <div class="w-9 h-9 rounded-xl bg-success-500/10 flex items-center justify-center text-success-400 shrink-0">
          <Footprints class="w-4.5 h-4.5" />
        </div>
      </div>

      <!-- BPM Card -->
      <div class="surface-card-sm p-3.5 flex items-center justify-between border border-white/5 bg-surface-800/20 backdrop-blur-md rounded-2xl hover:scale-[1.01] transition-transform">
        <div>
          <p class="text-[10px] text-surface-500 font-semibold uppercase tracking-wider">Rest BPM</p>
          <p class="text-base font-bold text-white mt-1">{{ todayLog.resting_heart_rate || 68 }}</p>
        </div>
        <div class="w-9 h-9 rounded-xl bg-danger-500/10 flex items-center justify-center text-danger-400 shrink-0">
          <Heart class="w-4.5 h-4.5" />
        </div>
      </div>

      <!-- Stress Card -->
      <div class="surface-card-sm p-3.5 flex items-center justify-between border border-white/5 bg-surface-800/20 backdrop-blur-md rounded-2xl hover:scale-[1.01] transition-transform">
        <div>
          <p class="text-[10px] text-surface-500 font-semibold uppercase tracking-wider">Tingkat Stres</p>
          <p class="text-base font-bold mt-1"
            :class="todayLog.stress_level_score > 60 ? 'text-danger-400' : todayLog.stress_level_score > 30 ? 'text-warning-400' : 'text-success-400'"
          >
            {{ todayLog.stress_level_score || 30 }}
          </p>
        </div>
        <div
          class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          :class="todayLog.stress_level_score > 60 ? 'bg-danger-500/10 text-danger-400' : todayLog.stress_level_score > 30 ? 'bg-warning-500/10 text-warning-400' : 'bg-success-500/10 text-success-400'"
        >
          <Brain class="w-4.5 h-4.5" />
        </div>
      </div>
    </div>

    <!-- Daily Goals Tracker -->
    <div class="mx-4 mb-4">
      <div class="surface-card p-4 hover:scale-[1.005] transition-transform">
        <div class="flex items-center justify-between mb-3.5">
          <h3 class="text-xs font-bold text-surface-400 uppercase tracking-wider">Target Harian</h3>
          <button
            @click="showAddLogModal = true"
            class="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-[10px] font-bold text-white uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-purple-500/20"
          >
            <Plus class="w-3.5 h-3.5" />
            Log Hari Ini
          </button>
        </div>

        <div class="space-y-4">
          <!-- Steps Goal -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-lg bg-success-500/10 flex items-center justify-center text-success-400">
                  <Footprints class="w-3.5 h-3.5" />
                </div>
                <span class="text-xs font-semibold text-white">Langkah Kaki</span>
              </div>
              <span class="text-[11px] font-medium text-surface-300">
                {{ todayLog.steps_count?.toLocaleString() || 0 }} / 10.000
                <span class="text-success-400 ml-1 font-bold">({{ stepsPercentage }}%)</span>
              </span>
            </div>
            <div class="h-2 bg-surface-700/50 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-success-500 to-teal-400 transition-all duration-700 ease-out"
                :style="{ width: stepsPercentage + '%' }"
              ></div>
            </div>
          </div>

          <!-- Sleep Goal -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Moon class="w-3.5 h-3.5" />
                </div>
                <span class="text-xs font-semibold text-white">Tidur Ideal</span>
              </div>
              <span class="text-[11px] font-medium text-surface-300">
                {{ formatMinutesToHours(todayLog.sleep_duration_minutes || 0) }} / 8j
                <span class="text-purple-400 ml-1 font-bold">({{ sleepPercentage }}%)</span>
              </span>
            </div>
            <div class="h-2 bg-surface-700/50 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-700 ease-out"
                :style="{ width: sleepPercentage + '%' }"
              ></div>
            </div>
          </div>

          <!-- Screen Time Limit -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center gap-2">
                <div
                  class="w-6 h-6 rounded-lg flex items-center justify-center"
                  :class="isScreenTimeOver ? 'bg-danger-500/10 text-danger-400' : 'bg-warning-500/10 text-warning-400'"
                >
                  <Smartphone class="w-3.5 h-3.5" />
                </div>
                <span class="text-xs font-semibold text-white">Batas Screen Time</span>
              </div>
              <span class="text-[11px] font-medium" :class="isScreenTimeOver ? 'text-danger-400' : 'text-surface-300'">
                {{ formatMinutesToHours(todayLog.screen_time_minutes || 0) }} / 6j
                <span class="ml-1 font-bold" :class="isScreenTimeOver ? 'text-danger-400' : 'text-warning-400'">
                  ({{ isScreenTimeOver ? 'Overlimit ' : '' }}{{ screenPercentage }}%)
                </span>
              </span>
            </div>
            <div class="h-2 bg-surface-700/50 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-700 ease-out"
                :class="isScreenTimeOver ? 'bg-gradient-to-r from-danger-500 to-pink-500' : 'bg-gradient-to-r from-warning-500 to-amber-400'"
                :style="{ width: screenPercentage + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sleep Chart -->
    <SleepChart />

    <!-- Coding Chart -->
    <div class="mt-4">
      <CodingChart />
    </div>

    <!-- Weekly Averages -->
    <div class="mt-5 mx-4 mb-5">
      <div class="flex items-center gap-2 mb-3 px-1">
        <h3 class="text-xs font-bold text-surface-400 uppercase tracking-wider">Rata-rata Mingguan</h3>
        <div class="flex-1 h-px bg-surface-700/50"></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <StatCard
          label="Rata-rata Tidur"
          :value="formatMinutesToHours(weeklyStats.avgSleep)"
          :icon="Moon"
          color="purple"
        />
        <StatCard
          label="Rata-rata Coding"
          :value="weeklyStats.avgCoding + 'j'"
          :icon="Code"
          color="cyan"
        />
        <StatCard
          label="Rata-rata Langkah"
          :value="weeklyStats.avgSteps.toLocaleString()"
          :icon="Footprints"
          color="green"
        />
        <StatCard
          label="Rata-rata Stress"
          :value="weeklyStats.avgStress + '/100'"
          :icon="Brain"
          :color="weeklyStats.avgStress > 50 ? 'rose' : 'green'"
        />
      </div>
    </div>

    <!-- Add Activity Log Modal -->
    <AddActivityLogModal
      :show="showAddLogModal"
      @close="showAddLogModal = false"
      @saved="fetchActivityLogs()"
    />
  </div>
</template>
