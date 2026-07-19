import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'
import {
  Map,
  type ExpressionSpecification,
  type GeoJSONSource,
  type StyleSpecification,
} from 'maplibre-gl'
import { storeToRefs } from 'pinia'
import { MOSCOW_BBOX, OKRUG_COLORS, OKRUGS_GEOJSON } from '@/domain/okrugs'
import { OKRUG_ORDER, type MoscowPoint } from '@/domain/types'
import { useCoordinatesStore } from '@/stores/coordinates'

const POINTS_SOURCE = 'points'
const OKRUGS_SOURCE = 'okrugs'

/** OSM raster tiles: no API key, and attribution is required by their policy. */
const STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
}

/** ['match', ['get','ref'], 'ЦАО', '#a48200', …, fallback] */
function colorByOkrug(property: string): ExpressionSpecification {
  return [
    'match',
    ['get', property],
    ...OKRUG_ORDER.flatMap((code) => [code, OKRUG_COLORS[code]] as [string, string]),
    '#888888',
  ] as unknown as ExpressionSpecification
}

const toFeatureCollection = (points: readonly MoscowPoint[]) => ({
  type: 'FeatureCollection' as const,
  features: points.map((point) => ({
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: [point.lng, point.lat] },
    properties: { okrug: point.okrug },
  })),
})

export function useMoscowMap(container: Ref<HTMLElement | null>) {
  const store = useCoordinatesStore()
  const { points, hiddenOkrugs } = storeToRefs(store)

  // Deliberately a plain binding, not a ref: a reactive proxy around the map
  // would wrap its whole internal object graph and break it.
  let map: Map | null = null

  onMounted(() => {
    if (!container.value) return

    map = new Map({
      container: container.value,
      style: STYLE,
      bounds: [
        [MOSCOW_BBOX[0], MOSCOW_BBOX[1]],
        [MOSCOW_BBOX[2], MOSCOW_BBOX[3]],
      ],
      fitBoundsOptions: { padding: 24 },
      attributionControl: { compact: true },
    })

    map.on('load', () => {
      if (!map) return

      map.addSource(OKRUGS_SOURCE, { type: 'geojson', data: OKRUGS_GEOJSON })
      map.addSource(POINTS_SOURCE, { type: 'geojson', data: toFeatureCollection(points.value) })

      map.addLayer({
        id: 'okrug-fill',
        type: 'fill',
        source: OKRUGS_SOURCE,
        paint: { 'fill-color': colorByOkrug('ref'), 'fill-opacity': 0.12 },
      })
      map.addLayer({
        id: 'okrug-outline',
        type: 'line',
        source: OKRUGS_SOURCE,
        paint: { 'line-color': colorByOkrug('ref'), 'line-width': 1.5, 'line-opacity': 0.9 },
      })
      map.addLayer({
        id: 'point-circles',
        type: 'circle',
        source: POINTS_SOURCE,
        paint: {
          'circle-radius': 5,
          'circle-color': colorByOkrug('okrug'),
          // A ring in the surface colour keeps overlapping points readable.
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
        },
      })

      applyFilter()
    })
  })

  /** One GPU-side filter beats re-uploading the data on every toggle. */
  function applyFilter() {
    if (!map?.getLayer('point-circles')) return
    const hidden = [...hiddenOkrugs.value]
    map.setFilter(
      'point-circles',
      hidden.length === 0
        ? null
        : ([
            '!',
            ['in', ['get', 'okrug'], ['literal', hidden]],
          ] as unknown as ExpressionSpecification),
    )
  }

  watch(points, (next) => {
    map?.getSource<GeoJSONSource>(POINTS_SOURCE)?.setData(toFeatureCollection(next))
  })

  watch(hiddenOkrugs, applyFilter)

  onBeforeUnmount(() => {
    map?.remove()
    map = null
  })
}
