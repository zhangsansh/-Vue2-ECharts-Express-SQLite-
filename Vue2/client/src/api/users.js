import http from './http'

export function fetchUsers() {
  return http.get('/users')
}

export function createUser(data) {
  return http.post('/users', data)
}

export function updateUser(id, data) {
  return http.put(`/users/${id}`, data)
}

export function deleteUser(id) {
  return http.delete(`/users/${id}`)
}
