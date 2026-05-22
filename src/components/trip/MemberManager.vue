<template>
  <div class="member-manager">
    <div class="member-list">
      <div v-if="!members.length" class="empty-state" style="padding: 24px">
        <span class="emoji">👥</span>
        <p>尚未加入成員</p>
      </div>
      <TransitionGroup name="list" tag="div" class="member-items">
        <div v-for="m in members" :key="m.id" class="member-row">
          <span class="avatar avatar-sm" :style="{ background: m.color }">{{ m.name[0] }}</span>
          <span class="member-name">{{ m.name }}</span>
          <button class="btn btn-ghost btn-sm btn-icon text-danger" @click="removeMember(m.id)" :aria-label="`移除 ${m.name}`">
            <X :size="14" />
          </button>
        </div>
      </TransitionGroup>
    </div>

    <div v-if="!showInput" class="add-trigger">
      <button class="btn btn-secondary btn-sm" @click="showInput = true" tabindex="0">
        <UserPlus :size="14" />
        加入成員
      </button>
    </div>

    <form v-else class="add-form" @submit.prevent="addMember">
      <input
        v-model="newName"
        class="form-input"
        placeholder="成員姓名"
        required
        autofocus
        tabindex="1"
        @keydown.escape="showInput = false"
      />
      <button type="submit" class="btn btn-primary btn-sm" :disabled="!newName.trim()" tabindex="2">新增</button>
      <button type="button" class="btn btn-ghost btn-sm" tabindex="3" @click="showInput = false">取消</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { UserPlus, X } from 'lucide-vue-next'
import { useTripStore } from '@/stores/trip'
import { useToast } from '@/composables/useToast'
import type { TripMember } from '@/types'

const props = defineProps<{ tripId: number; members: TripMember[] }>()

const store = useTripStore()
const { show: showToast } = useToast()
const showInput = ref(false)
const newName = ref('')

const AVATAR_COLORS = [
  '#5CC8BE', '#F07B6D', '#8FC9A9', '#CE93D8',
  '#FFB74D', '#64B5F6', '#F06292', '#90A4AE',
]

function pickColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

async function addMember() {
  const name = newName.value.trim()
  if (!name) return
  try {
    await store.addMember({
      tripId: props.tripId,
      name,
      color: pickColor(props.members.length),
    })
    newName.value = ''
    showInput.value = false
    showToast(`已加入 ${name} ✓`)
  } catch {
    showToast('新增失敗', 'error')
  }
}

async function removeMember(id: number) {
  try {
    await store.removeMember(id)
    showToast('已移除成員')
  } catch {
    showToast('移除失敗', 'error')
  }
}
</script>

<style scoped>
.member-manager { display: flex; flex-direction: column; gap: 12px; }
.member-items { display: flex; flex-direction: column; gap: 6px; }

.member-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: var(--radius);
  transition: background var(--transition);
}
.member-row:hover { background: var(--bg); }

.member-name {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 500;
}

.add-form {
  display: flex;
  gap: 8px;
  align-items: center;
}
.add-form .form-input { flex: 1; }

.text-danger { color: var(--coral) !important; }
</style>
