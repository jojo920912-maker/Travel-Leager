<template>
  <BaseModal v-model="show" :title="editing ? '編輯記帳' : '新增記帳'">
    <form class="form-stack" @submit.prevent="submit">
      <div class="form-group">
        <label class="form-label" for="exp-title">項目名稱 *</label>
        <input
          id="exp-title"
          v-model="form.title"
          class="form-input"
          placeholder="例：拉麵午餐"
          required
          autofocus
          autocomplete="off"
          tabindex="1"
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="exp-amount">金額 *</label>
          <input
            id="exp-amount"
            v-model.number="form.amount"
            type="number"
            class="form-input"
            placeholder="0"
            min="0"
            step="1"
            required
            tabindex="2"
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="exp-category">分類</label>
          <select id="exp-category" v-model="form.category" class="form-select" tabindex="3">
            <option v-for="(meta, key) in CATEGORY_META" :key="key" :value="key">
              {{ meta.emoji }} {{ meta.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="exp-date">日期 *</label>
          <input
            id="exp-date"
            v-model="form.date"
            type="date"
            class="form-input"
            required
            tabindex="4"
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="exp-time">時間</label>
          <input
            id="exp-time"
            v-model="form.time"
            type="time"
            class="form-input"
            tabindex="5"
          />
        </div>
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
        <label class="form-label" for="exp-note">備註</label>
        <textarea
          id="exp-note"
          v-model="form.note"
          class="form-textarea"
          placeholder="可以記錄更多細節..."
          rows="2"
          tabindex="6"
        />
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-ghost" tabindex="8" @click="show = false">取消</button>
        <button type="submit" class="btn btn-primary" :disabled="saving" tabindex="7">
          <span v-if="saving">儲存中...</span>
          <span v-else>{{ editing ? '更新' : '新增' }}</span>
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { CATEGORY_META, PAYMENT_META } from '@/types'
import type { Expense, ExpenseCategory, PaymentMethod } from '@/types'
import { useExpenseStore } from '@/stores/expense'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  modelValue: boolean
  expense?: Expense | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const store = useExpenseStore()
const { show: showToast } = useToast()
const saving = ref(false)

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const editing = computed(() => !!props.expense)

const defaultForm = () => ({
  title: '',
  amount: 0,
  category: 'food' as ExpenseCategory,
  paymentMethod: 'cash' as PaymentMethod,
  date: new Date().toISOString().slice(0, 10),
  time: new Date().toTimeString().slice(0, 5),
  note: '',
})

const form = ref(defaultForm())

watch(() => props.expense, (exp) => {
  if (exp) {
    form.value = {
      title: exp.title,
      amount: exp.amount,
      category: exp.category,
      paymentMethod: exp.paymentMethod ?? 'cash',
      date: exp.date,
      time: exp.time,
      note: exp.note,
    }
  } else {
    form.value = defaultForm()
  }
}, { immediate: true })

async function submit() {
  if (!form.value.title || form.value.amount <= 0) return
  saving.value = true
  try {
    if (editing.value && props.expense) {
      await store.editExpense(props.expense.id, form.value)
      showToast('記帳已更新 ✓')
    } else {
      await store.addExpense(form.value)
      showToast('新增成功 ✓')
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

.pay-btn:hover {
  border-color: var(--mint);
  background: var(--mint-pale);
}

.pay-btn.active {
  border-color: var(--mint);
  background: var(--mint-pale);
  box-shadow: 0 0 0 2px rgba(92,200,190,0.2);
}

.pay-emoji { font-size: 1.2rem; }

.pay-label {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-light);
  white-space: nowrap;
}

.pay-btn.active .pay-label { color: var(--mint-dark); font-weight: 600; }
</style>
