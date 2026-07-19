import rawGeoJson from '@/assets/moscow-okrugs.geojson?raw'
import { bboxContains, bboxOfMultiPolygon, mergeBBoxes, pointInMultiPolygon } from './geo'
import { OKRUG_ORDER, type BBox, type MultiPolygonCoords, type OkrugCode } from './types'

/**
 * Loaded as raw text and parsed at runtime rather than imported as a module:
 * a direct JSON import would make TypeScript infer a literal type for all ~3800
 * coordinates, which costs seconds on every type-check and buys nothing.
 */
export interface OkrugFeature {
  type: 'Feature'
  properties: { ref: OkrugCode; name: string }
  geometry:
    | { type: 'Polygon'; coordinates: MultiPolygonCoords[number] }
    | { type: 'MultiPolygon'; coordinates: MultiPolygonCoords }
}

export interface OkrugFeatureCollection {
  type: 'FeatureCollection'
  features: OkrugFeature[]
}

interface Okrug {
  code: OkrugCode
  name: string
  polygons: MultiPolygonCoords
  bbox: BBox
}

/** The boundaries as-is, for drawing. The same parse feeds findOkrug below. */
export const OKRUGS_GEOJSON = JSON.parse(rawGeoJson) as OkrugFeatureCollection

const features = OKRUGS_GEOJSON.features

const byCode = new Map<OkrugCode, Okrug>(
  features.map((feature) => {
    const polygons: MultiPolygonCoords =
      feature.geometry.type === 'Polygon'
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates

    return [
      feature.properties.ref,
      {
        code: feature.properties.ref,
        name: feature.properties.name,
        polygons,
        bbox: bboxOfMultiPolygon(polygons),
      },
    ]
  }),
)

/** Fails loudly at startup if the GeoJSON and OKRUG_ORDER ever drift apart. */
export const OKRUGS: Okrug[] = OKRUG_ORDER.map((code) => {
  const okrug = byCode.get(code)
  if (!okrug) throw new Error(`moscow-okrugs.geojson is missing the "${code}" feature`)
  return okrug
})

export const MOSCOW_BBOX: BBox = mergeBBoxes(OKRUGS.map((okrug) => okrug.bbox))

export const OKRUG_NAMES = Object.fromEntries(
  OKRUGS.map((okrug) => [okrug.code, okrug.name]),
) as Record<OkrugCode, string>

/**
 * Twelve hues spaced evenly around the OKLCH hue circle at equal lightness, then
 * ORDERED so that neighbouring pie sectors sit as far apart as possible.
 *
 * The order is the safety mechanism, not decoration: the same hues in hue-order
 * separate adjacent sectors by ΔE 5.9 under simulated deuteranopia, while this
 * order reaches 12.5 (target 8) and 17.0 under normal vision (floor 15). Derived
 * by search and checked with the dataviz skill's validator; re-run it before
 * changing a value or resorting the sectors.
 */
export const OKRUG_COLORS: Record<OkrugCode, string> = {
  ЦАО: '#a48200',
  САО: '#9b61ea',
  СВАО: '#de4181',
  ВАО: '#008fd2',
  ЮВАО: '#e54533',
  ЮАО: '#0097aa',
  ЮЗАО: '#7b9200',
  ЗАО: '#c54ebe',
  СЗАО: '#00a149',
  ЗелАО: '#5978fd',
  НАО: '#c46d00',
  ТАО: '#009c89',
}

/**
 * The okrug containing the point, or null if it falls outside Moscow.
 *
 * Doubles as the "is this in Moscow?" test the generator needs, so a point is
 * only ever located once.
 */
export function findOkrug(lng: number, lat: number): OkrugCode | null {
  for (const okrug of OKRUGS) {
    // Rejects most okrugs in four comparisons before touching their rings.
    if (!bboxContains(okrug.bbox, lng, lat)) continue
    if (pointInMultiPolygon(lng, lat, okrug.polygons)) return okrug.code
  }
  return null
}
