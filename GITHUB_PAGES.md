# GitHub Pages 发布

在 GitHub 仓库的 **Settings → Pages** 中，选择：

- **Build and deployment**：Deploy from a branch
- **Branch**：`main`
- **Folder**：`/docs`

每次修改网站后，在项目目录运行：

```powershell
npm.cmd run build:github-pages
```

将源码和新生成的 `docs` 文件夹一并提交、推送。网站地址为：

`https://qinmeng827-cpu.github.io/kakeya/`
