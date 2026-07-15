const express = require('express')
const multer = require('multer')
const XLSX = require('xlsx')
const db = require('../db')
const { authRequired, requirePermission } = require('../middleware/auth')

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } })

const TABLES = {
  traffic: {
    table: 'traffic_data',
    columns: ['district', 'highway_km', 'railway_km', 'passenger_volume', 'freight_volume', 'year'],
    numeric: ['highway_km', 'railway_km', 'passenger_volume', 'freight_volume', 'year']
  },
  population: {
    table: 'population_data',
    columns: ['district', 'total_pop', 'urban_pop', 'rural_pop', 'density', 'lng', 'lat', 'year'],
    numeric: ['total_pop', 'urban_pop', 'rural_pop', 'density', 'lng', 'lat', 'year']
  },
  economy: {
    table: 'economy_data',
    columns: ['district', 'gdp', 'primary_industry', 'secondary_industry', 'tertiary_industry', 'revenue', 'year'],
    numeric: ['gdp', 'primary_industry', 'secondary_industry', 'tertiary_industry', 'revenue', 'year']
  },
  agriculture: {
    table: 'agriculture_data',
    columns: ['district', 'grain_output', 'farmland_mu', 'livestock_count', 'agri_gdp', 'year'],
    numeric: ['grain_output', 'farmland_mu', 'livestock_count', 'agri_gdp', 'year']
  }
}

function getConfig(category) {
  const cfg = TABLES[category]
  if (!cfg) {
    const err = new Error('未知数据类别')
    err.status = 404
    throw err
  }
  return cfg
}

function normalizeRow(cfg, row) {
  const out = {}
  cfg.columns.forEach((col) => {
    let val = row[col]
    if (val === undefined || val === null || val === '') {
      out[col] = cfg.numeric.includes(col) ? 0 : ''
      return
    }
    if (cfg.numeric.includes(col)) {
      out[col] = Number(val)
    } else {
      out[col] = String(val).trim()
    }
  })
  return out
}

router.use(authRequired)

// 列表
router.get('/:category', requirePermission('view'), (req, res) => {
  try {
    const cfg = getConfig(req.params.category)
    const year = req.query.year
    let rows
    if (year) {
      rows = db.prepare(`SELECT * FROM ${cfg.table} WHERE year = ? ORDER BY id`).all(Number(year))
    } else {
      rows = db.prepare(`SELECT * FROM ${cfg.table} ORDER BY year DESC, id`).all()
    }
    res.json({ data: rows, permissions: req.permissions })
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message })
  }
})

// 概览统计
router.get('/:category/summary', requirePermission('view'), (req, res) => {
  try {
    const cfg = getConfig(req.params.category)
    const year = Number(req.query.year) || 2024
    const rows = db.prepare(`SELECT * FROM ${cfg.table} WHERE year = ?`).all(year)
    res.json({ data: rows, year })
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message })
  }
})

// 新增
router.post('/:category', requirePermission('edit'), (req, res) => {
  try {
    const cfg = getConfig(req.params.category)
    const row = normalizeRow(cfg, req.body || {})
    if (!row.district) return res.status(400).json({ message: '区县名称必填' })
    const cols = cfg.columns.join(', ')
    const placeholders = cfg.columns.map((c) => `@${c}`).join(', ')
    const info = db.prepare(`INSERT INTO ${cfg.table} (${cols}) VALUES (${placeholders})`).run(row)
    const created = db.prepare(`SELECT * FROM ${cfg.table} WHERE id = ?`).get(info.lastInsertRowid)
    res.json({ data: created })
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message })
  }
})

// 更新
router.put('/:category/:id', requirePermission('edit'), (req, res) => {
  try {
    const cfg = getConfig(req.params.category)
    const id = Number(req.params.id)
    const exist = db.prepare(`SELECT * FROM ${cfg.table} WHERE id = ?`).get(id)
    if (!exist) return res.status(404).json({ message: '记录不存在' })
    const row = normalizeRow(cfg, { ...exist, ...req.body })
    const sets = cfg.columns.map((c) => `${c} = @${c}`).join(', ')
    db.prepare(
      `UPDATE ${cfg.table} SET ${sets}, updated_at = datetime('now','localtime') WHERE id = @id`
    ).run({ ...row, id })
    const updated = db.prepare(`SELECT * FROM ${cfg.table} WHERE id = ?`).get(id)
    res.json({ data: updated })
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message })
  }
})

// 删除
router.delete('/:category/:id', requirePermission('edit'), (req, res) => {
  try {
    const cfg = getConfig(req.params.category)
    const info = db.prepare(`DELETE FROM ${cfg.table} WHERE id = ?`).run(Number(req.params.id))
    if (!info.changes) return res.status(404).json({ message: '记录不存在' })
    res.json({ message: '已删除' })
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message })
  }
})

// 导出 Excel / CSV
router.get('/:category/export/:format', requirePermission('export'), (req, res) => {
  try {
    const cfg = getConfig(req.params.category)
    const format = req.params.format
    const rows = db.prepare(`SELECT * FROM ${cfg.table} ORDER BY year DESC, id`).all()
    const sheet = XLSX.utils.json_to_sheet(rows)
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, cfg.table)

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(sheet)
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="${cfg.table}.csv"`)
      return res.send('\uFEFF' + csv)
    }

    if (format === 'xlsx' || format === 'excel') {
      const buffer = XLSX.write(book, { type: 'buffer', bookType: 'xlsx' })
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      res.setHeader('Content-Disposition', `attachment; filename="${cfg.table}.xlsx"`)
      return res.send(buffer)
    }

    // sqlite dump as json rows packaged - also support "sqlite" export as db copy of table json for portability
    if (format === 'sqlite' || format === 'json') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="${cfg.table}.json"`)
      return res.send(JSON.stringify({ table: cfg.table, columns: cfg.columns, data: rows }, null, 2))
    }

    return res.status(400).json({ message: '支持格式: xlsx / csv / json(sqlite数据)' })
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message })
  }
})

// 导入 Excel / CSV / JSON(Sqlite导出)
router.post(
  '/:category/import',
  requirePermission('import'),
  upload.single('file'),
  (req, res) => {
    try {
      const cfg = getConfig(req.params.category)
      if (!req.file) return res.status(400).json({ message: '请上传文件' })

      const name = (req.file.originalname || '').toLowerCase()
      let rows = []

      if (name.endsWith('.json')) {
        const parsed = JSON.parse(req.file.buffer.toString('utf8'))
        rows = Array.isArray(parsed) ? parsed : parsed.data || []
      } else {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' })
      }

      if (!rows.length) return res.status(400).json({ message: '文件无有效数据' })

      const insert = db.prepare(
        `INSERT INTO ${cfg.table} (${cfg.columns.join(', ')}) VALUES (${cfg.columns
          .map((c) => `@${c}`)
          .join(', ')})`
      )

      const mode = req.body.mode === 'replace' ? 'replace' : 'append'
      const tx = db.transaction((list) => {
        if (mode === 'replace') {
          db.prepare(`DELETE FROM ${cfg.table}`).run()
        }
        let n = 0
        list.forEach((raw) => {
          const row = normalizeRow(cfg, raw)
          if (!row.district) return
          insert.run(row)
          n += 1
        })
        return n
      })

      const imported = tx(rows)
      res.json({ message: `成功导入 ${imported} 条`, imported, mode })
    } catch (e) {
      res.status(e.status || 500).json({ message: e.message || '导入失败' })
    }
  }
)

// 导出整库 SQLite 文件
router.get('/db/download', requirePermission('export'), (req, res) => {
  const path = require('path')
  const fs = require('fs')
  const dbPath = path.join(__dirname, '../../data/nanyang.db')
  if (!fs.existsSync(dbPath)) return res.status(404).json({ message: '数据库文件不存在' })
  res.download(dbPath, 'nanyang.db')
})

module.exports = router
