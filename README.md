# SoulBook UI — Rust + Dioxus 前端

SoulBook V5 的 Dioxus 0.7 组件化前端，覆盖全部 25 个原型页面。

## 本地预览

```bash
# 需要安装 dioxus-cli
cargo install dioxus-cli

# 在项目根目录运行
dx serve
```

浏览器自动打开 http://localhost:8080

## 页面地图

| 路由 | 页面 |
|------|------|
| `/` | 首页工作台 |
| `/spaces` | 知识空间列表 |
| `/space` | 空间概览 |
| `/docs` | 文档中心 |
| `/editor` | 文档编辑器 |
| `/versions` | 版本历史 |
| `/change-requests` | 变更请求 |
| `/members` | 成员权限 |
| `/tags` | 标签管理 |
| `/files` | 文件管理 |
| `/search` | 全局搜索 |
| `/language` | 语言版本 |
| `/ai-tasks` | AI 任务中心 |
| `/ai-tools` | AI 工具配置 |
| `/seo` | SEO 与发布 |
| `/git-sync` | GitHub 同步 |
| `/developer` | 开发者平台 |
| `/notifications` | 通知中心 |
| `/profile` | 个人中心 |
| `/settings` | 系统设置 |
| `/workspace` | 发布站点 |
| `/templates` | 模板中心 |
| `/login` | 登录 |
| `/install` | 安装向导 |

## 技术栈

- **框架**: Dioxus 0.7.5 (Web / WASM)
- **路由**: dioxus-router
- **样式**: CSS 变量设计系统（Inter 字体，Indigo 主色调）
- **数据**: 内置 Mock 数据，无需后端
