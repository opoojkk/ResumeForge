import React, { useState, useRef, useEffect } from 'react'
import { DEFAULT_TEMPLATE_ID, resumeTemplates } from '../lib/templates'

interface ResumeEditorProps {
  initialData: any
  onDataChange: (data: any) => void
  onReset?: () => void
}

const AVATAR_CACHE_KEY = 'resume-forge-avatar'

// 压缩图片并转为 base64
const compressImage = (file: File, maxSize = 400): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // 等比缩放到 maxSize 以内
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width)
            width = maxSize
          } else {
            width = Math.round((width * maxSize) / height)
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        const base64 = canvas.toDataURL('image/jpeg', 0.85)
        resolve(base64)
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({ initialData, onDataChange, onReset }) => {
  const [activeSection, setActiveSection] = useState<string>('personalInfo')
  const [data, setData] = useState(initialData)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const editorContentRef = useRef<HTMLDivElement>(null)

  // 当父组件传入的 initialData 变化时（如重置），同步内部 state
  useEffect(() => {
    setData(initialData)
  }, [initialData])

  const migrateContactsData = (jsonData: any) => {
    // 如果 contacts 是数组，转换为对象格式
    if (Array.isArray(jsonData.personalInfo?.contacts)) {
      const contactsArray = jsonData.personalInfo.contacts
      const contactsObj: any = {
        email: '',
        phone: '',
        github: { title: '', link: '' },
        blog: { title: '', link: '' }
      }
      
      contactsArray.forEach((contact: any) => {
        if (contact.type === 'email') {
          contactsObj.email = contact.text
        } else if (contact.type === 'phone') {
          contactsObj.phone = contact.text
        } else if (contact.type === 'github') {
          contactsObj.github = {
            title: contact.title || '',
            link: contact.link || `https://github.com/${contact.text}`
          }
        } else if (contact.type === 'website') {
          contactsObj.blog = {
            title: contact.title || '',
            link: contact.link || contact.text
          }
        }
      })
      
      jsonData.personalInfo.contacts = contactsObj
    } else if (jsonData.personalInfo?.contacts) {
      // 如果是对象格式，但 github/blog 是字符串，转换为对象
      const contacts = jsonData.personalInfo.contacts
      
      if (typeof contacts.github === 'string') {
        contacts.github = {
          title: '',
          link: contacts.github
        }
      } else if (!contacts.github) {
        contacts.github = { title: '', link: '' }
      }
      
      if (typeof contacts.blog === 'string') {
        contacts.blog = {
          title: '',
          link: contacts.blog
        }
      } else if (!contacts.blog) {
        contacts.blog = { title: '', link: '' }
      }
    }
    
    return jsonData
  }

  const migrateTemplateData = (jsonData: any) => {
    if (!jsonData.templateId) {
      jsonData.templateId = DEFAULT_TEMPLATE_ID
    }

    return jsonData
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件！')
      return
    }

    // 限制原始文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片文件过大，请选择 5MB 以内的图片！')
      return
    }

    try {
      const base64 = await compressImage(file)
      // 存入单独的 localStorage key，避免 resume data 过大
      try {
        localStorage.setItem(AVATAR_CACHE_KEY, base64)
      } catch (e) {
        // ignore storage errors
      }
      updateData(['personalInfo', 'avatar'], base64)
    } catch {
      alert('图片处理失败，请重试！')
    }

    // 清空 input 值，允许重复选择同一文件
    if (avatarInputRef.current) {
      avatarInputRef.current.value = ''
    }
  }

  const handleClearAvatar = () => {
    try {
      localStorage.removeItem(AVATAR_CACHE_KEY)
    } catch (e) {
      // ignore
    }
    updateData(['personalInfo', 'avatar'], '')
  }

  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          let jsonData = JSON.parse(e.target?.result as string)
          jsonData = migrateContactsData(jsonData)
          jsonData = migrateTemplateData(jsonData)
          setData(jsonData)
          onDataChange(jsonData)
        } catch (error) {
          alert('JSON 文件格式错误！')
        }
      }
      reader.readAsText(file)
    }
  }

  const handleExportJson = () => {
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'resume-data.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const updateData = (path: (string | number)[], value: any) => {
    const newData = JSON.parse(JSON.stringify(data))
    let current = newData
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]]
    }
    current[path[path.length - 1]] = value
    setData(newData)
    onDataChange(newData)
  }

  const addArrayItem = (path: (string | number)[], template: any) => {
    const newData = JSON.parse(JSON.stringify(data))
    let current = newData
    for (const key of path) {
      current = current[key]
    }
    current.push(template)
    setData(newData)
    onDataChange(newData)
  }

  const removeArrayItem = (path: (string | number)[], index: number) => {
    const newData = JSON.parse(JSON.stringify(data))
    let current = newData
    for (const key of path) {
      current = current[key]
    }
    current.splice(index, 1)
    setData(newData)
    onDataChange(newData)
  }

  const sections = [
    { id: 'template', label: '主题模板', icon: '🎨' },
    { id: 'personalInfo', label: '个人信息', icon: '👤' },
    { id: 'workExperience', label: '工作经历', icon: '💼' },
    { id: 'skills', label: '专业技能', icon: '🛠️' },
    { id: 'education', label: '教育经历', icon: '🎓' },
    { id: 'openSourceProjects', label: '开源项目', icon: '🔗' },
    { id: 'articles', label: '文章', icon: '📝' },
  ]

  const scrollToSection = (sectionId: string) => {
    const sectionElement = sectionRefs.current[sectionId]
    const containerElement = editorContentRef.current
    
    if (sectionElement && containerElement) {
      const offsetTop = sectionElement.offsetTop - containerElement.offsetTop - 20
      containerElement.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      })
    }
    setActiveSection(sectionId)
  }

  // 监听滚动，更新活动tab
  useEffect(() => {
    const containerElement = editorContentRef.current
    if (!containerElement) return

    const handleScroll = () => {
      const scrollPosition = containerElement.scrollTop + 100 // 偏移量

      // 找出当前滚动位置对应的section
      for (const section of sections) {
        const element = sectionRefs.current[section.id]
        if (element) {
          const offsetTop = element.offsetTop - containerElement.offsetTop
          const offsetBottom = offsetTop + element.offsetHeight

          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    containerElement.addEventListener('scroll', handleScroll)
    return () => containerElement.removeEventListener('scroll', handleScroll)
  }, [sections])

  const renderPersonalInfoEditor = () => (
    <div className="editor-section-block" ref={(el) => { sectionRefs.current['personalInfo'] = el }}>
      <h3 className="section-title">👤 个人信息</h3>
      <div className="editor-section-content">
        <div className="form-group">
          <label>姓名</label>
          <input
            type="text"
            value={data.personalInfo.name}
            onChange={(e) => updateData(['personalInfo', 'name'], e.target.value)}
          />
        </div>
      <div className="form-group">
        <label>职位</label>
        <input
          type="text"
          value={data.personalInfo.title}
          onChange={(e) => updateData(['personalInfo', 'title'], e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>头像</label>
        <div className="avatar-upload-area">
          {data.personalInfo.avatar && (
            <div className="avatar-preview-small">
              <img src={data.personalInfo.avatar} alt="头像预览" />
            </div>
          )}
          <div className="avatar-upload-actions">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="btn-avatar-upload"
              onClick={() => avatarInputRef.current?.click()}
            >
              📷 上传头像
            </button>
            {data.personalInfo.avatar && (
              <button
                type="button"
                className="btn-avatar-clear"
                onClick={handleClearAvatar}
              >
                清除
              </button>
            )}
          </div>
        </div>
        <input
          type="text"
          placeholder="或输入头像 URL"
          value={data.personalInfo.avatar?.startsWith('data:') ? '' : (data.personalInfo.avatar || '')}
          onChange={(e) => {
            // 如果手动输入 URL，清除本地缓存的头像
            try { localStorage.removeItem(AVATAR_CACHE_KEY) } catch (e) { /* ignore */ }
            updateData(['personalInfo', 'avatar'], e.target.value)
          }}
        />
        {data.personalInfo.avatar?.startsWith('data:') && (
          <span className="avatar-hint">已使用本地上传的头像</span>
        )}
      </div>
      <div className="form-group">
        <label>位置</label>
        <input
          type="text"
          value={data.personalInfo.location}
          onChange={(e) => updateData(['personalInfo', 'location'], e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>联系方式</label>
        <div className="contact-fields">
          <div className="form-group">
            <label>邮箱</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={data.personalInfo.contacts.email || ''}
              onChange={(e) => updateData(['personalInfo', 'contacts', 'email'], e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>手机号</label>
            <input
              type="text"
              placeholder="13800138000"
              value={data.personalInfo.contacts.phone || ''}
              onChange={(e) => updateData(['personalInfo', 'contacts', 'phone'], e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>GitHub</label>
            <input
              type="text"
              placeholder="标题（可选，如：我的GitHub）"
              value={data.personalInfo.contacts.github?.title || ''}
              onChange={(e) => updateData(['personalInfo', 'contacts', 'github', 'title'], e.target.value)}
            />
            <input
              type="url"
              placeholder="https://github.com/username"
              value={data.personalInfo.contacts.github?.link || ''}
              onChange={(e) => updateData(['personalInfo', 'contacts', 'github', 'link'], e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>博客</label>
            <input
              type="text"
              placeholder="标题（可选，如：个人博客）"
              value={data.personalInfo.contacts.blog?.title || ''}
              onChange={(e) => updateData(['personalInfo', 'contacts', 'blog', 'title'], e.target.value)}
            />
            <input
              type="url"
              placeholder="https://yourblog.com"
              value={data.personalInfo.contacts.blog?.link || ''}
              onChange={(e) => updateData(['personalInfo', 'contacts', 'blog', 'link'], e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
    </div>
  )

  const renderTemplateEditor = () => (
    <div className="editor-section-block" ref={(el) => { sectionRefs.current['template'] = el }}>
      <h3 className="section-title">🎨 主题模板</h3>
      <div className="editor-section-content">
        <div className="form-group">
          <label>选择模板</label>
          <select
            value={data.templateId || DEFAULT_TEMPLATE_ID}
            onChange={(e) => updateData(['templateId'], e.target.value)}
          >
            {resumeTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
        <p className="template-description">
          {resumeTemplates.find((template) => template.id === (data.templateId || DEFAULT_TEMPLATE_ID))?.description}
        </p>
        <p className="template-extension-hint">
          其他用户可在 <code>lib/templates.ts</code> 添加新模板并提交 PR，具体步骤见 <code>docs/templates.md</code>。
        </p>
      </div>
    </div>
  )

  const renderWorkExperienceEditor = () => (
    <div className="editor-section-block" ref={(el) => { sectionRefs.current['workExperience'] = el }}>
      <h3 className="section-title">💼 工作经历</h3>
      <div className="editor-section-content">
      {data.workExperience.map((work: any, workIndex: number) => (
        <div key={workIndex} className="nested-item">
          <div className="nested-item-header">
            <h4>工作经历 #{workIndex + 1}</h4>
            <button
              className="btn-remove"
              onClick={() => removeArrayItem(['workExperience'], workIndex)}
            >
              删除
            </button>
          </div>
          <div className="form-group">
            <label>公司名称</label>
            <input
              type="text"
              value={work.company}
              onChange={(e) => updateData(['workExperience', workIndex, 'company'], e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>位置</label>
            <input
              type="text"
              value={work.location}
              onChange={(e) => updateData(['workExperience', workIndex, 'location'], e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>职位</label>
            <input
              type="text"
              value={work.position}
              onChange={(e) => updateData(['workExperience', workIndex, 'position'], e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>开始日期</label>
            <input
              type="text"
              value={work.startDate}
              onChange={(e) => updateData(['workExperience', workIndex, 'startDate'], e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>结束日期</label>
            <input
              type="text"
              value={work.endDate}
              onChange={(e) => updateData(['workExperience', workIndex, 'endDate'], e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>项目列表</label>
            {work.projects.map((project: any, projectIndex: number) => (
              <div key={projectIndex} className="sub-nested-item">
                <div className="sub-nested-item-header">
                  <h5>项目 #{projectIndex + 1}</h5>
                  <button
                    className="btn-remove-small"
                    onClick={() => removeArrayItem(['workExperience', workIndex, 'projects'], projectIndex)}
                  >
                    删除
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="项目名称"
                  value={project.name}
                  onChange={(e) => updateData(['workExperience', workIndex, 'projects', projectIndex, 'name'], e.target.value)}
                />
                <textarea
                  placeholder="项目描述"
                  value={project.description}
                  onChange={(e) => updateData(['workExperience', workIndex, 'projects', projectIndex, 'description'], e.target.value)}
                />
                <div className="responsibilities">
                  <label>职责描述</label>
                  {project.responsibilities.map((resp: string, respIndex: number) => (
                    <div key={respIndex} className="responsibility-item">
                      <textarea
                        value={resp}
                        onChange={(e) => updateData(['workExperience', workIndex, 'projects', projectIndex, 'responsibilities', respIndex], e.target.value)}
                      />
                      <button
                        className="btn-remove-small"
                        onClick={() => removeArrayItem(['workExperience', workIndex, 'projects', projectIndex, 'responsibilities'], respIndex)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    className="btn-add-small"
                    onClick={() => addArrayItem(['workExperience', workIndex, 'projects', projectIndex, 'responsibilities'], '')}
                  >
                    + 添加职责
                  </button>
                </div>
              </div>
            ))}
            <button
              className="btn-add"
              onClick={() => addArrayItem(['workExperience', workIndex, 'projects'], {
                name: '',
                description: '',
                responsibilities: []
              })}
            >
              + 添加项目
            </button>
          </div>
        </div>
      ))}
      <button
        className="btn-add"
        onClick={() => addArrayItem(['workExperience'], {
          company: '',
          location: '',
          position: '',
          startDate: '',
          endDate: '',
          projects: []
        })}
      >
        + 添加工作经历
      </button>
      </div>
    </div>
  )

  const renderSkillsEditor = () => (
    <div className="editor-section-block" ref={(el) => { sectionRefs.current['skills'] = el }}>
      <h3 className="section-title">🛠️ 专业技能</h3>
      <div className="editor-section-content">
        <div className="form-group">
          <label>技能列表</label>
        {data.skills.map((skill: string, index: number) => (
          <div key={index} className="array-item">
            <textarea
              value={skill}
              onChange={(e) => updateData(['skills', index], e.target.value)}
            />
            <button
              className="btn-remove"
              onClick={() => removeArrayItem(['skills'], index)}
            >
              删除
            </button>
          </div>
        ))}
        <button
          className="btn-add"
          onClick={() => addArrayItem(['skills'], '')}
        >
          + 添加技能
        </button>
        </div>
      </div>
    </div>
  )

  const renderEducationEditor = () => (
    <div className="editor-section-block" ref={(el) => { sectionRefs.current['education'] = el }}>
      <h3 className="section-title">🎓 教育经历</h3>
      <div className="editor-section-content">
      {data.education.map((edu: any, index: number) => (
        <div key={index} className="nested-item">
          <div className="nested-item-header">
            <h4>教育经历 #{index + 1}</h4>
            <button
              className="btn-remove"
              onClick={() => removeArrayItem(['education'], index)}
            >
              删除
            </button>
          </div>
          <div className="form-group">
            <label>学历</label>
            <input
              type="text"
              value={edu.degree}
              onChange={(e) => updateData(['education', index, 'degree'], e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>学校</label>
            <input
              type="text"
              value={edu.school}
              onChange={(e) => updateData(['education', index, 'school'], e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>专业</label>
            <input
              type="text"
              value={edu.major}
              onChange={(e) => updateData(['education', index, 'major'], e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>开始日期</label>
            <input
              type="text"
              value={edu.startDate}
              onChange={(e) => updateData(['education', index, 'startDate'], e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>结束日期</label>
            <input
              type="text"
              value={edu.endDate}
              onChange={(e) => updateData(['education', index, 'endDate'], e.target.value)}
            />
          </div>
        </div>
      ))}
      <button
        className="btn-add"
        onClick={() => addArrayItem(['education'], {
          degree: '',
          school: '',
          major: '',
          startDate: '',
          endDate: ''
        })}
      >
        + 添加教育经历
      </button>
      </div>
    </div>
  )

  const renderOpenSourceProjectsEditor = () => (
    <div className="editor-section-block" ref={(el) => { sectionRefs.current['openSourceProjects'] = el }}>
      <h3 className="section-title">🔗 开源项目</h3>
      <div className="editor-section-content">
      {data.openSourceProjects.map((project: any, index: number) => (
        <div key={index} className="nested-item">
          <div className="nested-item-header">
            <h4>项目 #{index + 1}</h4>
            <button
              className="btn-remove"
              onClick={() => removeArrayItem(['openSourceProjects'], index)}
            >
              删除
            </button>
          </div>
          <div className="form-group">
            <label>项目名称</label>
            <input
              type="text"
              value={project.name}
              onChange={(e) => updateData(['openSourceProjects', index, 'name'], e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>项目描述</label>
            <textarea
              value={project.description}
              onChange={(e) => updateData(['openSourceProjects', index, 'description'], e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>项目链接</label>
            <input
              type="text"
              value={project.link}
              onChange={(e) => updateData(['openSourceProjects', index, 'link'], e.target.value)}
            />
          </div>
        </div>
      ))}
      <button
        className="btn-add"
        onClick={() => addArrayItem(['openSourceProjects'], {
          name: '',
          description: '',
          link: ''
        })}
      >
        + 添加开源项目
      </button>
      </div>
    </div>
  )

  const renderArticlesEditor = () => (
    <div className="editor-section-block" ref={(el) => { sectionRefs.current['articles'] = el }}>
      <h3 className="section-title">📝 文章</h3>
      <div className="editor-section-content">
      {data.articles.map((article: any, index: number) => (
        <div key={index} className="nested-item">
          <div className="nested-item-header">
            <h4>文章 #{index + 1}</h4>
            <button
              className="btn-remove"
              onClick={() => removeArrayItem(['articles'], index)}
            >
              删除
            </button>
          </div>
          <div className="form-group">
            <label>文章标题</label>
            <input
              type="text"
              value={article.title}
              onChange={(e) => updateData(['articles', index, 'title'], e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>文章链接</label>
            <input
              type="text"
              value={article.link}
              onChange={(e) => updateData(['articles', index, 'link'], e.target.value)}
            />
          </div>
        </div>
      ))}
      <button
        className="btn-add"
        onClick={() => addArrayItem(['articles'], {
          title: '',
          link: ''
        })}
      >
        + 添加文章
      </button>
      </div>
    </div>
  )

  return (
    <div className="resume-editor-panel">
      <div className="editor-header">
        <h2>简历编辑</h2>
        <div className="editor-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJson}
            style={{ display: 'none' }}
          />
          <button
            className="btn-import"
            onClick={() => fileInputRef.current?.click()}
          >
            📥 导入
          </button>
          <button
            className="btn-export"
            onClick={handleExportJson}
          >
            📤 导出
          </button>
          {onReset && (
            <button
              className="btn-reset"
              onClick={() => {
                if (window.confirm('确定要重置为默认数据吗？所有未导出的编辑将丢失。')) {
                  onReset()
                }
              }}
            >
              🔄 重置
            </button>
          )}
        </div>
      </div>

      <div className="editor-tabs">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`tab-button ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => scrollToSection(section.id)}
          >
            <span className="tab-icon">{section.icon}</span>
            <span className="tab-label">{section.label}</span>
          </button>
        ))}
      </div>

      <div className="editor-content" ref={editorContentRef}>
        {renderTemplateEditor()}
        {renderPersonalInfoEditor()}
        {renderWorkExperienceEditor()}
        {renderSkillsEditor()}
        {renderEducationEditor()}
        {renderOpenSourceProjectsEditor()}
        {renderArticlesEditor()}
      </div>
    </div>
  )
}

export default ResumeEditor
