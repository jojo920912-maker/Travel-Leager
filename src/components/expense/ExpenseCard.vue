<template>
  <div class="expense-card card" :style="{ '--cat-color': catMeta.color }">
    <div class="cat-stripe" />
    <div class="card-body">
      <div class="card-left">
        <span class="cat-emoji" :title="catMeta.label">{{ catMeta.emoji }}</span>
        <div class="card-info">
          <span class="card-title">{{ expense.title }}</span>
          <div class="card-meta">
            <span class="card-time">{{ expense.time }}</span>
            <span class="pay-badge">
              {{ payMeta.emoji }} {{ payMeta.label }}
            </span>
          </div>
        </div>
      </div>
      <div class="card-right">
        <span class="card-amount amount">NT$ {{ expense.amount.toLocaleString() }}</span>
        <div class="card-actions">
          <button class="btn btn-ghost btn-sm btn-icon" title="編輯 (E)" @click.stop="$emit('edit', expense)" aria-label="編輯">
            <Pencil :size="14" />
          </button>
          <button class="btn btn-ghost btn-sm btn-icon text-danger" title="刪除 (Del)" @click.stop="$emit('delete', expense.id)" aria-label="刪除">
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </div>
    <div v-if="expense.note" class="card-note">{{ expense.note }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Pencil, Trash2 } from 'lucide-vue-next'
import { CATEGORY_META, PAYMENT_META } from '@/types'
import type { Expense } from '@/types'

const props = defineProps<{ expense: Expense }>()
defineEmits<{ edit: [expense: Expense]; delete: [id: number] }>()

const catMeta = computed(() => CATEGORY_META[props.expense.category])
const payMeta = computed(() => PAYMENT_META[props.expense.paymentMethod ?? 'cash'])
</script>

<style scoped>
.expense-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--radius-lg);
  transition: all var(--transition);
}

.cat-stripe {
  height: 3px;
  background: var(--cat-color);
  border-radius: 2px 2px 0 0;
}

.card-body {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
}

.card-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.cat-emoji { font-size: 1.4rem; flex-shrink: 0; }

.card-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.card-title {
  font-weight: 500;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.card-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.pay-badge {
  font-size: 0.7rem;
  color: var(--text-muted);
  background: var(--border-light);
  padding: 1px 7px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.card-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.card-amount {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
}

.card-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity var(--transition);
}

.expense-card:hover .card-actions { opacity: 1; }

.text-danger { color: var(--coral) !important; }

.card-note {
  padding: 0 16px 12px;
  font-size: 0.8rem;
  color: var(--text-light);
  border-top: 1px dashed var(--border-light);
  padding-top: 8px;
  margin: 0 16px;
}
</style>
