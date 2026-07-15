# 南阳市数据可视化大屏

基于 **Vue2 + ECharts + Express + SQLite** 的南阳市专题数据可视化系统。

## 功能概览

- 四个专题大屏：交通 / 人口 / 经济 / 农业

- 百度地图地形底图 + 区县指标空间分布（热力圈层）

- SQLite 持久化；支持 Excel / CSV / JSON 导入导出，以及整库 `.db` 下载

- 前端数据表增删改查

- 登录方式：邮箱密码、手机验证码（演示模式验证码在接口/控制台返回）

- 角色权限：

  | 角色          | 查看 | 编辑 | 导入 | 导出 | 用户管理 |
  | ------------- | ---- | ---- | ---- | ---- | -------- |
  | admin 管理员  | ✓    | ✓    | ✓    | ✓    | ✓        |
  | editor 编辑员 | ✓    | ✓    | ✓    | ✓    | ✗        |
  | viewer 访客   | ✓    | ✗    | ✗    | ✓    | ✗        |

## 快速启动

```bash
# 根目录
npm install
cd server && npm install
cd ../client && npm install

# 分别启动（两个终端）
cd server && npm run dev
cd client && npm run serve
```

或在根目录安装 `concurrently` 后：

```bash
npm install
npm run install:all
npm run dev
```

- 前端：http://localhost:8080
- 后端：http://localhost:3001

## 演示账号

| 角色   | 邮箱                  | 密码       | 手机号      |
| ------ | --------------------- | ---------- | ----------- |
| 管理员 | admin@nanyang.gov.cn  | Admin@123  | 13800000001 |
| 编辑员 | editor@nanyang.gov.cn | Editor@123 | 13800000002 |
| 访客   | viewer@nanyang.gov.cn | Viewer@123 | 13800000003 |

手机登录：先点「获取验证码」，页面会显示演示验证码，再登录。

## 百度地图密钥

在 `client` 目录创建 `.env.local`：

```bash
VUE_APP_BAIDU_MAP_AK=你的百度地图密钥
```

密钥可在[百度地图开放平台](https://lbsyun.baidu.com/)申请。修改后需重启 `npm run serve`。

未配置或密钥无效时，不会加载百度脚本，大屏自动使用 ECharts 示意图，避免页面报错。

## 数据管理

登录后右上角「操作」菜单可进入各专题数据管理页：

- 增删改查（需 edit 权限）
- 导入 `.xlsx / .csv / .json`（需 import 权限）
- 导出 Excel / CSV / SQLite-JSON，或下载整库（需 export 权限）

## 目录结构

```
Vue2/
  client/          # Vue2 前端
  server/          # Express + SQLite API
  server/data/     # nanyang.db（首次启动自动生成）
```

<img width="2552" height="1524" alt="屏幕截图 2026-07-15 195542" src="https://github.com/user-attachments/assets/9ea1c99b-b7cc-4bae-b95e-057c2b39fc48" />
<img width="2557" height="1419" alt="屏幕截图 2026-07-15 195547" src="https://github.com/user-attachments/assets/75b12a79-b8aa-47f7-b6e7-b8c6bb33b0e3" />
<img width="553" height="544" alt="屏幕截图 2026-07-15 195553" src="https://github.com/user-attachments/assets/229b1358-407b-4246-9a22-5cde97529110" />
<img width="2531" height="1381" alt="屏幕截图 2026-07-15 195600" src="https://github.com/user-attachments/assets/09f6b2a5-b2d4-4f5a-afc2-f8a044144659" />
<img width="2541" height="1379" alt="屏幕截图 2026-07-15 195645" src="https://github.com/user-attachments/assets/7235e5bd-ee13-405c-804b-a78cb892f24e" />
<img width="2202" height="1326" alt="屏幕截图 2026-07-14 223001" src="https://github.com/user-attachments/assets/8f51255f-c74a-401c-abd6-84c15c91f7c6" />





