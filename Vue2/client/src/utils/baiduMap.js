/**
 * 百度地图 AK：替换为你在 https://lbsyun.baidu.com/ 申请的密钥后才会加载脚本。
 * 也可在项目根目录 .env.local 中设置 VUE_APP_BAIDU_MAP_AK
 */
export const BAIDU_MAP_AK =
  process.env.VUE_APP_BAIDU_MAP_AK || ''

const PLACEHOLDER = 'YOUR_BAIDU_MAP_AK'

export function hasValidBaiduAk() {
  const ak = (BAIDU_MAP_AK || '').trim()
  return !!ak && ak !== PLACEHOLDER
}

let loadingPromise = null

export function loadBaiduMap() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('非浏览器环境'))
  }
  if (typeof window.BMapGL !== 'undefined') {
    return Promise.resolve(window.BMapGL)
  }
  if (!hasValidBaiduAk()) {
    return Promise.reject(new Error('未配置有效百度地图 AK'))
  }
  if (loadingPromise) return loadingPromise

  loadingPromise = new Promise((resolve, reject) => {
    const callbackName = `__initBMapGl_${Date.now()}`
    window[callbackName] = () => {
      try {
        delete window[callbackName]
      } catch (e) {
        /* ignore */
      }
      if (typeof window.BMapGL !== 'undefined') {
        resolve(window.BMapGL)
      } else {
        loadingPromise = null
        reject(new Error('BMapGL 未就绪'))
      }
    }

    const script = document.createElement('script')
    script.async = true
    script.src = `https://api.map.baidu.com/api?v=1.0&type=webgl&ak=${encodeURIComponent(
      BAIDU_MAP_AK.trim()
    )}&callback=${callbackName}`
    script.onerror = () => {
      loadingPromise = null
      reject(new Error('百度地图脚本加载失败'))
    }
    document.head.appendChild(script)
  })

  return loadingPromise
}
