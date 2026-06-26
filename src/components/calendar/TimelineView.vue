<script setup>
import { ref, computed } from 'vue'
import { 
  Clock, MapPin, GraduationCap, Code, Target, AlertCircle, Users, Repeat, CalendarOff, Check 
} from 'lucide-vue-next'
import { useFormatters } from '../../composables/useFormatters'

const props = defineProps({
  events: { type: Array, default: () => [] },
  selectedDate: { type: Date, default: () => new Date() },
})

const emit = defineEmits(['edit-event'])

const { formatTime, formatTimeRange } = useFormatters()

const hours = Array.from({ length: 18 }, (_, i) => i + 6) // 06:00 to 23:00

const borderColors = {
  blue: 'border-l-blue-500/80',
  green: 'border-l-green-500/80',
  yellow: 'border-l-yellow-500/80',
  red: 'border-l-red-500/80',
  purple: 'border-l-purple-500/80',
  pink: 'border-l-pink-500/80',
  cyan: 'border-l-cyan-500/80',
}

const bgColors = {
  blue: 'bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/10',
  green: 'bg-green-500/5 hover:bg-green-500/10 border-green-500/10',
  yellow: 'bg-yellow-500/5 hover:bg-yellow-500/10 border-yellow-500/10',
  red: 'bg-red-500/5 hover:bg-red-500/10 border-red-500/10',
  purple: 'bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/10',
  pink: 'bg-pink-500/5 hover:bg-pink-500/10 border-pink-500/10',
  cyan: 'bg-cyan-500/5 hover:bg-cyan-500/10 border-cyan-500/10',
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

const categoryIcons = {
  akademik: GraduationCap,
  coding: Code,
  personal: Target,
  deadline: AlertCircle,
  meeting: Users,
}

// Local state for completed event IDs with localStorage persistence
const completedEvents = ref(new Set())

try {
  const saved = localStorage.getItem('life_os_completed_events')
  if (saved) {
    const list = JSON.parse(saved)
    if (Array.isArray(list)) {
      completedEvents.value = new Set(list)
    }
  }
} catch (e) {
  console.error('Failed to load completed events from localStorage', e)
}

function toggleComplete(id) {
  if (completedEvents.value.has(id)) {
    completedEvents.value.delete(id)
  } else {
    completedEvents.value.add(id)
  }
  
  try {
    localStorage.setItem(
      'life_os_completed_events', 
      JSON.stringify(Array.from(completedEvents.value))
    )
  } catch (e) {
    console.error('Failed to save completed events to localStorage', e)
  }
}


function getLocalDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const filteredEvents = computed(() => {
  const selectedIso = getLocalDateString(props.selectedDate)
  return props.events
    .filter(e => {
      const eventDate = new Date(e.start)
      return getLocalDateString(eventDate) === selectedIso
    })
    .sort((a, b) => new Date(a.start) - new Date(b.start))
})

// Progress aggregation computed properties
const totalTodayEvents = computed(() => filteredEvents.value.length)
const completedTodayEvents = computed(() => filteredEvents.value.filter(e => completedEvents.value.has(e.id)).length)
const completionPercentage = computed(() => totalTodayEvents.value > 0 ? Math.round((completedTodayEvents.value / totalTodayEvents.value) * 100) : 0)

function getEventsForHour(hour) {
  return filteredEvents.value.filter(e => {
    const startHour = new Date(e.start).getHours()
    if (hour === 6) {
      return startHour <= 6
    }
    return startHour === hour
  })
}

function getEventDuration(event) {
  const start = new Date(event.start)
  const end = new Date(event.end)
  const diffMin = (end - start) / 60000
  return Math.max(diffMin, 30)
}

function hasEventsInHour(hour) {
  return getEventsForHour(hour).length > 0
}

// Current hour indicator
const currentHour = new Date().getHours()
const currentMinute = new Date().getMinutes()
</script>

<template>
  <div class="mx-4 stagger-children">
    <!-- Empty State -->
    <div v-if="filteredEvents.length === 0" class="surface-card p-8 text-center flex flex-col items-center justify-center border border-white/5 hover:scale-[1.002] transition-transform">
      <div class="w-12 h-12 rounded-2xl bg-surface-800/50 border border-white/5 flex items-center justify-center mb-4 text-surface-400 shadow-inner">
        <CalendarOff class="w-6 h-6" />
      </div>
      <p class="text-sm text-surface-300 font-bold tracking-wide">Tidak Ada Jadwal Hari Ini</p>
      <p class="text-xs text-surface-500 mt-1.5 max-w-[200px] leading-relaxed mx-auto">Klik tombol tambah (+) di bawah untuk membuat agenda baru.</p>
    </div>

    <!-- Timeline & Progress -->
    <div v-else class="relative">
      <!-- Daily Progress Bar -->
      <div class="surface-card p-4 mb-5 hover:scale-[1.005] transition-transform border border-white/5 bg-surface-800/10 backdrop-blur-md rounded-2xl">
        <div class="flex items-center justify-between mb-2">
          <div>
            <h4 class="text-xs font-bold text-surface-300 uppercase tracking-wider">Progress Agenda</h4>
            <p class="text-[10px] text-surface-500 mt-0.5 font-medium">Selesaikan jadwal hari ini</p>
          </div>
          <div class="text-right">
            <span class="text-xs font-bold text-primary-400 font-mono">
              {{ completedTodayEvents }} / {{ totalTodayEvents }} Selesai
            </span>
            <span class="text-[10px] font-bold text-surface-400 ml-1.5 font-mono">({{ completionPercentage }}%)</span>
          </div>
        </div>
        
        <!-- Progress Bar Track -->
        <div class="h-2 bg-surface-700/40 rounded-full overflow-hidden border border-white/5">
          <div
            class="h-full rounded-full bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-600 transition-all duration-700 ease-out shadow-[0_0_12px_rgba(99,102,241,0.3)]"
            :style="{ width: completionPercentage + '%' }"
          ></div>
        </div>
      </div>

      <div v-for="hour in hours" :key="hour" class="flex gap-3 min-h-[28px]">
        <!-- Time Label -->
        <div class="w-10 flex-shrink-0 text-right pt-0.5">
          <span
            v-if="hasEventsInHour(hour) || hour % 2 === 0"
            class="text-[11px] font-mono font-medium"
            :class="hour === currentHour ? 'text-primary-400' : 'text-surface-500'"
          >
            {{ String(hour).padStart(2, '0') }}:00
          </span>
        </div>

        <!-- Timeline Line + Events -->
        <div class="flex-1 relative pl-4 pb-2">
          <!-- Vertical line -->
          <div class="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-surface-700/50 via-surface-700/30 to-surface-700/10"></div>

          <!-- Dot indicator -->
          <div
            v-if="hasEventsInHour(hour)"
            class="absolute left-[-3px] top-2 w-[7px] h-[7px] rounded-full border-2"
            :class="hour === currentHour ? 'bg-primary-400 border-primary-400 shadow-glow-sm' : 'bg-surface-600 border-surface-500'"
          ></div>

          <!-- Current time indicator -->
          <div
            v-if="hour === currentHour"
            class="absolute left-[-4px] w-2 h-2 bg-primary-400 rounded-full animate-pulse shadow-glow-sm"
            :style="{ top: `${(currentMinute / 60) * 100}%` }"
          ></div>

          <!-- Event Cards -->
          <div v-for="event in getEventsForHour(hour)" :key="event.id" class="mb-2">
            <div
              @click="emit('edit-event', event)"
              class="border-l-4 rounded-r-xl rounded-l-sm p-3.5 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer relative backdrop-blur-md border-y border-r border-white/5"
              :class="[
                completedEvents.has(event.id)
                  ? 'border-l-surface-600 bg-surface-900/30 opacity-50 grayscale-[30%]'
                  : (borderColors[event.color] || 'border-l-primary-500') + ' ' + (bgColors[event.color] || 'bg-primary-500/10')
              ]"
            >
              <!-- RRULE Badge -->
              <span
                v-if="event.rrule"
                class="absolute top-3 right-3 text-surface-400 hover:text-white transition-colors"
                title="Jadwal Berulang"
              >
                <Repeat class="w-3.5 h-3.5" />
              </span>

              <div class="flex items-start gap-3">
                <!-- Checklist Button -->
                <button
                  type="button"
                  @click.stop="toggleComplete(event.id)"
                  class="mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all active:scale-90"
                  :class="[
                    completedEvents.has(event.id)
                      ? 'bg-success-500 border-success-500 text-white shadow-lg shadow-success-500/25'
                      : 'border-surface-600 hover:border-surface-400 bg-surface-800/50 text-transparent'
                  ]"
                >
                  <Check class="w-3 h-3 stroke-[3.5]" />
                </button>

                <!-- Event Details -->
                <div class="flex-1 min-w-0">
                  <h4 
                    class="text-sm font-bold text-white mb-1.5 pr-6 flex items-center gap-2 transition-all duration-300"
                    :class="completedEvents.has(event.id) ? 'line-through text-surface-500' : ''"
                  >
                    <component 
                      :is="categoryIcons[event.category] || Target" 
                      class="w-4 h-4 shrink-0" 
                      :class="completedEvents.has(event.id) ? 'text-surface-500' : (textColors[event.color] || 'text-primary-400')"
                    />
                    <span>{{ event.title }}</span>
                  </h4>
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <span class="flex items-center gap-1.5 text-xs text-surface-400 font-medium" :class="completedEvents.has(event.id) ? 'text-surface-500 line-through' : ''">
                      <Clock class="w-3.5 h-3.5 text-surface-500" />
                      {{ formatTimeRange(event.start, event.end) }}
                    </span>
                    <span class="flex items-center gap-1.5 text-xs text-surface-400 font-medium" v-if="event.location" :class="completedEvents.has(event.id) ? 'text-surface-500 line-through' : ''">
                      <MapPin class="w-3.5 h-3.5 text-surface-500" />
                      {{ event.location }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty hour spacer -->
          <div v-if="!hasEventsInHour(hour)" class="h-1"></div>
        </div>
      </div>
    </div>
  </div>
</template>
