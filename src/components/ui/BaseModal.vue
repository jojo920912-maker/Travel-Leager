<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="$emit('update:modelValue', false)" role="dialog" :aria-label="title" aria-modal="true">
        <div class="modal-box scale-in" :style="{ maxWidth: width }">
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button class="btn btn-ghost btn-icon" @click="$emit('update:modelValue', false)" aria-label="關閉" tabindex="0">
              <X :size="18" />
            </button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useModalKeyboard } from '@/composables/useKeyboard'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  width?: string
}>(), { width: '480px' })

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

useModalKeyboard(() => emit('update:modelValue', false))

watch(() => props.modelValue, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(44, 55, 72, 0.45);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 200;
}

.modal-box {
  background: var(--card);
  border-radius: var(--radius-xl);
  width: 100%;
  max-height: 90dvh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
}

.modal-body {
  padding: 20px 24px;
}

.modal-footer {
  padding: 0 24px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
