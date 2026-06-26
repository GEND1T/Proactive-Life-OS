<script setup>
import { onMounted, computed } from 'vue'
import AIInsightCard from '../components/shared/AIInsightCard.vue'
import BalanceCards from '../components/finance/BalanceCards.vue'
import TransactionList from '../components/finance/TransactionList.vue'
import { useFinanceDB } from '../composables/useFinanceDB'
import { useFormatters } from '../composables/useFormatters'

const { formatCurrency } = useFormatters()
const { totalBalance, dailyBudget, todaySpending, fetchTransactions, isLoading } = useFinanceDB()

const spendingPercentage = computed(() => {
  if (!dailyBudget.value) return 0
  return Math.min(100, Math.round((todaySpending.value / dailyBudget.value) * 100))
})

onMounted(() => {
  fetchTransactions()
})
</script>

<template>
  <div class="stagger-children">
    <!-- AI Insight -->
    <AIInsightCard
      title="AI Finance Analysis"
      message="Pengeluaran makananmu minggu ini naik 20% dibanding minggu lalu. Ada 3 pembelian impulsif senilai total Rp 294rb — pertimbangkan masak di rumah untuk menghemat. Saldo totalmu masih aman di Rp 5.5jt."
      timestamp="2 menit lalu"
      icon="💳"
    />

    <!-- Total Balance Summary -->
    <div class="mx-4 mb-3">
      <div class="surface-card p-4">
        <p class="text-xs text-surface-500 font-medium uppercase tracking-wider mb-1">Total Saldo Semua Wallet</p>
        <p class="text-2xl font-bold text-white">{{ formatCurrency(totalBalance) }}</p>

        <!-- Daily Spending Progress -->
        <div class="mt-3">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[11px] text-surface-400 font-medium">Pengeluaran Hari Ini</span>
            <span class="text-[11px] font-semibold"
              :class="spendingPercentage > 80 ? 'text-danger-400' : spendingPercentage > 50 ? 'text-warning-400' : 'text-success-400'"
            >
              {{ formatCurrency(todaySpending) }} / {{ formatCurrency(dailyBudget) }}
            </span>
          </div>
          <div class="h-2 bg-surface-700/50 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-700 ease-out"
              :class="spendingPercentage > 80 ? 'bg-gradient-to-r from-danger-500 to-danger-400' : spendingPercentage > 50 ? 'bg-gradient-to-r from-warning-500 to-warning-400' : 'bg-gradient-to-r from-success-500 to-success-400'"
              :style="{ width: spendingPercentage + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Balance Cards -->
    <div class="mb-2">
      <div class="px-4 mb-2">
        <h3 class="text-sm font-semibold text-surface-300">E-Wallet</h3>
      </div>
      <BalanceCards />
    </div>

    <!-- Transaction List -->
    <div>
      <div class="px-4 mb-3">
        <h3 class="text-sm font-semibold text-surface-300">Riwayat Transaksi</h3>
      </div>
      <TransactionList />
    </div>
  </div>
</template>
