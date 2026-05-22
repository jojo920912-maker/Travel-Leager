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

      <div class="form-group">
        <label class="form-label">分攤成員</label>
        <div class="split-members">
          <label
            v-for="m in members"
            :key="m.id"
            class="split-member"
            :class="{ selected: form.splitAmong.includes(m.id) }"
            tabindex="7"
            @keydown.space.prevent="toggleMember(m.id)"
          >
            <input
              type="checkbox"
              :value="m.id"
              v-model="form.splitAmong"
              class="visually-hidden"
              tabindex="-1"
            />
            <span class="avatar avatar-sm" :style="{ background: m.color }">{{ m.name[0] }}</span>
            <span>{{ m.name }}</span>
          </label>
        </div>
        <p v-if="form.splitAmong.length > 0" class="split-preview">
          每人 {{ currencySymbol }}{{ perPerson }}
        </p>
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
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { CATEGORY_META, CURRENCIES } from '@/types'
import type { TripMember, TripExpense, ExpenseCategory } from '@/types'
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
    ? { title: e.title, amount: e.amount, category: e.category, date: e.date, time: e.time, paidById: e.paidById, splitAmong: [...e.splitAmong], note: e.note }
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
  } catch {
    showToast('操作失敗，請重試', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.form-stack { display: flex; flex-direction: column; gap: 16px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 4px; }

.split-members {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.split-member {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  border: 1.5px solid var(--border);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-light);
  transition: all var(--transition);
}

.split-member:hover { border-color: var(--mint); }
.split-member.selected { border-color: var(--mint); background: var(--mint-pale); color: var(--mint-dark); }

.visually-hidden {
  position: absolute;
  width: 1px; height: 1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
}

.split-preview {
  font-size: 0.82rem;
  color: var(--mint-dark);
  margin-top: 6px;
  font-weight: 500;
}
</style>
