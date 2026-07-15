<template>
  <div class="screen-page" v-loading="loading">
    <KpiRow :items="kpis" />
    <div class="layout-3col">
      <aside class="col-side">
        <PanelCard title="城乡人口 · 堆叠面积图" class="side-panel">
          <EChart :option="areaOption" />
        </PanelCard>
        <PanelCard title="密度关系 · 气泡散点图" class="side-panel">
          <EChart :option="bubbleOption" />
        </PanelCard>
      </aside>

      <main class="col-map">
        <PanelCard title="ECharts Map · 南阳市人口分布" class="map-panel">
          <GeoMapChart
            :points="mapPoints"
            value-key="total_pop"
            mode="choropleth"
            title="常住人口"
            unit="万人"
            :colors="['#311b92', '#5e35b1', '#7e57c2', '#b39ddb', '#ede7f6']"
          />
        </PanelCard>
      </main>

      <aside class="col-side">
        <PanelCard title="人口结构 · 南丁格尔玫瑰" class="side-panel">
          <EChart :option="roseOption" />
        </PanelCard>
        <PanelCard title="城镇化 · 环状占比" class="side-panel">
          <EChart :option="ringOption" />
        </PanelCard>
      </aside>
    </div>
    <div class="footer-actions">
      <el-button size="mini" type="primary" plain @click="$router.push('/data/population')">
        进入人口数据管理
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
  name: 'PopulationScreen',
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
      const total = sumField(list, 'total_pop')
      const urban = sumField(list, 'urban_pop')
      return [
        { label: '常住人口', value: total.toFixed(1), unit: '万人' },
        { label: '城镇人口', value: urban.toFixed(1), unit: '万人' },
        { label: '乡村人口', value: sumField(list, 'rural_pop').toFixed(1), unit: '万人' },
        {
          label: '城镇化率',
          value: total ? ((urban / total) * 100).toFixed(1) : '0',
          unit: '%'
        }
      ]
    },
    areaOption() {
      const list = this.yearRows
      return {
        color: ['#ce93d8', '#7b1fa2'],
        tooltip: { trigger: 'axis' },
        legend: { data: ['城镇', '乡村'], textStyle: { color: '#cfe8ff' } },
        grid: { left: 40, right: 12, top: 36, bottom: 48 },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: list.map((r) => r.district),
          axisLabel: { color: '#9ec8f0', rotate: 30, fontSize: 10 }
        },
        yAxis: { type: 'value', ...axisStyle() },
        series: [
          {
            name: '城镇',
            type: 'line',
            stack: 'pop',
            smooth: true,
            areaStyle: { opacity: 0.45 },
            data: list.map((r) => r.urban_pop)
          },
          {
            name: '乡村',
            type: 'line',
            stack: 'pop',
            smooth: true,
            areaStyle: { opacity: 0.45 },
            data: list.map((r) => r.rural_pop)
          }
        ]
      }
    },
    roseOption() {
      const list = this.yearRows
      return {
        color: chartColors(),
        tooltip: { trigger: 'item' },
        series: [
          {
            type: 'pie',
            roseType: 'area',
            radius: ['10%', '68%'],
            center: ['50%', '52%'],
            data: [
              { name: '城镇', value: sumField(list, 'urban_pop') },
              { name: '乡村', value: sumField(list, 'rural_pop') },
              { name: '密度指数', value: sumField(list, 'density') / 20 },
              { name: '总人口', value: sumField(list, 'total_pop') }
            ],
            label: { color: '#dcebff', fontSize: 11 },
            itemStyle: { borderRadius: 4 }
          }
        ]
      }
    },
    bubbleOption() {
      const list = this.yearRows
      return {
        color: ['#ab47bc'],
        tooltip: {
          formatter: (p) =>
            `${p.data[3]}<br/>城镇 ${p.data[0]}万<br/>乡村 ${p.data[1]}万<br/>密度 ${p.data[2]}`
        },
        grid: { left: 48, right: 20, top: 24, bottom: 36 },
        xAxis: { name: '城镇', nameTextStyle: { color: '#8db4d8' }, ...axisStyle() },
        yAxis: { name: '乡村', nameTextStyle: { color: '#8db4d8' }, ...axisStyle() },
        series: [
          {
            type: 'scatter',
            symbolSize: (val) => Math.max(12, Math.sqrt(val[2]) * 1.1),
            data: list.map((r) => [r.urban_pop, r.rural_pop, r.density, r.district]),
            label: {
              show: true,
              formatter: (p) => p.data[3],
              position: 'top',
              color: '#e8f4ff',
              fontSize: 9
            },
            itemStyle: { shadowBlur: 12, shadowColor: 'rgba(171,71,188,0.55)' }
          }
        ]
      }
    },
    ringOption() {
      const list = this.yearRows
      const urban = sumField(list, 'urban_pop')
      const rural = sumField(list, 'rural_pop')
      return {
        color: ['#7e57c2', '#b39ddb'],
        tooltip: { trigger: 'item' },
        series: [
          {
            type: 'pie',
            radius: ['48%', '72%'],
            center: ['50%', '50%'],
            label: { color: '#dcebff', formatter: '{b}\n{d}%' },
            data: [
              { name: '城镇人口', value: urban },
              { name: '乡村人口', value: rural }
            ]
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
        const { data } = await fetchData('population')
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
