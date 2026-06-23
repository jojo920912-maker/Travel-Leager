<template>
  <BaseModal v-model="show" :title="editing ? '編輯旅程' : '新增旅程'">
    <form class="form-stack" @submit.prevent="submit">
      <div class="form-group">
        <label class="form-label" for="trip-name">旅程名稱 *</label>
        <input
          id="trip-name"
          v-model="form.name"
          class="form-input"
          placeholder="例：日本關西自由行"
          required
          autofocus
          tabindex="1"
        />
      </div>

      <div class="form-group">
        <label class="form-label" for="trip-desc">描述</label>
        <textarea
          id="trip-desc"
          v-model="form.description"
          class="form-textarea"
          placeholder="旅程簡介..."
          rows="2"
          tabindex="2"
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="trip-start">出發日 *</label>
          <input
            id="trip-start"
            v-model="form.startDate"
            type="date"
            class="form-input"
            required
            tabindex="3"
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="trip-end">返回日</label>
          <input
            id="trip-end"
            v-model="form.endDate"
            type="date"
            class="form-input"
            :min="form.startDate"
            tabindex="4"
          />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="trip-currency">貨幣</label>
        <select id="trip-currency" v-model="form.currency" class="form-select" tabindex="5">
          <option v-for="c in CURRENCIES" :key="c.code" :value="c.code">
            {{ c.symbol }} {{ c.label }} ({{ c.code }})
          </option>
        </select>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-ghost" tabindex="7" @click="show = false">取消</button>
        <button type="submit" class="btn btn-primary" :disabled="saving" tabindex="6">
          <span v-if="saving">儲存中...</span>
          <span v-else>{{ editing ? '更新' : '新增旅程' }}</span>
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { CURRENCIES } from '@/types'
import type { Trip } from '@/types'
import { useTripStore } from '@/stores/trip'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  modelValue: boolean
  trip?: Trip | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [trip: Trip]
}>()

const store = useTripStore()
const authStore = useAuthStore()
const { show: showToast } = useToast()
const saving = ref(false)

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
const editing = computed(() => !!props.trip)

const defaultForm = () => ({
  name: '',
  description: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  currency: 'TWD',
})

const form = ref(defaultForm())

watch(() => props.trip, (t) => {
  form.value = t
    ? { name: t.name, description: t.description, startDate: t.startDate, endDate: t.endDate, currency: t.currency }
    : defaultForm()
}, { immediate: true })

async function submit() {
  if (!form.value.name) return
  saving.value = true
  try {
    let saved: Trip
    if (editing.value && props.trip) {
      saved = await store.editTrip(props.trip.id, form.value)
      showToast('旅程已更新 ✓')
    } else {
      saved = await store.addTrip(form.value)
      // 自動將當前使用者加入成員
      const userName = authStore.currentUser?.displayName ?? authStore.currentUser?.username ?? '我'
      await store.addMember({ tripId: saved.id, name: userName, color: '#5CC8BE' })
      showToast('旅程已新增 ✓')
    }
    show.value = false
    emit('saved', saved)
  } catch (e) {
    const msg = e instanceof Error ? e.message : '操作失敗，請重試'
    console.error('[TripForm]', e)
    showToast(msg, 'error')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.form-stack { display: flex; flex-direction: column; gap: 16px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 4px; }

@media (max-width: 480px) {
  .form-row { grid-template-columns: 1fr; }
}
</style>
