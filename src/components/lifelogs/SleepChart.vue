<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { Moon } from 'lucide-vue-next'
import { useActivityDB } from '../../composables/useActivityDB'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const { activityLogs } = useActivityDB()

// We slice the last 7 aggregated daily records and reverse them for chronological display
const recentLogs = computed(() => {
  return activityLogs.value.slice(0, 7).reverse()
})

const labels = computed(() => {
  return recentLogs.value.map(l => {
    const d = new Date(l.logged_date)
    return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })
  })
})

const mainSleep = computed(() => {
  return recentLogs.value.map(l => +(l.main_sleep_duration / 60).toFixed(1))
})

const napSleep = computed(() => {
  return recentLogs.value.map(l => +(l.nap_sleep_duration / 60).toFixed(1))
})

const chartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: 'Tidur Utama',
      data: mainSleep.value,
      backgroundColor: 'rgba(139, 92, 246, 0.6)',
      borderColor: 'rgba(139, 92, 246, 1)',
      borderWidth: 1,
      borderRadius: 6,
      borderSkipped: false,
    },
    {
      label: 'Tidur Siang',
      data: napSleep.value,
      backgroundColor: 'rgba(244, 114, 182, 0.5)',
      borderColor: 'rgba(244, 114, 182, 1)',
      borderWidth: 1,
      borderRadius: 6,
      borderSkipped: false,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        color: '#94A3B8',
        font: { size: 10, family: 'Inter' },
        padding: 12,
        usePointStyle: true,
        pointStyleWidth: 8,
      },
    },
    tooltip: {
      backgroundColor: '#1E293B',
      titleColor: '#F1F5F9',
      bodyColor: '#CBD5E1',
      borderColor: '#334155',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 10,
      titleFont: { size: 11, family: 'Inter' },
      bodyFont: { size: 11, family: 'Inter' },
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} jam`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#64748B', font: { size: 10, family: 'Inter' } },
      border: { display: false },
    },
    y: {
      grid: { color: 'rgba(51, 65, 85, 0.3)', drawBorder: false },
      ticks: {
        color: '#64748B',
        font: { size: 10, family: 'Inter' },
        callback: (v) => v + 'j',
        stepSize: 2,
      },
      border: { display: false },
      min: 0,
      max: 10,
    },
  },
}
</script>

<template>
  <div class="mx-4 surface-card p-4">
    <h3 class="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-1.5">
      <Moon class="w-4 h-4 text-purple-400" />
      <span>Durasi Tidur (7 Hari)</span>
    </h3>
    <div class="h-48">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
