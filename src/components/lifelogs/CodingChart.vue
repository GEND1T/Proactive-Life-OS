<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Code } from 'lucide-vue-next'
import { useActivityDB } from '../../composables/useActivityDB'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const { activityLogs } = useActivityDB()

const data = computed(() => {
  const logs = activityLogs.value
    .filter(l => l.wakatime_coding_hours != null)
    .slice(0, 7)
    .reverse()

  return {
    labels: logs.map(l => {
      const d = new Date(l.logged_date)
      return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: 'Coding Hours',
        data: logs.map(l => l.wakatime_coding_hours),
        borderColor: '#22D3EE',
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#22D3EE',
        pointBorderColor: '#0F172A',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
    ],
  }
})

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
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
        label: (ctx) => `WakaTime: ${ctx.raw} jam`,
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
      <Code class="w-4 h-4 text-cyan-400" />
      <span>WakaTime Coding Hours (7 Hari)</span>
    </h3>
    <div class="h-44">
      <Line :data="data" :options="options" />
    </div>
  </div>
</template>
