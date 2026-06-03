<template>
  <div
    class="trip-card card card-interactive"
    :class="`status-${tripStatus}`"
    @click="$emit('click')"
    @keydown.enter="$emit('click')"
    tabindex="0"
    role="button"
    :aria-label="`前往 ${trip.name}`"
  >
    <div class="trip-card-header">
      <div class="trip-icon">{{ tripStatus === 'completed' ? '🗺️' : '✈️' }}</div>
      <div class="header-right">
        <span class="status-badge" :class="`badge-${tripStatus}`">
          {{ statusLabel }}
        </span>
        <div class="trip-actions" @click.stop>
          <button class="btn btn-ghost btn-sm btn-icon" @click="$emit('edit', trip)" aria-label="編輯旅程">
            <Pencil :size="14" />
          </button>
          <button class="btn btn-ghost btn-sm btn-icon text-danger" @click="$emit('delete', trip.id)" aria-label="刪除旅程">
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </div>

    <div class="trip-body">
      <h3 class="trip-name">{{ trip.name }}</h3>
      <p v-if="trip.description" class="trip-desc">{{ trip.description }}</p>
    </div>

    <!-- 即將到來：顯示時間軸倒數 -->
    <div v-if="tripStatus === 'upcoming'" class="trip-countdown">
      <div class="countdown-timeline">
        <span class="tl-now">{{ nowMonthLabel }}</span>
        <div class="tl-track">
          <div class="tl-dot tl-dot-start" />
          <div class="tl-line" />
          <div class="tl-dot tl-dot-end" />
        </div>
        <span class="tl-target">{{ startMonthLabel }}</span>
      </div>
      <span class="countdown-badge">{{ countdownText }}</span>
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
import { computed } from 'vue'
import { Pencil, Trash2, Calendar } from 'lucide-vue-next'
import type { Trip } from '@/types'
import {
  getTripStatus,
  getCountdownText,
  toMonthLabel,
  todayMonthLabel,
} from '@/utils/tripStatus'

const props = defineProps<{ trip: Trip }>()
defineEmits<{ click: []; edit: [trip: Trip]; delete: [id: number] }>()

const tripStatus = computed(() => getTripStatus(props.trip.startDate, props.trip.endDate))

const statusLabel = computed(() => {
  if (tripStatus.value === 'active')    return '進行中'
  if (tripStatus.value === 'upcoming')  return '即將到來'
  return '已完成'
})

const countdownText   = computed(() => getCountdownText(props.trip.startDate))
const startMonthLabel = computed(() => toMonthLabel(props.trip.startDate))
const nowMonthLabel   = todayMonthLabel()

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
  border-left: 3px solid transparent;
  transition: all var(--transition);
}

/* 左側彩色邊線 */
.trip-card.status-active    { border-left-color: var(--mint); }
.trip-card.status-upcoming  { border-left-color: #6366F1; }
.trip-card.status-completed { border-left-color: var(--border); opacity: 0.75; }

.trip-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.trip-icon { font-size: 2rem; }

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Status badge */
.status-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.badge-active {
  background: rgba(92, 200, 190, 0.18);
  color: var(--mint-dark);
}
.badge-upcoming {
  background: rgba(99, 102, 241, 0.12);
  color: #6366F1;
}
.badge-completed {
  background: var(--border-light);
  color: var(--text-muted);
}

/* Trip actions */
.trip-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity var(--transition);
}
.trip-card:hover .trip-actions { opacity: 1; }

/* Body */
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

/* Countdown timeline */
.trip-countdown {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(99, 102, 241, 0.06);
  border-radius: var(--radius);
  padding: 8px 12px;
  gap: 12px;
}

.countdown-timeline {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  font-weight: 600;
}

.tl-now    { color: var(--text-muted); }
.tl-target { color: #6366F1; }

.tl-track {
  display: flex;
  align-items: center;
  gap: 0;
  flex: 1;
  min-width: 48px;
}

.tl-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.tl-dot-start { background: var(--text-muted); }
.tl-dot-end   { background: #6366F1; }

.tl-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(to right, var(--border), #6366F1);
  min-width: 32px;
}

.countdown-badge {
  font-size: 0.78rem;
  font-weight: 700;
  color: #6366F1;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Footer */
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
