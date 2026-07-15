module.exports = {
  transpileDependencies: true,
  devServer: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    },
    // 屏蔽跨域第三方脚本（如无效百度 AK）产生的无信息 Script error 遮罩
    client: {
      overlay: {
        errors: true,
        warnings: false,
        runtimeErrors: (error) => {
          const msg = (error && error.message) || String(error || '')
          if (!msg || msg === 'Script error.' || /Script error/i.test(msg)) {
            return false
          }
          return true
        }
      }
    }
  },
  lintOnSave: false
}
