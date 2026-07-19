import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { distributionOf, generateMoscowPoints } from '@/domain/generator'
import { OKRUG_ORDER, type MoscowPoint, type OkrugCode } from '@/domain/types'

export const POINT_COUNT = 100

export const useCoordinatesStore = defineStore('coordinates', () => {
  /**
   * The data. shallowRef because points are replaced wholesale and never edited
   * in place — deep reactivity over 100 objects would cost proxies for nothing.
   */
  const points = shallowRef<MoscowPoint[]>(generateMoscowPoints(POINT_COUNT))

  /** The view: which okrugs are hidden from the map. Never touches `points`. */
  const hiddenOkrugs = ref(new Set<OkrugCode>())

  /**
   * Counts every generated point, hidden or not — the pie answers "what was
   * generated", so hiding a sector must not repaint the others. `hiddenOkrugs`
   * is deliberately absent from this computation.
   */
  const distribution = computed(() => distributionOf(points.value))

  /** Derived from the counts, not by re-filtering the points the map already filters. */
  const visibleCount = computed(() =>
    OKRUG_ORDER.reduce(
      (sum, okrug) => (hiddenOkrugs.value.has(okrug) ? sum : sum + distribution.value[okrug]),
      0,
    ),
  )

  const isHidden = (okrug: OkrugCode) => hiddenOkrugs.value.has(okrug)

  function toggleOkrug(okrug: OkrugCode) {
    // Replaced, not mutated: Set mutations don't retrigger computeds reliably.
    const next = new Set(hiddenOkrugs.value)
    if (!next.delete(okrug)) next.add(okrug)
    hiddenOkrugs.value = next
  }

  /** Keeps `hiddenOkrugs`: it is a view setting, not part of the data. */
  function regenerate() {
    points.value = generateMoscowPoints(POINT_COUNT)
  }

  return { points, hiddenOkrugs, distribution, visibleCount, isHidden, toggleOkrug, regenerate }
})
