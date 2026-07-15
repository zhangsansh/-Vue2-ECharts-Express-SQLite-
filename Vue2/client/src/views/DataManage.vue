<template>
  <div class="data-page" v-loading="loading">
    <div class="toolbar">
      <div>
        <h2>{{ title }}数据管理</h2>
        <p>
          角色权限：
          <el-tag size="mini" effect="plain">查看</el-tag>
          <el-tag size="mini" :type="canEdit ? 'success' : 'info'" effect="plain">编辑</el-tag>
          <el-tag size="mini" :type="canImport ? 'success' : 'info'" effect="plain">导入</el-tag>
          <el-tag size="mini" :type="canExport ? 'success' : 'info'" effect="plain">导出</el-tag>
        </p>
      </div>
      <div class="actions">
        <el-button size="small" @click="$router.push(`/${category}`)">返回大屏</el-button>
        <el-button v-if="canEdit" size="small" type="primary" @click="openCreate">新增</el-button>
        <el-dropdown v-if="canExport" size="small" @command="onExport">
          <el-button size="small" type="success">
            导出 <i class="el-icon-arrow-down" />
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="xlsx">导出 Excel 表格</el-dropdown-item>
            <el-dropdown-item command="csv">导出 CSV 表格</el-dropdown-item>
            <el-dropdown-item command="json">导出 SQLite JSON</el-dropdown-item>
            <el-dropdown-item divided command="sqlite-db">下载整库 SQLite 文件</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <el-upload
          v-if="canImport"
          action=""
          :show-file-list="false"
          :http-request="onImport"
          accept=".xlsx,.xls,.csv,.json"
        >
          <el-button size="small" type="warning">导入表格/JSON</el-button>
        </el-upload>
        <el-select v-if="canImport" v-model="importMode" size="small" style="width: 120px">
          <el-option label="追加导入" value="append" />
          <el-option label="覆盖导入" value="replace" />
        </el-select>
      </div>
    </div>

    <el-table :data="rows" border height="calc(100vh - 220px)" class="dark-table">
      <el-table-column
        v-for="col in columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :min-width="col.width || 110"
      />
      <el-table-column label="操作" width="160" fixed="right">
        <template slot-scope="{ row }">
          <el-button v-if="canEdit" type="text" @click="openEdit(row)">编辑</el-button>
          <el-button v-if="canEdit" type="text" style="color: #f56c6c" @click="onDelete(row)">
            删除
          </el-button>
          <span v-if="!canEdit" class="muted">只读</span>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="form.id ? '编辑记录' : '新增记录'" :visible.sync="dialogVisible" width="560px">
      <el-form :model="form" label-width="110px">
        <el-form-item v-for="col in columns" :key="col.prop" :label="col.label">
          <el-input
            v-model="form[col.prop]"
            :type="col.numeric ? 'number' : 'text'"
            :disabled="!canEdit"
          />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="canEdit" type="primary" :loading="saving" @click="save">保存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  fetchData,
  createData,
  updateData,
  deleteData,
  importData,
  exportData,
  downloadSqlite
} from '@/api/data'

const SCHEMAS = {
  traffic: {
    title: '交通',
    columns: [
      { prop: 'district', label: '区县' },
      { prop: 'highway_km', label: '公路(km)', numeric: true },
      { prop: 'railway_km', label: '铁路(km)', numeric: true },
      { prop: 'passenger_volume', label: '客运量(万人)', numeric: true },
      { prop: 'freight_volume', label: '货运量(万吨)', numeric: true },
      { prop: 'year', label: '年份', numeric: true }
    ]
  },
  population: {
    title: '人口',
    columns: [
      { prop: 'district', label: '区县' },
      { prop: 'total_pop', label: '总人口(万)', numeric: true },
      { prop: 'urban_pop', label: '城镇(万)', numeric: true },
      { prop: 'rural_pop', label: '乡村(万)', numeric: true },
      { prop: 'density', label: '密度', numeric: true },
      { prop: 'lng', label: '经度', numeric: true },
      { prop: 'lat', label: '纬度', numeric: true },
      { prop: 'year', label: '年份', numeric: true }
    ]
  },
  economy: {
    title: '经济',
    columns: [
      { prop: 'district', label: '区县' },
      { prop: 'gdp', label: 'GDP(亿)', numeric: true },
      { prop: 'primary_industry', label: '一产', numeric: true },
      { prop: 'secondary_industry', label: '二产', numeric: true },
      { prop: 'tertiary_industry', label: '三产', numeric: true },
      { prop: 'revenue', label: '财政收入', numeric: true },
      { prop: 'year', label: '年份', numeric: true }
    ]
  },
  agriculture: {
    title: '农业',
    columns: [
      { prop: 'district', label: '区县' },
      { prop: 'grain_output', label: '粮食(万吨)', numeric: true },
      { prop: 'farmland_mu', label: '耕地(万亩)', numeric: true },
      { prop: 'livestock_count', label: '畜禽(万头)', numeric: true },
      { prop: 'agri_gdp', label: '农业增加值', numeric: true },
      { prop: 'year', label: '年份', numeric: true }
    ]
  }
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

export default {
  name: 'DataManage',
  data() {
    return {
      loading: false,
      saving: false,
      rows: [],
      dialogVisible: false,
      importMode: 'append',
      form: {}
    }
  },
  computed: {
    ...mapGetters(['canEdit', 'canImport', 'canExport']),
    category() {
      return this.$route.params.category
    },
    schema() {
      return SCHEMAS[this.category] || SCHEMAS.traffic
    },
    title() {
      return this.schema.title
    },
    columns() {
      return this.schema.columns
    }
  },
  watch: {
    category: {
      immediate: true,
      handler() {
        this.load()
      }
    }
  },
  methods: {
    async load() {
      this.loading = true
      try {
        const { data } = await fetchData(this.category)
        this.rows = data.data || []
      } finally {
        this.loading = false
      }
    },
    emptyForm() {
      const form = { id: null }
      this.columns.forEach((c) => {
        form[c.prop] = c.prop === 'year' ? 2024 : c.numeric ? 0 : ''
      })
      return form
    },
    openCreate() {
      this.form = this.emptyForm()
      this.dialogVisible = true
    },
    openEdit(row) {
      this.form = { ...row }
      this.dialogVisible = true
    },
    async save() {
      this.saving = true
      try {
        const payload = { ...this.form }
        delete payload.id
        delete payload.updated_at
        if (this.form.id) {
          await updateData(this.category, this.form.id, payload)
        } else {
          await createData(this.category, payload)
        }
        this.$message.success('保存成功')
        this.dialogVisible = false
        this.load()
      } finally {
        this.saving = false
      }
    },
    async onDelete(row) {
      await this.$confirm(`确认删除「${row.district}」记录？`, '提示', { type: 'warning' })
      await deleteData(this.category, row.id)
      this.$message.success('已删除')
      this.load()
    },
    async onExport(format) {
      if (format === 'sqlite-db') {
        const { data } = await downloadSqlite()
        downloadBlob(data, 'nanyang.db')
        return
      }
      const { data } = await exportData(this.category, format)
      const ext = format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'xlsx'
      downloadBlob(data, `${this.category}_data.${ext}`)
    },
    async onImport(req) {
      try {
        await this.$confirm(
          this.importMode === 'replace'
            ? '覆盖导入将清空当前类别全部数据，是否继续？'
            : '确认追加导入？',
          '导入确认',
          { type: 'warning' }
        )
        const { data } = await importData(this.category, req.file, this.importMode)
        this.$message.success(data.message)
        this.load()
      } catch (e) {
        /* cancel or error */
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.data-page {
  background: rgba(8, 28, 52, 0.55);
  border: 1px solid rgba(64, 158, 255, 0.25);
  border-radius: 8px;
  padding: 16px;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
  h2 {
    font-size: 18px;
    margin-bottom: 6px;
  }
  p {
    color: #8db4d8;
    font-size: 12px;
    display: flex;
    gap: 6px;
    align-items: center;
  }
}
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.muted {
  color: #8099b3;
  font-size: 12px;
}
::v-deep .dark-table {
  background: transparent;
  color: #dcebff;
  th,
  tr {
    background: #0b1f38 !important;
    color: #dcebff;
  }
  td,
  th {
    border-color: #1e3a5c !important;
  }
  .el-table__body tr:hover > td {
    background: #123255 !important;
  }
}
</style>
