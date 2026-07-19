import { randomInBBox } from './geo'
import { findOkrug, MOSCOW_BBOX } from './okrugs'
import { OKRUG_ORDER, type Distribution, type MoscowPoint } from './types'

/**
 * Moscow fills only ~36% of its bounding box, so roughly three draws land per
 * point kept. The cap exists so broken geometry fails fast instead of hanging
 * the page; it is far above the ~3n draws this needs in practice.
 */
const MAX_ATTEMPTS_PER_POINT = 200

/**
 * Rejection sampling: draw uniformly over Moscow's bounding box, keep the draws
 * that land inside some okrug. Uniform over the box stays uniform over the city,
 * because rejection does not distort the surviving points.
 */
export function generateMoscowPoints(count: number): MoscowPoint[] {
  const points: MoscowPoint[] = []
  let attemptsLeft = count * MAX_ATTEMPTS_PER_POINT

  while (points.length < count) {
    if (attemptsLeft-- <= 0) {
      throw new Error(
        `Generated only ${points.length} of ${count} points before running out of attempts — check the okrug geometry`,
      )
    }

    const [lng, lat] = randomInBBox(MOSCOW_BBOX)
    const okrug = findOkrug(lng, lat)
    if (!okrug) continue

    points.push({ id: points.length, lng, lat, okrug })
  }

  return points
}

/** Counts every okrug, including the ones that got nothing. */
export function distributionOf(points: readonly MoscowPoint[]): Distribution {
  const distribution = Object.fromEntries(OKRUG_ORDER.map((code) => [code, 0])) as Distribution
  for (const point of points) distribution[point.okrug]++
  return distribution
}
