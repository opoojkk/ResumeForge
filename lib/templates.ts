export const TEMPLATE_VAR_KEYS = [
  '--rf-color-body-text',
  '--rf-color-body-bg',
  '--rf-color-panel-bg',
  '--rf-color-preview-bg',
  '--rf-color-primary',
  '--rf-color-secondary',
  '--rf-color-muted',
  '--rf-color-border',
  '--rf-color-accent',
  '--rf-color-accent-hover',
  '--rf-color-tag-primary-bg',
  '--rf-color-tag-primary-text',
  '--rf-color-tag-secondary-bg',
  '--rf-color-tag-secondary-text',
  '--rf-color-skill-fill-from',
  '--rf-color-skill-fill-to'
] as const

export type TemplateVarKey = (typeof TEMPLATE_VAR_KEYS)[number]
export type TemplateVars = Record<TemplateVarKey, string>

export interface ResumeTemplate {
  id: string
  name: string
  description: string
  vars: Partial<TemplateVars>
}

export interface ResolvedResumeTemplate extends Omit<ResumeTemplate, 'vars'> {
  vars: TemplateVars
}

export const DEFAULT_TEMPLATE_ID = 'classic'

const defaultTemplateVars: TemplateVars = {
  '--rf-color-body-text': '#333',
  '--rf-color-body-bg': '#ffffff',
  '--rf-color-panel-bg': '#fafbfc',
  '--rf-color-preview-bg': '#f6f8fa',
  '--rf-color-primary': '#1e293b',
  '--rf-color-secondary': '#64748b',
  '--rf-color-muted': '#475569',
  '--rf-color-border': '#e5e7eb',
  '--rf-color-accent': '#0969da',
  '--rf-color-accent-hover': '#0550ae',
  '--rf-color-tag-primary-bg': '#dbeafe',
  '--rf-color-tag-primary-text': '#1e40af',
  '--rf-color-tag-secondary-bg': '#f1f5f9',
  '--rf-color-tag-secondary-text': '#475569',
  '--rf-color-skill-fill-from': '#2563eb',
  '--rf-color-skill-fill-to': '#3b82f6'
}

export const resumeTemplates: ResumeTemplate[] = [
  {
    id: 'classic',
    name: '经典蓝',
    description: '稳重清晰，适合通用岗位。',
    vars: defaultTemplateVars
  },
  {
    id: 'forest',
    name: '森系绿',
    description: '柔和绿色系，适合设计/内容岗位。',
    vars: {
      '--rf-color-body-text': '#2f3d34',
      '--rf-color-body-bg': '#f8fbf9',
      '--rf-color-panel-bg': '#f4f8f5',
      '--rf-color-preview-bg': '#eef5f0',
      '--rf-color-primary': '#1f3a2f',
      '--rf-color-secondary': '#4f6b5d',
      '--rf-color-muted': '#3f5b4d',
      '--rf-color-border': '#d5e4da',
      '--rf-color-accent': '#2f855a',
      '--rf-color-accent-hover': '#276749',
      '--rf-color-tag-primary-bg': '#d1fae5',
      '--rf-color-tag-primary-text': '#065f46',
      '--rf-color-tag-secondary-bg': '#e8f5ec',
      '--rf-color-tag-secondary-text': '#2f5e47',
      '--rf-color-skill-fill-from': '#059669',
      '--rf-color-skill-fill-to': '#10b981'
    }
  },
  {
    id: 'slate',
    name: '商务灰',
    description: '冷静中性，适合技术/管理岗位。',
    vars: {
      '--rf-color-body-text': '#2b3037',
      '--rf-color-body-bg': '#f7f8fa',
      '--rf-color-panel-bg': '#f3f4f6',
      '--rf-color-preview-bg': '#eceff3',
      '--rf-color-primary': '#111827',
      '--rf-color-secondary': '#4b5563',
      '--rf-color-muted': '#374151',
      '--rf-color-border': '#d1d5db',
      '--rf-color-accent': '#334155',
      '--rf-color-accent-hover': '#1f2937',
      '--rf-color-tag-primary-bg': '#e2e8f0',
      '--rf-color-tag-primary-text': '#1e293b',
      '--rf-color-tag-secondary-bg': '#f1f5f9',
      '--rf-color-tag-secondary-text': '#334155',
      '--rf-color-skill-fill-from': '#475569',
      '--rf-color-skill-fill-to': '#64748b'
    }
  }
]

const validateTemplates = (templates: ResumeTemplate[]) => {
  const idSet = new Set<string>()
  const templateVarKeySet = new Set<string>(TEMPLATE_VAR_KEYS)

  for (const template of templates) {
    if (!/^[a-z0-9-]+$/.test(template.id)) {
      throw new Error(`模板 id 非法: ${template.id}（仅允许小写字母/数字/中划线）`)
    }

    if (idSet.has(template.id)) {
      throw new Error(`模板 id 重复: ${template.id}`)
    }
    idSet.add(template.id)

    const unknownVarKeys = Object.keys(template.vars).filter((key) => !templateVarKeySet.has(key))
    if (unknownVarKeys.length > 0) {
      throw new Error(`模板 ${template.id} 包含未知样式变量: ${unknownVarKeys.join(', ')}`)
    }
  }
}

validateTemplates(resumeTemplates)

const resolveTemplateVars = (vars: Partial<TemplateVars>): TemplateVars => ({
  ...defaultTemplateVars,
  ...vars
})

const resolveTemplate = (template: ResumeTemplate): ResolvedResumeTemplate => ({
  ...template,
  vars: resolveTemplateVars(template.vars)
})

export const getTemplateById = (id?: string): ResolvedResumeTemplate => {
  const fallbackTemplate = resumeTemplates.find((template) => template.id === DEFAULT_TEMPLATE_ID) || resumeTemplates[0]
  const targetTemplate = resumeTemplates.find((template) => template.id === id) || fallbackTemplate

  return resolveTemplate(targetTemplate)
}
