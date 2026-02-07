# ResumeForge

基于 **MDX + React + GitHub Actions** 的现代化简历生成工具。

## 特性

- 使用 **MDX** 编写简历内容（Markdown + React 组件）
- 基于 **Next.js** 和 **React** 构建
- **可定制的组件**：Header、Timeline、Section、SkillBar、Tags 等
- **可视化编辑器**：无需手动编辑代码，在浏览器中直接编辑简历
- **导入/导出 JSON**：快速备份和迁移简历数据
- 浏览器内一键导出 **PDF**
- **GitHub Actions** 自动化构建
- 现代化 UI 设计，支持打印优化
- 支持头像展示

## 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

访问 http://localhost:3000 预览简历。

### 导出 PDF

1. 运行 `npm run dev` 启动开发服务器
2. 在浏览器中访问 http://localhost:3000
3. 点击右侧预览区右上角的"导出 PDF"按钮
4. 在打印对话框中选择"另存为 PDF"，勾选"背景图形"，点击保存

## 可视化编辑器

ResumeForge 内置了可视化编辑器，采用**左右分栏设计**，让您无需手动编辑代码即可修改简历内容。

### 主要功能

- **左右分栏布局**：左侧编辑表单，右侧实时预览
- **Tab 导航**：清晰的模块切换（个人信息、工作经历、技能等）
- **所见即所得**：编辑内容立即在右侧预览中更新
- **导入 JSON**：一键导入 JSON 文件覆盖所有内容
- **导出 JSON**：将编辑结果导出为 JSON 文件
- **导出 PDF**：点击预览区顶部的"导出 PDF"按钮，直接从浏览器打印生成 PDF
- **响应式设计**：适配桌面和移动设备

### 快速使用

1. 启动开发服务器：`npm run dev`
2. 访问 http://localhost:3000
3. 右侧面板直接编辑，左侧实时预览
4. 点击顶部 Tab 切换不同模块

## 编辑简历

提供两种方式编辑简历内容：

### 方式一：在线编辑

启动项目后，直接在浏览器中通过可视化编辑器修改简历内容，所有改动实时预览，无需手动编辑代码文件。

1. 运行 `npm run dev` 并访问 http://localhost:3000
2. 在左侧编辑面板中填写或修改各模块内容
3. 右侧预览区实时展示效果
4. 编辑完成后可导出为 JSON 备份，或直接导出 PDF

### 方式二：编辑 JSON 后导入

如果你习惯直接编辑数据，可以修改 `data/resume-data.json` 文件，然后通过编辑器的"导入 JSON"功能加载。

JSON 数据结构参考 [data/resume-data.json](./data/resume-data.json)，示例：

```json
{
  "personalInfo": {
    "name": "姓名",
    "title": "职位",
    "avatar": "头像地址",
    "location": "城市",
    "contacts": {
      "email": "your@email.com",
      "phone": "138-0000-0000",
      "github": { "title": "", "link": "https://github.com/username" },
      "blog": { "title": "", "link": "https://yourblog.dev" }
    }
  },
  "workExperience": [
    {
      "company": "公司名称",
      "location": "城市",
      "position": "职位",
      "startDate": "2022/06",
      "endDate": "至今",
      "projects": [
        {
          "name": "项目名称",
          "description": "项目描述",
          "responsibilities": ["职责一", "职责二"]
        }
      ]
    }
  ],
  "skills": ["技能一", "技能二"],
  "education": [
    {
      "degree": "学士",
      "school": "学校名称",
      "major": "专业",
      "startDate": "2006/09",
      "endDate": "2010/07"
    }
  ],
  "openSourceProjects": [
    { "name": "项目名", "description": "项目描述", "link": "https://github.com/..." }
  ],
  "articles": [
    { "title": "文章标题", "link": "https://..." }
  ]
}
```

编辑完成后，在浏览器中点击"导入 JSON"按钮，选择该文件即可加载。

## 部署到 GitHub Pages

项目已内置 GitHub Pages 自动部署支持，推送代码后即可自动构建并发布。

### 启用步骤

1. 将代码推送到 GitHub 仓库的 `main` 或 `master` 分支
2. 进入仓库 **Settings → Pages**
3. 在 **Source** 下拉菜单中选择 **GitHub Actions**
4. 推送代码后，GitHub Actions 会自动构建并部署到 `https://<你的用户名>.github.io/<仓库名>/`

### 自定义域名

如需使用自定义域名，可在仓库 **Settings → Pages → Custom domain** 中配置，并在项目根目录添加 `public/CNAME` 文件写入你的域名。使用自定义域名时，需将 `next.config.js` 中的 `NEXT_PUBLIC_BASE_PATH` 环境变量留空或移除。

## License

MIT

---

如果你在使用过程中遇到问题或有改进建议，欢迎提交 [Issue](../../issues) 或 [Pull Request](../../pulls)。
