<template>
  <div class="terrain-map">
    <div ref="map" class="map-el" />
    <div class="map-legend">
      <span class="legend-title">{{ legendTitle }}</span>
      <div class="legend-bar" :style="legendGradient" />
      <div class="legend-scale">
        <span>低</span>
        <span>高</span>
      </div>
    </div>
  </div>
</template>

<script>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { DISTRICT_COORDS } from '@/utils/nanyang'

const THEMES = {
  traffic: {
    legendTitle: '客运量 · 地形分布',
    colors: ['#0b3a6a', '#1e88e5', '#64b5f6', '#e3f2fd'],
    fill: '#2196f3',
    stroke: '#bbdefb',
    tile: 'topo'
  },
  population: {
    legendTitle: '常住人口 · 地形分布',
    colors: ['#4a148c', '#7b1fa2', '#ce93d8', '#f3e5f5'],
    fill: '#ab47bc',
    stroke: '#f3e5f5',
    tile: 'satellite'
  },
  economy: {
    legendTitle: 'GDP · 地形分布',
    colors: ['#e65100', '#fb8c00', '#ffcc80', '#fff3e0'],
    fill: '#ff9800',
    stroke: '#ffe0b2',
    tile: 'topo'
  },
  agriculture: {
    legendTitle: '粮食产量 · 地形分布',
    colors: ['#1b5e20', '#43a047', '#a5d6a7', '#e8f5e9'],
    fill: '#66bb6a',
    stroke: '#c8e6c9',
    tile: 'topo'
  }
}

function tileLayer(kind) {
  if (kind === 'satellite') {
    return L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        attribution: 'Esri World Imagery'
      }
    )
  }
  // 真实地形/等高风格底图
  return L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: 'OpenTopoMap'
  })
}

export default {
  name: 'TerrainDistributionMap',
  props: {
    points: { type: Array, default: () => [] },
    valueKey: { type: String, default: 'value' },
    theme: {
      type: String,
      default: 'traffic',
      validator: (v) => ['traffic', 'population', 'economy', 'agriculture'].includes(v)
    },
    showLinks: { type: Boolean, default: false }
  },
  data() {
    return {
      map: null,
      layerGroup: null
    }
  },
  computed: {
    themeCfg() {
      return THEMES[this.theme] || THEMES.traffic
    },
    legendTitle() {
      return this.themeCfg.legendTitle
    },
    legendGradient() {
      const c = this.themeCfg.colors
      return {
        background: `linear-gradient(90deg, ${c[0]}, ${c[1]}, ${c[2]}, ${c[3]})`
      }
    },
    maxVal() {
      return Math.max(...this.points.map((p) => Number(p[this.valueKey]) || 0), 1)
    }
  },
  watch: {
    points: {
      deep: true,
      handler() {
        this.renderLayers()
      }
    },
    valueKey() {
      this.renderLayers()
    },
    theme() {
      this.rebuildBase()
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initMap()
      // Leaflet 在隐藏容器里初始化时需要延期重算尺寸
      setTimeout(() => {
        if (this.map) this.map.invalidateSize()
      }, 200)
    })
  },
  beforeDestroy() {
    if (this.map) {
      this.map.remove()
      this.map = null
    }
  },
  methods: {
    initMap() {
      if (this.map || !this.$refs.map) return
      this.map = L.map(this.$refs.map, {
        zoomControl: true,
        attributionControl: true
      }).setView([33.0, 112.53], 8)

      tileLayer(this.themeCfg.tile).addTo(this.map)
      this.layerGroup = L.layerGroup().addTo(this.map)
      this.renderLayers()
    },
    rebuildBase() {
      if (!this.map) return
      this.map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) this.map.removeLayer(layer)
      })
      tileLayer(this.themeCfg.tile).addTo(this.map)
      this.renderLayers()
    },
    renderLayers() {
      if (!this.map || !this.layerGroup) return
      this.layerGroup.clearLayers()

      const center = DISTRICT_COORDS['卧龙区'] || { lng: 112.53, lat: 32.99 }
      const max = this.maxVal
      const fill = this.themeCfg.fill
      const stroke = this.themeCfg.stroke

      if (this.showLinks || this.theme === 'traffic') {
        this.points.forEach((p) => {
          const lng = p.lng != null ? Number(p.lng) : (DISTRICT_COORDS[p.district] || {}).lng
          const lat = p.lat != null ? Number(p.lat) : (DISTRICT_COORDS[p.district] || {}).lat
          if (lng == null || lat == null) return
          L.polyline(
            [
              [center.lat, center.lng],
              [lat, lng]
            ],
            {
              color: fill,
              weight: 1.5,
              opacity: 0.55,
              dashArray: '4 6'
            }
          ).addTo(this.layerGroup)
        })
      }

      this.points.forEach((p) => {
        const lng = p.lng != null ? Number(p.lng) : (DISTRICT_COORDS[p.district] || {}).lng
        const lat = p.lat != null ? Number(p.lat) : (DISTRICT_COORDS[p.district] || {}).lat
        if (lng == null || lat == null) return
        const val = Number(p[this.valueKey]) || 0
        const ratio = val / max
        const radius = 6000 + ratio * 18000

        const circle = L.circle([lat, lng], {
          radius,
          color: stroke,
          weight: 1.5,
          fillColor: fill,
          fillOpacity: 0.28 + ratio * 0.42
        })
        circle.bindPopup(
          `<strong>${p.district}</strong><br/>${this.legendTitle.split('·')[0].trim()}：<b>${val}</b>`
        )
        circle.addTo(this.layerGroup)

        const marker = L.circleMarker([lat, lng], {
          radius: 4 + ratio * 6,
          color: '#fff',
          weight: 1,
          fillColor: fill,
          fillOpacity: 0.95
        })
        marker.bindTooltip(`${p.district}: ${val}`, {
          permanent: true,
          direction: 'right',
          offset: [8, 0],
          className: 'terrain-tip'
        })
        marker.addTo(this.layerGroup)
      })
    }
  }
}
</script>

<style scoped>
.terrain-map {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 300px;
  border-radius: 4px;
  overflow: hidden;
}
.map-el {
  width: 100%;
  height: 100%;
  min-height: 300px;
  background: #1a2a1a;
}
.map-legend {
  position: absolute;
  left: 10px;
  bottom: 12px;
  z-index: 500;
  padding: 8px 10px;
  border-radius: 4px;
  background: rgba(6, 20, 36, 0.78);
  border: 1px solid rgba(120, 180, 230, 0.35);
  min-width: 140px;
}
.legend-title {
  display: block;
  font-size: 11px;
  color: #dcebff;
  margin-bottom: 6px;
}
.legend-bar {
  height: 8px;
  border-radius: 4px;
}
.legend-scale {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 10px;
  color: #9ec8f0;
}
</style>

<style>
.terrain-tip {
  background: rgba(4, 20, 40, 0.85) !important;
  border: 1px solid #3aa0ff !important;
  color: #e8f4ff !important;
  font-size: 11px !important;
  box-shadow: none !important;
  padding: 2px 6px !important;
}
.terrain-tip::before {
  border-right-color: rgba(4, 20, 40, 0.85) !important;
}
.leaflet-container {
  font: inherit;
}
</style>
