import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '@/store'

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/ScreenLayout.vue'),
    redirect: '/traffic',
    children: [
      {
        path: 'traffic',
        name: 'Traffic',
        component: () => import('@/views/screens/Traffic.vue'),
        meta: { title: '交通专题', category: 'traffic' }
      },
      {
        path: 'population',
        name: 'Population',
        component: () => import('@/views/screens/Population.vue'),
        meta: { title: '人口专题', category: 'population' }
      },
      {
        path: 'economy',
        name: 'Economy',
        component: () => import('@/views/screens/Economy.vue'),
        meta: { title: '经济专题', category: 'economy' }
      },
      {
        path: 'agriculture',
        name: 'Agriculture',
        component: () => import('@/views/screens/Agriculture.vue'),
        meta: { title: '农业专题', category: 'agriculture' }
      },
      {
        path: 'data/:category',
        name: 'DataManage',
        component: () => import('@/views/DataManage.vue'),
        meta: { title: '数据管理' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/Users.vue'),
        meta: { title: '用户权限', requireAdmin: true }
      }
    ]
  }
]

const router = new VueRouter({
  mode: 'hash',
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.public) return next()
  if (!store.getters.isLogin) return next({ path: '/login', query: { redirect: to.fullPath } })
  if (to.meta.requireAdmin && !store.getters.canManageUsers) {
    return next('/traffic')
  }
  next()
})

export default router
