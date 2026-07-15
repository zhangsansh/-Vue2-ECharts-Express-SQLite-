<template>
  <div class="kpi-row">
    <div v-for="item in items" :key="item.label" class="kpi">
      <div class="label">{{ item.label }}</div>
      <div class="value">
        {{ item.value }}
        <small v-if="item.unit">{{ item.unit }}</small>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'KpiRow',
  props: {
    items: { type: Array, default: () => [] }
  }
}
</script>

<style scoped>
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 10px;
  flex-shrink: 0;
}
.kpi {
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px solid rgba(64, 158, 255, 0.28);
  background: linear-gradient(135deg, rgba(20, 70, 130, 0.45), rgba(8, 28, 52, 0.7));
}
.label {
  color: #8db4d8;
  font-size: 12px;
  margin-bottom: 4px;
}
.value {
  font-size: 20px;
  color: #fff;
  font-weight: 600;
}
.value small {
  margin-left: 4px;
  font-size: 12px;
  color: #7ec8ff;
  font-weight: 400;
}
@media (max-width: 900px) {
  .kpi-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
