<script setup>
import { ref, computed, reactive } from 'vue'
import { 
  ChevronDown, Edit3, Trash2, Zap, Copy, X, Loader2, AlertTriangle,
  Wallet, Banknote, CreditCard, Smartphone,
  Utensils, Car, Gamepad2, ShoppingBag, Briefcase, Send, CircleDollarSign,
  Receipt, HeartPulse, BookOpen, TrendingUp, Heart, Users, PiggyBank
} from 'lucide-vue-next'
import { useFinanceDB } from '../../composables/useFinanceDB'
import { useFormatters } from '../../composables/useFormatters'

const { formatCurrency, formatTime, formatDate } = useFormatters()
const { transactions, deleteTransaction, updateTransaction } = useFinanceDB()

const expandedId = ref(null)
const isEditing = ref(false)
const isSaving = ref(false)

// Toast Alert
const toast = reactive({ show: false, message: '', type: 'info' })
function showToast(message, type = 'info') {
  toast.message = message
  toast.type = type
  toast.show = true
  setTimeout(() => { toast.show = false }, 3500)
}

// Delete Confirm States
const showDeleteConfirm = ref(false)
const transactionToDelete = ref(null)

// Edit Form State
const editForm = reactive({
  id: '',
  amount: 0,
  description: '',
  category: 'Makanan',
  payment_method: 'dana',
  transaction_type: 'EXPENSE',
  is_impulsive: false,
  transaction_date: '',
  note: '',
})

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

// Normalisasi teks tingkat lanjut untuk menangani berbagai variasi input
function normalizeText(text) {
  if (!text) return ''
  
  let normalized = String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') 
    .replace(/\s+/g, ' ')        
    .trim()
  
  // Deteksi Kata Kunci Metode Pembayaran
  if (/cash|tunai|uang/.test(normalized)) return 'tunai'
  if (/gopay|go pay|gojek/.test(normalized)) return 'gopay'
  if (/shopee|spay/.test(normalized)) return 'shopeepay'
  if (/link aja|linkaja/.test(normalized)) return 'linkaja'
  if (/dana/.test(normalized)) return 'dana'
  if (/ovo/.test(normalized)) return 'ovo'
  if (/bca/.test(normalized)) return 'bca'
  if (/mandiri/.test(normalized)) return 'mandiri'
  if (/bni/.test(normalized)) return 'bni'
  if (/bri/.test(normalized)) return 'bri'

  // Deteksi Kata Kunci Kategori Transaksi (Diperluas)
  if (/makan|minum|konsumsi|jajan|food|kuliner|resto|kopi|cafe/.test(normalized)) return 'makanan'
  if (/transport|gojek|grab|maxim|bensin|parkir|tol|krl|mrt|tiket|pesawat|kereta/.test(normalized)) return 'transportasi'
  if (/hibur|main|game|nonton|bioskop|netflix|spotify|langganan|rekreasi|liburan/.test(normalized)) return 'hiburan'
  if (/belanja|shop|beli|pakaian|baju|sepatu|skincare|kebutuhan|groceries|pasar|supermarket/.test(normalized)) return 'belanja'
  
  // Kategori Baru
  if (/tagihan|listrik|token|air|pdam|internet|wifi|pulsa|paket data|kuota|cicilan|bpjs|komunikasi|/.test(normalized)) return 'tagihan'
  if (/sehat|sakit|dokter|obat|apotek|rs|rumah sakit|klinik|medis/.test(normalized)) return 'kesehatan'
  if (/didik|sekolah|kuliah|spp|buku|kursus|les|training/.test(normalized)) return 'pendidikan'
  if (/invest|saham|reksadana|crypto|emas|tabung|deposito/.test(normalized)) return 'investasi'
  if (/sedekah|zakat|infaq|donasi|amal|masjid|gereja|sumbangan/.test(normalized)) return 'sedekah'
  if (/keluarga|anak|istri|suami|ortu|rumah tangga/.test(normalized)) return 'keluarga'
  
  // Kategori Income
  if (/gaji|upah|salary|pendapatan|payday/.test(normalized)) return 'gaji'
  if (/freelance|project|proyek|bonus|kerja|sampingan/.test(normalized)) return 'freelance'
  
  if (/transfer|tf|kirim/.test(normalized)) return 'transfer'

  return normalized.replace(/\s/g, '')
}

// Map ikon menggunakan komponen Lucide (key menggunakan huruf kecil semua)
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

const walletNames = {
  dana: 'DANA',
  gopay: 'GoPay',
  ovo: 'OVO',
  shopeepay: 'ShopeePay',
  linkaja: 'LinkAja',
  bca: 'Bank BCA',
  mandiri: 'Bank Mandiri',
  bni: 'Bank BNI',
  bri: 'Bank BRI',
  tunai: 'Tunai',
}

const categoryIcons = {
  makanan: Utensils,
  transportasi: Car,
  hiburan: Gamepad2,
  belanja: ShoppingBag,
  tagihan: Receipt,      
  kesehatan: HeartPulse, 
  pendidikan: BookOpen,  
  investasi: TrendingUp, 
  sedekah: Heart,        
  keluarga: Users,       
  gaji: PiggyBank,       
  freelance: Briefcase,
  transfer: Send,
}

const categories = [
  'Makanan',
  'Transportasi',
  'Hiburan',
  'Belanja',
  'Tagihan',
  'Kesehatan',
  'Pendidikan',
  'Keluarga',
  'Sedekah',
  'Investasi',
  'Gaji',
  'Freelance',
  'Transfer'
]
const walletsList = ['dana', 'gopay', 'ovo', 'shopeepay', 'linkaja', 'bca', 'mandiri', 'bni', 'bri', 'tunai']

// Toggle states untuk custom select
const showCategoryDropdown = ref(false)
const showWalletDropdown = ref(false)

function selectCategory(cat) {
  editForm.category = cat
  showCategoryDropdown.value = false
}

function selectWallet(walletId) {
  editForm.payment_method = walletId
  showWalletDropdown.value = false
}

// Helper untuk mengambil komponen ikon (dengan fallback jika tidak ditemukan)
function getWalletIcon(method) {
  const key = normalizeText(method)
  return walletIcons[key] || Wallet 
}

function getCategoryIcon(category) {
  const key = normalizeText(category)
  return categoryIcons[key] || CircleDollarSign
}

// Group transactions by date
const groupedTransactions = computed(() => {
  const groups = {}
  transactions.value.forEach(t => {
    const date = t.transaction_date || (t.created_at ? t.created_at.split('T')[0] : '')
    if (!date) return
    if (!groups[date]) groups[date] = []
    groups[date].push(t)
  })
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
})

// Trigger Edit Modal
function triggerEdit(txn) {
  Object.assign(editForm, {
    id: txn.id,
    amount: Math.abs(txn.amount), // Always handle positive values for display
    description: txn.description,
    category: txn.category || 'Makanan',
    payment_method: txn.payment_method || 'dana',
    transaction_type: (txn.transaction_type || 'EXPENSE').toUpperCase(),
    is_impulsive: !!txn.is_impulsive,
    transaction_date: txn.transaction_date || (txn.created_at ? txn.created_at.split('T')[0] : ''),
    note: txn.note || '',
  })
  showCategoryDropdown.value = false
  showWalletDropdown.value = false
  isEditing.value = true
}

// Submit Edits
async function handleEditSubmit() {
  if (!editForm.amount || !editForm.description) {
    showToast('Harap isi nominal dan deskripsi.', 'error')
    return
  }

  isSaving.value = true
  const res = await updateTransaction(editForm.id, {
    amount: editForm.amount,
    description: editForm.description,
    category: editForm.category,
    payment_method: editForm.payment_method,
    transaction_type: editForm.transaction_type,
    is_impulsive: editForm.is_impulsive,
    transaction_date: editForm.transaction_date,
    note: editForm.note,
  })
  isSaving.value = false

  if (res.success) {
    isEditing.value = false
    expandedId.value = null
  } else {
    showToast(res.error || 'Gagal memperbarui transaksi.', 'error')
  }
}

// Trigger Delete
function triggerDelete(id) {
  transactionToDelete.value = id
  showDeleteConfirm.value = true
}

// Confirm Delete
async function confirmDelete() {
  if (!transactionToDelete.value) return
  const res = await deleteTransaction(transactionToDelete.value)
  showDeleteConfirm.value = false
  if (res.success) {
    expandedId.value = null
  } else {
    showToast(res.error || 'Gagal menghapus transaksi.', 'error')
  }
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => {
        showToast('ID disalin ke clipboard!', 'success')
      })
      .catch(err => {
        console.error('Failed to copy: ', err)
      })
  } else {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      showToast('ID disalin ke clipboard!', 'success')
    } catch (err) {
      console.error('Fallback copy failed: ', err)
    }
    document.body.removeChild(textarea)
  }
}
</script>

<template>
  <div class="mx-4">
    <!-- Toast Notification -->
    <transition name="toast-slide">
      <div
        v-if="toast.show"
        class="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm p-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl"
        :class="{
          'bg-success-500/15 border-success-500/30': toast.type === 'success',
          'bg-danger-500/15 border-danger-500/30': toast.type === 'error',
        }"
      >
        <span class="text-xs font-semibold text-surface-200">{{ toast.message }}</span>
      </div>
    </transition>
    <div v-for="[date, txns] in groupedTransactions" :key="date" class="mb-4">
      <div class="flex items-center gap-2 mb-2 px-1">
        <span class="text-xs font-semibold text-surface-500 uppercase tracking-wider">
          {{ formatDate(date) }}
        </span>
        <div class="flex-1 h-px bg-surface-700/50"></div>
      </div>

      <div class="space-y-2">
        <div
          v-for="txn in txns"
          :key="txn.id"
          class="surface-card-sm overflow-hidden transition-all duration-300"
          :class="expandedId === txn.id ? 'ring-1 ring-primary-500/30' : ''"
        >
          <button
            @click="toggleExpand(txn.id)"
            class="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[0.02] transition-colors"
          >
            <!-- E-wallet Icon -->
            <div class="w-9 h-9 rounded-xl bg-surface-800 flex items-center justify-center text-base shrink-0">
              <component :is="getWalletIcon(txn.payment_method)" class="w-5 h-5 text-surface-400" />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <p class="text-sm font-medium text-white truncate">{{ txn.description }}</p>
                <span v-if="txn.is_impulsive" class="shrink-0" title="Pembelian Impulsif">
                  <Zap class="w-3.5 h-3.5 text-warning-400" />
                </span>
              </div>
              <p class="text-xs text-surface-500 mt-0.5">
                {{ formatTime(txn.created_at) }} • {{ walletNames[normalizeText(txn.payment_method)] || txn.payment_method }}
              </p>
            </div>

            <div class="text-right shrink-0 flex items-center gap-2">
              <span
                class="text-sm font-bold"
                :class="(txn.transaction_type || '').toLowerCase() === 'income' ? 'text-success-400' : 'text-danger-400'"
              >
                {{ (txn.transaction_type || '').toLowerCase() === 'income' ? '+' : '-' }}{{ formatCurrency(Math.abs(txn.amount)) }}
              </span>
              <ChevronDown
                class="w-4 h-4 text-surface-500 transition-transform duration-300"
                :class="expandedId === txn.id ? 'rotate-180' : ''"
              />
            </div>
          </button>

          <div
            class="accordion-body"
            :class="expandedId === txn.id ? 'open' : ''"
          >
            <div class="px-3 pb-3 pt-1 border-t border-surface-700/50">
              <div class="grid grid-cols-2 gap-2 mb-3">
                <div class="bg-surface-800/50 rounded-lg px-3 py-2">
                  <p class="text-[10px] text-surface-500 uppercase font-medium">Kategori</p>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <component :is="getCategoryIcon(txn.category)" class="w-3.5 h-3.5 text-surface-400" />
                    <span class="text-xs text-surface-200 font-medium">{{ txn.category }}</span>
                  </div>
                </div>
                
                <div class="bg-surface-800/50 rounded-lg px-3 py-2">
                  <p class="text-[10px] text-surface-500 uppercase font-medium">Metode Pembayaran</p>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <component :is="getWalletIcon(txn.payment_method)" class="w-3.5 h-3.5 text-surface-400" />
                    <span class="text-xs text-surface-200 font-medium">
                      {{ walletNames[normalizeText(txn.payment_method)] || txn.payment_method }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="bg-surface-800/50 rounded-lg px-3 py-2 mb-3" v-if="txn.note">
                <p class="text-[10px] text-surface-500 uppercase font-medium mb-1">Catatan</p>
                <p class="text-xs text-surface-300 leading-relaxed">{{ txn.note }}</p>
              </div>

              <div v-if="txn.is_impulsive" class="bg-warning-400/10 border border-warning-400/20 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
                <Zap class="w-4 h-4 text-warning-400" />
                <span class="text-xs text-warning-400 font-medium">Pembelian Impulsif — pertimbangkan lagi di lain waktu</span>
              </div>

              <div class="flex items-center gap-2">
                <button
                  @click="triggerEdit(txn)"
                  class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary-500/10 text-primary-400 text-xs font-medium hover:bg-primary-500/20 transition-colors"
                >
                  <Edit3 class="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  @click="triggerDelete(txn.id)"
                  class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-danger-500/10 text-danger-400 text-xs font-medium hover:bg-danger-500/20 transition-colors"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="isEditing"
        class="fixed top-0 left-0 right-0 bottom-16 bg-black/60 backdrop-blur-sm z-40"
        @click="isEditing = false"
      ></div>
    </transition>

    <transition name="modal-scale">
      <div
        v-if="isEditing"
        class="fixed top-0 left-0 right-0 bottom-16 z-[45] bg-surface-900 border-b border-surface-700/50 shadow-2xl flex flex-col overflow-hidden max-w-md mx-auto p-5 animate-fade-in"
      >
        <div class="flex items-center justify-between border-b border-surface-700/50 pb-3 mb-4 shrink-0">
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <Edit3 class="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h3 class="text-base font-bold text-white">Edit Transaksi</h3>
              <p class="text-[10px] text-surface-400 mt-0.5">Ubah data transaksi di Supabase</p>
            </div>
          </div>
          <button
            @click="isEditing = false"
            class="p-1.5 rounded-lg bg-surface-800 text-surface-400 hover:text-white"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="handleEditSubmit" class="flex-1 overflow-y-auto pr-1 space-y-4 pb-2">
          <div>
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Jenis Transaksi</label>
            <div class="grid grid-cols-2 gap-2 bg-surface-800/50 p-1.5 rounded-xl border border-surface-700/50">
              <button
                type="button"
                @click="editForm.transaction_type = 'EXPENSE'"
                class="py-2 text-xs font-bold rounded-lg transition-all"
                :class="editForm.transaction_type === 'EXPENSE' ? 'bg-danger-500/20 border border-danger-500/30 text-danger-400' : 'text-surface-400 hover:text-white'"
              >
                EXPENSE
              </button>
              <button
                type="button"
                @click="editForm.transaction_type = 'INCOME'"
                class="py-2 text-xs font-bold rounded-lg transition-all"
                :class="editForm.transaction_type === 'INCOME' ? 'bg-success-500/20 border border-success-500/30 text-success-400' : 'text-surface-400 hover:text-white'"
              >
                INCOME
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Nominal (Rupiah)</label>
            <input
              v-model.number="editForm.amount"
              type="number"
              required
              :disabled="isSaving"
              class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Deskripsi Singkat</label>
            <input
              v-model="editForm.description"
              type="text"
              required
              :disabled="isSaving"
              class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          <!-- Category & Wallet (Custom Select with Icons) -->
          <div class="grid grid-cols-2 gap-3">
            <!-- Custom Kategori Dropdown -->
            <div class="relative">
              <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Kategori</label>
              <button
                type="button"
                @click="showCategoryDropdown = !showCategoryDropdown; showWalletDropdown = false"
                :disabled="isSaving"
                class="w-full flex items-center justify-between bg-surface-800/50 border border-surface-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
              >
                <div class="flex items-center gap-2">
                  <component :is="getCategoryIcon(editForm.category)" class="w-4 h-4 text-surface-400" />
                  <span>{{ editForm.category }}</span>
                </div>
                <ChevronDown class="w-4 h-4 text-surface-400 transition-transform duration-200" :class="showCategoryDropdown ? 'rotate-180' : ''" />
              </button>
              
              <div
                v-if="showCategoryDropdown"
                class="absolute z-50 left-0 right-0 mt-1 bg-surface-900 border border-surface-700/80 rounded-xl shadow-2xl max-h-48 overflow-y-auto p-1"
              >
                <button
                  v-for="cat in categories"
                  :key="cat"
                  type="button"
                  @click="selectCategory(cat)"
                  class="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left rounded-lg hover:bg-surface-800 transition-colors text-white"
                >
                  <component :is="getCategoryIcon(cat)" class="w-4 h-4 text-surface-400" />
                  <span>{{ cat }}</span>
                </button>
              </div>
            </div>

            <!-- Custom Wallet Dropdown -->
            <div class="relative">
              <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Metode / Wallet</label>
              <button
                type="button"
                @click="showWalletDropdown = !showWalletDropdown; showCategoryDropdown = false"
                :disabled="isSaving"
                class="w-full flex items-center justify-between bg-surface-800/50 border border-surface-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
              >
                <div class="flex items-center gap-2">
                  <component :is="getWalletIcon(editForm.payment_method)" class="w-4 h-4 text-surface-400" />
                  <span>{{ walletNames[normalizeText(editForm.payment_method)] || editForm.payment_method }}</span>
                </div>
                <ChevronDown class="w-4 h-4 text-surface-400 transition-transform duration-200" :class="showWalletDropdown ? 'rotate-180' : ''" />
              </button>

              <div
                v-if="showWalletDropdown"
                class="absolute z-50 left-0 right-0 mt-1 bg-surface-900 border border-surface-700/80 rounded-xl shadow-2xl max-h-48 overflow-y-auto p-1"
              >
                <button
                  v-for="walletId in walletsList"
                  :key="walletId"
                  type="button"
                  @click="selectWallet(walletId)"
                  class="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left rounded-lg hover:bg-surface-800 transition-colors text-white"
                >
                  <component :is="getWalletIcon(walletId)" class="w-4 h-4 text-surface-400" />
                  <span>{{ walletNames[walletId] }}</span>
                </button>
              </div>
            </div>
          </div>

          <div
            v-if="editForm.transaction_type === 'EXPENSE'"
            class="flex items-center justify-between p-3 rounded-xl bg-surface-800/30 border border-surface-700/50"
          >
            <div class="flex items-center gap-2">
              <Zap class="w-4 h-4 text-warning-400" />
              <div>
                <h4 class="text-xs font-bold text-white">Pembelian Impulsif</h4>
              </div>
            </div>
            <input
              v-model="editForm.is_impulsive"
              type="checkbox"
              :disabled="isSaving"
              class="w-5 h-5 rounded-lg border-surface-700 bg-surface-800/50 checked:bg-primary-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Tanggal Transaksi</label>
            <input
              v-model="editForm.transaction_date"
              type="date"
              required
              :disabled="isSaving"
              class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Catatan Detail</label>
            <textarea
              v-model="editForm.note"
              rows="3"
              :disabled="isSaving"
              class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
            ></textarea>
          </div>

          <button
            type="submit"
            :disabled="isSaving"
            class="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 text-xs font-bold text-white tracking-wider uppercase active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
            {{ isSaving ? 'Menyimpan Perubahan...' : 'Simpan Perubahan' }}
          </button>
        </form>
      </div>
    </transition>

    <transition name="fade">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
        @click="showDeleteConfirm = false"
      ></div>
    </transition>

    <transition name="modal-scale">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto z-[90] surface-card p-5 border border-white/5 shadow-2xl flex flex-col items-center text-center animate-fade-in"
      >
        <div class="w-12 h-12 rounded-full bg-danger-500/15 flex items-center justify-center mb-4">
          <Trash2 class="w-6 h-6 text-danger-400" />
        </div>
        <h3 class="text-base font-bold text-white mb-2">Hapus Transaksi?</h3>
        <p class="text-xs text-surface-400 mb-6 leading-relaxed">
          Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan dan data akan langsung dihapus dari Supabase.
        </p>
        <div class="flex items-center gap-3 w-full">
          <button
            type="button"
            @click="showDeleteConfirm = false"
            class="flex-1 py-2.5 rounded-xl bg-surface-800 border border-white/5 text-xs font-semibold text-surface-300 hover:bg-surface-700 active:scale-95 transition-all"
          >
            Batal
          </button>
          <button
            type="button"
            @click="confirmDelete"
            class="flex-1 py-2.5 rounded-xl bg-danger-500 hover:bg-danger-600 text-xs font-semibold text-white active:scale-95 transition-all shadow-lg shadow-danger-500/20"
          >
            Hapus
          </button>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-scale-enter-active,
.modal-scale-leave-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-scale-enter-from {
  opacity: 0;
  transform: scale(0.92) translate3d(0, 20px, 0);
}
.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translate3d(0, 10px, 0);
}

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s ease-out;
}
.toast-slide-enter-from {
  opacity: 0;
  transform: translate(-50%, -20px);
}
.toast-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>
