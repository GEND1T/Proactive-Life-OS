<script setup>
import { ref, reactive } from 'vue'
import {
  Plus, X, Loader2, ChevronDown, Zap,
  Utensils, Car, Gamepad2, ShoppingBag, Briefcase, Send, CircleDollarSign,
  Receipt, HeartPulse, BookOpen, TrendingUp, Heart, Users, PiggyBank,
  Wallet, Banknote, CreditCard, Smartphone
} from 'lucide-vue-next'
import { useFinanceDB } from '../../composables/useFinanceDB'

const props = defineProps({
  show: Boolean,
})
const emit = defineEmits(['close', 'saved'])

const { addTransaction } = useFinanceDB()

const isSubmitting = ref(false)
const showCategoryDropdown = ref(false)
const showWalletDropdown = ref(false)

const form = reactive({
  amount: '',
  description: '',
  category: 'Makanan',
  payment_method: 'dana',
  transaction_type: 'EXPENSE',
  is_impulsive: false,
  transaction_date: new Date().toISOString().split('T')[0],
  note: '',
})

// Toast
const toast = reactive({ show: false, message: '', type: 'info' })
function showToast(message, type = 'info') {
  toast.message = message
  toast.type = type
  toast.show = true
  setTimeout(() => { toast.show = false }, 3500)
}

const categories = [
  'Makanan', 'Transportasi', 'Hiburan', 'Belanja', 'Tagihan',
  'Kesehatan', 'Pendidikan', 'Keluarga', 'Sedekah', 'Investasi',
  'Gaji', 'Freelance', 'Transfer'
]
const walletsList = ['dana', 'gopay', 'ovo', 'shopeepay', 'linkaja', 'bca', 'mandiri', 'bni', 'bri', 'tunai']
const walletNames = {
  dana: 'DANA', gopay: 'GoPay', ovo: 'OVO', shopeepay: 'ShopeePay', linkaja: 'LinkAja',
  bca: 'Bank BCA', mandiri: 'Bank Mandiri', bni: 'Bank BNI', bri: 'Bank BRI', tunai: 'Tunai',
}

const categoryIcons = {
  makanan: Utensils, transportasi: Car, hiburan: Gamepad2, belanja: ShoppingBag,
  tagihan: Receipt, kesehatan: HeartPulse, pendidikan: BookOpen, investasi: TrendingUp,
  sedekah: Heart, keluarga: Users, gaji: PiggyBank, freelance: Briefcase, transfer: Send,
}
const walletIcons = {
  dana: Smartphone, gopay: Smartphone, ovo: Smartphone, shopeepay: Smartphone, linkaja: Smartphone,
  bca: CreditCard, mandiri: CreditCard, bni: CreditCard, bri: CreditCard, tunai: Banknote,
}

function getCategoryIcon(cat) { return categoryIcons[(cat || '').toLowerCase()] || CircleDollarSign }
function getWalletIcon(id) { return walletIcons[(id || '').toLowerCase()] || Wallet }

function resetForm() {
  form.amount = ''
  form.description = ''
  form.category = 'Makanan'
  form.payment_method = 'dana'
  form.transaction_type = 'EXPENSE'
  form.is_impulsive = false
  form.transaction_date = new Date().toISOString().split('T')[0]
  form.note = ''
  showCategoryDropdown.value = false
  showWalletDropdown.value = false
}

async function handleSubmit() {
  if (!form.amount || !form.description) {
    showToast('Harap isi nominal dan deskripsi.', 'error')
    return
  }

  isSubmitting.value = true
  const res = await addTransaction({ ...form })
  isSubmitting.value = false

  if (res.success) {
    showToast('Transaksi berhasil ditambahkan!', 'success')
    emit('saved')
    setTimeout(() => {
      resetForm()
      emit('close')
    }, 800)
  } else {
    showToast(res.error || 'Gagal menambahkan transaksi.', 'error')
  }
}

function handleClose() {
  resetForm()
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        @click="handleClose"
      ></div>
    </transition>

    <!-- Toast -->
    <transition name="toast-slide">
      <div
        v-if="toast.show"
        class="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm p-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl"
        :class="{
          'bg-success-500/15 border-success-500/30 text-success-400': toast.type === 'success',
          'bg-danger-500/15 border-danger-500/30 text-danger-400': toast.type === 'error',
        }"
      >
        <span class="text-xs font-semibold text-surface-200">{{ toast.message }}</span>
      </div>
    </transition>

    <!-- Modal -->
    <transition name="modal-scale">
      <div
        v-if="show"
        class="fixed inset-x-4 top-[8%] bottom-[8%] max-w-md mx-auto z-[45] bg-surface-900 border border-surface-700/50 rounded-[28px] shadow-2xl flex flex-col overflow-hidden p-5 text-left"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-surface-700/50 pb-3 mb-4 shrink-0">
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/10 flex items-center justify-center">
              <Plus class="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h3 class="text-base font-bold text-white">Tambah Transaksi</h3>
              <p class="text-[10px] text-surface-400 mt-0.5">Catat pemasukan atau pengeluaran baru</p>
            </div>
          </div>
          <button @click="handleClose" class="p-1.5 rounded-lg bg-surface-800 text-surface-400 hover:text-white transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="flex-1 overflow-y-auto pr-1 space-y-4 pb-2">
          <!-- Transaction Type Toggle -->
          <div>
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Jenis Transaksi</label>
            <div class="grid grid-cols-2 gap-2 bg-surface-800/50 p-1.5 rounded-xl border border-surface-700/50">
              <button
                type="button"
                @click="form.transaction_type = 'EXPENSE'"
                class="py-2.5 text-xs font-bold rounded-lg transition-all"
                :class="form.transaction_type === 'EXPENSE' ? 'bg-danger-500/20 border border-danger-500/30 text-danger-400 shadow-sm' : 'text-surface-400 hover:text-white'"
              >
                💸 Pengeluaran
              </button>
              <button
                type="button"
                @click="form.transaction_type = 'INCOME'"
                class="py-2.5 text-xs font-bold rounded-lg transition-all"
                :class="form.transaction_type === 'INCOME' ? 'bg-success-500/20 border border-success-500/30 text-success-400 shadow-sm' : 'text-surface-400 hover:text-white'"
              >
                💰 Pemasukan
              </button>
            </div>
          </div>

          <!-- Amount -->
          <div>
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Nominal (Rupiah)</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-sm text-surface-500 font-semibold">Rp</span>
              <input
                v-model.number="form.amount"
                type="number"
                min="0"
                placeholder="50000"
                required
                :disabled="isSubmitting"
                class="w-full bg-surface-800/50 border border-surface-700 rounded-xl pl-12 pr-4 py-2.5 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Deskripsi</label>
            <input
              v-model="form.description"
              type="text"
              placeholder="Makan siang, Gaji bulan Juli, dll."
              required
              :disabled="isSubmitting"
              class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
            />
          </div>

          <!-- Category & Wallet Row -->
          <div class="grid grid-cols-2 gap-3">
            <!-- Category Dropdown -->
            <div class="relative">
              <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Kategori</label>
              <button
                type="button"
                @click="showCategoryDropdown = !showCategoryDropdown; showWalletDropdown = false"
                :disabled="isSubmitting"
                class="w-full flex items-center justify-between bg-surface-800/50 border border-surface-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
              >
                <div class="flex items-center gap-2">
                  <component :is="getCategoryIcon(form.category)" class="w-4 h-4 text-surface-400" />
                  <span class="truncate">{{ form.category }}</span>
                </div>
                <ChevronDown class="w-4 h-4 text-surface-400 transition-transform duration-200 shrink-0" :class="showCategoryDropdown ? 'rotate-180' : ''" />
              </button>
              <div
                v-if="showCategoryDropdown"
                class="absolute z-50 left-0 right-0 mt-1 bg-surface-900 border border-surface-700/80 rounded-xl shadow-2xl max-h-48 overflow-y-auto p-1"
              >
                <button
                  v-for="cat in categories"
                  :key="cat"
                  type="button"
                  @click="form.category = cat; showCategoryDropdown = false"
                  class="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left rounded-lg hover:bg-surface-800 transition-colors text-white"
                >
                  <component :is="getCategoryIcon(cat)" class="w-4 h-4 text-surface-400" />
                  <span>{{ cat }}</span>
                </button>
              </div>
            </div>

            <!-- Wallet Dropdown -->
            <div class="relative">
              <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Wallet</label>
              <button
                type="button"
                @click="showWalletDropdown = !showWalletDropdown; showCategoryDropdown = false"
                :disabled="isSubmitting"
                class="w-full flex items-center justify-between bg-surface-800/50 border border-surface-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
              >
                <div class="flex items-center gap-2">
                  <component :is="getWalletIcon(form.payment_method)" class="w-4 h-4 text-surface-400" />
                  <span class="truncate">{{ walletNames[form.payment_method] || form.payment_method }}</span>
                </div>
                <ChevronDown class="w-4 h-4 text-surface-400 transition-transform duration-200 shrink-0" :class="showWalletDropdown ? 'rotate-180' : ''" />
              </button>
              <div
                v-if="showWalletDropdown"
                class="absolute z-50 left-0 right-0 mt-1 bg-surface-900 border border-surface-700/80 rounded-xl shadow-2xl max-h-48 overflow-y-auto p-1"
              >
                <button
                  v-for="walletId in walletsList"
                  :key="walletId"
                  type="button"
                  @click="form.payment_method = walletId; showWalletDropdown = false"
                  class="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left rounded-lg hover:bg-surface-800 transition-colors text-white"
                >
                  <component :is="getWalletIcon(walletId)" class="w-4 h-4 text-surface-400" />
                  <span>{{ walletNames[walletId] }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Impulsive Purchase Toggle (only for EXPENSE) -->
          <div
            v-if="form.transaction_type === 'EXPENSE'"
            class="flex items-center justify-between p-3 rounded-xl bg-surface-800/30 border border-surface-700/50"
          >
            <div class="flex items-center gap-2">
              <Zap class="w-4 h-4 text-warning-400" />
              <div>
                <h4 class="text-xs font-bold text-white">Pembelian Impulsif?</h4>
                <p class="text-[9px] text-surface-500 mt-0.5">Tandai jika ini bukan kebutuhan</p>
              </div>
            </div>
            <input
              v-model="form.is_impulsive"
              type="checkbox"
              :disabled="isSubmitting"
              class="w-5 h-5 rounded-lg border-surface-700 bg-surface-800/50 checked:bg-primary-500 accent-primary-500"
            />
          </div>

          <!-- Date -->
          <div>
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Tanggal Transaksi</label>
            <input
              v-model="form.transaction_date"
              type="date"
              required
              :disabled="isSubmitting"
              class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
            />
          </div>

          <!-- Note -->
          <div>
            <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Catatan (Opsional)</label>
            <textarea
              v-model="form.note"
              rows="2"
              placeholder="Detail tambahan..."
              :disabled="isSubmitting"
              class="w-full bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-2 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
            ></textarea>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full py-3.5 rounded-xl text-xs font-bold text-white tracking-wider uppercase active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
            :class="form.transaction_type === 'INCOME'
              ? 'bg-gradient-to-r from-success-500 to-teal-600 hover:from-success-600 hover:to-teal-700 shadow-success-500/20'
              : 'bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 shadow-primary-500/20'"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <Plus v-else class="w-4 h-4" />
            <span>{{ isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi' }}</span>
          </button>
        </form>
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
