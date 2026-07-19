<script setup lang="ts">
import { ref } from 'vue'
import { useOkrugPieChart } from '@/composables/useOkrugPieChart'

const container = ref<HTMLElement | null>(null)
useOkrugPieChart(container)
</script>

<template>
  <div ref="container" class="chart" />
</template>

<style scoped>
.chart {
  width: 100%;
  height: 280px;
}
</style>
