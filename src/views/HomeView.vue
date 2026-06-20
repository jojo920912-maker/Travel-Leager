<template>
  <div class="page-content fade-in">
    <div class="page-header">
      <div>
        <h1>總覽</h1>
        <p class="sub">{{ todayStr }}</p>
      </div>
    </div>

    <!-- Trip summary stat -->
    <div class="stat-card trip-stat-card">
      <div class="stat-label">旅程概況</div>
      <div class="stat-value">{{ tripStore.trips.length }} 個旅程</div>
      <div class="stat-trip-tags">
        <span v-if="activeTrips.length"    class="tag-dot dot-active">{{ activeTrips.length }} 進行中</span>
        <span v-if="upcomingTrips.length"  class="tag-dot dot-upcoming">{{ upcomingTrips.length }} 即將到來</span>
        <span v-if="completedTrips.length" class="tag-dot dot-done">{{ completedTrips.length }} 已完成</span>
        <span v-if="!tripStore.trips.length" class="tag-dot dot-none">尚無旅程</span>
      </div>
    </div>

    <!-- Active trips -->
    <div v-if="activeTrips.length" class="section">
      <div class="section-header">
        <h3>✈️ 進行中旅程</h3>
        <RouterLink to="/trips" class="btn btn-ghost btn-sm">查看全部 →</RouterLink>
      </div>
      <div class="trip-list-sm">
        <RouterLink
          v-for="t in activeTrips"
          :key="t.id"
          :to="`/trips/${t.id}`"
          class="trip-sm-card card trip-sm-active"
        >
          <span class="trip-sm-icon">✈️</span>
          <div class="trip-sm-info">
            <span class="trip-sm-name">{{ t.name }}</span>
            <span class="trip-sm-date">{{ t.startDate }}<template v-if="t.endDate"> → {{ t.endDate }}</template></span>
          </div>
          <span class="trip-sm-cur">{{ t.currency }}</span>
        </RouterLink>
      </div>
    </div>

    <!-- Upcoming trips (≤ 2 months) -->
    <div v-if="soonTrips.length" class="section">
      <div class="section-header">
        <h3>🗓️ 即將到來</h3>
        <RouterLink to="/trips" class="btn btn-ghost btn-sm">查看全部 →</RouterLink>
      </div>
      <div class="trip-list-sm">
        <RouterLink
          v-for="t in soonTrips"
          :key="t.id"
          :to="`/trips/${t.id}`"
          class="trip-sm-card card trip-sm-upcoming"
        >
          <span class="trip-sm-icon">🗺️</span>
          <div class="trip-sm-info">
            <span class="trip-sm-name">{{ t.name }}</span>
            <div class="trip-sm-timeline">
              <span class="tl-now-label">{{ nowMonthLabel }}</span>
              <div class="tl-mini-track">
                <div class="tl-mini-dot start" />
                <div class="tl-mini-line" />
                <div class="tl-mini-dot end" />
              </div>
              <span class="tl-start-label">{{ monthLabel(t.startDate) }}</span>
            </div>
          </div>
          <div class="trip-sm-right">
            <span class="countdown-chip">{{ getCountdownText(t.startDate) }}</span>
            <span class="trip-sm-cur">{{ t.currency }}</span>
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- Planning trips (> 2 months) -->
    <div v-if="laterTrips.length" class="section">
      <div class="section-header">
        <h3>📋 計畫中旅程</h3>
        <RouterLink to="/trips" class="btn btn-ghost btn-sm">查看全部 →</RouterLink>
      </div>
      <div class="trip-list-sm">
        <RouterLink
          v-for="t in laterTrips"
          :key="t.id"
          :to="`/trips/${t.id}`"
          class="trip-sm-card card trip-sm-planning"
        >
          <span class="trip-sm-icon">📋</span>
          <div class="trip-sm-info">
            <span class="trip-sm-name">{{ t.name }}</span>
            <div class="trip-sm-timeline">
              <span class="tl-now-label">{{ nowMonthLabel }}</span>
              <div class="tl-mini-track">
                <div class="tl-mini-dot start" />
                <div class="tl-mini-line tl-line-amber" />
                <div class="tl-mini-dot end tl-dot-amber" />
              </div>
              <span class="tl-start-label tl-amber">{{ monthLabel(t.startDate) }}</span>
            </div>
          </div>
          <div class="trip-sm-right">
            <span class="countdown-chip countdown-chip-amber">{{ getCountdownText(t.startDate) }}</span>
            <span class="trip-sm-cur">{{ t.currency }}</span>
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- Completed trips (recent 3) -->
    <div v-if="recentCompletedTrips.length" class="section">
      <div class="section-header">
        <h3>🗺️ 已完成旅程</h3>
        <RouterLink to="/trips" class="btn btn-ghost btn-sm">查看全部 →</RouterLink>
      </div>
      <div class="trip-list-sm">
        <RouterLink
          v-for="t in recentCompletedTrips"
          :key="t.id"
          :to="`/trips/${t.id}`"
          class="trip-sm-card card trip-sm-completed"
        >
          <span class="trip-sm-icon">✅</span>
          <div class="trip-sm-info">
            <span class="trip-sm-name">{{ t.name }}</span>
            <span class="trip-sm-date">
              {{ t.startDate }}<template v-if="t.endDate"> → {{ t.endDate }}</template>
            </span>
          </div>
          <span class="trip-sm-cur trip-sm-cur-done">{{ t.currency }}</span>
        </RouterLink>
      </div>
    </div>

    <!-- Empty trip state (no trips at all) -->
    <div v-if="!tripStore.trips.length && !tripStore.loading" class="section">
      <div class="section-header">
        <h3>✈️ 旅程</h3>
        <RouterLink to="/trips" class="btn btn-ghost btn-sm">前往新增 →</RouterLink>
      </div>
      <div class="empty-state" style="padding: 20px 0;">
        <span class="emoji">🗺️</span>
        <p>還沒有旅程，去計畫一趟吧！</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTripStore } from '@/stores/trip'
import { getTripStatus, getCountdownText, toMonthLabel, todayMonthLabel, isSoon } from '@/utils/tripStatus'

const tripStore = useTripStore()

const now = new Date()
const todayStr = now.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

const activeTrips = computed(() =>
  tripStore.trips.filter((t) => getTripStatus(t.startDate, t.endDate) === 'active')
)
const upcomingTrips = computed(() =>
  tripStore.trips.filter((t) => getTripStatus(t.startDate, t.endDate) === 'upcoming')
)
const soonTrips = computed(() =>
  upcomingTrips.value
    .filter((t) => isSoon(t.startDate))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 3)
)
const laterTrips = computed(() =>
  upcomingTrips.value
    .filter((t) => !isSoon(t.startDate))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 3)
)
const completedTrips = computed(() =>
  tripStore.trips.filter((t) => getTripStatus(t.startDate, t.endDate) === 'completed')
)
const recentCompletedTrips = computed(() =>
  completedTrips.value
    .slice()
    .sort((a, b) => {
      const da = a.endDate || a.startDate
      const db = b.endDate || b.startDate
      return db.localeCompare(da)
    })
    .slice(0, 3)
)

const nowMonthLabel = todayMonthLabel()
const monthLabel    = toMonthLabel

onMounted(async () => {
  await tripStore.fetchTrips()
})
</script>

<style scoped>
.page-header { margin-bottom: 24px; }
.sub { color: var(--text-light); font-size: 0.875rem; margin-top: 4px; }

.trip-stat-card {
  margin-bottom: 24px;
  padding: 16px 20px;
}

.section { margin-bottom: 28px; }

.stat-trip-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}
.tag-dot {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: var(--radius-full);
}
.dot-active   { background: rgba(92, 200, 190, 0.18); color: var(--mint-dark); }
.dot-upcoming { background: rgba(99, 102, 241, 0.12); color: #6366F1; }
.dot-done     { background: var(--border-light); color: var(--text-muted); }
.dot-none     { background: var(--border-light); color: var(--text-muted); }

.trip-list-sm { display: flex; flex-direction: column; gap: 8px; }

.trip-sm-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  text-decoration: none;
  color: var(--text);
  transition: all var(--transition);
  border-left: 3px solid transparent;
}
.trip-sm-card:hover { transform: translateX(4px); }
.trip-sm-active   { border-left-color: var(--mint); }
.trip-sm-upcoming { border-left-color: #6366F1; }
.trip-sm-planning { border-left-color: #F59E0B; }

.trip-sm-icon { font-size: 1.5rem; flex-shrink: 0; }

.trip-sm-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.trip-sm-name { font-weight: 600; font-size: 0.9rem; }
.trip-sm-date { font-size: 0.75rem; color: var(--text-light); }

.trip-sm-timeline {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
}

.tl-now-label   { color: var(--text-muted); font-weight: 600; }
.tl-start-label { color: #6366F1; font-weight: 700; }

.tl-mini-track {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 32px;
}
.tl-mini-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}
.tl-mini-dot.start { background: var(--text-muted); }
.tl-mini-dot.end   { background: #6366F1; }
.tl-mini-line {
  flex: 1;
  height: 1.5px;
  background: linear-gradient(to right, var(--border), #6366F1);
  min-width: 20px;
}

.trip-sm-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.countdown-chip {
  font-size: 0.72rem;
  font-weight: 700;
  color: #6366F1;
  background: rgba(99, 102, 241, 0.1);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}
.countdown-chip-amber {
  font-size: 0.72rem;
  font-weight: 700;
  color: #B45309;
  background: rgba(245, 158, 11, 0.12);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}
.tl-line-amber { background: linear-gradient(to right, var(--border), #F59E0B) !important; }
.tl-dot-amber  { background: #F59E0B !important; }
.tl-amber      { color: #B45309 !important; }

.trip-sm-completed { border-left-color: var(--border); opacity: 0.8; }

.trip-sm-cur {
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--mint-pale);
  color: var(--mint-dark);
  padding: 2px 10px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}
.trip-sm-cur-done {
  background: var(--border-light);
  color: var(--text-muted);
}
</style>
