<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast-${toast.type}`"
        >
          <component :is="iconFor(toast.type)" :size="16" />
          <span>{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { CheckCircle2, AlertCircle, Info } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
import type { Toast } from '@/composables/useToast'

const { toasts } = useToast()

function iconFor(type: Toast['type']) {
  if (type === 'success') return CheckCircle2
  if (type === 'error')   return AlertCircle
  return Info
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 300;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: var(--shadow-lg);
  pointer-events: all;
  min-width: 220px;
}

.toast-success { background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0; }
.toast-error   { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }
.toast-info    { background: var(--mint-pale); color: var(--mint-dark); border: 1px solid var(--mint-light); }

.toast-enter-active { transition: all 0.25s ease; }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from   { opacity: 0; transform: translateX(20px); }
.toast-leave-to     { opacity: 0; transform: translateX(20px); }
</style>
