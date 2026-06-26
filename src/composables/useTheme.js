import { ref, watch, onMounted, onUnmounted, computed } from 'vue'

const themeMode = ref(localStorage.getItem('life_os_theme_mode') || 'dark')
const isDarkActive = ref(themeMode.value === 'dark')

function applyTheme() {
  if (typeof window === 'undefined') return
  const html = document.documentElement
  const mode = themeMode.value

  if (mode === 'dark') {
    html.classList.add('dark')
    html.classList.remove('light')
    isDarkActive.value = true
  } else if (mode === 'light') {
    html.classList.add('light')
    html.classList.remove('dark')
    isDarkActive.value = false
  } else if (mode === 'auto') {
    const hour = new Date().getHours()
    const isNight = hour >= 18 || hour < 6
    if (isNight) {
      html.classList.add('dark')
      html.classList.remove('light')
      isDarkActive.value = true
    } else {
      html.classList.add('light')
      html.classList.remove('dark')
      isDarkActive.value = false
    }
  }
}

// Watch for manual mode changes and apply theme immediately
watch(themeMode, (newMode) => {
  localStorage.setItem('life_os_theme_mode', newMode)
  applyTheme()
}, { immediate: true })

// Initialize theme immediately at script evaluation time
applyTheme()

export function useTheme() {
  // Timer to check auto mode transition
  let timer = null
  onMounted(() => {
    applyTheme()
    timer = setInterval(() => {
      if (themeMode.value === 'auto') {
        applyTheme()
      }
    }, 60000) // check every minute
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return {
    themeMode,
    isDarkActive,
    isDark: computed({
      get() {
        return isDarkActive.value
      },
      set(val) {
        themeMode.value = val ? 'dark' : 'light'
      }
    }),
    setThemeMode(mode) {
      themeMode.value = mode
    }
  }
}

