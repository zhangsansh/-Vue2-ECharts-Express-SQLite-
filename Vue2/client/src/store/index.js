import Vue from 'vue'
import Vuex from 'vuex'
import { getMe } from '@/api/auth'

Vue.use(Vuex)

const saved = (() => {
  try {
    return JSON.parse(localStorage.getItem('ny_auth') || 'null')
  } catch (e) {
    return null
  }
})()

export default new Vuex.Store({
  state: {
    token: (saved && saved.token) || '',
    user: (saved && saved.user) || null
  },
  getters: {
    isLogin: (s) => !!s.token,
    permissions: (s) => (s.user && s.user.permissions) || {},
    role: (s) => (s.user && s.user.role) || '',
    canEdit: (s, g) => !!g.permissions.edit,
    canImport: (s, g) => !!g.permissions.import,
    canExport: (s, g) => !!g.permissions.export,
    canManageUsers: (s, g) => !!g.permissions.manageUsers
  },
  mutations: {
    SET_AUTH(state, { token, user }) {
      state.token = token
      state.user = user
      localStorage.setItem('ny_auth', JSON.stringify({ token, user }))
    },
    CLEAR_AUTH(state) {
      state.token = ''
      state.user = null
      localStorage.removeItem('ny_auth')
    },
    SET_USER(state, user) {
      state.user = user
      const raw = localStorage.getItem('ny_auth')
      const savedAuth = raw ? JSON.parse(raw) : {}
      localStorage.setItem('ny_auth', JSON.stringify({ ...savedAuth, token: state.token, user }))
    }
  },
  actions: {
    loginSuccess({ commit }, payload) {
      commit('SET_AUTH', payload)
    },
    logout({ commit }) {
      commit('CLEAR_AUTH')
    },
    async refreshMe({ commit, state }) {
      if (!state.token) return
      const { data } = await getMe()
      commit('SET_USER', data.user)
    }
  }
})
