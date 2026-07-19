import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'
import * as am5 from '@amcharts/amcharts5'
import * as am5percent from '@amcharts/amcharts5/percent'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import { storeToRefs } from 'pinia'
import { OKRUG_COLORS, OKRUG_NAMES } from '@/domain/okrugs'
import { OKRUG_ORDER, type OkrugCode } from '@/domain/types'
import { POINT_COUNT, useCoordinatesStore } from '@/stores/coordinates'

interface PieDatum {
  okrug: OkrugCode
  name: string
  count: number
}

/** Matches --surface-1: the slice separator should read as the panel showing through. */
const SURFACE = 0xfcfcfb
const HIDDEN_FILL_OPACITY = 0.15

export function useOkrugPieChart(container: Ref<HTMLElement | null>) {
  const store = useCoordinatesStore()
  const { distribution, hiddenOkrugs } = storeToRefs(store)

  // Plain bindings, never refs: amCharts objects are a large mutable graph, and
  // wrapping them in Vue's reactive proxies breaks them and costs dearly.
  let root: am5.Root | null = null
  let series: am5percent.PieSeries | null = null

  const buildData = (): PieDatum[] =>
    OKRUG_ORDER.map((okrug) => ({
      okrug,
      name: OKRUG_NAMES[okrug],
      count: distribution.value[okrug],
    }))

  /** Hidden okrugs fade but keep their size — the pie reports what was generated. */
  function applyHidden() {
    series?.dataItems.forEach((item) => {
      const okrug = (item.dataContext as PieDatum).okrug
      const hidden = store.isHidden(okrug)
      const slice = item.get('slice')
      if (!slice) return

      slice.animate({ key: 'fillOpacity', to: hidden ? HIDDEN_FILL_OPACITY : 1, duration: 200 })
      // Swap the 2px separator for the okrug's own colour, so a faded sector
      // still says which one it is.
      slice.set('stroke', am5.color(hidden ? OKRUG_COLORS[okrug] : SURFACE))
    })
  }

  onMounted(() => {
    if (!container.value) return

    root = am5.Root.new(container.value)
    root.setThemes([am5themes_Animated.new(root)])
    // The amCharts branding link stays: the free tier is a linkware licence and
    // hiding the logo would breach it.

    const chart = root.container.children.push(
      am5percent.PieChart.new(root, { layout: root.verticalLayout }),
    )

    series = chart.series.push(
      am5percent.PieSeries.new(root, {
        categoryField: 'okrug',
        valueField: 'count',
        // Data order is OKRUG_ORDER, and the palette is only validated for that
        // sequence of neighbours — never sort the slices by value.
        legendLabelText: '{name}',
      }),
    )

    series.set(
      'colors',
      am5.ColorSet.new(root, {
        colors: OKRUG_ORDER.map((okrug) => am5.color(OKRUG_COLORS[okrug])),
      }),
    )

    // Okrug names run to ~38 characters ("Северо-Западный административный
    // округ"), which on one line is wider than the sidebar and gets clipped at
    // the chart's edge. Break the name off from the numbers and let it wrap.
    const tooltip = am5.Tooltip.new(root, {
      labelText: `[bold]{name}[/]\n{count} из ${POINT_COUNT} ({valuePercentTotal.formatNumber("0.0")}%)`,
    })
    tooltip.label.setAll({
      oversizedBehavior: 'wrap',
      maxWidth: 220,
      // The chart is canvas, so the page font has to be handed over explicitly.
      fontFamily: 'Golos Text Variable, system-ui, sans-serif',
      fontSize: 13,
    })

    series.slices.template.setAll({
      // The default click behaviour pulls a slice out of the pie, which fights
      // the fade that signals "hidden".
      toggleKey: 'none',
      strokeWidth: 2,
      stroke: am5.color(SURFACE),
      cursorOverStyle: 'pointer',
      tooltip,
    })

    // Twelve sectors can't carry readable labels — ЦАО is ~2% of the circle.
    // The legend beside the chart names them instead.
    series.labels.template.set('forceHidden', true)
    series.ticks.template.set('forceHidden', true)

    series.slices.template.events.on('click', (event) => {
      const datum = event.target.dataItem?.dataContext as PieDatum | undefined
      if (datum) store.toggleOkrug(datum.okrug)
    })

    series.data.setAll(buildData())
    applyHidden()
  })

  watch(distribution, () => {
    // setAll rebuilds the data items, so the fade has to be re-applied.
    series?.data.setAll(buildData())
    applyHidden()
  })

  watch(hiddenOkrugs, applyHidden)

  onBeforeUnmount(() => {
    root?.dispose()
    root = null
    series = null
  })
}
