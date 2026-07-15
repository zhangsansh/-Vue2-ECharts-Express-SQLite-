<template>
  <div class="map-wrap">
    <div v-show="mapReady" ref="map" class="map-el" />
    <div v-if="!mapReady" class="map-fallback">
      <p>{{ statusText }}</p>
      <p class="hint">
        在 <code>client/.env.local</code> 配置 <code>VUE_APP_BAIDU_MAP_AK=你的密钥</code> 后重启前端，即可启用百度地形图。当前使用 ECharts 示意分布。
      </p>
      <EChart :option="fallbackOption" class="fallback-chart" />
    </div>
  </div>
</template>

<script>
import EChart from './EChart.vue'
import { loadBaiduMap, hasValidBaiduAk } from '@/utils/baiduMap'

export default {
  name: 'BaiduTerrainMap',
  components: { EChart },
  props: {
    points: {
      type: Array,
      default: () => []
    },
    valueKey: {
      type: String,
      default: 'total_pop'
    },
    heatMode: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      map: null,
      mapReady: false,
      statusText: '百度地图未配置，使用示意图表',
      overlays: []
    }
  },
  computed: {
    fallbackOption() {
      const names = this.points.map((p) => p.district)
      const values = this.points.map((p) => Number(p[this.valueKey]) || 0)
      const scatter = this.points.map((p) => ({
        name: p.district,
        value: [Number(p.lng) || 112.5, Number(p.lat) || 33.0, Number(p[this.valueKey]) || 0]
      }))
      return {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          formatter: (p) => {
            if (p.seriesType === 'scatter') {
              return `${p.name}<br/>经度 ${p.value[0]}<br/>纬度 ${p.value[1]}<br/>值 ${p.value[2]}`
            }
            return `${p.name}: ${p.value}`
          }
        },
        grid: [
          { left: 50, right: 20, top: '8%', height: '38%' },
          { left: 50, right: 20, top: '58%', height: '34%' }
        ],
        xAxis: [
          {
            type: 'category',
            data: names,
            gridIndex: 0,
            axisLabel: { color: '#9ec8f0', rotate: 35, fontSize: 10 },
            axisLine: { lineStyle: { color: '#2a4f78' } }
          },
          {
            type: 'value',
            name: '经度',
            gridIndex: 1,
            min: 110.8,
            max: 113.9,
            axisLabel: { color: '#9ec8f0' },
            splitLine: { lineStyle: { color: 'rgba(50,90,140,0.35)' } }
          }
        ],
        yAxis: [
          {
            type: 'value',
            gridIndex: 0,
            axisLabel: { color: '#9ec8f0' },
            splitLine: { lineStyle: { color: 'rgba(50,90,140,0.35)' } }
          },
          {
            type: 'value',
            name: '纬度',
            gridIndex: 1,
            min: 31.6,
            max: 33.9,
            axisLabel: { color: '#9ec8f0' },
            splitLine: { lineStyle: { color: 'rgba(50,90,140,0.35)' } }
          }
        ],
        visualMap: {
          min: 0,
          max: Math.max(...values, 1),
          calculable: true,
          inRange: { color: ['#123a66', '#2f8fff', '#00e0c6', '#ffe566'] },
          textStyle: { color: '#cfe8ff' },
          right: 8,
          bottom: 8,
          seriesIndex: 1
        },
        series: [
          {
            type: 'bar',
            data: values,
            xAxisIndex: 0,
            yAxisIndex: 0,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#3aa0ff' },
                  { offset: 1, color: '#0b3a6a' }
                ]
              }
            }
          },
          {
            type: 'scatter',
            data: scatter,
            xAxisIndex: 1,
            yAxisIndex: 1,
            symbolSize: (val) => Math.max(14, Math.sqrt(val[2]) * 2.4),
            label: {
              show: true,
              formatter: '{b}',
              color: '#fff',
              fontSize: 10,
              position: 'right'
            }
          }
        ]
      }
    }
  },
  watch: {
    points: {
      deep: true,
      handler() {
        this.renderOverlays()
      }
    }
  },
  mounted() {
    this.$nextTick(() => this.initMap())
  },
  beforeDestroy() {
    this.clearOverlays()
    this.map = null
  },
  methods: {
    async initMap() {
      if (!hasValidBaiduAk()) {
        this.mapReady = false
        this.statusText = '百度地图未配置，使用示意图表'
        return
      }
      this.statusText = '百度地图加载中…'
      try {
        await loadBaiduMap()
        await this.$nextTick()
        const el = this.$refs.map
        if (!el || typeof BMapGL === 'undefined') {
          this.mapReady = false
          this.statusText = '百度地图初始化失败，使用示意图表'
          return
        }
        this.map = new BMapGL.Map(el)
        const center = new BMapGL.Point(112.5285, 32.9908)
        this.map.centerAndZoom(center, 9)
        this.map.enableScrollWheelZoom(true)
        try {
          if (typeof BMAP_EARTH_MAP !== 'undefined') {
            this.map.setMapType(BMAP_EARTH_MAP)
          } else if (typeof BMAP_SATELLITE_MAP !== 'undefined') {
            this.map.setMapType(BMAP_SATELLITE_MAP)
          }
        } catch (e) {
          /* keep default */
        }
        this.mapReady = true
        this.renderOverlays()
      } catch (e) {
        console.warn('百度地图不可用：', e && e.message)
        this.mapReady = false
        this.statusText = '百度地图加载失败，使用示意图表'
      }
    },
    clearOverlays() {
      if (!this.map) return
      this.overlays.forEach((o) => {
        try {
          this.map.removeOverlay(o)
        } catch (e) {
          /* ignore */
        }
      })
      this.overlays = []
    },
    renderOverlays() {
      if (!this.map || !this.mapReady) return
      this.clearOverlays()
      const max = Math.max(...this.points.map((p) => Number(p[this.valueKey]) || 0), 1)
      this.points.forEach((p) => {
        if (p.lng == null || p.lat == null) return
        const val = Number(p[this.valueKey]) || 0
        const point = new BMapGL.Point(Number(p.lng), Number(p.lat))
        const ratio = val / max
        const circle = new BMapGL.Circle(point, 3000 + ratio * 12000, {
          strokeColor: '#3aa0ff',
          strokeWeight: 1,
          strokeOpacity: 0.8,
          fillColor: this.heatMode ? '#00d4c8' : '#409eff',
          fillOpacity: 0.25 + ratio * 0.45
        })
        this.map.addOverlay(circle)
        const label = new BMapGL.Label(`${p.district}\n${val}`, {
          position: point,
          offset: new BMapGL.Size(-28, -18)
        })
        label.setStyle({
          color: '#fff',
          fontSize: '11px',
          background: 'rgba(0,20,40,0.55)',
          border: '1px solid #3aa0ff',
          padding: '2px 6px',
          borderRadius: '3px'
        })
        this.map.addOverlay(label)
        this.overlays.push(circle, label)
      })
    }
  }
}
</script>

<style scoped>
.map-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 320px;
}
.map-el {
  width: 100%;
  height: 100%;
}
.map-fallback {
  position: absolute;
  inset: 0;
  padding: 10px;
  display: flex;
  flex-direction: column;
  background: rgba(6, 24, 48, 0.92);
}
.map-fallback p {
  color: #9ec8f0;
  font-size: 13px;
}
.hint {
  margin: 6px 0 10px;
  color: #7aa3c7 !important;
  font-size: 12px !important;
}
.hint code {
  color: #7ad0ff;
  font-size: 11px;
}
.fallback-chart {
  flex: 1;
  min-height: 240px;
}
</style>
