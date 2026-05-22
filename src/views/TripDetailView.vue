<template>
  <div class="page-content fade-in">
    <!-- Loading / Error -->
    <div v-if="store.loading" class="loading">載入中...</div>
    <div v-else-if="!store.currentTrip" class="empty-state">
      <span class="emoji">🔍</span>
      <p>找不到旅程</p>
      <RouterLink to="/trips" class="btn btn-secondary">回旅程列表</RouterLink>
    </div>

    <template v-else>
      <!-- Back + Header -->
      <div class="trip-header">
        <RouterLink to="/trips" class="btn btn-ghost btn-sm">
          <ChevronLeft :size="16" /> 返回
        </RouterLink>
        <div class="trip-title-row">
          <div>
            <h1>{{ store.currentTrip.name }}</h1>
            <p v-if="store.currentTrip.description" class="sub">{{ store.currentTrip.description }}</p>
            <div class="trip-meta">
              <span><Calendar :size="13" /> {{ store.currentTrip.startDate }}</span>
              <span v-if="store.currentTrip.endDate"> → {{ store.currentTrip.endDate }}</span>
              <span class="tag active" style="margin-left: 8px">{{ store.currentTrip.currency }}</span>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary" @click="showExpenseForm = true" title="新增支出 (N)">
              <Plus :size="16" />
              <span class="btn-label">新增支出</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs" role="tablist">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          role="tab"
          :aria-selected="activeTab === tab.id"
          @click="activeTab = tab.id"
          tabindex="0"
        >
          <component :is="tab.icon" :size="15" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab: 支出 -->
      <div v-show="activeTab === 'expenses'" class="tab-content slide-up">
        <div v-if="!store.tripExpenses.length" class="empty-state">
          <span class="emoji">💴</span>
          <p>還沒有支出記錄</p>
          <button class="btn btn-primary" @click="showExpenseForm = true">新增第一筆</button>
        </div>

        <div v-else class="expense-list">
          <div
            v-for="e in store.tripExpenses"
            :key="e.id"
            class="trip-expense-row card"
          >
            <div class="te-stripe" :style="{ background: CATEGORY_META[e.category].color }" />
            <div class="te-body">
              <div class="te-left">
                <span class="te-emoji">{{ CATEGORY_META[e.category].emoji }}</span>
                <div class="te-info">
                  <span class="te-title">{{ e.title }}</span>
                  <span class="te-meta">{{ e.date }} {{ e.time }} · 由 {{ memberName(e.paidById) }} 付款</span>
                </div>
              </div>
              <div class="te-right">
                <span class="te-amount amount">{{ currencySymbol }}{{ e.amount.toLocaleString() }}</span>
                <div class="te-split">
                  <span
                    v-for="mid in e.splitAmong"
                    :key="mid"
                    class="avatar avatar-sm"
                    :style="{ background: memberColor(mid) }"
                    :title="memberName(mid)"
                  >{{ memberName(mid)[0] }}</span>
                </div>
                <div class="te-actions">
                  <button class="btn btn-ghost btn-sm btn-icon" @click="openEditExpense(e)"><Pencil :size="13" /></button>
                  <button class="btn btn-ghost btn-sm btn-icon text-danger" @click="deleteExpense(e.id)"><Trash2 :size="13" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: 成員 -->
      <div v-show="activeTab === 'members'" class="tab-content slide-up">
        <MemberManager :tripId="props.id" :members="store.members" />
      </div>

      <!-- Tab: 分帳 -->
      <div v-show="activeTab === 'split'" class="tab-content slide-up">
        <div v-if="!store.members.length" class="empty-state">
          <span class="emoji">👥</span>
          <p>先新增成員才能計算分帳</p>
          <button class="btn btn-secondary" @click="activeTab = 'members'">前往新增成員</button>
        </div>
        <div v-else>
          <div class="split-total stat-card" style="margin-bottom: 20px;">
            <div class="stat-label">旅程總支出</div>
            <div class="stat-value amount">{{ currencySymbol }}{{ store.totalTripExpense.toLocaleString() }}</div>
          </div>
          <SplitSummary
            :balances="store.balances"
            :settlements="store.settlements"
            :currency="store.currentTrip.currency"
          />
        </div>
      </div>
    </template>

    <TripExpenseForm
      v-model="showExpenseForm"
      :tripId="props.id"
      :currency="store.currentTrip?.currency ?? 'TWD'"
      :members="store.members"
      :expense="editExpenseTarget"
      @saved="() => store.fetchTripDetail(props.id)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, ChevronLeft, Calendar, Pencil, Trash2, List, Users, Calculator } from 'lucide-vue-next'
import MemberManager from '@/components/trip/MemberManager.vue'
import TripExpenseForm from '@/components/trip/TripExpenseForm.vue'
import SplitSummary from '@/components/trip/SplitSummary.vue'
import { useTripStore } from '@/stores/trip'
import { CATEGORY_META, CURRENCIES } from '@/types'
import type { TripExpense } from '@/types'
import { useToast } from '@/composables/useToast'
import { useKeyboard } from '@/composables/useKeyboard'

const props = defineProps<{ id: number }>()

const store = useTripStore()
const { show: showToast } = useToast()

const activeTab = ref<'expenses' | 'members' | 'split'>('expenses')
const showExpenseForm = ref(false)
const editExpenseTarget = ref<TripExpense | null>(null)

const tabs = [
  { id: 'expenses' as const, label: '支出', icon: List },
  { id: 'members'  as const, label: '成員', icon: Users },
  { id: 'split'    as const, label: '分帳', icon: Calculator },
]

const currencySymbol = computed(
  () => CURRENCIES.find((c) => c.code === store.currentTrip?.currency)?.symbol ?? ''
)

function memberName(id: number) {
  return store.members.find((m) => m.id === id)?.name ?? '?'
}
function memberColor(id: number) {
  return store.members.find((m) => m.id === id)?.color ?? '#ccc'
}

function openEditExpense(e: TripExpense) {
  editExpenseTarget.value = e
  showExpenseForm.value = true
}

async function deleteExpense(id: number) {
  if (!confirm('確定要刪除這筆支出？')) return
  await store.removeTripExpense(id)
  showToast('已刪除')
}

function openAdd() {
  editExpenseTarget.value = null
  showExpenseForm.value = true
}

useKeyboard({ n: openAdd, N: openAdd })

onMounted(() => store.fetchTripDetail(props.id))
</script>

<style scoped>
.trip-header { margin-bottom: 24px; }

.trip-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-top: 12px;
  gap: 16px;
}

.sub { color: var(--text-light); font-size: 0.875rem; margin-top: 4px; }

.trip-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-light);
  margin-top: 8px;
}

.header-actions { flex-shrink: 0; }

.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid var(--border-light);
  margin-bottom: 20px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  background: none;
  border: none;
  font-family: var(--font);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-light);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all var(--transition);
}

.tab-btn:hover { color: var(--text); }
.tab-btn.active { color: var(--mint-dark); border-bottom-color: var(--mint); }

.expense-list { display: flex; flex-direction: column; gap: 8px; }

.trip-expense-row {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.te-stripe { height: 3px; }

.te-body {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
}

.te-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.te-emoji { font-size: 1.3rem; flex-shrink: 0; }

.te-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.te-title {
  font-weight: 500;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.te-meta { font-size: 0.72rem; color: var(--text-muted); }

.te-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.te-amount { font-size: 1rem; font-weight: 700; }

.te-split {
  display: flex;
  gap: -4px;
}

.te-split .avatar { margin-right: -6px; border: 2px solid white; }

.te-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity var(--transition);
}

.trip-expense-row:hover .te-actions { opacity: 1; }

.text-danger { color: var(--coral) !important; }

.loading { color: var(--text-light); padding: 40px; text-align: center; }

@media (max-width: 640px) {
  .trip-title-row { flex-direction: column; }
  .tab-btn { padding: 8px 12px; font-size: 0.8rem; }
  .btn-label { display: none; }
}
</style>
