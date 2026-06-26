<script setup>
import { ref } from 'vue'
import { useFinanceDB } from '../../composables/useFinanceDB'
import { useFormatters } from '../../composables/useFormatters'
import { 
  ChevronDown, TrendingUp, TrendingDown,
  Smartphone, CreditCard, Banknote, Wallet
} from 'lucide-vue-next'

const { wallets } = useFinanceDB()
const { formatCurrency } = useFormatters()

const expandedWalletId = ref(null)

function toggleWalletExpand(id) {
  expandedWalletId.value = expandedWalletId.value === id ? null : id
}

const walletIcons = {
  dana: Smartphone,
  gopay: Smartphone,
  ovo: Smartphone,
  shopeepay: Smartphone,
  linkaja: Smartphone,
  bca: CreditCard,
  mandiri: CreditCard,
  bni: CreditCard,
  bri: CreditCard,
  tunai: Banknote,
}

function getWalletIcon(walletId) {
  const key = String(walletId || '').toLowerCase().trim()
  return walletIcons[key] || Wallet
}
</script>

<template>
  <div class="mx-4 mb-4">
    <!-- Horizontal Scroll Cards -->
    <div class="scroll-snap-x flex gap-3 py-1 mb-3">
      <button
        v-for="wallet in wallets"
        :key="wallet.id"
        @click="toggleWalletExpand(wallet.id)"
        class="scroll-snap-item w-44 shrink-0 surface-card-sm p-4 bg-gradient-to-br border transition-all text-left hover:scale-[1.02] active:scale-[0.98] focus:outline-none"
        :class="[
          wallet.gradient,
          expandedWalletId === wallet.id ? 'ring-2 ring-primary-500/50 scale-[1.02] border-primary-500/25' : ''
        ]"
      >
        <!-- Wallet Icon & Name -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
              :style="{ backgroundColor: wallet.color + '20', color: wallet.color }"
            >
              <component :is="getWalletIcon(wallet.id)" class="w-4 h-4" />
            </div>
            <span class="text-xs font-semibold text-surface-300">{{ wallet.name }}</span>
          </div>
          <ChevronDown
            class="w-3.5 h-3.5 text-surface-400 transition-transform duration-350"
            :class="expandedWalletId === wallet.id ? 'rotate-180 text-primary-400' : ''"
          />
        </div>

        <!-- Balance -->
        <p class="text-lg font-bold text-white">{{ formatCurrency(wallet.balance) }}</p>

        <!-- Mini indicator bar -->
        <div class="mt-2 h-1 bg-surface-700/50 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :style="{
              width: Math.min(100, (wallet.balance / 5000000) * 100) + '%',
              backgroundColor: wallet.color
            }"
          ></div>
        </div>
      </button>
    </div>

    <!-- Expandable Wallet Details -->
    <div class="overflow-hidden transition-all duration-300">
      <div
        v-for="wallet in wallets"
        :key="'detail-' + wallet.id"
        v-show="expandedWalletId === wallet.id"
        class="surface-card p-4 border border-white/5 bg-surface-800/40 rounded-2xl animate-fade-in"
      >
        <div class="flex items-center justify-between mb-3 border-b border-surface-700/50 pb-2">
          <h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <component :is="getWalletIcon(wallet.id)" class="w-4 h-4 text-surface-400" />
            <span>Detail Dompet {{ wallet.name }}</span>
          </h4>
          <span class="text-[10px] text-surface-500 font-mono">Net Flow</span>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <!-- Total Income -->
          <div class="bg-success-500/5 border border-success-500/10 rounded-xl p-3">
            <div class="flex items-center gap-1.5 text-success-400 mb-1">
              <TrendingUp class="w-3.5 h-3.5" />
              <span class="text-[10px] font-bold uppercase tracking-wider">Total Pemasukan</span>
            </div>
            <p class="text-sm font-bold text-white">{{ formatCurrency(wallet.totalIncome) }}</p>
          </div>

          <!-- Total Expense -->
          <div class="bg-danger-500/5 border border-danger-500/10 rounded-xl p-3">
            <div class="flex items-center gap-1.5 text-danger-400 mb-1">
              <TrendingDown class="w-3.5 h-3.5" />
              <span class="text-[10px] font-bold uppercase tracking-wider">Total Pengeluaran</span>
            </div>
            <p class="text-sm font-bold text-white">{{ formatCurrency(wallet.totalExpense) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
