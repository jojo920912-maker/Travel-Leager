<template>
  <div class="split-summary">
    <div class="balance-grid">
      <div
        v-for="b in balances"
        :key="b.memberId"
        class="balance-card stat-card"
        :class="b.balance > 0 ? 'positive' : b.balance < 0 ? 'negative' : 'neutral'"
      >
        <div class="balance-header">
          <span class="avatar avatar-sm" :style="{ background: b.memberColor }">{{ b.memberName[0] }}</span>
          <span class="balance-name">{{ b.memberName }}</span>
          <span class="balance-tag" :class="b.balance > 0 ? 'tag-credit' : b.balance < 0 ? 'tag-debt' : 'tag-even'">
            {{ b.balance > 0 ? '收款' : b.balance < 0 ? '付款' : '持平' }}
          </span>
        </div>
        <div class="balance-details">
          <div class="balance-row">
            <span>已付</span>
            <span class="amount">{{ symbol }}{{ b.paid.toFixed(0) }}</span>
          </div>
          <div class="balance-row">
            <span>應分攤</span>
            <span class="amount">{{ symbol }}{{ b.shouldPay.toFixed(0) }}</span>
          </div>
          <div class="balance-divider" />
          <div class="balance-row balance-net">
            <span>{{ b.balance > 0 ? '可收回' : b.balance < 0 ? '需付出' : '剛好' }}</span>
            <span class="amount net-amount" :style="{ color: b.balance > 0 ? '#059669' : b.balance < 0 ? '#DC2626' : 'var(--text-light)' }">
              {{ symbol }}{{ Math.abs(b.balance).toFixed(0) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <template v-if="settlements.length">
      <h4 class="section-title">
        <ArrowLeftRight :size="16" />
        建議還款方式
      </h4>
      <div class="settlements">
        <div v-for="(s, i) in settlements" :key="i" class="settlement-row">
          <div class="settlement-party">
            <span class="avatar avatar-sm" :style="{ background: s.fromColor }">{{ s.fromName[0] }}</span>
            <span class="party-name">{{ s.fromName }}</span>
          </div>
          <div class="settlement-arrow">
            <ArrowRight :size="14" />
            <span class="settlement-amount amount">{{ symbol }}{{ s.amount.toFixed(0) }}</span>
          </div>
          <div class="settlement-party">
            <span class="avatar avatar-sm" :style="{ background: s.toColor }">{{ s.toName[0] }}</span>
            <span class="party-name">{{ s.toName }}</span>
          </div>
        </div>
      </div>
    </template>

    <div v-else-if="balances.length > 0" class="all-even">
      <span>🎉</span>
      <span>帳款已平衡，大家各付各的！</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeftRight, ArrowRight } from 'lucide-vue-next'
import { CURRENCIES } from '@/types'
import type { Balance, Settlement } from '@/types'

const props = defineProps<{
  balances: Balance[]
  settlements: Settlement[]
  currency: string
}>()

const symbol = computed(
  () => CURRENCIES.find((c) => c.code === props.currency)?.symbol ?? props.currency
)
</script>

<style scoped>
.split-summary { display: flex; flex-direction: column; gap: 20px; }

.balance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.balance-card { border-radius: var(--radius-lg); padding: 16px; }
.balance-card.positive { border-color: #A7F3D0; }
.balance-card.negative { border-color: #FECACA; }
.balance-card.neutral  { border-color: var(--border-light); }

.balance-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.balance-name { flex: 1; font-weight: 600; font-size: 0.9rem; }

.balance-tag {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}
.tag-credit { background: #ECFDF5; color: #059669; }
.tag-debt   { background: #FEF2F2; color: #DC2626; }
.tag-even   { background: var(--border-light); color: var(--text-light); }

.balance-details { display: flex; flex-direction: column; gap: 6px; }

.balance-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.83rem;
  color: var(--text-light);
}

.balance-divider { height: 1px; background: var(--border-light); margin: 4px 0; }

.balance-net { font-weight: 600; }

.net-amount { font-size: 1rem; }

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
}

.settlements { display: flex; flex-direction: column; gap: 10px; }

.settlement-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg);
  padding: 12px 16px;
  border-radius: var(--radius);
  font-size: 0.85rem;
}

.settlement-party { display: flex; align-items: center; gap: 8px; flex: 1; }
.settlement-party:last-child { justify-content: flex-end; }
.party-name { font-weight: 500; }

.settlement-arrow {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  color: var(--coral);
  flex-shrink: 0;
}

.settlement-amount { font-size: 0.85rem; font-weight: 700; color: var(--coral); }

.all-even {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: #ECFDF5;
  border-radius: var(--radius-lg);
  color: #059669;
  font-weight: 500;
  font-size: 0.9rem;
}
</style>
