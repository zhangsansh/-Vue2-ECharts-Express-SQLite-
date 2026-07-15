export const DISTRICT_COORDS = {
  宛城区: { lng: 112.6126, lat: 32.8776 },
  卧龙区: { lng: 112.4559, lat: 32.9814 },
  南召县: { lng: 112.4313, lat: 33.4488 },
  方城县: { lng: 113.0128, lat: 33.2893 },
  西峡县: { lng: 111.4108, lat: 33.4391 },
  镇平县: { lng: 112.1949, lat: 33.0372 },
  内乡县: { lng: 111.8147, lat: 33.1857 },
  淅川县: { lng: 111.4175, lat: 32.9989 },
  社旗县: { lng: 113.0173, lat: 32.9783 },
  唐河县: { lng: 112.9006, lat: 32.6251 },
  新野县: { lng: 112.3784, lat: 32.5522 },
  桐柏县: { lng: 113.4113, lat: 32.4996 },
  邓州市: { lng: 112.0664, lat: 32.6545 }
}

/** 南阳市 ECharts map 注册名（对应 assets/nanyangGeo.json 真实区划边界） */
export const NANYANG_MAP_NAME = 'nanyang'

export function withCoords(rows) {
  return (rows || []).map((r) => {
    const c = DISTRICT_COORDS[r.district] || {}
    return {
      ...r,
      // 优先使用与 GeoJSON 区划对齐的中心点，保证地图散点落在正确区域
      lng: c.lng != null ? c.lng : r.lng,
      lat: c.lat != null ? c.lat : r.lat
    }
  })
}

export function sumField(rows, key) {
  return (rows || []).reduce((s, r) => s + (Number(r[key]) || 0), 0)
}

export function axisStyle() {
  return {
    axisLabel: { color: '#9ec8f0' },
    axisLine: { lineStyle: { color: '#2a4f78' } },
    splitLine: { lineStyle: { color: 'rgba(50,90,140,0.35)' } }
  }
}

export function chartColors() {
  return ['#3aa0ff', '#00d4c8', '#ffc857', '#ff6b6b', '#a78bfa', '#34d399']
}
