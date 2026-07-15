const express = require('express')
const bcrypt = require('bcryptjs')
const db = require('../db')
const { authRequired, requirePermission, ROLE_PERMISSIONS } = require('../middleware/auth')

const router = express.Router()

router.use(authRequired)
router.use(requirePermission('manageUsers'))

router.get('/', (req, res) => {
  const users = db
    .prepare('SELECT id, email, phone, name, role, created_at FROM users ORDER BY id')
    .all()
  res.json({
    data: users.map((u) => ({ ...u, permissions: ROLE_PERMISSIONS[u.role] }))
  })
})

router.post('/', (req, res) => {
  const { email, phone, password, name, role } = req.body || {}
  if (!name || !password || !role) {
    return res.status(400).json({ message: '姓名、密码、角色必填' })
  }
  if (!['admin', 'editor', 'viewer'].includes(role)) {
    return res.status(400).json({ message: '角色无效' })
  }
  try {
    const hash = bcrypt.hashSync(password, 10)
    const info = db
      .prepare(
        'INSERT INTO users (email, phone, password_hash, name, role) VALUES (?, ?, ?, ?, ?)'
      )
      .run(email || null, phone || null, hash, name, role)
    const user = db
      .prepare('SELECT id, email, phone, name, role, created_at FROM users WHERE id = ?')
      .get(info.lastInsertRowid)
    res.json({ data: user })
  } catch (e) {
    res.status(400).json({ message: e.message.includes('UNIQUE') ? '邮箱或手机号已存在' : e.message })
  }
})

router.put('/:id', (req, res) => {
  const id = Number(req.params.id)
  const exist = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  if (!exist) return res.status(404).json({ message: '用户不存在' })

  const { email, phone, password, name, role } = req.body || {}
  const nextRole = role || exist.role
  if (!['admin', 'editor', 'viewer'].includes(nextRole)) {
    return res.status(400).json({ message: '角色无效' })
  }

  const hash = password ? bcrypt.hashSync(password, 10) : exist.password_hash
  try {
    db.prepare(
      `UPDATE users SET email = ?, phone = ?, password_hash = ?, name = ?, role = ? WHERE id = ?`
    ).run(email ?? exist.email, phone ?? exist.phone, hash, name || exist.name, nextRole, id)
    const user = db
      .prepare('SELECT id, email, phone, name, role, created_at FROM users WHERE id = ?')
      .get(id)
    res.json({ data: user })
  } catch (e) {
    res.status(400).json({ message: e.message.includes('UNIQUE') ? '邮箱或手机号已存在' : e.message })
  }
})

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id)
  if (id === req.user.id) {
    return res.status(400).json({ message: '不能删除当前登录账号' })
  }
  const info = db.prepare('DELETE FROM users WHERE id = ?').run(id)
  if (!info.changes) return res.status(404).json({ message: '用户不存在' })
  res.json({ message: '已删除' })
})

module.exports = router
