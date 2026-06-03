<template>
  <BaseModal v-model="show" :title="editing ? '編輯支出' : '新增支出'">
    <form class="form-stack" @submit.prevent="submit">
      <div class="form-group">
        <label class="form-label" for="te-title">項目名稱 *</label>
        <input
          id="te-title"
          v-model="form.title"
          class="form-input"
          placeholder="例：新幹線車票"
          required
          autofocus
          tabindex="1"
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="te-amount">金額 *</label>
          <input
            id="te-amount"
            v-model.number="form.amount"
            type="number"
            class="form-input"
            min="0"
            step="1"
            required
            tabindex="2"
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="te-category">分類</label>
          <select id="te-category" v-model="form.category" class="form-select" tabindex="3">
            <option v-for="(meta, key) in CATEGORY_META" :key="key" :value="key">
              {{ meta.emoji }} {{ meta.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="te-date">日期 *</label>
          <input id="te-date" v-model="form.date" type="date" class="form-input" required tabindex="4" />
        </div>
        <div class="form-group">
          <label class="form-label" for="te-time">時間</label>
          <input id="te-time" v-model="form.time" type="time" class="form-input" tabindex="5" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="te-paidby">由誰付款 *</label>
        <select id="te-paidby" v-model="form.paidById" class="form-select" required tabindex="6">
          <option value="" disabled>選擇付款人</option>
          <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
        </select>
      </div>

      <div class="form-group" ref="splitGroupRef">
        <label class="form-label">分攤成員</label>
        <div class="split-dropdown-wrapper">
          <button
            type="button"
            class="form-input split-trigger"
            @click="showSplitDrop = !showSplitDrop"
          >
            <span v-if="!form.splitAmong.length" class="split-placeholder">選擇分攤成員</span>
            <span v-else-if="form.splitAmong.length === members.length" class="split-summary">
              全部成員（{{ members.length }} 人）
            </span>
            <span v-else class="split-summary">
              {{ selectedNames }} （{{ form.splitAmong.length }} 人）
            </span>
            <ChevronDown :size="15" class="split-chevron" :class="{ open: showSplitDrop }" />
          </button>

          <Transition name="drop">
            <div v-if="showSplitDrop" class="split-dropdown-menu">
              <!-- 全選 / 全清 -->
              <div class="split-option all-row" @click="toggleAll">
                <span class="check-box" :class="{ checked: form.splitAmong.length === members.length }">
                  <Check v-if="form.splitAmong.length === members.length" :size="11" />
                  <Minus v-else-if="form.splitAmong.length > 0" :size="11" />
                </span>
                <span class="split-opt-label">全部成員</span>
              </div>
              <div class="drop-divider" />
              <div
                v-for="m in members"
                :key="m.id"
                class="split-option"
                @click="toggleMember(m.id)"
              >
                <span class="check-box" :class="{ checked: form.splitAmong.includes(m.id) }">
                  <Check v-if="form.splitAmong.includes(m.id)" :size="11" />
                </span>
                <span class="avatar avatar-sm" :style="{ background: m.color }">{{ m.name[0] }}</span>
                <span class="split-opt-label">{{ m.name }}</span>
              </div>
            </div>
          </Transition>
        </div>

        <p v-if="form.splitAmong.length > 0" class="split-preview">
          每人 {{ currencySymbol }}{{ perPerson }}
        </p>
      </div>

      <!-- 付款方式 -->
      <div class="form-group">
        <label class="form-label">付款方式</label>
        <div class="payment-grid">
          <button
            v-for="(meta, key) in PAYMENT_META"
            :key="key"
            type="button"
            class="pay-btn"
            :class="{ active: form.paymentMethod === key }"
            @click="form.paymentMethod = key as PaymentMethod"
          >
            <span class="pay-emoji">{{ meta.emoji }}</span>
            <span class="pay-label">{{ meta.label }}</span>
          </button>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="te-note">備註</label>
        <textarea id="te-note" v-model="form.note" class="form-textarea" rows="2" tabindex="8" />
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-ghost" @click="show = false">取消</button>
        <button type="submit" class="btn btn-primary" :disabled="saving || !canSubmit">
          {{ saving ? '儲存中...' : (editing ? '更新' : '新增') }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { ChevronDown, Check, Minus } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import { CATEGORY_META, CURRENCIES, PAYMENT_META } from '@/types'
import type { TripMember, TripExpense, ExpenseCategory, PaymentMethod } from '@/types'
import { useTripStore } from '@/stores/trip'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  modelValue: boolean
  tripId: number
  currency: string
  members: TripMember[]
  expense?: TripExpense | null
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  saved: []
}>()

const store = useTripStore()
const { show: showToast } = useToast()
const saving = ref(false)

// 分攤下拉
const showSplitDrop = ref(false)
const splitGroupRef = ref<HTMLElement | null>(null)

const selectedNames = computed(() =>
  props.members
    .filter((m) => form.value.splitAmong.includes(m.id))
    .map((m) => m.name)
    .join('、')
)

function toggleAll() {
  if (form.value.splitAmong.length === props.members.length) {
    form.value.splitAmong = []
  } else {
    form.value.splitAmong = props.members.map((m) => m.id)
  }
}

function handleClickOutside(e: MouseEvent) {
  if (splitGroupRef.value && !splitGroupRef.value.contains(e.target as Node)) {
    showSplitDrop.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', handleClickOutside))

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
const editing = computed(() => !!props.expense)

const currencySymbol = computed(
  () => CURRENCIES.find((c) => c.code === props.currency)?.symbol ?? props.currency
)

const defaultForm = () => ({
  title: '',
  amount: 0,
  category: 'food' as ExpenseCategory,
  paymentMethod: 'cash' as PaymentMethod,
  date: new Date().toISOString().slice(0, 10),
  time: new Date().toTimeString().slice(0, 5),
  paidById: props.members[0]?.id ?? 0,
  splitAmong: props.members.map((m) => m.id),
  note: '',
})

const form = ref(defaultForm())

const perPerson = computed(() => {
  if (!form.value.splitAmong.length) return 0
  return Math.round((form.value.amount / form.value.splitAmong.length) * 100) / 100
})

const canSubmit = computed(
  () => form.value.title && form.value.amount > 0 && form.value.paidById && form.value.splitAmong.length > 0
)

watch(() => props.expense, (e) => {
  form.value = e
    ? { title: e.title, amount: e.amount, category: e.category, paymentMethod: e.paymentMethod ?? 'cash', date: e.date, time: e.time, paidById: e.paidById, splitAmong: [...e.splitAmong], note: e.note }
    : defaultForm()
}, { immediate: true })

watch(() => props.members, () => {
  if (!editing.value) form.value = defaultForm()
})

function toggleMember(id: number) {
  const idx = form.value.splitAmong.indexOf(id)
  if (idx === -1) form.value.splitAmong.push(id)
  else form.value.splitAmong.splice(idx, 1)
}

async function submit() {
  if (!canSubmit.value) return
  saving.value = true
  try {
    const data = { ...form.value, tripId: props.tripId }
    if (editing.value && props.expense) {
      await store.editTripExpense(props.expense.id, data)
      showToast('支出已更新 ✓')
    } else {
      await store.addTripExpense(data)
      showToast('已新增支出 ✓')
    }
    show.value = false
    emit('saved')
  } catch (e) {
    const msg = e instanceof Error ? e.message : '操作失敗，請重試'
    console.error('[TripExpenseForm]', e)
    showToast(msg, 'error')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.form-stack { display: flex; flex-direction: column; gap: 16px; }

/* 付款方式 */
.payment-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.pay-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 6px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);
  cursor: pointer;
  transition: all var(--transition);
  font-family: var(--font);
}
.pay-btn:hover { border-color: var(--mint); background: var(--mint-pale); }
.pay-btn.active {
  border-color: var(--mint);
  background: var(--mint-pale);
  box-shadow: 0 0 0 2px rgba(92,200,190,0.2);
}
.pay-emoji { font-size: 1.2rem; }
.pay-label { font-size: 0.72rem; font-weight: 500; color: var(--text-light); white-space: nowrap; }
.pay-btn.active .pay-label { color: var(--mint-dark); font-weight: 600; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 4px; }

/* ── 分攤下拉 ─────────────────────────────── */
.split-dropdown-wrapper { position: relative; }

.split-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  text-align: left;
  user-select: none;
}

.split-placeholder { color: var(--text-muted); }
.split-summary { color: var(--text); font-weight: 500; }

.split-chevron {
  color: var(--mint);
  flex-shrink: 0;
  transition: transform var(--transition);
}
.split-chevron.open { transform: rotate(180deg); }

.split-dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--card);
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  z-index: 50;
  overflow: hidden;
}

.split-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background var(--transition);
}
.split-option:hover { background: var(--mint-pale); }

.all-row { font-weight: 600; color: var(--text); }

.check-box {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 1.5px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--transition);
  color: white;
}
.check-box.checked {
  background: var(--mint);
  border-color: var(--mint);
}

.split-opt-label { flex: 1; }

.drop-divider {
  height: 1px;
  background: var(--border-light);
  margin: 2px 0;
}

/* dropdown 動畫 */
.drop-enter-active, .drop-leave-active { transition: all 0.15s ease; }
.drop-enter-from, .drop-leave-to { opacity: 0; transform: translateY(-4px); }

.split-preview {
  font-size: 0.82rem;
  color: var(--mint-dark);
  margin-top: 6px;
  font-weight: 500;
}
</style>
