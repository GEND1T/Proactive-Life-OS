<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const isOn = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  isOn.value = val
})

function toggle() {
  if (props.disabled) return
  isOn.value = !isOn.value
  emit('update:modelValue', isOn.value)
}
</script>

<template>
  <button
    @click="toggle"
    class="relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none"
    :class="[
      isOn ? 'bg-primary-500 shadow-glow-sm' : 'bg-surface-600',
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    ]"
    role="switch"
    :aria-checked="isOn"
  >
    <span
      class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300"
      :class="isOn ? 'left-[22px]' : 'left-0.5'"
    ></span>
  </button>
</template>
