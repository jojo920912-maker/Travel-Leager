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
import { CATEGORY_META } from '@/types'
import type { Expense, ExpenseCategory } from '@/types'
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
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}
</style>
