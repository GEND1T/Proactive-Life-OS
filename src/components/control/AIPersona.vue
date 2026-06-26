<script setup>
import { ref, computed } from 'vue'
import { aiPersona as initialPersona } from '../../data/system'

const temperature = ref(initialPersona.temperature)
const selectedStyle = ref(initialPersona.style)
const systemPrompt = ref(initialPersona.systemPrompt)
const styles = initialPersona.styles

const previewResponses = {
  formal: 'Selamat pagi. Berdasarkan analisis data, saldo Anda mengalami penurunan sebesar 12% pada minggu ini. Disarankan untuk meninjau kembali pos pengeluaran hiburan.',
  santai: 'Hei! Minggu ini pengeluaranmu naik dikit nih, terutama di makanan. Coba deh masak sendiri, selain hemat juga lebih sehat 😄',
  humoris: 'Bro, dompetmu lagi nangis ini 😭 Pengeluaran naik 12% — kayaknya perut kamu lebih rajin kerja daripada kamu! Yuk mulai meal prep 🍳',
  motivasional: 'Setiap rupiah yang kamu hemat hari ini adalah investasi untuk masa depanmu! 💪 Kamu sudah coding 4.8 jam kemarin — konsistensi adalah kunci kesuksesan!',
}

const previewText = computed(() => previewResponses[selectedStyle.value] || previewResponses.santai)
</script>

<template>
  <div class="mx-4 space-y-4">
    <!-- Temperature Slider -->
    <div class="surface-card p-4">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-semibold text-surface-300">🌡️ Temperature LLM</h4>
        <span class="text-sm font-bold text-primary-400 font-mono">{{ temperature.toFixed(1) }}</span>
      </div>
      <input
        type="range"
        v-model.number="temperature"
        min="0"
        max="2"
        step="0.1"
        class="w-full h-1.5 bg-surface-700 rounded-full appearance-none cursor-pointer accent-primary-500
               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
               [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500
               [&::-webkit-slider-thumb]:shadow-glow-sm [&::-webkit-slider-thumb]:cursor-pointer
               [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface-900"
      />
      <div class="flex justify-between mt-1.5">
        <span class="text-[10px] text-surface-500">Presisi</span>
        <span class="text-[10px] text-surface-500">Kreatif</span>
      </div>
    </div>

    <!-- AI Style -->
    <div class="surface-card p-4">
      <h4 class="text-sm font-semibold text-surface-300 mb-3">🎭 Gaya Bahasa AI</h4>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="style in styles"
          :key="style"
          @click="selectedStyle = style"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition-all capitalize"
          :class="selectedStyle === style
            ? 'bg-primary-500 text-white shadow-glow-sm'
            : 'bg-surface-800 text-surface-400 hover:bg-surface-700'"
        >
          {{ style }}
        </button>
      </div>

      <!-- Preview -->
      <div class="mt-3 bg-surface-800/50 rounded-xl p-3 border border-surface-700/50">
        <p class="text-[10px] text-surface-500 uppercase font-semibold tracking-wider mb-1.5">Preview Respons</p>
        <p class="text-xs text-surface-300 leading-relaxed italic">"{{ previewText }}"</p>
      </div>
    </div>

    <!-- System Prompt -->
    <div class="surface-card p-4">
      <h4 class="text-sm font-semibold text-surface-300 mb-3">📝 System Prompt</h4>
      <textarea
        v-model="systemPrompt"
        rows="4"
        class="w-full bg-surface-800/50 border border-surface-700/50 rounded-xl px-3 py-2.5 text-xs text-surface-300 leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500/30 resize-none transition-all"
        placeholder="Masukkan system prompt untuk AI..."
      ></textarea>
      <div class="flex justify-end mt-2">
        <button class="px-4 py-1.5 rounded-xl bg-primary-500/20 text-primary-400 text-xs font-semibold hover:bg-primary-500/30 transition-colors">
          Simpan Perubahan
        </button>
      </div>
    </div>
  </div>
</template>
