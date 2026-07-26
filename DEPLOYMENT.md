# 部署说明

本项目是一个使用 vinext、React 与 Cloudflare Workers 兼容运行时构建的 ChatGPT Sites 项目。

## 本地运行

要求：Node.js 22.13 或更高版本。

```bash
npm ci
npm run dev
```

开发服务器启动后，按终端显示的本地地址在浏览器中预览。

## 构建验证

```bash
npm run build
```

构建成功后会生成适用于 Sites 的 `dist/` 产物。提交或发布前建议运行此命令。

## 通过 ChatGPT Sites 发布

1. 在 ChatGPT 桌面端的 Codex 或 Work 中打开本项目目录。
2. 保留 `.openai/hosting.json`；它保存了该站点的托管项目关联信息。
3. 先执行 `npm run build`，确认构建通过。
4. 在 Sites 工作流中保存一个新版本，确认预览无误后再发布。

每个发布 URL 都是生产环境 URL。若只是验证改动，应先保存版本并预览，不要直接发布。

## 素材与数据

- 页面图片、社交分享图和图标位于 `public/`。
- 页面主体代码位于 `app/`。
- Worker 入口与运行时逻辑位于 `worker/`。
- 数据模型位于 `db/`，数据库迁移位于 `drizzle/`。
- 当前 `.openai/hosting.json` 未声明 D1 或 R2 资源；如后续增加持久化功能，需要在 Sites 中配置对应资源。
