<template>
  <div class="users-page" v-loading="loading">
    <div class="toolbar">
      <div>
        <h2>用户与权限管理</h2>
        <p>仅管理员可访问。角色决定大屏数据增删改查与导入导出能力。</p>
      </div>
      <div>
        <el-button size="small" @click="$router.push('/traffic')">返回大屏</el-button>
        <el-button size="small" type="primary" @click="openCreate">新增用户</el-button>
      </div>
    </div>

    <el-table :data="rows" border class="dark-table">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="email" label="邮箱" min-width="180" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="role" label="角色" width="100">
        <template slot-scope="{ row }">
          {{ roleLabel(row.role) }}
        </template>
      </el-table-column>
      <el-table-column label="权限" min-width="220">
        <template slot-scope="{ row }">
          <el-tag v-if="row.permissions.view" size="mini">查看</el-tag>
          <el-tag v-if="row.permissions.edit" size="mini" type="success">编辑</el-tag>
          <el-tag v-if="row.permissions.import" size="mini" type="warning">导入</el-tag>
          <el-tag v-if="row.permissions.export" size="mini" type="info">导出</el-tag>
          <el-tag v-if="row.permissions.manageUsers" size="mini" type="danger">用户管理</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template slot-scope="{ row }">
          <el-button type="text" @click="openEdit(row)">编辑</el-button>
          <el-button type="text" style="color: #f56c6c" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="form.id ? '编辑用户' : '新增用户'" :visible.sync="visible" width="480px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="姓名">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" maxlength="11" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            :placeholder="form.id ? '不修改请留空' : '必填'"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role" style="width: 100%">
            <el-option label="管理员（全权限）" value="admin" />
            <el-option label="编辑员（可改数据/导入导出）" value="editor" />
            <el-option label="访客（仅查看+导出）" value="viewer" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="perm-hint">
        <p><b>admin</b>：查看、编辑、导入、导出、用户管理</p>
        <p><b>editor</b>：查看、编辑、导入、导出</p>
        <p><b>viewer</b>：查看、导出（不可改数据）</p>
      </div>
      <span slot="footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { fetchUsers, createUser, updateUser, deleteUser } from '@/api/users'

export default {
  name: 'UsersPage',
  data() {
    return {
      loading: false,
      saving: false,
      rows: [],
      visible: false,
      form: {
        id: null,
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'viewer'
      }
    }
  },
  created() {
    this.load()
  },
  methods: {
    roleLabel(role) {
      return { admin: '管理员', editor: '编辑员', viewer: '访客' }[role] || role
    },
    async load() {
      this.loading = true
      try {
        const { data } = await fetchUsers()
        this.rows = data.data || []
      } finally {
        this.loading = false
      }
    },
    openCreate() {
      this.form = {
        id: null,
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'viewer'
      }
      this.visible = true
    },
    openEdit(row) {
      this.form = {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        password: '',
        role: row.role
      }
      this.visible = true
    },
    async save() {
      if (!this.form.name || !this.form.role) {
        this.$message.warning('请完善信息')
        return
      }
      if (!this.form.id && !this.form.password) {
        this.$message.warning('新用户必须设置密码')
        return
      }
      this.saving = true
      try {
        const payload = { ...this.form }
        delete payload.id
        if (!payload.password) delete payload.password
        if (this.form.id) {
          await updateUser(this.form.id, payload)
        } else {
          await createUser(payload)
        }
        this.$message.success('保存成功')
        this.visible = false
        this.load()
      } finally {
        this.saving = false
      }
    },
    async onDelete(row) {
      await this.$confirm(`确认删除用户「${row.name}」？`, '提示', { type: 'warning' })
      await deleteUser(row.id)
      this.$message.success('已删除')
      this.load()
    }
  }
}
</script>

<style lang="scss" scoped>
.users-page {
  background: rgba(8, 28, 52, 0.55);
  border: 1px solid rgba(64, 158, 255, 0.25);
  border-radius: 8px;
  padding: 16px;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 12px;
  h2 {
    font-size: 18px;
    margin-bottom: 6px;
  }
  p {
    color: #8db4d8;
    font-size: 12px;
  }
}
.perm-hint {
  margin: 0 20px 10px;
  font-size: 12px;
  color: #8db4d8;
  line-height: 1.7;
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
}
</style>
