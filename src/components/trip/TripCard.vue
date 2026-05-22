<template>
  <div class="trip-card card card-interactive" @click="$emit('click')" @keydown.enter="$emit('click')" tabindex="0" role="button" :aria-label="`前往 ${trip.name}`">
    <div class="trip-card-header">
      <div class="trip-icon">✈️</div>
      <div class="trip-actions" @click.stop>
        <button class="btn btn-ghost btn-sm btn-icon" @click="$emit('edit', trip)" aria-label="編輯旅程">
          <Pencil :size="14" />
        </button>
        <button class="btn btn-ghost btn-sm btn-icon text-danger" @click="$emit('delete', trip.id)" aria-label="刪除旅程">
          <Trash2 :size="14" />
        </button>
      </div>
    </div>
    <div class="trip-body">
      <h3 class="trip-name">{{ trip.name }}</h3>
      <p v-if="trip.description" class="trip-desc">{{ trip.description }}</p>
    </div>
    <div class="trip-footer">
      <div class="trip-dates">
        <Calendar :size="13" />
        <span>{{ formatDate(trip.startDate) }}</span>
        <span v-if="trip.endDate">→ {{ formatDate(trip.endDate) }}</span>
      </div>
      <span class="trip-currency">{{ trip.currency }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Pencil, Trash2, Calendar } from 'lucide-vue-next'
import type { Trip } from '@/types'

defineProps<{ trip: Trip }>()
defineEmits<{ click: []; edit: [trip: Trip]; delete: [id: number] }>()

function formatDate(s: string) {
  const [y, m, d] = s.split('-')
  return `${y}/${m}/${d}`
}
</script>

<style scoped>
.trip-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trip-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.trip-icon { font-size: 2rem; }

.trip-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity var(--transition);
}

.trip-card:hover .trip-actions { opacity: 1; }

.trip-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text);
}

.trip-desc {
  font-size: 0.83rem;
  color: var(--text-light);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.trip-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid var(--border-light);
}

.trip-dates {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78rem;
  color: var(--text-light);
}

.trip-currency {
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--mint-pale);
  color: var(--mint-dark);
  padding: 2px 10px;
  border-radius: var(--radius-full);
}

.text-danger { color: var(--coral) !important; }
</style>
