import axios from 'axios'
import store from '@/store'
import router from '@/router'
import { Message } from 'element-ui'

const http = axios.create({
  baseURL: '/api',
  timeout: 30000
})

http.interceptors.request.use((config) => {
  if (store.state.token) {
    config.headers.Authorization = `Bearer ${store.state.token}`
  }
  return config
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = (err.response && err.response.data && err.response.data.message) || err.message
    if (err.response && err.response.status === 401) {
      store.dispatch('logout')
      if (router.currentRoute.path !== '/login') {
        router.replace('/login')
      }
    }
    Message.error(msg || '请求失败')
    return Promise.reject(err)
  }
)

export default http
