<template>
  <div class="screen-page" v-loading="loading">
    <KpiRow :items="kpis" />
    <div class="layout-3col">
      <aside class="col-side">
        <PanelCard title="里程对比 · 横向条形" class="side-panel">
          <EChart :option="hbarOption" />
        </PanelCard>
        <PanelCard title="运量结构 · 漏斗图" class="side-panel">
          <EChart :option="funnelOption" />
        </PanelCard>
      </aside>

      <main class="col-map">
        <PanelCard title="ECharts Map · 南阳市交通客运分布" class="map-panel">
          <GeoMapChart
            :points="mapPoints"
            value-key="passenger_volume"
            mode="lines"
            title="客运量"
            unit="万人"
            :colors="['#0d2748', '#1565c0', '#42a5f5', '#90caf9', '#e3f2fd']"
          />
        </PanelCard>
      </main>

      <aside class="col-side">
        <PanelCard title="运输活跃度 · 仪表盘" class="side-panel">
          <EChart :option="gaugeOption" />
        </PanelCard>
        <PanelCard title="区县客运 · 横向排名" class="side-panel">
          <EChart :option="rankOption" />
        </PanelCard>
      </aside>
    </div>
    <div class="footer-actions">
      <el-button size="mini" type="primary" plain @click="$router.push('/data/traffic')">
        进入交通数据管理
      </el-button>
    </div>
  </div>
</template>

<script>
import PanelCard from '@/components/PanelCard.vue'
import EChart from '@/components/EChart.vue'
import KpiRow from '@/components/KpiRow.vue'
import GeoMapChart from '@/components/GeoMapChart.vue'
import { fetchData } from '@/api/data'
import { withCoords, sumField, axisStyle, chartColors } from '@/utils/nanyang'

export default {
  name: 'TrafficScreen',
  components: { PanelCard, EChart, KpiRow, GeoMapChart },
  data() {
    return { loading: false, rows: [] }
  },
  computed: {
    yearRows() {
      return this.rows.filter((r) => r.year === 2024)
    },
    mapPoints() {
      return withCoords(this.yearRows)
    },
    kpis() {
      const list = this.yearRows
      return [
        { label: '公路总里程', value: sumField(list, 'highway_km').toFixed(1), unit: 'km' },
        { label: '铁路总里程', value: sumField(list, 'railway_km').toFixed(1), unit: 'km' },
        { label: '客运量合计', value: sumField(list, 'passenger_volume'), unit: '万人' },
        { label: '货运量合计', value: sumField(list, 'freight_volume'), unit: '万吨' }
      ]
    },
    hbarOption() {
      const list = [...this.yearRows].sort((a, b) => a.highway_km - b.highway_km)
      return {
        color: chartColors(),
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['公路', '铁路'], textStyle: { color: '#cfe8ff' }, top: 0 },
        grid: { left: 68, right: 16, top: 32, bottom: 12 },
        xAxis: { type: 'value', ...axisStyle() },
        yAxis: {
          type: 'category',
          data: list.map((r) => r.district),
          axisLabel: { color: '#9ec8f0', fontSize: 10 }
        },
        series: [
          {
            name: '公路',
            type: 'bar',
            data: list.map((r) => r.highway_km),
            itemStyle: {
              borderRadius: [0, 4, 4, 0],
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  { offset: 0, color: '#0d4a8a' },
                  { offset: 1, color: '#3aa0ff' }
                ]
              }
            }
          },
          {
            name: '铁路',
            type: 'bar',
            data: list.map((r) => r.railway_km),
            itemStyle: {
              borderRadius: [0, 4, 4, 0],
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  { offset: 0, color: '#0a5a52' },
                  { offset: 1, color: '#00d4c8' }
                ]
              }
            }
          }
        ]
      }
    },
    gaugeOption() {
      const list = this.yearRows
      const score = Math.min(
        100,
        Math.round(
          (sumField(list, 'passenger_volume') / 50 + sumField(list, 'freight_volume') / 120) / 2
        )
      )
      return {
        series: [
          {
            type: 'gauge',
            min: 0,
            max: 100,
            radius: '88%',
            axisLine: {
              lineStyle: {
                width: 12,
                color: [
                  [0.3, '#67c23a'],
                  [0.7, '#3aa0ff'],
                  [1, '#ff6b6b']
                ]
              }
            },
            pointer: { itemStyle: { color: '#cfe8ff' } },
            axisLabel: { color: '#9ec8f0', distance: 14, fontSize: 10 },
            detail: {
              valueAnimation: true,
              formatter: '{value}',
              color: '#fff',
              fontSize: 20,
              offsetCenter: [0, '68%']
            },
            title: { offsetCenter: [0, '90%'], color: '#8db4d8', fontSize: 12 },
            data: [{ value: score, name: '运输活跃度' }]
          }
        ]
      }
    },
    funnelOption() {
      const list = this.yearRows
      const items = [
        { name: '货运量', value: sumField(list, 'freight_volume') },
        { name: '客运量', value: sumField(list, 'passenger_volume') },
        { name: '公路里程', value: Math.round(sumField(list, 'highway_km')) },
        { name: '铁路里程', value: Math.round(sumField(list, 'railway_km')) }
      ].sort((a, b) => b.value - a.value)
      return {
        color: chartColors(),
        tooltip: { trigger: 'item', formatter: '{b}: {c}' },
        series: [
          {
            type: 'funnel',
            left: '8%',
            width: '78%',
            top: 12,
            bottom: 12,
            label: { color: '#e8f4ff', formatter: '{b}' },
            itemStyle: { borderColor: '#061428', borderWidth: 2 },
            data: items
          }
        ]
      }
    },
    rankOption() {
      const list = [...this.yearRows].sort((a, b) => a.passenger_volume - b.passenger_volume)
      return {
        color: ['#42a5f5'],
        tooltip: { trigger: 'axis' },
        grid: { left: 68, right: 28, top: 16, bottom: 16 },
        xAxis: { type: 'value', ...axisStyle() },
        yAxis: {
          type: 'category',
          data: list.map((r) => r.district),
          axisLabel: { color: '#9ec8f0', fontSize: 10 }
        },
        series: [
          {
            type: 'bar',
            data: list.map((r) => r.passenger_volume),
            label: { show: true, position: 'right', color: '#cfe8ff', fontSize: 10 },
            itemStyle: { borderRadius: [0, 4, 4, 0] }
          }
        ]
      }
    }
  },
  created() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      try {
        const { data } = await fetchData('traffic')
        this.rows = data.data || []
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import './screen.scss';
</style>
