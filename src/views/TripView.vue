<template>
  <div class="page-content fade-in">
    <div class="page-header">
      <div>
        <h1>旅行分帳</h1>
        <p class="sub">{{ store.trips.length }} 個旅程</p>
      </div>
      <button class="btn btn-primary" @click="openAdd" title="新增旅程 (N)">
        <Plus :size="16" />
        <span class="btn-label">新增旅程</span>
      </button>
    </div>

    <!-- Trip budget mini-bar -->
    <div v-if="budgetStore.currentMonthBudget || tripSpent > 0" class="budget-mini card">
      <div class="bm-left">
        <span class="bm-label">✈️ 本月旅行預算</span>
        <span class="bm-val amount">NT$ {{ tripSpent.toLocaleString() }}</span>
        <span class="bm-limit" v-if="tripBudget">
          / NT$ {{ tripBudget.toLocaleString() }}
          <span class="bm-pct" :class="tripPctClass">（{{ tripPct }}%）</span>
        </span>
        <span class="bm-limit muted" v-else>未分配預算</span>
      </div>
      <div class="bm-right">
        <div v-if="tripBudget" class="bm-track">
          <div class="bm-fill" :class="tripPctClass" :style="{ width: `${Math.min(tripPct, 100)}%` }" />
        </div>
        <button class="btn btn-ghost btn-sm" @click="openBudgetModal">
          {{ tripBudget ? '編輯' : '設定預算' }}
        </button>
      </div>
    </div>

    <div v-if="store.loading" class="loading">載入中...</div>

    <div v-else-if="!store.trips.length" class="empty-state">
      <span class="emoji">🗺️</span>
      <p>還沒有旅程</p>
      <button class="btn btn-primary" @click="openAdd">建立第一個旅程</button>
    </div>

    <div v-else class="trips-grid">
      <TripCard
        v-for="t in store.trips"
        :key="t.id"
        :trip="t"
        @click="router.push(`/trips/${t.id}`)"
        @edit="openEdit(t)"
        @delete="confirmDelete(t.id)"
      />
    </div>

    <TripForm
      v-model="showForm"
      :trip="editTarget"
      @saved="(t) => router.push(`/trips/${t.id}`)"
    />

    <!-- Budget allocation modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showBudgetModal" class="modal-overlay" @click.self="showBudgetModal = false">
          <div class="modal-box alloc-modal">
            <div class="modal-header">
              <h2>設定旅行預算分配</h2>
              <button class="btn btn-icon btn-ghost" @click="showBudgetModal = false">✕</button>
            </div>
            <div class="modal-body">
              <p class="modal-sub">{{ currentMonthLabel }}</p>
              <div class="form-group">
                <label class="form-label">旅行分配金額（NT$）</label>
                <input v-model.number="allocInput" type="number" min="0" placeholder="0 = 不分配" class="form-input" />
              </div>
              <RouterLink to="/budget" class="goto-budget" @click="showBudgetModal = false">
                前往完整預算設定 →
              </RouterLink>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" @click="showBudgetModal = false">取消</button>
              <button class="btn btn-primary" :disabled="allocSaving" @click="saveAlloc">
                {{ allocSaving ? '儲存中…' : '儲存' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import TripCard from '@/components/trip/TripCard.vue'
import TripForm from '@/components/trip/TripForm.vue'
import { useTripStore } from '@/stores/trip'
import { useBudgetStore } from '@/stores/budget'
import type { Trip } from '@/types'
import { useToast } from '@/composables/useToast'
import { useKeyboard } from '@/composables/useKeyboard'

const store = useTripStore()
const budgetStore = useBudgetStore()
const router = useRouter()
const { show: showToast } = useToast()

const showForm = ref(false)
const editTarget = ref<Trip | null>(null)

// ─── 當月旅行預算 ──────────────────────────────────────────────
const now = new Date()
const currentMonthKey   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
const currentMonthLabel = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月`

const tripBudget = computed(() => budgetStore.currentMonthBudget?.tripBudget ?? 0)
const tripSpent  = computed(() =>
  store.monthTripExpenses
    .filter((e) => e.date.startsWith(currentMonthKey))
    .reduce((s, e) => s + e.amount, 0)
)
const tripPct = computed(() =>
  tripBudget.value ? Math.round((tripSpent.value / tripBudget.value) * 100) : 0
)
const tripPctClass = computed(() => {
  const p = tripPct.value
  return p >= 100 ? 'danger' : p >= 80 ? 'warning' : 'safe'
})

// ─── 分配 Modal ────────────────────────────────────────────────
const showBudgetModal = ref(false)
const allocInput  = ref(0)
const allocSaving = ref(false)

function openBudgetModal() {
  allocInput.value = tripBudget.value
  showBudgetModal.value = true
}

async function saveAlloc() {
  allocSaving.value = true
  try {
    await budgetStore.updateAllocation(currentMonthKey, 'trip', allocInput.value)
    showToast('旅行預算已更新 ✓')
    showBudgetModal.value = false
  } catch {
    showToast('儲存失敗', 'error')
  } finally {
    allocSaving.value = false
  }
}

// ─── Trip CRUD ─────────────────────────────────────────────────
function openAdd() {
  editTarget.value = null
  showForm.value = true
}

function openEdit(trip: Trip) {
  editTarget.value = trip
  showForm.value = true
}

async function confirmDelete(id: number) {
  if (!confirm('確定要刪除這個旅程？此操作無法復原。')) return
  await store.removeTrip(id)
  showToast('旅程已刪除')
}

useKeyboard({ n: openAdd, N: openAdd })

onMounted(async () => {
  await Promise.all([
    store.fetchTrips(),
    budgetStore.fetchByMonth(currentMonthKey),
    store.fetchMonthTripExpenses(currentMonthKey),
  ])
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}
.sub { color: var(--text-light); font-size: 0.875rem; margin-top: 4px; }

/* Budget mini bar */
.budget-mini {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin-bottom: 20px;
  gap: 12px;
  flex-wrap: wrap;
}
.bm-left {
  display: flex; align-items: center; gap: 8px;
  flex-wrap: wrap; font-size: 0.83rem;
}
.bm-label  { font-weight: 600; color: var(--text); }
.bm-val    { font-weight: 700; color: var(--text); }
.bm-limit  { color: var(--text-muted); }
.bm-pct    { font-family: var(--font-mono); font-weight: 700; }
.bm-pct.safe    { color: var(--mint-dark); }
.bm-pct.warning { color: #D97706; }
.bm-pct.danger  { color: #DC2626; }
.bm-right  { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.bm-track  {
  width: 80px; height: 6px;
  background: var(--border-light);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.bm-fill   { height: 100%; border-radius: var(--radius-full); transition: width 0.4s; }
.bm-fill.safe    { background: #8FC9A9; }
.bm-fill.warning { background: #F59E0B; }
.bm-fill.danger  { background: #EF4444; }

.trips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.loading { color: var(--text-light); padding: 40px; text-align: center; }

/* Alloc modal */
.alloc-modal { width: min(400px, 95vw); }
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-light);
}
.modal-body { padding: 20px 24px; }
.modal-footer {
  display: flex; gap: 10px; justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid var(--border-light);
}
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; padding: 16px;
}
.modal-box { background: var(--card); border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); }
.modal-sub { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px; }
.goto-budget {
  display: block; margin-top: 14px;
  font-size: 0.82rem; color: var(--mint-dark); text-decoration: none;
}
.goto-budget:hover { text-decoration: underline; }

@media (max-width: 768px) {
  .trips-grid { grid-template-columns: 1fr; }
  .btn-label { display: none; }
}
</style>
