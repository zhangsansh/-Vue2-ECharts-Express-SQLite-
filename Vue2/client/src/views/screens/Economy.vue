<template>
  <div class="screen-page" v-loading="loading">
    <KpiRow :items="kpis" />
    <div class="layout-3col">
      <aside class="col-side">
        <PanelCard title="GDP / 财政 · 柱线组合" class="side-panel">
          <EChart :option="comboOption" />
        </PanelCard>
        <PanelCard title="产业结构 · 堆叠百分比" class="side-panel">
          <EChart :option="percentOption" />
        </PanelCard>
      </aside>

      <main class="col-map">
        <PanelCard title="ECharts Map · 南阳市经济 GDP 分布" class="map-panel">
          <GeoMapChart
            :points="mapPoints"
            value-key="gdp"
            mode="heat"
            title="GDP"
            unit="亿元"
            :colors="['#3e2723', '#bf360c', '#ff6d00', '#ffab40', '#ffe0b2']"
          />
        </PanelCard>
      </main>

      <aside class="col-side">
        <PanelCard title="三次产业 · 矩形树图" class="side-panel">
          <EChart :option="treeOption" />
        </PanelCard>
        <PanelCard title="产业环图 · 占比" class="side-panel">
          <EChart :option="industryPie" />
        </PanelCard>
      </aside>
    </div>
    <div class="footer-actions">
      <el-button size="mini" type="primary" plain @click="$router.push('/data/economy')">
        进入经济数据管理
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
  name: 'EconomyScreen',
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
        { label: '地区生产总值', value: sumField(list, 'gdp').toFixed(0), unit: '亿元' },
        { label: '第一产业', value: sumField(list, 'primary_industry').toFixed(0), unit: '亿元' },
        { label: '第二产业', value: sumField(list, 'secondary_industry').toFixed(0), unit: '亿元' },
        { label: '财政收入', value: sumField(list, 'revenue').toFixed(0), unit: '亿元' }
      ]
    },
    comboOption() {
      const list = this.yearRows
      return {
        color: ['#ffc857', '#3aa0ff'],
        tooltip: { trigger: 'axis' },
        legend: { data: ['GDP', '财政收入'], textStyle: { color: '#cfe8ff' } },
        grid: { left: 40, right: 36, top: 36, bottom: 48 },
        xAxis: {
          type: 'category',
          data: list.map((r) => r.district),
          axisLabel: { color: '#9ec8f0', rotate: 30, fontSize: 10 }
        },
        yAxis: [
          { type: 'value', ...axisStyle() },
          {
            type: 'value',
            splitLine: { show: false },
            axisLabel: { color: '#9ec8f0' }
          }
        ],
        series: [
          {
            name: 'GDP',
            type: 'bar',
            barWidth: '40%',
            data: list.map((r) => r.gdp),
            itemStyle: {
              borderRadius: [4, 4, 0, 0],
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#ffc857' },
                  { offset: 1, color: '#8a5a10' }
                ]
              }
            }
          },
          {
            name: '财政收入',
            type: 'line',
            yAxisIndex: 1,
            smooth: true,
            symbolSize: 6,
            data: list.map((r) => r.revenue)
          }
        ]
      }
    },
    treeOption() {
      const list = this.yearRows
      return {
        tooltip: { formatter: (p) => `${p.name}: ${p.value} 亿元` },
        series: [
          {
            type: 'treemap',
            roam: false,
            nodeClick: false,
            breadcrumb: { show: false },
            label: { color: '#fff', fontSize: 12 },
            itemStyle: { borderColor: '#061428', borderWidth: 2, gapWidth: 2 },
            data: [
              {
                name: '第一产业',
                value: sumField(list, 'primary_industry'),
                itemStyle: { color: '#34d399' }
              },
              {
                name: '第二产业',
                value: sumField(list, 'secondary_industry'),
                itemStyle: { color: '#3aa0ff' }
              },
              {
                name: '第三产业',
                value: sumField(list, 'tertiary_industry'),
                itemStyle: { color: '#a78bfa' }
              }
            ]
          }
        ]
      }
    },
    percentOption() {
      const list = this.yearRows.slice(0, 8)
      const toPct = (row, key) => {
        const t = row.primary_industry + row.secondary_industry + row.tertiary_industry
        return t ? +((row[key] / t) * 100).toFixed(1) : 0
      }
      return {
        color: ['#34d399', '#3aa0ff', '#a78bfa'],
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['一产%', '二产%', '三产%'], textStyle: { color: '#cfe8ff' } },
        grid: { left: 40, right: 12, top: 36, bottom: 40 },
        xAxis: {
          type: 'category',
          data: list.map((r) => r.district),
          axisLabel: { color: '#9ec8f0', rotate: 30, fontSize: 10 }
        },
        yAxis: {
          type: 'value',
          max: 100,
          axisLabel: { color: '#9ec8f0', formatter: '{value}%' },
          splitLine: { lineStyle: { color: 'rgba(50,90,140,0.35)' } }
        },
        series: [
          {
            name: '一产%',
            type: 'bar',
            stack: 'p',
            data: list.map((r) => toPct(r, 'primary_industry'))
          },
          {
            name: '二产%',
            type: 'bar',
            stack: 'p',
            data: list.map((r) => toPct(r, 'secondary_industry'))
          },
          {
            name: '三产%',
            type: 'bar',
            stack: 'p',
            data: list.map((r) => toPct(r, 'tertiary_industry'))
          }
        ]
      }
    },
    industryPie() {
      const list = this.yearRows
      return {
        color: chartColors(),
        tooltip: { trigger: 'item' },
        series: [
          {
            type: 'pie',
            radius: ['0%', '68%'],
            roseType: 'radius',
            data: [
              { name: '一产', value: sumField(list, 'primary_industry') },
              { name: '二产', value: sumField(list, 'secondary_industry') },
              { name: '三产', value: sumField(list, 'tertiary_industry') }
            ],
            label: { color: '#dcebff' }
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
        const { data } = await fetchData('economy')
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
