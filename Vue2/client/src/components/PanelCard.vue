<template>
  <div class="panel-card">
    <div class="panel-title">
      <span>{{ title }}</span>
      <slot name="extra" />
    </div>
    <div class="panel-body">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'PanelCard',
  props: {
    title: { type: String, default: '' }
  }
}
</script>

<style lang="scss" scoped>
.panel-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(64, 158, 255, 0.28);
  background: rgba(8, 28, 52, 0.72);
  border-radius: 6px;
  overflow: hidden;
}
.panel-title {
  height: 40px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  color: #cfe8ff;
  border-bottom: 1px solid rgba(64, 158, 255, 0.2);
  background: linear-gradient(90deg, rgba(30, 90, 160, 0.35), transparent);
}
.panel-body {
  flex: 1;
  min-height: 0;
  padding: 8px;
  display: flex;
  flex-direction: column;
}
.panel-body > * {
  flex: 1;
  min-height: 0;
  width: 100%;
}
</style>
