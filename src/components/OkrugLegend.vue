<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { OKRUG_COLORS, OKRUG_NAMES } from '@/domain/okrugs'
import { OKRUG_ORDER } from '@/domain/types'
import { useCoordinatesStore } from '@/stores/coordinates'

const store = useCoordinatesStore()
const { distribution } = storeToRefs(store)
</script>

<template>
  <ul class="legend">
    <li v-for="okrug in OKRUG_ORDER" :key="okrug">
      <!--
        The legend is the same control as the pie, not a second feature: ЦАО is
        ~2% of the circle and awkward to hit, and colour alone shouldn't have to
        carry which sector is which.
      -->
      <button
        type="button"
        class="row"
        :class="{ 'is-hidden': store.isHidden(okrug) }"
        :aria-pressed="!store.isHidden(okrug)"
        :title="OKRUG_NAMES[okrug]"
        @click="store.toggleOkrug(okrug)"
      >
        <span class="chip" :style="{ backgroundColor: OKRUG_COLORS[okrug] }" />
        <span class="code">{{ okrug }}</span>
        <span class="count">{{ distribution[okrug] }}</span>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.legend {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2px 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 4px 6px;
  border: 0;
  border-radius: 4px;
  background: none;
  cursor: pointer;
  font: inherit;
  color: var(--text-primary);
  text-align: left;
}

.row:hover {
  background: var(--surface-2);
}

.chip {
  width: 10px;
  height: 10px;
  flex: none;
  border-radius: 2px;
}

.code {
  flex: 1;
  font-size: 13px;
}

.count {
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
}

/* Hidden reads as switched off, not as absent: the count stays legible. */
.is-hidden .chip {
  opacity: 0.25;
}

.is-hidden .code,
.is-hidden .count {
  color: var(--text-muted);
  text-decoration: line-through;
}
</style>
