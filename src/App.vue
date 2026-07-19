<script setup lang="ts">
import { storeToRefs } from 'pinia'
import MoscowMap from '@/components/MoscowMap.vue'
import OkrugPieChart from '@/components/OkrugPieChart.vue'
import OkrugLegend from '@/components/OkrugLegend.vue'
import { POINT_COUNT, useCoordinatesStore } from '@/stores/coordinates'

const store = useCoordinatesStore()
const { visibleCount } = storeToRefs(store)
</script>

<template>
  <div class="app">
    <header class="header">
      <div class="brand">
        <!-- The same 12-sector ring as the favicon: one arc per okrug, in OKRUG_ORDER. -->
        <svg
          class="mark"
          viewBox="0 0 32 32"
          fill="none"
          stroke-width="6"
          aria-hidden="true"
        >
          <path d="M16.576 5.015A11 11 0 0 1 20.994 6.199" stroke="#a48200" />
          <path d="M21.991 6.775A11 11 0 0 1 25.225 10.009" stroke="#9b61ea" />
          <path d="M25.801 11.006A11 11 0 0 1 26.985 15.424" stroke="#de4181" />
          <path d="M26.985 16.576A11 11 0 0 1 25.801 20.994" stroke="#008fd2" />
          <path d="M25.225 21.991A11 11 0 0 1 21.991 25.225" stroke="#e54533" />
          <path d="M20.994 25.801A11 11 0 0 1 16.576 26.985" stroke="#0097aa" />
          <path d="M15.424 26.985A11 11 0 0 1 11.006 25.801" stroke="#7b9200" />
          <path d="M10.009 25.225A11 11 0 0 1 6.775 21.991" stroke="#c54ebe" />
          <path d="M6.199 20.994A11 11 0 0 1 5.015 16.576" stroke="#00a149" />
          <path d="M5.015 15.424A11 11 0 0 1 6.199 11.006" stroke="#5978fd" />
          <path d="M6.775 10.009A11 11 0 0 1 10.009 6.775" stroke="#c46d00" />
          <path d="M11.006 6.199A11 11 0 0 1 15.424 5.015" stroke="#009c89" />
        </svg>
        <h1>Случайные координаты Москвы</h1>
      </div>
      <p class="count">
        Показано <strong>{{ visibleCount }}</strong> из {{ POINT_COUNT }}
      </p>
    </header>

    <main class="body">
      <section class="map-panel">
        <MoscowMap />
      </section>

      <aside class="sidebar">
        <button type="button" class="regenerate" @click="store.regenerate()">
          Перегенерировать
        </button>

        <section class="panel">
          <h2>Распределение по округам</h2>
          <p class="hint">Клик по сектору или строке скрывает округ на карте</p>
          <OkrugPieChart />
          <OkrugLegend />
        </section>
      </aside>
    </main>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-1);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.mark {
  width: 20px;
  height: 20px;
  flex: none;
}

h1 {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.count {
  margin: 0;
  flex: none;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--surface-2);
  font-size: 13px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.count strong {
  color: var(--text-primary);
  font-weight: 650;
}

.body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.map-panel {
  flex: 1;
  min-width: 0;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 380px;
  flex: none;
  padding: 14px;
  border-left: 1px solid var(--border);
  background: var(--page);
  overflow-y: auto;
}

.regenerate {
  padding: 10px 16px;
  border: 0;
  border-radius: 8px;
  background: var(--ink);
  color: var(--surface-1);
  font: inherit;
  font-weight: 550;
  cursor: pointer;
  transition: background-color 120ms ease;
}

.regenerate:hover {
  background: #3c3a32;
}

.regenerate:active {
  background: #14130f;
}

.panel {
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface-1);
  box-shadow: var(--shadow-card);
}

.panel h2 {
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.hint {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--text-muted);
}

/* Below the sidebar's own width the split stops making sense — stack instead. */
@media (max-width: 760px) {
  .body {
    flex-direction: column;
  }

  .map-panel {
    min-height: 320px;
  }

  .sidebar {
    width: 100%;
    border-left: 0;
    border-top: 1px solid var(--border);
  }
}
</style>
