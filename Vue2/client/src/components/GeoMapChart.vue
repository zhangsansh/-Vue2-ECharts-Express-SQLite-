<template>
  <div class="geo-wrap">
    <div class="map-badge">南阳市行政区划</div>
    <EChart :option="option" />
  </div>
</template>

<script>
import * as echarts from 'echarts'
import EChart from './EChart.vue'
import nanyangGeo from '@/assets/nanyangGeo.json'
import { DISTRICT_COORDS, NANYANG_MAP_NAME } from '@/utils/nanyang'

const MAP_NAME = NANYANG_MAP_NAME

// 使用 DataV 南阳市（adcode 411300）完整区划边界
echarts.registerMap(MAP_NAME, nanyangGeo)

export default {
  name: 'GeoMapChart',
  components: { EChart },
  props: {
    points: { type: Array, default: () => [] },
    valueKey: { type: String, default: 'value' },
    /** choropleth | terrain | lines | heat | effect | scatter */
    mode: { type: String, default: 'terrain' },
    title: { type: String, default: '' },
    unit: { type: String, default: '' },
    colors: {
      type: Array,
      default: () => ['#1b4332', '#2d6a4f', '#52b788', '#95d5b2', '#d8f3dc']
    }
  },
  computed: {
    values() {
      return this.points.map((p) => {
        const c = DISTRICT_COORDS[p.district] || {}
        return {
          name: p.district,
          value: Number(p[this.valueKey]) || 0,
          lng: c.lng != null ? c.lng : p.lng != null ? Number(p.lng) : null,
          lat: c.lat != null ? c.lat : p.lat != null ? Number(p.lat) : null
        }
      })
    },
    maxVal() {
      return Math.max(...this.values.map((v) => v.value), 1)
    },
    tipFormatter() {
      const unit = this.unit
      const title = this.title || '指标'
      return (p) => {
        const name = p.name || ''
        let val = p.value
        if (Array.isArray(val)) val = val[2]
        if (val == null || val === '-') val = 0
        return `${name}<br/>${title}：${val}${unit ? ' ' + unit : ''}`
      }
    },
    option() {
      const mapData = this.values.map((v) => ({ name: v.name, value: v.value }))
      const scatterData = this.values
        .filter((v) => v.lng != null && v.lat != null)
        .map((v) => ({ name: v.name, value: [v.lng, v.lat, v.value] }))

      const visualMap = {
        min: 0,
        max: this.maxVal,
        calculable: true,
        inRange: { color: this.colors },
        text: ['高', '低'],
        textStyle: { color: '#cfe8ff' },
        left: 10,
        bottom: 14,
        itemWidth: 12,
        itemHeight: 110
      }

      // 适配南阳市真实边界（东西向较宽）
      const layout = {
        aspectScale: 0.85,
        layoutCenter: ['52%', '50%'],
        layoutSize: '96%',
        roam: true,
        zoom: 1.05,
        scaleLimit: { min: 0.7, max: 8 }
      }

      const commonMapStyle = {
        label: {
          show: true,
          color: '#eaf6ff',
          fontSize: 11,
          formatter: '{b}'
        },
        itemStyle: {
          borderColor: 'rgba(180, 230, 255, 0.75)',
          borderWidth: 1.2,
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.35)'
        },
        emphasis: {
          label: { show: true, color: '#fff', fontSize: 13, fontWeight: 'bold' },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1.5,
            shadowBlur: 16
          }
        }
      }

      if (this.mode === 'choropleth') {
        return {
          backgroundColor: 'transparent',
          tooltip: { trigger: 'item', formatter: this.tipFormatter },
          visualMap,
          series: [
            {
              name: this.title || '南阳市分布',
              type: 'map',
              map: MAP_NAME,
              ...layout,
              data: mapData,
              ...commonMapStyle,
              itemStyle: {
                ...commonMapStyle.itemStyle,
                areaColor: '#1a3358'
              },
              emphasis: {
                ...commonMapStyle.emphasis,
                itemStyle: {
                  ...commonMapStyle.emphasis.itemStyle,
                  areaColor: '#3a7bd5'
                }
              }
            }
          ]
        }
      }

      if (this.mode === 'terrain') {
        return {
          backgroundColor: 'transparent',
          tooltip: { trigger: 'item', formatter: this.tipFormatter },
          visualMap: { ...visualMap, seriesIndex: 0 },
          geo: {
            map: MAP_NAME,
            ...layout,
            silent: true,
            itemStyle: {
              areaColor: '#14281f',
              borderColor: '#4a7c59',
              borderWidth: 1
            },
            label: { show: false }
          },
          series: [
            {
              name: this.title || '南阳市地形分布',
              type: 'map',
              map: MAP_NAME,
              geoIndex: 0,
              data: mapData,
              ...commonMapStyle
            },
            {
              type: 'effectScatter',
              coordinateSystem: 'geo',
              zlevel: 2,
              rippleEffect: { brushType: 'stroke', scale: 3 },
              symbolSize: (val) => Math.max(9, Math.sqrt(val[2]) * 1.7),
              itemStyle: {
                color: '#ffd54f',
                shadowBlur: 12,
                shadowColor: '#ffd54f'
              },
              data: scatterData
            }
          ]
        }
      }

      if (this.mode === 'lines') {
        const center = DISTRICT_COORDS['卧龙区'] || { lng: 112.4559, lat: 32.9814 }
        const lines = scatterData.map((d) => ({
          coords: [
            [center.lng, center.lat],
            [d.value[0], d.value[1]]
          ]
        }))
        return {
          backgroundColor: 'transparent',
          tooltip: { trigger: 'item', formatter: this.tipFormatter },
          geo: {
            map: MAP_NAME,
            ...layout,
            itemStyle: {
              areaColor: '#0d2748',
              borderColor: '#4db3ff',
              borderWidth: 1.1
            },
            label: { show: true, color: '#dcebff', fontSize: 10 },
            emphasis: { itemStyle: { areaColor: '#1a5a9a' } }
          },
          visualMap: { ...visualMap, seriesIndex: 1, dimension: 2 },
          series: [
            {
              type: 'lines',
              coordinateSystem: 'geo',
              zlevel: 1,
              effect: {
                show: true,
                period: 4,
                trailLength: 0.4,
                symbol: 'arrow',
                symbolSize: 5
              },
              lineStyle: {
                color: '#64b5f6',
                width: 1.2,
                opacity: 0.55,
                curveness: 0.2
              },
              data: lines
            },
            {
              type: 'effectScatter',
              coordinateSystem: 'geo',
              zlevel: 2,
              rippleEffect: { brushType: 'stroke', scale: 3 },
              symbolSize: (val) => Math.max(8, Math.sqrt(val[2]) * 1.8),
              itemStyle: { color: '#29b6f6' },
              data: scatterData,
              label: {
                show: true,
                formatter: '{b}',
                position: 'right',
                color: '#fff',
                fontSize: 10
              }
            }
          ]
        }
      }

      if (this.mode === 'heat') {
        return {
          backgroundColor: 'transparent',
          tooltip: { trigger: 'item', formatter: this.tipFormatter },
          geo: {
            map: MAP_NAME,
            ...layout,
            itemStyle: {
              areaColor: '#2a1a0a',
              borderColor: '#e09f3e',
              borderWidth: 1.1
            },
            label: { show: true, color: '#ffe8c8', fontSize: 10 },
            emphasis: { itemStyle: { areaColor: '#5c3d1e' } }
          },
          visualMap: { ...visualMap, seriesIndex: 0, dimension: 2 },
          series: [
            {
              type: 'scatter',
              coordinateSystem: 'geo',
              data: scatterData,
              symbolSize: (val) => Math.max(20, (val[2] / this.maxVal) * 56),
              itemStyle: {
                color: '#ff9800',
                opacity: 0.55,
                shadowBlur: 18,
                shadowColor: '#ff9800'
              },
              label: { show: true, formatter: '{b}', color: '#fff', fontSize: 10 }
            }
          ]
        }
      }

      const useEffect = this.mode === 'effect'
      return {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item', formatter: this.tipFormatter },
        geo: {
          map: MAP_NAME,
          ...layout,
          itemStyle: {
            areaColor: '#14301f',
            borderColor: '#66bb6a',
            borderWidth: 1.1
          },
          label: { show: true, color: '#dcefe0', fontSize: 10 },
          emphasis: { itemStyle: { areaColor: '#2e6b45' } }
        },
        visualMap: { ...visualMap, seriesIndex: 0, dimension: 2 },
        series: [
          {
            type: useEffect ? 'effectScatter' : 'scatter',
            coordinateSystem: 'geo',
            rippleEffect: useEffect ? { brushType: 'stroke', scale: 2.8 } : undefined,
            data: scatterData,
            symbolSize: (val) => Math.max(10, Math.sqrt(val[2]) * 2),
            itemStyle: { color: useEffect ? '#81c784' : '#ffc857' },
            label: {
              show: true,
              formatter: '{b}',
              position: 'right',
              color: '#e8f4ff',
              fontSize: 10
            }
          }
        ]
      }
    }
  }
}
</script>

<style scoped>
.geo-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 280px;
}
.map-badge {
  position: absolute;
  top: 8px;
  left: 10px;
  z-index: 2;
  padding: 4px 10px;
  border-radius: 3px;
  font-size: 12px;
  color: #dcebff;
  background: rgba(6, 24, 48, 0.72);
  border: 1px solid rgba(100, 180, 255, 0.35);
  pointer-events: none;
}
</style>
