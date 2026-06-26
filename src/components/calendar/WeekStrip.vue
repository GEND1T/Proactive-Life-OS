<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'

const props = defineProps({
  selectedDate: { type: Date, default: () => new Date() },
})

const emit = defineEmits(['select'])

const scrollContainer = ref(null)

function getLocalDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const days = computed(() => {
  const result = []
  const today = new Date()
  for (let i = -7; i <= 14; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    result.push({
      date: new Date(date),
      dayName: date.toLocaleDateString('id-ID', { weekday: 'short' }),
      dayNumber: date.getDate(),
      monthName: date.toLocaleDateString('id-ID', { month: 'short' }),
      isToday: i === 0,
      iso: getLocalDateString(date),
    })
  }
  return result
})

const selectedIso = ref(getLocalDateString(new Date()))

function selectDay(day) {
  selectedIso.value = day.iso
  emit('select', day.date)
}

onMounted(async () => {
  await nextTick()
  const todayEl = scrollContainer.value?.querySelector('[data-today="true"]')
  if (todayEl) {
    todayEl.scrollIntoView({ inline: 'center', behavior: 'smooth' })
  }
})
</script>

<template>
  <div class="mx-4 mb-4">
    <div
      ref="scrollContainer"
      class="scroll-snap-x flex gap-2 py-2 px-1"
    >
      <button
        v-for="day in days"
        :key="day.iso"
        @click="selectDay(day)"
        :data-today="day.isToday"
        class="scroll-snap-item flex flex-col items-center justify-center w-14 h-[72px] rounded-2xl transition-all duration-300 shrink-0"
        :class="[
          selectedIso === day.iso
            ? 'bg-gradient-to-b from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 scale-105'
            : day.isToday
              ? 'bg-primary-500/10 text-primary-300 border border-primary-500/30'
              : 'bg-surface-800/50 text-surface-400 hover:bg-surface-700/50'
        ]"
      >
        <span class="text-[10px] font-semibold uppercase tracking-wide"
          :class="selectedIso === day.iso ? 'text-primary-100' : ''"
        >
          {{ day.dayName }}
        </span>
        <span class="text-xl font-bold mt-0.5"
          :class="selectedIso === day.iso ? 'text-white' : ''"
        >
          {{ day.dayNumber }}
        </span>
        <span class="text-[9px] font-medium mt-0.5"
          :class="selectedIso === day.iso ? 'text-primary-200' : 'text-surface-500'"
        >
          {{ day.monthName }}
        </span>
        <!-- Today dot -->
        <div
          v-if="day.isToday && selectedIso !== day.iso"
          class="w-1 h-1 bg-primary-400 rounded-full mt-0.5"
        ></div>
      </button>
    </div>
  </div>
</template>
