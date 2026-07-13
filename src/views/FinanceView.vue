<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { Plus } from 'lucide-vue-next'
import AIInsightCard from '../components/shared/AIInsightCard.vue'
import BalanceCards from '../components/finance/BalanceCards.vue'
import TransactionList from '../components/finance/TransactionList.vue'
import AddTransactionModal from '../components/finance/AddTransactionModal.vue'
import { useFinanceDB } from '../composables/useFinanceDB'
import { useFormatters } from '../composables/useFormatters'
import { useAIInsight } from '../composables/useAIInsight'

const { formatCurrency } = useFormatters()
const { totalBalance, dailyBudget, todaySpending, transactions, fetchTransactions, isLoading } = useFinanceDB()
const { insight: aiInsight, isLoading: aiLoading, source: aiSource, fetchInsight } = useAIInsight()

const showAddModal = ref(false)

const spendingPercentage = computed(() => {
  if (!dailyBudget.value) return 0
  return Math.min(100, Math.round((todaySpending.value / dailyBudget.value) * 100))
})

const topCategory = computed(() => {
  const cats = {}
  ;(transactions.value || []).forEach(t => {
    if ((t.transaction_type || '').toLowerCase() === 'expense') {
      const cat = t.category || 'Lainnya'
      cats[cat] = (cats[cat] || 0) + Math.abs(t.amount)
    }
  })
  const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] || 'Lainnya'
})

const financeInsightMessage = computed(() => aiInsight.value || 'Memuat insight...')

function loadFinanceInsight(forceRefresh = false) {
  const ctx = {
    balance: totalBalance.value || 0,
    todaySpending: todaySpending.value || 0,
    dailyBudget: dailyBudget.value || 0,
    spendingPercentage: spendingPercentage.value,
    recentTransactionsCount: (transactions.value || []).length,
    topCategory: topCategory.value,
  }
  fetchInsight('finance', ctx, forceRefresh)
}

onMounted(() => {
  fetchTransactions()
})

watch([totalBalance, todaySpending, transactions], () => {
  if (!isLoading.value) {
    loadFinanceInsight()
  }
}, { deep: true })
</script>

<template>
  <div class="stagger-children">
    <!-- AI Insight -->
    <AIInsightCard
      title="AI Finance Analysis"
      :message="financeInsightMessage"
      :loading="aiLoading"
      :source="aiSource"
      timestamp="Baru saja"
      icon="💳"
      @refresh="loadFinanceInsight(true)"
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
      <div class="px-4 mb-2 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-surface-300">E-Wallet</h3>
        <button
          @click="showAddModal = true"
          class="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 text-[10px] font-bold text-white uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-primary-500/20"
        >
          <Plus class="w-3.5 h-3.5" />
          Tambah
        </button>
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

    <!-- Add Transaction Modal -->
    <AddTransactionModal
      :show="showAddModal"
      @close="showAddModal = false"
      @saved="fetchTransactions()"
    />
  </div>
</template>
