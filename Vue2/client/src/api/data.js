import http from './http'

export function fetchData(category, params) {
  return http.get(`/data/${category}`, { params })
}

export function createData(category, data) {
  return http.post(`/data/${category}`, data)
}

export function updateData(category, id, data) {
  return http.put(`/data/${category}/${id}`, data)
}

export function deleteData(category, id) {
  return http.delete(`/data/${category}/${id}`)
}

export function importData(category, file, mode = 'append') {
  const form = new FormData()
  form.append('file', file)
  form.append('mode', mode)
  return http.post(`/data/${category}/import`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function exportData(category, format) {
  return http.get(`/data/${category}/export/${format}`, {
    responseType: 'blob'
  })
}

export function downloadSqlite() {
  return http.get('/sqlite/download', { responseType: 'blob' })
}
