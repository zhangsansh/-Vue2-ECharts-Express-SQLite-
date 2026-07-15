import http from './http'

export function loginByEmail(data) {
  return http.post('/auth/login/email', data)
}

export function sendSms(data) {
  return http.post('/auth/sms/send', data)
}

export function loginByPhone(data) {
  return http.post('/auth/login/phone', data)
}

export function getMe() {
  return http.get('/auth/me')
}
