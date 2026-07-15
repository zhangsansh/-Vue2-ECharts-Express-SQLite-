<template>
  <div class="login-page">
    <div class="login-panel">
      <div class="panel-left">
        <h1>南阳市<br />数据可视化大屏</h1>
        <p>Vue2 · ECharts · SQLite · 多方式登录</p>
        <ul>
          <li>交通 / 人口 / 经济 / 农业 四专题</li>
          <li>邮箱密码登录 · 手机验证码登录</li>
          <li>管理员 / 编辑员 / 访客 分级权限</li>
        </ul>
      </div>
      <div class="panel-right">
        <el-tabs v-model="tab" stretch @tab-click="onTabChange">
          <el-tab-pane label="邮箱登录" name="email">
            <el-form
              ref="emailForm"
              :model="emailForm"
              :rules="emailRules"
              label-position="top"
              @submit.native.prevent="doEmailLogin"
            >
              <el-form-item label="邮箱" prop="email">
                <el-input
                  v-model="emailForm.email"
                  placeholder="请输入注册邮箱"
                  clearable
                  prefix-icon="el-icon-message"
                />
              </el-form-item>
              <el-form-item label="密码" prop="password">
                <el-input
                  v-model="emailForm.password"
                  type="password"
                  show-password
                  placeholder="请输入密码"
                  prefix-icon="el-icon-lock"
                  @keyup.enter.native="doEmailLogin"
                />
              </el-form-item>
              <el-button type="primary" class="full" :loading="loading" native-type="submit">
                登录
              </el-button>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="手机验证登录" name="phone">
            <el-form
              ref="phoneForm"
              :model="phoneForm"
              :rules="phoneRules"
              label-position="top"
              @submit.native.prevent="doPhoneLogin"
            >
              <el-form-item label="手机号" prop="phone">
                <el-input
                  v-model="phoneForm.phone"
                  placeholder="请输入 11 位手机号"
                  maxlength="11"
                  clearable
                  prefix-icon="el-icon-mobile-phone"
                />
              </el-form-item>
              <el-form-item label="验证码" prop="code">
                <div class="code-row">
                  <el-input
                    v-model="phoneForm.code"
                    placeholder="6 位数字验证码"
                    maxlength="6"
                    prefix-icon="el-icon-key"
                    @keyup.enter.native="doPhoneLogin"
                  />
                  <el-button
                    type="success"
                    plain
                    :loading="sending"
                    :disabled="countdown > 0 || sending"
                    @click="sendCode"
                  >
                    {{ countdown > 0 ? `${countdown}s 后重发` : '获取验证码' }}
                  </el-button>
                </div>
              </el-form-item>

              <div v-if="smsTip" class="sms-tip">
                <i class="el-icon-success" />
                <span>{{ smsTip }}</span>
                <strong v-if="demoCode">验证码：{{ demoCode }}</strong>
              </div>

              <el-button
                type="primary"
                class="full"
                :loading="loading"
                :disabled="!codeSent"
                native-type="submit"
              >
                验证并登录
              </el-button>
              <p class="hint">请先点击「获取验证码」，输入收到的 6 位数字后再登录</p>
            </el-form>
          </el-tab-pane>
        </el-tabs>

        <div class="accounts">
          <p>演示账号（手机登录请用下列号码）</p>
          <span>管理员 邮箱 admin@nanyang.gov.cn / Admin@123 · 手机 13800000001</span>
          <span>编辑员 邮箱 editor@nanyang.gov.cn / Editor@123 · 手机 13800000002</span>
          <span>访客 邮箱 viewer@nanyang.gov.cn / Viewer@123 · 手机 13800000003</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { loginByEmail, loginByPhone, sendSms } from '@/api/auth'

export default {
  name: 'Login',
  data() {
    const checkPhone = (rule, value, callback) => {
      if (!value) return callback(new Error('请输入手机号'))
      if (!/^1\d{10}$/.test(value)) return callback(new Error('请输入正确的 11 位手机号'))
      callback()
    }
    const checkCode = (rule, value, callback) => {
      if (!value) return callback(new Error('请输入验证码'))
      if (!/^\d{6}$/.test(value)) return callback(new Error('验证码为 6 位数字'))
      callback()
    }
    return {
      tab: 'phone',
      loading: false,
      sending: false,
      countdown: 0,
      timer: null,
      demoCode: '',
      smsTip: '',
      codeSent: false,
      emailForm: {
        email: 'admin@nanyang.gov.cn',
        password: 'Admin@123'
      },
      phoneForm: {
        phone: '13800000001',
        code: ''
      },
      emailRules: {
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码至少 6 位', trigger: 'blur' }
        ]
      },
      phoneRules: {
        phone: [{ validator: checkPhone, trigger: 'blur' }],
        code: [{ validator: checkCode, trigger: 'blur' }]
      }
    }
  },
  beforeDestroy() {
    this.clearTimer()
  },
  methods: {
    clearTimer() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },
    onTabChange() {
      this.loading = false
    },
    startCountdown(seconds) {
      this.clearTimer()
      this.countdown = seconds || 60
      this.timer = setInterval(() => {
        this.countdown -= 1
        if (this.countdown <= 0) {
          this.clearTimer()
          this.countdown = 0
        }
      }, 1000)
    },
    async doEmailLogin() {
      try {
        await this.$refs.emailForm.validate()
      } catch (e) {
        return
      }
      this.loading = true
      try {
        const { data } = await loginByEmail(this.emailForm)
        await this.$store.dispatch('loginSuccess', data)
        this.$message.success(data.message || `欢迎，${data.user.name}`)
        this.$router.replace(this.$route.query.redirect || '/')
      } catch (e) {
        /* 错误已由拦截器提示 */
      } finally {
        this.loading = false
      }
    },
    async sendCode() {
      const phoneOk = await new Promise((resolve) => {
        this.$refs.phoneForm.validateField('phone', (errMsg) => resolve(!errMsg))
      })
      if (!phoneOk) return

      this.sending = true
      this.smsTip = ''
      this.demoCode = ''
      try {
        const { data } = await sendSms({ phone: this.phoneForm.phone.trim() })
        this.codeSent = true
        this.demoCode = data.demoCode || ''
        this.smsTip = data.message || '验证码已发送'
        if (this.demoCode) {
          this.phoneForm.code = this.demoCode
          this.$message.success(`验证码已发送：${this.demoCode}`)
        } else {
          this.$message.success(this.smsTip)
        }
        this.startCountdown(data.resendAfter || 60)
      } catch (e) {
        const wait = e.response && e.response.data && e.response.data.wait
        if (wait) this.startCountdown(wait)
      } finally {
        this.sending = false
      }
    },
    async doPhoneLogin() {
      const valid = await new Promise((resolve) => {
        this.$refs.phoneForm.validate((ok) => resolve(ok))
      })
      if (!valid) return
      if (!this.codeSent) {
        this.$message.warning('请先获取验证码')
        return
      }

      this.loading = true
      try {
        const { data } = await loginByPhone({
          phone: this.phoneForm.phone.trim(),
          code: this.phoneForm.code.trim()
        })
        await this.$store.dispatch('loginSuccess', data)
        this.$message.success(data.message || `欢迎，${data.user.name}`)
        this.demoCode = ''
        this.smsTip = ''
        this.codeSent = false
        this.phoneForm.code = ''
        this.$router.replace(this.$route.query.redirect || '/')
      } catch (e) {
        /* 错误已由拦截器提示 */
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(circle at 20% 20%, rgba(40, 120, 220, 0.35), transparent 40%),
    radial-gradient(circle at 80% 70%, rgba(0, 180, 160, 0.2), transparent 35%),
    #061428;
}

.login-panel {
  width: min(920px, 100%);
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(100, 170, 255, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  background: rgba(8, 24, 48, 0.92);
}

.panel-left {
  padding: 42px 36px;
  background: linear-gradient(160deg, rgba(20, 80, 160, 0.55), rgba(6, 30, 60, 0.2));
  h1 {
    font-size: 34px;
    line-height: 1.25;
    margin-bottom: 12px;
  }
  p {
    color: #9ec8f0;
    margin-bottom: 28px;
  }
  ul {
    list-style: none;
    li {
      margin-bottom: 12px;
      padding-left: 14px;
      position: relative;
      color: #d5ebff;
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 8px;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #3aa0ff;
      }
    }
  }
}

.panel-right {
  padding: 28px 30px 22px;
  background: #0b1d35;
}

.full {
  width: 100%;
}

.code-row {
  display: flex;
  gap: 8px;
  width: 100%;
  .el-input {
    flex: 1;
  }
  .el-button {
    flex-shrink: 0;
    min-width: 118px;
  }
}

.sms-tip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: -4px 0 14px;
  padding: 8px 10px;
  border-radius: 4px;
  background: rgba(103, 194, 58, 0.12);
  border: 1px solid rgba(103, 194, 58, 0.35);
  color: #b7eb8f;
  font-size: 13px;
  i {
    color: #67c23a;
  }
  strong {
    color: #fff;
    letter-spacing: 2px;
  }
}

.hint {
  margin-top: 10px;
  font-size: 12px;
  color: #7aa3c7;
  text-align: center;
}

.accounts {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px dashed rgba(100, 160, 220, 0.3);
  font-size: 12px;
  color: #8db4d8;
  display: grid;
  gap: 4px;
  p {
    color: #c5e0ff;
    margin-bottom: 4px;
  }
}

::v-deep .el-form-item__label {
  color: #b8d6f2;
  padding-bottom: 2px !important;
  line-height: 1.2 !important;
}
::v-deep .el-form-item {
  margin-bottom: 16px;
}
::v-deep .el-input__inner {
  background: #102744;
  border-color: #2a4f78;
  color: #e8f4ff;
}
::v-deep .el-tabs__item {
  color: #9ec4e8;
}
::v-deep .el-tabs__item.is-active {
  color: #409eff;
}

@media (max-width: 800px) {
  .login-panel {
    grid-template-columns: 1fr;
  }
  .panel-left {
    padding: 24px;
    h1 {
      font-size: 26px;
    }
  }
}
</style>
