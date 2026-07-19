import type { BBox, MultiPolygonCoords, PolygonCoords, Position, Ring } from './types'

/**
 * Ray casting: count crossings of a ray cast east from the point.
 * An odd number of crossings means the point is inside the ring.
 */
export function pointInRing(lng: number, lat: number, ring: Ring): boolean {
  const last = ring[ring.length - 1]
  if (!last) return false

  let inside = false
  let [xj, yj] = last

  for (const [xi, yi] of ring) {
    // Does the edge straddle the point's latitude, and is the crossing east of it?
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
    xj = xi
    yj = yi
  }

  return inside
}

/**
 * Even-odd across every ring of the polygon. Holes need no special casing: a
 * point inside a hole is inside two rings, which flips it back to outside.
 */
export function pointInPolygon(lng: number, lat: number, polygon: PolygonCoords): boolean {
  let inside = false
  for (const ring of polygon) {
    if (pointInRing(lng, lat, ring)) inside = !inside
  }
  return inside
}

export function pointInMultiPolygon(
  lng: number,
  lat: number,
  multiPolygon: MultiPolygonCoords,
): boolean {
  return multiPolygon.some((polygon) => pointInPolygon(lng, lat, polygon))
}

export function bboxOfMultiPolygon(multiPolygon: MultiPolygonCoords): BBox {
  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity

  for (const polygon of multiPolygon) {
    for (const ring of polygon) {
      for (const [lng, lat] of ring) {
        if (lng < minLng) minLng = lng
        if (lng > maxLng) maxLng = lng
        if (lat < minLat) minLat = lat
        if (lat > maxLat) maxLat = lat
      }
    }
  }

  return [minLng, minLat, maxLng, maxLat]
}

export function mergeBBoxes(boxes: BBox[]): BBox {
  return boxes.reduce<BBox>(
    ([aMinLng, aMinLat, aMaxLng, aMaxLat], [bMinLng, bMinLat, bMaxLng, bMaxLat]) => [
      Math.min(aMinLng, bMinLng),
      Math.min(aMinLat, bMinLat),
      Math.max(aMaxLng, bMaxLng),
      Math.max(aMaxLat, bMaxLat),
    ],
    [Infinity, Infinity, -Infinity, -Infinity],
  )
}

export function bboxContains([minLng, minLat, maxLng, maxLat]: BBox, lng: number, lat: number) {
  return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat
}

const toRad = (deg: number) => (deg * Math.PI) / 180
const toDeg = (rad: number) => (rad * 180) / Math.PI

/**
 * Uniform over the bbox's *area*, not over its degrees.
 *
 * Meridians converge toward the pole, so a degree of longitude covers less
 * ground the further north you go. Drawing latitude uniformly would crowd points
 * toward the north — across Moscow's span that is a ~2% bias. Drawing sin(lat)
 * uniformly instead weights each latitude by the ground it actually covers.
 */
export function randomInBBox([minLng, minLat, maxLng, maxLat]: BBox): Position {
  const sinMin = Math.sin(toRad(minLat))
  const sinMax = Math.sin(toRad(maxLat))

  return [
    minLng + Math.random() * (maxLng - minLng),
    toDeg(Math.asin(sinMin + Math.random() * (sinMax - sinMin))),
  ]
}
