<script setup>
import { onMounted, computed } from 'vue'
import { 
  Footprints, Heart, Brain, Moon, Code, Sparkles, Smartphone
} from 'lucide-vue-next'
import AIInsightCard from '../components/shared/AIInsightCard.vue'
import StatCard from '../components/shared/StatCard.vue'
import SleepChart from '../components/lifelogs/SleepChart.vue'
import CodingChart from '../components/lifelogs/CodingChart.vue'
import { useActivityDB } from '../composables/useActivityDB'
import { useFormatters } from '../composables/useFormatters'

const { formatMinutesToHours } = useFormatters()
const { todayLog, weeklyStats, fetchActivityLogs } = useActivityDB()

onMounted(() => {
  fetchActivityLogs()
})

const stepsPercentage = computed(() => Math.min(100, Math.round(((todayLog.value?.steps_count || 0) / 10000) * 100)))
const sleepPercentage = computed(() => Math.min(100, Math.round(((todayLog.value?.sleep_duration_minutes || 0) / 480) * 100)))
const screenPercentage = computed(() => Math.min(100, Math.round(((todayLog.value?.screen_time_minutes || 0) / 360) * 100)))
const isScreenTimeOver = computed(() => (todayLog.value?.screen_time_minutes || 0) > 360)
</script>

<template>
  <div class="stagger-children">
    <!-- AI Insight -->
    <AIInsightCard
      title="AI Habit Analysis"
      message="Tidur siangmu kemarin 1.5 jam membuat screen time malammu meningkat 35%. Pola coding-mu paling produktif di hari Kamis (7.3 jam). Coba tidur sebelum jam 23:00 untuk kualitas deep sleep yang lebih baik."
      timestamp="8 menit lalu"
      :icon="Sparkles"
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
          <span class="text-[10px] text-surface-500 font-medium">Hari Ini</span>
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
  </div>
</template>
