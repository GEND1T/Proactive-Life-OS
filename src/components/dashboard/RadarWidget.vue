<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  Clock, MapPin, ChevronRight,
  GraduationCap, Code, Target, AlertCircle, Users 
} from 'lucide-vue-next'
import { useFormatters } from '../../composables/useFormatters'

const props = defineProps({
  events: {
    type: Array,
    default: () => []
  }
})

const { formatTime, formatTimeRange } = useFormatters()

const now = ref(new Date())
let timer = null

onMounted(() => {
  timer = setInterval(() => { now.value = new Date() }, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})

const currentEvent = computed(() => {
  return props.events.find(e => {
    const start = new Date(e.start)
    const end = new Date(e.end)
    return now.value >= start && now.value <= end
  })
})

const nextEvent = computed(() => {
  return props.events.find(e => new Date(e.start) > now.value)
})

const countdown = computed(() => {
  if (!nextEvent.value) return null
  const diff = new Date(nextEvent.value.start) - now.value
  if (diff <= 0) return null
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  const secs = Math.floor((diff % 60000) / 1000)
  return { hours, mins, secs, total: diff }
})

const categoryIcons = {
  akademik: GraduationCap,
  coding: Code,
  personal: Target,
  deadline: AlertCircle,
  meeting: Users,
}

const textColors = {
  blue: 'text-blue-400',
  green: 'text-green-400',
  yellow: 'text-yellow-400',
  red: 'text-red-400',
  purple: 'text-purple-400',
  pink: 'text-pink-400',
  cyan: 'text-cyan-400',
}

const categoryColorClasses = {
  akademik: 'text-blue-400',
  coding: 'text-green-400',
  personal: 'text-yellow-400',
  deadline: 'text-red-400',
  meeting: 'text-purple-400',
}
</script>

<template>
  <div class="space-y-3 mx-4">
    <!-- Current Event -->
    <div v-if="currentEvent" class="surface-card p-4">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
        <span class="text-[10px] font-semibold text-success-400 uppercase tracking-wider">Sedang Berlangsung</span>
      </div>
      <h3 class="text-base font-semibold text-white mb-1 flex items-center gap-2">
        <component 
          :is="categoryIcons[currentEvent.category] || Target" 
          class="w-4 h-4 shrink-0" 
          :class="textColors[currentEvent.color] || categoryColorClasses[currentEvent.category] || 'text-primary-400'"
        />
        <span>{{ currentEvent.title }}</span>
      </h3>
      <div class="flex items-center gap-3 text-xs text-surface-400">
        <span class="flex items-center gap-1">
          <Clock class="w-3 h-3" />
          {{ formatTimeRange(currentEvent.start, currentEvent.end) }}
        </span>
        <span class="flex items-center gap-1">
          <MapPin class="w-3 h-3" />
          {{ currentEvent.location }}
        </span>
      </div>
    </div>

    <div v-else class="surface-card p-4">
      <div class="flex items-center gap-2 mb-1">
        <span class="text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Tidak Ada Event</span>
      </div>
      <p class="text-sm text-surface-400">Kamu sedang free saat ini 🎉</p>
    </div>

    <!-- Next Event Countdown -->
    <div v-if="nextEvent && countdown" class="surface-card p-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-[10px] font-semibold text-warning-400 uppercase tracking-wider">Berikutnya</span>
          </div>
          <h3 class="text-sm font-medium text-white mb-1 flex items-center gap-2">
            <component 
              :is="categoryIcons[nextEvent.category] || Target" 
              class="w-3.5 h-3.5 shrink-0" 
              :class="textColors[nextEvent.color] || categoryColorClasses[nextEvent.category] || 'text-primary-400'"
            />
            <span>{{ nextEvent.title }}</span>
          </h3>
          <span class="text-xs text-surface-400 flex items-center gap-1">
            <Clock class="w-3 h-3" />
            {{ formatTime(nextEvent.start) }}
          </span>
        </div>

        <!-- Countdown -->
        <div class="flex items-center gap-1 text-center">
          <div v-if="countdown.hours > 0" class="bg-surface-800 rounded-lg px-2 py-1.5 min-w-[36px]">
            <span class="text-lg font-bold text-white font-mono">{{ String(countdown.hours).padStart(2, '0') }}</span>
            <p class="text-[8px] text-surface-500 mt-0.5">JAM</p>
          </div>
          <span v-if="countdown.hours > 0" class="text-surface-500 text-xs font-bold">:</span>
          <div class="bg-surface-800 rounded-lg px-2 py-1.5 min-w-[36px]">
            <span class="text-lg font-bold text-white font-mono">{{ String(countdown.mins).padStart(2, '0') }}</span>
            <p class="text-[8px] text-surface-500 mt-0.5">MIN</p>
          </div>
          <span class="text-surface-500 text-xs font-bold">:</span>
          <div class="bg-surface-800 rounded-lg px-2 py-1.5 min-w-[36px]">
            <span class="text-lg font-bold text-primary-400 font-mono">{{ String(countdown.secs).padStart(2, '0') }}</span>
            <p class="text-[8px] text-surface-500 mt-0.5">DET</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
