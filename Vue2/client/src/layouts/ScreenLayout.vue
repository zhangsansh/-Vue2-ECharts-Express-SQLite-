<template>
  <div class="screen-layout">
    <header class="top-bar">
      <div class="brand">
        <span class="brand-mark" />
        <div>
          <h1>南阳市数据可视化大屏</h1>
          <p>交通 · 人口 · 经济 · 农业 | Baidu Map + ECharts + SQLite</p>
        </div>
      </div>
      <nav class="nav-tabs">
        <router-link
          v-for="item in menus"
          :key="item.path"
          :to="item.path"
          class="tab"
          active-class="active"
        >
          {{ item.label }}
        </router-link>
      </nav>
      <div class="user-box">
        <el-tag size="mini" effect="dark" :type="roleTagType">{{ roleLabel }}</el-tag>
        <span class="uname">{{ userName }}</span>
        <el-dropdown trigger="click" @command="onCommand">
          <span class="el-dropdown-link">
            操作 <i class="el-icon-arrow-down el-icon--right" />
          </span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="data-traffic">交通数据管理</el-dropdown-item>
            <el-dropdown-item command="data-population">人口数据管理</el-dropdown-item>
            <el-dropdown-item command="data-economy">经济数据管理</el-dropdown-item>
            <el-dropdown-item command="data-agriculture">农业数据管理</el-dropdown-item>
            <el-dropdown-item v-if="canManageUsers" divided command="users">用户权限管理</el-dropdown-item>
            <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </header>
    <main class="main-area">
      <router-view :key="$route.fullPath" />
    </main>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'

export default {
  name: 'ScreenLayout',
  data() {
    return {
      menus: [
        { path: '/traffic', label: '交通' },
        { path: '/population', label: '人口' },
        { path: '/economy', label: '经济' },
        { path: '/agriculture', label: '农业' }
      ]
    }
  },
  computed: {
    ...mapState(['user']),
    ...mapGetters(['canManageUsers', 'role']),
    userName() {
      return (this.user && this.user.name) || '用户'
    },
    roleLabel() {
      return { admin: '管理员', editor: '编辑员', viewer: '访客' }[this.role] || this.role
    },
    roleTagType() {
      return { admin: 'danger', editor: 'warning', viewer: 'info' }[this.role] || 'info'
    }
  },
  methods: {
    onCommand(cmd) {
      if (cmd === 'logout') {
        this.$store.dispatch('logout')
        this.$router.replace('/login')
        return
      }
      if (cmd === 'users') {
        this.$router.push('/users')
        return
      }
      if (cmd.startsWith('data-')) {
        this.$router.push(`/data/${cmd.replace('data-', '')}`)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.screen-layout {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(ellipse at top, rgba(24, 96, 180, 0.35), transparent 55%),
    linear-gradient(180deg, #07182e 0%, #040f1c 100%);
}

.top-bar {
  height: 72px;
  padding: 0 20px;
  display: grid;
  grid-template-columns: 1.2fr 1.6fr 1fr;
  align-items: center;
  border-bottom: 1px solid rgba(64, 158, 255, 0.25);
  background: rgba(4, 18, 36, 0.75);
  backdrop-filter: blur(8px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  h1 {
    font-size: 22px;
    letter-spacing: 2px;
    background: linear-gradient(90deg, #9fd3ff, #ffffff);
    -webkit-background-clip: text;
    color: transparent;
  }
  p {
    margin-top: 2px;
    font-size: 12px;
    color: #7fafd8;
  }
}

.brand-mark {
  width: 14px;
  height: 42px;
  border-radius: 4px;
  background: linear-gradient(180deg, #3aa0ff, #00d4c8);
  box-shadow: 0 0 18px rgba(58, 160, 255, 0.6);
}

.nav-tabs {
  display: flex;
  justify-content: center;
  gap: 10px;
  .tab {
    min-width: 88px;
    text-align: center;
    padding: 8px 16px;
    color: #9ec4e8;
    text-decoration: none;
    border: 1px solid transparent;
    border-radius: 4px;
    transition: 0.2s;
    &.active,
    &:hover {
      color: #fff;
      border-color: rgba(64, 158, 255, 0.55);
      background: rgba(32, 120, 220, 0.25);
    }
  }
}

.user-box {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  .uname {
    color: #cfe8ff;
    font-size: 13px;
  }
  .el-dropdown-link {
    color: #79b7ff;
    cursor: pointer;
  }
}

.main-area {
  flex: 1;
  padding: 14px 16px 18px;
  min-height: 0;
}

@media (max-width: 1100px) {
  .top-bar {
    grid-template-columns: 1fr;
    height: auto;
    gap: 10px;
    padding: 12px;
  }
  .user-box {
    justify-content: flex-start;
  }
}
</style>
