<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../services/supabase'
import { Sparkles, Mail, Lock, LogIn, Github, Chrome, AlertCircle, CheckCircle2 } from 'lucide-vue-next'

const router = useRouter()

const email = ref('')
const password = ref('')
const isSignUp = ref(false)
const isLoading = ref(false)

const errorMessage = ref('')
const successMessage = ref('')

async function handleEmailAuth() {
  if (!email.value || !password.value) {
    errorMessage.value = 'Silakan isi email dan password Anda.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (isSignUp.value) {
      const { data, error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
      successMessage.value = 'Pendaftaran berhasil! Silakan periksa email Anda untuk konfirmasi.'
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
      successMessage.value = 'Login berhasil! Mengalihkan...'
      setTimeout(() => {
        router.push('/')
      }, 1000)
    }
  } catch (error) {
    errorMessage.value = error.message || 'Terjadi kesalahan sistem.'
  } finally {
    isLoading.value = false
  }
}

async function handleOAuth(provider) {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (error) throw error
  } catch (error) {
    errorMessage.value = error.message || `Gagal login dengan ${provider}.`
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-surface-900 bg-mesh relative overflow-hidden">
    <!-- Gradient background blurs -->
    <div class="fixed inset-0 pointer-events-none z-0">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
    </div>

    <!-- Login Card Container -->
    <div class="relative z-10 w-full max-w-md surface-card p-6 md:p-8 border border-white/5 shadow-2xl backdrop-blur-xl animate-fade-in">
      <!-- Logo Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 mb-3 shadow-lg shadow-primary-500/20">
          <Sparkles class="w-6 h-6 text-white animate-pulse" />
        </div>
        <h2 class="text-2xl font-bold text-white tracking-tight">Proactive Life-OS</h2>
        <p class="text-xs text-surface-400 mt-1.5">Kelola produktivitas, keuangan, dan kesehatan dalam satu hub pintar</p>
      </div>

      <!-- Notification Alerts -->
      <transition name="slide-up">
        <div v-if="errorMessage" class="mb-5 p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 flex items-start gap-2.5">
          <AlertCircle class="w-4 h-4 text-danger-400 shrink-0 mt-0.5" />
          <span class="text-xs text-danger-300 font-medium">{{ errorMessage }}</span>
        </div>
      </transition>

      <transition name="slide-up">
        <div v-if="successMessage" class="mb-5 p-3 rounded-xl bg-success-500/10 border border-success-500/20 flex items-start gap-2.5">
          <CheckCircle2 class="w-4 h-4 text-success-400 shrink-0 mt-0.5" />
          <span class="text-xs text-success-300 font-medium">{{ successMessage }}</span>
        </div>
      </transition>

      <!-- OAuth Buttons -->
      <div class="grid grid-cols-2 gap-3 mb-6">
        <button
          @click="handleOAuth('google')"
          :disabled="isLoading"
          class="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-surface-800 border border-white/5 text-sm font-medium text-surface-200 hover:bg-surface-700 active:scale-95 transition-all disabled:opacity-50"
        >
          <Chrome class="w-4 h-4 text-danger-400" />
          Google
        </button>
        <button
          @click="handleOAuth('github')"
          :disabled="isLoading"
          class="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-surface-800 border border-white/5 text-sm font-medium text-surface-200 hover:bg-surface-700 active:scale-95 transition-all disabled:opacity-50"
        >
          <Github class="w-4 h-4 text-white" />
          GitHub
        </button>
      </div>

      <!-- Divider -->
      <div class="flex items-center my-6">
        <div class="flex-1 h-px bg-surface-800"></div>
        <span class="px-3 text-[10px] uppercase font-bold tracking-widest text-surface-500">Atau Gunakan Email</span>
        <div class="flex-1 h-px bg-surface-800"></div>
      </div>

      <!-- Email Form -->
      <form @submit.prevent="handleEmailAuth" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">Email</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Mail class="w-4 h-4 text-surface-500" />
            </span>
            <input
              v-model="email"
              type="email"
              placeholder="nama@email.com"
              required
              :disabled="isLoading"
              class="w-full bg-surface-800/50 border border-surface-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <div class="flex justify-between items-center mb-1.5">
            <label class="text-xs font-semibold text-surface-400 uppercase tracking-wider">Password</label>
            <a href="#" class="text-[11px] font-medium text-primary-400 hover:underline">Lupa Password?</a>
          </div>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock class="w-4 h-4 text-surface-500" />
            </span>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              required
              :disabled="isLoading"
              class="w-full bg-surface-800/50 border border-surface-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 active:scale-98 transition-all disabled:opacity-50"
        >
          <span v-if="isLoading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <component :is="isSignUp ? Sparkles : LogIn" v-else class="w-4 h-4" />
          {{ isSignUp ? 'Daftar Sekarang' : 'Masuk ke Dashboard' }}
        </button>
      </form>

      <!-- Toggle Sign In / Sign Up -->
      <p class="text-center text-xs text-surface-400 mt-6">
        {{ isSignUp ? 'Sudah memiliki akun?' : 'Belum memiliki akun?' }}
        <button
          @click="isSignUp = !isSignUp"
          class="text-primary-400 font-semibold hover:underline focus:outline-none ml-1"
        >
          {{ isSignUp ? 'Masuk' : 'Daftar' }}
        </button>
      </p>
    </div>
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease-out;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
