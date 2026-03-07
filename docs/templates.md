# 模板扩展指南

本项目支持通过 `lib/templates.ts` 扩展模板，**不需要改动组件代码**。

## 1) 新增模板

在 `resumeTemplates` 数组中新增一个对象：

```ts
{
  id: 'my-theme',
  name: '我的主题',
  description: '一句话描述主题风格。',
  vars: {
    '--rf-color-primary': '#0f172a',
    '--rf-color-accent': '#7c3aed'
  }
}
```

说明：

- `id` 仅允许：小写字母 / 数字 / `-`。
- `vars` 支持**部分覆盖**。没写到的变量会自动回退到默认主题。
- 模板定义会在运行时自动校验（重复 id、未知变量会直接报错）。

## 2) 可用变量列表

完整变量键如下（与 `TEMPLATE_VAR_KEYS` 一致）：

- `--rf-color-body-text`
- `--rf-color-body-bg`
- `--rf-color-panel-bg`
- `--rf-color-preview-bg`
- `--rf-color-primary`
- `--rf-color-secondary`
- `--rf-color-muted`
- `--rf-color-border`
- `--rf-color-accent`
- `--rf-color-accent-hover`
- `--rf-color-tag-primary-bg`
- `--rf-color-tag-primary-text`
- `--rf-color-tag-secondary-bg`
- `--rf-color-tag-secondary-text`
- `--rf-color-skill-fill-from`
- `--rf-color-skill-fill-to`

## 3) 本地验证

```bash
npm run build
```

构建过程中会进行类型检查；如果模板 id/变量有问题，运行时校验也会在开发阶段快速暴露错误。
