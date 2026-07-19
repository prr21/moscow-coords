/** [lng, lat] — GeoJSON axis order. */
export type Position = [number, number]

/** A linear ring: first and last positions coincide. */
export type Ring = Position[]

/** [outerRing, ...holes] */
export type PolygonCoords = Ring[]

export type MultiPolygonCoords = PolygonCoords[]

/** [minLng, minLat, maxLng, maxLat] */
export type BBox = [number, number, number, number]

/**
 * The twelve administrative okrugs of Moscow, in the canonical order used by the
 * city: centre first, then clockwise from north, then Zelenograd and the two
 * Novaya Moskva okrugs annexed in 2012.
 *
 * The order is load-bearing: it fixes which colour each okrug gets, and the
 * palette is only validated for *this* sequence of neighbours (see OKRUG_COLORS).
 */
export const OKRUG_ORDER = [
  'ЦАО',
  'САО',
  'СВАО',
  'ВАО',
  'ЮВАО',
  'ЮАО',
  'ЮЗАО',
  'ЗАО',
  'СЗАО',
  'ЗелАО',
  'НАО',
  'ТАО',
] as const

export type OkrugCode = (typeof OKRUG_ORDER)[number]

export interface MoscowPoint {
  id: number
  lng: number
  lat: number
  okrug: OkrugCode
}

/** Count of generated points per okrug. Every okrug is present, possibly at 0. */
export type Distribution = Record<OkrugCode, number>
