const bcrypt = require('bcryptjs')
const db = require('./db')

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password_hash TEXT,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer' CHECK(role IN ('admin','editor','viewer')),
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS sms_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS traffic_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      district TEXT NOT NULL,
      highway_km REAL DEFAULT 0,
      railway_km REAL DEFAULT 0,
      passenger_volume REAL DEFAULT 0,
      freight_volume REAL DEFAULT 0,
      year INTEGER NOT NULL,
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS population_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      district TEXT NOT NULL,
      total_pop REAL DEFAULT 0,
      urban_pop REAL DEFAULT 0,
      rural_pop REAL DEFAULT 0,
      density REAL DEFAULT 0,
      lng REAL,
      lat REAL,
      year INTEGER NOT NULL,
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS economy_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      district TEXT NOT NULL,
      gdp REAL DEFAULT 0,
      primary_industry REAL DEFAULT 0,
      secondary_industry REAL DEFAULT 0,
      tertiary_industry REAL DEFAULT 0,
      revenue REAL DEFAULT 0,
      year INTEGER NOT NULL,
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS agriculture_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      district TEXT NOT NULL,
      grain_output REAL DEFAULT 0,
      farmland_mu REAL DEFAULT 0,
      livestock_count REAL DEFAULT 0,
      agri_gdp REAL DEFAULT 0,
      year INTEGER NOT NULL,
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `)
}

function seedUsers() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c
  if (count > 0) return

  const hash = bcrypt.hashSync('Admin@123', 10)
  const editorHash = bcrypt.hashSync('Editor@123', 10)
  const viewerHash = bcrypt.hashSync('Viewer@123', 10)

  const insert = db.prepare(`
    INSERT INTO users (email, phone, password_hash, name, role)
    VALUES (?, ?, ?, ?, ?)
  `)

  insert.run('admin@nanyang.gov.cn', '13800000001', hash, '系统管理员', 'admin')
  insert.run('editor@nanyang.gov.cn', '13800000002', editorHash, '数据编辑员', 'editor')
  insert.run('viewer@nanyang.gov.cn', '13800000003', viewerHash, '只读访客', 'viewer')
}

function seedDistrictData() {
  const trafficCount = db.prepare('SELECT COUNT(*) AS c FROM traffic_data').get().c
  if (trafficCount > 0) return

  const districts = [
    { name: '宛城区', lng: 112.5395, lat: 33.0036 },
    { name: '卧龙区', lng: 112.5288, lat: 32.9899 },
    { name: '南召县', lng: 112.4291, lat: 33.4899 },
    { name: '方城县', lng: 113.0128, lat: 33.2551 },
    { name: '西峡县', lng: 111.4735, lat: 33.3079 },
    { name: '镇平县', lng: 112.2345, lat: 33.0342 },
    { name: '内乡县', lng: 111.8493, lat: 33.0448 },
    { name: '淅川县', lng: 111.4909, lat: 33.1379 },
    { name: '社旗县', lng: 112.9481, lat: 33.0561 },
    { name: '唐河县', lng: 112.8076, lat: 32.6814 },
    { name: '新野县', lng: 112.3600, lat: 32.5208 },
    { name: '桐柏县', lng: 113.4091, lat: 32.3792 },
    { name: '邓州市', lng: 112.0874, lat: 32.6877 }
  ]

  const year = 2024
  const insertTraffic = db.prepare(`
    INSERT INTO traffic_data (district, highway_km, railway_km, passenger_volume, freight_volume, year)
    VALUES (@district, @highway_km, @railway_km, @passenger_volume, @freight_volume, @year)
  `)
  const insertPop = db.prepare(`
    INSERT INTO population_data (district, total_pop, urban_pop, rural_pop, density, lng, lat, year)
    VALUES (@district, @total_pop, @urban_pop, @rural_pop, @density, @lng, @lat, @year)
  `)
  const insertEco = db.prepare(`
    INSERT INTO economy_data (district, gdp, primary_industry, secondary_industry, tertiary_industry, revenue, year)
    VALUES (@district, @gdp, @primary_industry, @secondary_industry, @tertiary_industry, @revenue, @year)
  `)
  const insertAgri = db.prepare(`
    INSERT INTO agriculture_data (district, grain_output, farmland_mu, livestock_count, agri_gdp, year)
    VALUES (@district, @grain_output, @farmland_mu, @livestock_count, @agri_gdp, @year)
  `)

  const seed = db.transaction(() => {
    districts.forEach((d, i) => {
      const factor = 0.7 + (i % 5) * 0.15
      insertTraffic.run({
        district: d.name,
        highway_km: Math.round(180 * factor * 10) / 10,
        railway_km: Math.round(45 * factor * 10) / 10,
        passenger_volume: Math.round(320 * factor),
        freight_volume: Math.round(850 * factor),
        year
      })
      const total = Math.round(55 + factor * 40 + (i % 3) * 12)
      const urban = Math.round(total * (0.35 + (i % 4) * 0.05))
      insertPop.run({
        district: d.name,
        total_pop: total,
        urban_pop: urban,
        rural_pop: total - urban,
        density: Math.round(total * 18 + 80),
        lng: d.lng,
        lat: d.lat,
        year
      })
      const gdp = Math.round(280 * factor + (i % 4) * 40)
      insertEco.run({
        district: d.name,
        gdp,
        primary_industry: Math.round(gdp * 0.12),
        secondary_industry: Math.round(gdp * 0.42),
        tertiary_industry: Math.round(gdp * 0.46),
        revenue: Math.round(gdp * 0.08),
        year
      })
      insertAgri.run({
        district: d.name,
        grain_output: Math.round(38 * factor + 10),
        farmland_mu: Math.round(55 * factor + 20),
        livestock_count: Math.round(28 * factor + 5),
        agri_gdp: Math.round(45 * factor + 8),
        year
      })
    })
  })
  seed()
}

function initDb() {
  initSchema()
  seedUsers()
  seedDistrictData()
  console.log('数据库初始化完成:', require('path').join(__dirname, '../data/nanyang.db'))
  console.log('演示账号:')
  console.log('  管理员: admin@nanyang.gov.cn / Admin@123 (手机 13800000001)')
  console.log('  编辑员: editor@nanyang.gov.cn / Editor@123 (手机 13800000002)')
  console.log('  访客:   viewer@nanyang.gov.cn / Viewer@123 (手机 13800000003)')
}

if (require.main === module) {
  initDb()
}

module.exports = { initDb, initSchema }
