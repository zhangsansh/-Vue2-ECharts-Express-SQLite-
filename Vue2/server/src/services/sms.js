const db = require('../db')

const CODE_TTL_MS = 5 * 60 * 1000
const RESEND_INTERVAL_SEC = 60
const MAX_VERIFY_ATTEMPTS = 5

function formatLocalDateTime(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function ensureSmsSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sms_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `)
  try {
    const cols = db.prepare('PRAGMA table_info(sms_codes)').all().map((c) => c.name)
    if (!cols.includes('attempts')) {
      db.exec('ALTER TABLE sms_codes ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0')
    }
    if (!cols.includes('used')) {
      db.exec('ALTER TABLE sms_codes ADD COLUMN used INTEGER NOT NULL DEFAULT 0')
    }
  } catch (e) {
    /* ignore */
  }
}

function findUserByPhone(phone) {
  return db.prepare('SELECT * FROM users WHERE phone = ?').get(String(phone).trim())
}

function getLatestCode(phone) {
  return db
    .prepare(
      `SELECT * FROM sms_codes WHERE phone = ? AND used = 0 ORDER BY id DESC LIMIT 1`
    )
    .get(String(phone).trim())
}

/**
 * 发送验证码（演示环境写入数据库并返回 code；可替换为真实短信网关）
 */
function sendLoginCode(phone) {
  const normalized = String(phone || '').trim()
  if (!/^1\d{10}$/.test(normalized)) {
    const err = new Error('请输入有效的中国大陆手机号')
    err.status = 400
    throw err
  }

  const user = findUserByPhone(normalized)
  if (!user) {
    const err = new Error('该手机号未注册，请联系管理员开通账号')
    err.status = 404
    throw err
  }

  const latest = db
    .prepare('SELECT * FROM sms_codes WHERE phone = ? ORDER BY id DESC LIMIT 1')
    .get(normalized)
  if (latest) {
    const created = new Date(String(latest.created_at).replace(' ', 'T')).getTime()
    const elapsed = (Date.now() - created) / 1000
    if (elapsed < RESEND_INTERVAL_SEC) {
      const wait = Math.ceil(RESEND_INTERVAL_SEC - elapsed)
      const err = new Error(`发送过于频繁，请 ${wait} 秒后再试`)
      err.status = 429
      err.wait = wait
      throw err
    }
  }

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = formatLocalDateTime(new Date(Date.now() + CODE_TTL_MS))

  db.prepare('UPDATE sms_codes SET used = 1 WHERE phone = ? AND used = 0').run(normalized)
  db.prepare(
    `INSERT INTO sms_codes (phone, code, expires_at, attempts, used, created_at)
     VALUES (?, ?, ?, 0, 0, ?)`
  ).run(normalized, code, expiresAt, formatLocalDateTime())

  // 可在此接入阿里云/腾讯云短信；当前为本地演示模式
  console.log(`[短信验证码] ${normalized} => ${code} （有效至 ${expiresAt}）`)

  return {
    phone: normalized,
    expiresIn: CODE_TTL_MS / 1000,
    resendAfter: RESEND_INTERVAL_SEC,
    // 演示环境返回验证码，便于联调；上线真实短信后可改为不返回
    demoCode: code,
    message: '验证码已发送，5 分钟内有效'
  }
}

/**
 * 校验验证码并返回对应用户
 */
function verifyLoginCode(phone, code) {
  const normalized = String(phone || '').trim()
  const inputCode = String(code || '').trim()

  if (!/^1\d{10}$/.test(normalized)) {
    const err = new Error('请输入有效的手机号')
    err.status = 400
    throw err
  }
  if (!/^\d{6}$/.test(inputCode)) {
    const err = new Error('请输入 6 位数字验证码')
    err.status = 400
    throw err
  }

  const user = findUserByPhone(normalized)
  if (!user) {
    const err = new Error('该手机号未注册，请联系管理员')
    err.status = 404
    throw err
  }

  const record = getLatestCode(normalized)
  if (!record) {
    const err = new Error('请先获取验证码')
    err.status = 400
    throw err
  }

  const expiresMs = new Date(String(record.expires_at).replace(' ', 'T')).getTime()
  if (Number.isNaN(expiresMs) || expiresMs < Date.now()) {
    db.prepare('UPDATE sms_codes SET used = 1 WHERE id = ?').run(record.id)
    const err = new Error('验证码已过期，请重新获取')
    err.status = 401
    throw err
  }

  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    db.prepare('UPDATE sms_codes SET used = 1 WHERE id = ?').run(record.id)
    const err = new Error('验证码错误次数过多，请重新获取')
    err.status = 401
    throw err
  }

  if (record.code !== inputCode) {
    db.prepare('UPDATE sms_codes SET attempts = attempts + 1 WHERE id = ?').run(record.id)
    const left = MAX_VERIFY_ATTEMPTS - (record.attempts + 1)
    const err = new Error(left > 0 ? `验证码错误，还可尝试 ${left} 次` : '验证码错误，请重新获取')
    err.status = 401
    throw err
  }

  db.prepare('UPDATE sms_codes SET used = 1 WHERE phone = ?').run(normalized)
  return user
}

module.exports = {
  ensureSmsSchema,
  sendLoginCode,
  verifyLoginCode,
  findUserByPhone,
  RESEND_INTERVAL_SEC,
  CODE_TTL_MS
}
