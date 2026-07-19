<script setup lang="ts">
import { ref } from 'vue'
import { useMoscowMap } from '@/composables/useMoscowMap'

const container = ref<HTMLElement | null>(null)
useMoscowMap(container)
</script>

<template>
  <div ref="container" class="map" />
</template>

<style scoped>
.map {
  width: 100%;
  height: 100%;
}
</style>
