import { ref, computed } from 'vue'
import { supabase } from '../services/supabase'

const transactions = ref([])
const isLoading = ref(false)
const error = ref(null)

// Base balances matching the dummy data to avoid zero/negative balances initially
const BASE_BALANCES = {
  dana: 500000,
  gopay: 200000,
  bca: 3500000,
  tunai: 100000,
}

const walletMeta = {
  dana: { name: 'DANA', color: '#108EE9', icon: '💙', gradient: 'from-blue-500/20 to-blue-600/10 border-blue-500/20' },
  gopay: { name: 'GoPay', color: '#00AED6', icon: '💚', gradient: 'from-cyan-500/20 to-teal-600/10 border-cyan-500/20' },
  ovo: { name: 'OVO', color: '#4C2A86', icon: '💜', gradient: 'from-purple-600/20 to-purple-800/10 border-purple-500/20' },
  shopeepay: { name: 'ShopeePay', color: '#EE4D2D', icon: '🧡', gradient: 'from-orange-500/20 to-orange-600/10 border-orange-500/20' },
  linkaja: { name: 'LinkAja', color: '#E00016', icon: '❤️', gradient: 'from-red-500/20 to-red-600/10 border-red-500/20' },
  bca: { name: 'Bank BCA', color: '#003D79', icon: '🏦', gradient: 'from-blue-800/30 to-blue-900/20 border-blue-700/20' },
  mandiri: { name: 'Bank Mandiri', color: '#1C3F60', icon: '🏦', gradient: 'from-blue-900/30 to-yellow-900/10 border-blue-800/20' },
  bni: { name: 'Bank BNI', color: '#006573', icon: '🏦', gradient: 'from-teal-600/20 to-orange-600/10 border-teal-500/20' },
  bri: { name: 'Bank BRI', color: '#00529C', icon: '🏦', gradient: 'from-blue-600/20 to-blue-800/10 border-blue-500/20' },
  tunai: { name: 'Tunai', color: '#64748B', icon: '💵', gradient: 'from-slate-500/20 to-slate-600/10 border-slate-500/20' },
}

export function useFinanceDB() {
  async function fetchTransactions() {
    isLoading.value = true
    error.value = null
    try {
      const { data, error: dbError } = await supabase
        .from('financial_logs')
        .select('*')
        .order('created_at', { ascending: false })

      if (dbError) throw dbError
      transactions.value = data || []
    } catch (err) {
      console.error('Error fetching financial logs:', err)
      error.value = err.message || 'Gagal mengambil data keuangan.'
    } finally {
      isLoading.value = false
    }
  }

  // Calculate wallet stats dynamically based only on transaction history
  const wallets = computed(() => {
    const stats = {}

    // Sum transactions and build wallets dynamically
    transactions.value.forEach(txn => {
      const rawMethod = (txn.payment_method || '').trim().toLowerCase()
      if (!rawMethod) return

      // Map raw name to standard ID if applicable
      let walletId = rawMethod
      if (rawMethod.includes('bca')) walletId = 'bca'
      else if (rawMethod.includes('mandiri')) walletId = 'mandiri'
      else if (rawMethod.includes('bni')) walletId = 'bni'
      else if (rawMethod.includes('bri')) walletId = 'bri'
      else if (rawMethod.includes('dana')) walletId = 'dana'
      else if (rawMethod.includes('gopay')) walletId = 'gopay'
      else if (rawMethod.includes('ovo')) walletId = 'ovo'
      else if (rawMethod.includes('shopee')) walletId = 'shopeepay'
      else if (rawMethod.includes('link')) walletId = 'linkaja'
      else if (rawMethod.includes('tunai') || rawMethod.includes('cash')) walletId = 'tunai'
      else if (rawMethod.includes('bank')) walletId = 'bca' // default fallback for generic bank

      // Initialize wallet dynamically if not exists
      if (!stats[walletId]) {
        const meta = walletMeta[walletId] || {
          name: rawMethod.toUpperCase(),
          color: '#64748B',
          icon: '💳',
          gradient: 'from-slate-500/20 to-slate-600/10 border-slate-500/20',
        }

        stats[walletId] = {
          id: walletId,
          name: meta.name,
          color: meta.color,
          icon: meta.icon,
          gradient: meta.gradient,
          totalIncome: 0,
          totalExpense: 0,
        }
      }

      const type = (txn.transaction_type || '').toUpperCase()
      const amount = Math.abs(Number(txn.amount) || 0)

      if (type === 'INCOME') {
        stats[walletId].totalIncome += amount
      } else if (type === 'EXPENSE') {
        stats[walletId].totalExpense += amount
      }
    })

    // Compute final balance (income - expense)
    return Object.values(stats).map(w => ({
      ...w,
      balance: w.totalIncome - w.totalExpense,
    }))
  })

  // Total balance is sum of all wallets
  const totalBalance = computed(() => {
    return wallets.value.reduce((sum, w) => sum + w.balance, 0)
  })

  const dailyBudget = ref(100000)

  // Today's spending
  const todaySpending = computed(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    return transactions.value
      .filter(txn => {
        const isExpense = (txn.transaction_type || '').toUpperCase() === 'EXPENSE'
        const txnDate = txn.transaction_date || (txn.created_at ? txn.created_at.split('T')[0] : '')
        return isExpense && txnDate === todayStr
      })
      .reduce((sum, txn) => sum + Math.abs(Number(txn.amount) || 0), 0)
  })

  async function deleteTransaction(id) {
    isLoading.value = true
    error.value = null
    try {
      const { error: dbError } = await supabase
        .from('financial_logs')
        .delete()
        .eq('id', id)

      if (dbError) throw dbError
      await fetchTransactions()
      return { success: true }
    } catch (err) {
      console.error('Error deleting transaction:', err)
      error.value = err.message || 'Gagal menghapus transaksi.'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function updateTransaction(id, payload) {
    isLoading.value = true
    error.value = null
    try {
      const { error: dbError } = await supabase
        .from('financial_logs')
        .update(payload)
        .eq('id', id)

      if (dbError) throw dbError
      await fetchTransactions()
      return { success: true }
    } catch (err) {
      console.error('Error updating transaction:', err)
      error.value = err.message || 'Gagal memperbarui transaksi.'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  return {
    transactions,
    wallets,
    totalBalance,
    todaySpending,
    dailyBudget,
    isLoading,
    error,
    fetchTransactions,
    deleteTransaction,
    updateTransaction,
  }
}
