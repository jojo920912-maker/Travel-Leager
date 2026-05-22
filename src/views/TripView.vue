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

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import TripCard from '@/components/trip/TripCard.vue'
import TripForm from '@/components/trip/TripForm.vue'
import { useTripStore } from '@/stores/trip'
import type { Trip } from '@/types'
import { useToast } from '@/composables/useToast'
import { useKeyboard } from '@/composables/useKeyboard'

const store = useTripStore()
const router = useRouter()
const { show: showToast } = useToast()

const showForm = ref(false)
const editTarget = ref<Trip | null>(null)

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

onMounted(() => store.fetchTrips())
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}
.sub { color: var(--text-light); font-size: 0.875rem; margin-top: 4px; }

.trips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.loading { color: var(--text-light); padding: 40px; text-align: center; }

@media (max-width: 768px) {
  .trips-grid { grid-template-columns: 1fr; }
  .btn-label { display: none; }
}
</style>
