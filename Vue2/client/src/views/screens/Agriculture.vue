<template>
  <div class="screen-page" v-loading="loading">
    <KpiRow :items="kpis" />
    <div class="layout-3col">
      <aside class="col-side">
        <PanelCard title="农业指标 · 雷达图" class="side-panel">
          <EChart :option="radarOption" />
        </PanelCard>
        <PanelCard title="区县产值 · 象形柱图" class="side-panel">
          <EChart :option="pictorialOption" />
        </PanelCard>
      </aside>

      <main class="col-map">
        <PanelCard title="ECharts Map · 南阳市农业粮食分布" class="map-panel">
          <GeoMapChart
            :points="mapPoints"
            value-key="grain_output"
            mode="terrain"
            title="粮食产量"
            unit="万吨"
            :colors="['#1b4332', '#2d6a4f', '#40916c', '#74c69d', '#d8f3dc']"
          />
        </PanelCard>
      </main>

      <aside class="col-side">
        <PanelCard title="粮食产量 · 极坐标柱图" class="side-panel">
          <EChart :option="polarOption" />
        </PanelCard>
        <PanelCard title="畜禽规模 · 平滑面积线" class="side-panel">
          <EChart :option="areaLineOption" />
        </PanelCard>
      </aside>
    </div>
    <div class="footer-actions">
      <el-button size="mini" type="primary" plain @click="$router.push('/data/agriculture')">
        进入农业数据管理
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
  name: 'AgricultureScreen',
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
        { label: '粮食总产量', value: sumField(list, 'grain_output').toFixed(1), unit: '万吨' },
        { label: '耕地面积', value: sumField(list, 'farmland_mu').toFixed(1), unit: '万亩' },
        { label: '畜禽存栏', value: sumField(list, 'livestock_count').toFixed(1), unit: '万头' },
        { label: '农业增加值', value: sumField(list, 'agri_gdp').toFixed(1), unit: '亿元' }
      ]
    },
    radarOption() {
      const top = [...this.yearRows]
        .sort((a, b) => b.grain_output - a.grain_output)
        .slice(0, 4)
      const maxGrain = Math.max(...top.map((r) => r.grain_output), 1)
      const maxFarm = Math.max(...top.map((r) => r.farmland_mu), 1)
      const maxLive = Math.max(...top.map((r) => r.livestock_count), 1)
      const maxAgri = Math.max(...top.map((r) => r.agri_gdp), 1)
      return {
        color: chartColors(),
        tooltip: {},
        legend: {
          data: top.map((r) => r.district),
          textStyle: { color: '#cfe8ff', fontSize: 10 },
          bottom: 0
        },
        radar: {
          indicator: [
            { name: '粮食', max: maxGrain * 1.1 },
            { name: '耕地', max: maxFarm * 1.1 },
            { name: '畜禽', max: maxLive * 1.1 },
            { name: '农产增加值', max: maxAgri * 1.1 }
          ],
          axisName: { color: '#9ec8f0' },
          splitArea: {
            areaStyle: { color: ['rgba(20,60,100,0.15)', 'rgba(20,60,100,0.35)'] }
          }
        },
        series: [
          {
            type: 'radar',
            data: top.map((r) => ({
              name: r.district,
              value: [r.grain_output, r.farmland_mu, r.livestock_count, r.agri_gdp],
              areaStyle: { opacity: 0.15 }
            }))
          }
        ]
      }
    },
    polarOption() {
      const list = [...this.yearRows].sort((a, b) => b.grain_output - a.grain_output)
      return {
        tooltip: {},
        angleAxis: {
          type: 'category',
          data: list.map((r) => r.district),
          axisLabel: { color: '#9ec8f0', fontSize: 9 }
        },
        radiusAxis: {
          axisLabel: { color: '#9ec8f0', fontSize: 10 },
          splitLine: { lineStyle: { color: 'rgba(50,90,140,0.35)' } }
        },
        polar: {},
        series: [
          {
            type: 'bar',
            coordinateSystem: 'polar',
            data: list.map((r) => r.grain_output),
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#0a5a3a' },
                  { offset: 1, color: '#34d399' }
                ]
              }
            }
          }
        ]
      }
    },
    pictorialOption() {
      const list = [...this.yearRows].sort((a, b) => b.agri_gdp - a.agri_gdp).slice(0, 8)
      const max = Math.max(...list.map((r) => r.agri_gdp), 1)
      return {
        tooltip: { trigger: 'axis' },
        grid: { left: 48, right: 16, top: 20, bottom: 44 },
        xAxis: {
          type: 'category',
          data: list.map((r) => r.district),
          axisLabel: { color: '#9ec8f0', rotate: 30, fontSize: 10 },
          axisTick: { show: false },
          axisLine: { show: false }
        },
        yAxis: { type: 'value', ...axisStyle(), splitLine: { show: false } },
        series: [
          {
            name: '农业增加值',
            type: 'pictorialBar',
            symbol: 'path://M0,10 L10,10 C5.5,10 5.5,5 5,0 C4.5,5 4.5,10 0,10 z',
            barCategoryGap: '40%',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#a7f3d0' },
                  { offset: 1, color: '#059669' }
                ]
              }
            },
            data: list.map((r) => r.agri_gdp),
            z: 10
          },
          {
            name: '背景',
            type: 'bar',
            barGap: '-100%',
            barWidth: 16,
            itemStyle: { color: 'rgba(20,60,40,0.35)' },
            data: list.map(() => max * 1.15),
            tooltip: { show: false },
            z: 1
          }
        ]
      }
    },
    areaLineOption() {
      const list = this.yearRows
      return {
        color: ['#66bb6a'],
        tooltip: { trigger: 'axis' },
        grid: { left: 40, right: 12, top: 24, bottom: 48 },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: list.map((r) => r.district),
          axisLabel: { color: '#9ec8f0', rotate: 30, fontSize: 10 }
        },
        yAxis: { type: 'value', ...axisStyle() },
        series: [
          {
            name: '畜禽存栏',
            type: 'line',
            smooth: true,
            areaStyle: { opacity: 0.28 },
            data: list.map((r) => r.livestock_count)
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
        const { data } = await fetchData('agriculture')
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
