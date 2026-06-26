<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    required: true,
    default: () => [10, 25, 15, 30, 20, 45, 30] // dummy data if none provided
  },
  color: {
    type: String,
    default: 'primary' // primary, green, rose, etc.
  }
})

// Normalisasi data agar pas di dalam viewbox SVG (misalnya 100x30)
const svgPath = computed(() => {
  if (!props.data || props.data.length === 0) return ''
  
  const width = 100
  const height = 30
  
  const max = Math.max(...props.data)
  const min = Math.min(...props.data)
  const range = max - min || 1 // cegah pembagian dengan nol
  
  const stepX = width / (props.data.length - 1 || 1)
  
  const points = props.data.map((val, index) => {
    const x = index * stepX
    // y dibalik karena koordinat SVG mulai dari atas kiri (0,0)
    const y = height - ((val - min) / range) * height
    return `${x},${y}`
  })

  // Smooth curve menggunakan bezier sederhana atau polyline
  // Polyline lebih simpel, tapi mari buat jadi smooth curve path jika mau
  let path = `M ${points[0]}`
  for (let i = 1; i < points.length; i++) {
    // Basic Lineto untuk sparkline simpel, dengan stroke-linejoin round ini akan terlihat bagus
    path += ` L ${points[i]}`
  }
  
  return path
})

// Path untuk gradient area di bawah grafik
const areaPath = computed(() => {
  if (!svgPath.value) return ''
  const width = 100
  const height = 30
  // Mulai dari path garis, lalu tarik ke pojok kanan bawah, kiri bawah, tutup
  return `${svgPath.value} L ${width},${height} L 0,${height} Z`
})

const colorMap = {
  primary: { stroke: 'stroke-primary-400', fill: 'fill-primary-500/20' },
  green: { stroke: 'stroke-success-400', fill: 'fill-success-500/20' },
  rose: { stroke: 'stroke-danger-400', fill: 'fill-danger-500/20' },
  purple: { stroke: 'stroke-purple-400', fill: 'fill-purple-500/20' },
  amber: { stroke: 'stroke-amber-400', fill: 'fill-amber-500/20' },
  cyan: { stroke: 'stroke-cyan-400', fill: 'fill-cyan-500/20' }
}

const themeColor = computed(() => colorMap[props.color] || colorMap.primary)
</script>

<template>
  <div class="w-16 h-8 opacity-80 group-hover:opacity-100 transition-opacity">
    <svg viewBox="0 -5 100 40" class="w-full h-full overflow-visible" preserveAspectRatio="none">
      <!-- Glow effect defs -->
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient :id="`grad-${color}`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :class="themeColor.stroke" stop-opacity="0.3" stop-color="currentColor" />
          <stop offset="100%" :class="themeColor.stroke" stop-opacity="0" stop-color="currentColor" />
        </linearGradient>
      </defs>
      
      <!-- Area chart fill -->
      <path 
        :d="areaPath" 
        :fill="`url(#grad-${color})`"
        class="transition-all duration-500"
      />
      
      <!-- Line chart stroke -->
      <path 
        :d="svgPath" 
        fill="none" 
        :class="themeColor.stroke" 
        stroke-width="3" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        class="drop-shadow-sm transition-all duration-500 sparkline-path"
      />
    </svg>
  </div>
</template>

<style scoped>
.sparkline-path {
  stroke-dasharray: 200;
  stroke-dashoffset: 200;
  animation: drawLine 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

@keyframes drawLine {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
