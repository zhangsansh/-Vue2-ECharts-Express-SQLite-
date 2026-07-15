const express = require('express')
const bcrypt = require('bcryptjs')
const db = require('../db')
const { signToken, ROLE_PERMISSIONS, authRequired } = require('../middleware/auth')
const { ensureSmsSchema, sendLoginCode, verifyLoginCode } = require('../services/sms')

const router = express.Router()
ensureSmsSchema()

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    name: row.name,
    role: row.role,
    permissions: ROLE_PERMISSIONS[row.role]
  }
}

// 邮箱密码登录
router.post('/login/email', (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ message: '请输入邮箱和密码' })
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).trim())
  if (!user || !user.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: '邮箱或密码错误' })
  }
  const token = signToken(user)
  res.json({ token, user: publicUser(user), message: '登录成功' })
})

// 发送手机登录验证码
router.post('/sms/send', (req, res) => {
  try {
    const result = sendLoginCode(req.body && req.body.phone)
    res.json(result)
  } catch (e) {
    res.status(e.status || 500).json({
      message: e.message || '验证码发送失败',
      wait: e.wait
    })
  }
})

// 手机验证码登录
router.post('/login/phone', (req, res) => {
  try {
    const { phone, code } = req.body || {}
    const user = verifyLoginCode(phone, code)
    const token = signToken(user)
    res.json({ token, user: publicUser(user), message: '登录成功' })
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message || '登录失败' })
  }
})

router.get('/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  if (!user) return res.status(404).json({ message: '用户不存在' })
  res.json({ user: publicUser(user) })
})

module.exports = router
