<script setup>
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Wallet, Moon, Smartphone, Code } from 'lucide-vue-next'
import StatCard from '../shared/StatCard.vue'
import { useFinanceDB } from '../../composables/useFinanceDB'
import { useActivityDB } from '../../composables/useActivityDB'
import { useFormatters } from '../../composables/useFormatters'

const router = useRouter()
const { formatCompact, formatMinutesToHours } = useFormatters()
const { totalBalance, fetchTransactions } = useFinanceDB()
const { todayLog, activityLogs, fetchActivityLogs } = useActivityDB()

onMounted(() => {
  fetchTransactions()
  fetchActivityLogs()
})

const sleepSparkline = computed(() => {
  const data = activityLogs.value.slice(0, 7).map(l => l.sleep_duration_minutes).reverse()
  return data.length > 0 ? data : [400, 420, 390, 450, 410, 440, 430]
})

const screenSparkline = computed(() => {
  const data = activityLogs.value.slice(0, 7).map(l => l.screen_time_minutes).reverse()
  return data.length > 0 ? data : [180, 200, 150, 220, 190, 210, 180]
})

const codingSparkline = computed(() => {
  const data = activityLogs.value.slice(0, 7).map(l => l.wakatime_coding_hours).reverse()
  return data.length > 0 ? data : [2, 3.5, 4, 2.5, 5, 3, 4.5]
})

const financeSparkline = [3000, 3200, 3100, 3500, 3400, 4000, 5500] // Dummy trend
</script>

<template>
  <div class="grid grid-cols-2 gap-3 mx-4">
    <StatCard
      label="Saldo Total"
      :value="'Rp ' + formatCompact(totalBalance)"
      :icon="Wallet"
      subtitle="4 wallet aktif"
      trend="12%"
      :trend-up="true"
      color="green"
      :sparkline-data="financeSparkline"
      class="cursor-pointer hover:scale-[1.01] active:scale-[0.98] transition-transform"
      @click="router.push('/finance')"
    />
    <StatCard
      label="Tidur Semalam"
      :value="formatMinutesToHours(todayLog.sleep_duration_minutes)"
      :icon="Moon"
      :subtitle="'Deep: ' + formatMinutesToHours(todayLog.deep_sleep_minutes)"
      trend="30m"
      :trend-up="true"
      color="purple"
      :sparkline-data="sleepSparkline"
    />
    <StatCard
      label="Screen Time"
      :value="formatMinutesToHours(todayLog.screen_time_minutes)"
      :icon="Smartphone"
      subtitle="Hari ini"
      trend="15%"
      :trend-up="false"
      color="amber"
      :sparkline-data="screenSparkline"
    />
    <StatCard
      label="Coding Hours"
      :value="todayLog.wakatime_coding_hours + 'j'"
      :icon="Code"
      subtitle="WakaTime"
      trend="0.5j"
      :trend-up="true"
      color="cyan"
      :sparkline-data="codingSparkline"
    />
  </div>
</template>
