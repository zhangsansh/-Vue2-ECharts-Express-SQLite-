const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'nanyang-dashboard-secret-2024'

const ROLE_PERMISSIONS = {
  admin: {
    view: true,
    edit: true,
    import: true,
    export: true,
    manageUsers: true
  },
  editor: {
    view: true,
    edit: true,
    import: true,
    export: true,
    manageUsers: false
  },
  viewer: {
    view: true,
    edit: false,
    import: false,
    export: true,
    manageUsers: false
  }
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, phone: user.phone, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '12h' }
  )
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return res.status(401).json({ message: '未登录或登录已过期' })
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    req.permissions = ROLE_PERMISSIONS[payload.role] || ROLE_PERMISSIONS.viewer
    next()
  } catch (e) {
    return res.status(401).json({ message: '未登录或登录已过期' })
  }
}

function requirePermission(key) {
  return (req, res, next) => {
    if (!req.permissions || !req.permissions[key]) {
      return res.status(403).json({ message: `当前角色无「${key}」权限` })
    }
    next()
  }
}

module.exports = {
  JWT_SECRET,
  ROLE_PERMISSIONS,
  signToken,
  authRequired,
  requirePermission
}
