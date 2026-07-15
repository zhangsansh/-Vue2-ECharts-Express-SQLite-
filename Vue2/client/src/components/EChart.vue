<template>
  <div ref="chart" class="echart" />
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'EChart',
  props: {
    option: { type: Object, default: () => ({}) }
  },
  data() {
    return { chart: null }
  },
  watch: {
    option: {
      deep: true,
      handler(val) {
        if (this.chart) this.chart.setOption(val, true)
      }
    }
  },
  mounted() {
    this.chart = echarts.init(this.$refs.chart)
    this.chart.setOption(this.option)
    window.addEventListener('resize', this.resize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resize)
    if (this.chart) this.chart.dispose()
  },
  methods: {
    resize() {
      if (this.chart) this.chart.resize()
    }
  }
}
</script>

<style scoped>
.echart {
  width: 100%;
  height: 100%;
  min-height: 180px;
}
</style>
