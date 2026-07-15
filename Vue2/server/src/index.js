const express = require('express')
const cors = require('cors')
const path = require('path')
const { initDb } = require('./initDb')

initDb()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/api/health', (req, res) => {
  res.json({ ok: true, name: '南阳市数据可视化大屏 API' })
})

app.use('/api/auth', require('./routes/auth'))
app.use('/api/data', require('./routes/data'))
app.use('/api/users', require('./routes/users'))

// 整库下载放在 data 路由内部路径冲突前的独立入口
app.get('/api/sqlite/download', require('./middleware/auth').authRequired, require('./middleware/auth').requirePermission('export'), (req, res) => {
  const dbPath = path.join(__dirname, '../data/nanyang.db')
  res.download(dbPath, 'nanyang.db')
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ message: err.message || '服务器错误' })
})

app.listen(PORT, () => {
  console.log(`API 服务已启动: http://localhost:${PORT}`)
})
