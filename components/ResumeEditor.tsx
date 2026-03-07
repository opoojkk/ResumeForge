import React, { useState, useRef, useEffect } from 'react'

interface ResumeEditorProps {
  initialData: any
  onDataChange: (data: any) => void
  onReset?: () => void
  onSelectJsonFile?: () => void
  selectedJsonFileName?: string
  jsonSyncStatus?: 'idle' | 'syncing' | 'synced' | 'error'
}

type ViewMode = 'focused' | 'all'

const AVATAR_CACHE_KEY = 'resume-forge-avatar'

const normalizeResumeData = (jsonData: any) => {
  const nextData = JSON.parse(JSON.stringify(jsonData ?? {}))

  if (!nextData.personalInfo) {
    nextData.personalInfo = {}
  }

  if (!nextData.exportSettings || typeof nextData.exportSettings !== 'object') {
    nextData.exportSettings = {}
  }

  if (typeof nextData.exportSettings.pdfFileName !== 'string') {
    nextData.exportSettings.pdfFileName = ''
  }

  return nextData
}

const sanitizeFileName = (value: string) => (
  (value || '')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
    .replace(/\.(pdf|json)$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
)

const getExportFilePrefix = (resumeData: any) => {
  const customPrefix = sanitizeFileName(resumeData?.exportSettings?.pdfFileName || '')
  if (customPrefix) {
    return customPrefix
  }

  const fallbackPrefix = sanitizeFileName(
    resumeData?.personalInfo?.name
      ? `${resumeData.personalInfo.name}-简历`
      : 'resume'
  )

  return fallbackPrefix || 'resume'
}

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 6 6 18"></path>
    <path d="m6 6 12 12"></path>
  </svg>
)

const FileTextIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <path d="M14 2v6h6"></path>
    <path d="M16 13H8"></path>
    <path d="M16 17H8"></path>
    <path d="M10 9H8"></path>
  </svg>
)

const UploadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3v12"></path>
    <path d="m7 8 5-5 5 5"></path>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
  </svg>
)

const DownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 21V9"></path>
    <path d="m7 16 5 5 5-5"></path>
    <path d="M21 5v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"></path>
  </svg>
)

const RefreshIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 2v6h6"></path>
    <path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path>
    <path d="M21 22v-6h-6"></path>
    <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path>
  </svg>
)

const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 5v14"></path>
    <path d="M5 12h14"></path>
  </svg>
)

const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 6h18"></path>
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"></path>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
    <path d="M10 11v6"></path>
    <path d="M14 11v6"></path>
  </svg>
)

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

const ResumeEditor: React.FC<ResumeEditorProps> = ({
  initialData,
  onDataChange,
  onReset,
  onSelectJsonFile,
  selectedJsonFileName,
  jsonSyncStatus = 'idle',
}) => {
  const [activeSection, setActiveSection] = useState<string>('personalInfo')
  const [data, setData] = useState(() => normalizeResumeData(initialData))
  const [actionMessage, setActionMessage] = useState('')
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [viewMode, setViewMode] = useState<ViewMode>('focused')
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const sectionAnchorRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const editorScrollRef = useRef<HTMLDivElement>(null)
  const editorTabsRef = useRef<HTMLDivElement>(null)

  // 当父组件传入的 initialData 变化时（如重置），同步内部 state
  useEffect(() => {
    setData(normalizeResumeData(initialData))
  }, [initialData])

  useEffect(() => {
    if (!actionMessage) return
    const timeoutId = window.setTimeout(() => setActionMessage(''), 2200)
    return () => window.clearTimeout(timeoutId)
  }, [actionMessage])

  useEffect(() => {
    if (!highlightedSection) return
    const timeoutId = window.setTimeout(() => setHighlightedSection(null), 1400)
    return () => window.clearTimeout(timeoutId)
  }, [highlightedSection])

  useEffect(() => {
    const activeTab = tabRefs.current[activeSection]
    const tabsContainer = editorTabsRef.current
    if (!activeTab || !tabsContainer) return

    const targetLeft = activeTab.offsetLeft - (tabsContainer.clientWidth - activeTab.offsetWidth) / 2
    const maxScrollLeft = tabsContainer.scrollWidth - tabsContainer.clientWidth

    tabsContainer.scrollTo({
      left: Math.max(0, Math.min(targetLeft, maxScrollLeft)),
      behavior: 'smooth',
    })
  }, [activeSection])

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
      setActionMessage('头像已更新')
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
    setActionMessage('头像已清除')
  }

  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          let jsonData = JSON.parse(e.target?.result as string)
          jsonData = migrateContactsData(jsonData)
          jsonData = normalizeResumeData(jsonData)
          setData(jsonData)
          onDataChange(jsonData)
          setActionMessage('已导入 JSON 数据')
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
    link.download = `${getExportFilePrefix(data)}-resume-json.json`
    link.click()
    URL.revokeObjectURL(url)
    setActionMessage('已导出 JSON 文件')
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
    setActionMessage('已添加一项内容')
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
    setActionMessage('已删除一项内容')
  }

  const sections = [
    { id: 'personalInfo', label: '个人信息', icon: '👤' },
    { id: 'workExperience', label: '工作经历', icon: '💼' },
    { id: 'skills', label: '专业技能', icon: '🛠️' },
    { id: 'education', label: '教育经历', icon: '🎓' },
    { id: 'openSourceProjects', label: '开源项目', icon: '🔗' },
    { id: 'articles', label: '文章', icon: '📝' },
  ]

  const activeSectionMeta = sections.find((section) => section.id === activeSection) || sections[0]
  const totalProjects = data.workExperience.reduce((sum: number, work: any) => sum + work.projects.length, 0)
  const quickStats = [
    { label: '工作经历', value: data.workExperience.length },
    { label: '项目数', value: totalProjects },
    { label: '教育经历', value: data.education.length },
    { label: '文章', value: data.articles.length },
  ]
  const jsonSyncTextMap = {
    idle: '待同步',
    syncing: '同步中',
    synced: '已同步',
    error: '同步失败',
  } as const

  const toggleSectionCollapsed = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const highlightSection = (sectionId: string) => {
    setHighlightedSection(sectionId)
  }

  const openSectionIfCollapsed = (sectionId: string) => {
    if (!collapsedSections[sectionId]) return false
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: false
    }))
    return true
  }

  const scrollEditorToSection = (sectionId: string, behavior: ScrollBehavior = 'smooth') => {
    const containerElement = editorScrollRef.current
    const anchorElement = sectionAnchorRefs.current[sectionId]

    if (!containerElement || !anchorElement) return

    const containerRect = containerElement.getBoundingClientRect()
    const anchorRect = anchorElement.getBoundingClientRect()
    const tabsHeight = editorTabsRef.current?.offsetHeight ?? 0
    const topOffset = tabsHeight + 18
    const targetTop = containerElement.scrollTop + anchorRect.top - containerRect.top - topOffset

    window.requestAnimationFrame(() => {
      containerElement.scrollTo({
        top: Math.max(0, targetTop),
        behavior,
      })
    })
  }

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    const didExpand = openSectionIfCollapsed(sectionId)

    if (viewMode === 'focused') {
      window.setTimeout(() => {
        editorScrollRef.current?.scrollTo({
          top: 0,
          behavior: 'smooth'
        })
      }, didExpand ? 120 : 0)
      return
    }

    if (didExpand) {
      window.setTimeout(() => {
        scrollEditorToSection(sectionId)
        highlightSection(sectionId)
      }, 120)
      return
    }

    scrollEditorToSection(sectionId)
    highlightSection(sectionId)
  }

  const handleViewModeChange = (nextMode: ViewMode) => {
    if (nextMode === viewMode) return

    setViewMode(nextMode)

    if (nextMode === 'focused') {
      openSectionIfCollapsed(activeSection)
      window.setTimeout(() => {
        editorScrollRef.current?.scrollTo({
          top: 0,
          behavior: 'smooth'
        })
      }, 0)
      return
    }

    window.setTimeout(() => scrollEditorToSection(activeSection), 0)
  }

  const renderSectionShell = (
    sectionId: string,
    title: string,
    summary: string,
    children: React.ReactNode
  ) => {
    const isCollapsed = viewMode === 'focused' ? false : Boolean(collapsedSections[sectionId])

    return (
      <>
        <div
          className="editor-section-anchor"
          aria-hidden="true"
          ref={(el) => { sectionAnchorRefs.current[sectionId] = el }}
        />
        <div
          className={`editor-section-block ${isCollapsed ? 'collapsed' : ''} ${highlightedSection === sectionId ? 'highlighted' : ''}`}
          ref={(el) => { sectionRefs.current[sectionId] = el }}
        >
          <div className="editor-section-head">
            <div className="editor-section-head-main">
              <h3 className="section-title">{title}</h3>
              <span className="editor-section-summary">{summary}</span>
            </div>
            {viewMode === 'all' && (
              <button
                type="button"
                className={`section-toggle-button ${isCollapsed ? 'collapsed' : ''}`}
                onClick={() => toggleSectionCollapsed(sectionId)}
              >
                {isCollapsed ? '展开' : '收起'}
              </button>
            )}
          </div>
          {!isCollapsed && <div className="editor-section-content">{children}</div>}
        </div>
      </>
    )
  }

  // 监听滚动，更新活动tab
  useEffect(() => {
    const containerElement = editorScrollRef.current
    if (!containerElement || viewMode !== 'all') return

    const handleScroll = () => {
      const tabsHeight = editorTabsRef.current?.offsetHeight ?? 0
      const scrollPosition = containerElement.scrollTop + tabsHeight + 36

      // 找出当前滚动位置对应的section
      for (let index = 0; index < sections.length; index++) {
        const section = sections[index]
        const anchorElement = sectionAnchorRefs.current[section.id]
        const nextAnchorElement = sectionAnchorRefs.current[sections[index + 1]?.id]

        if (anchorElement) {
          const offsetTop = anchorElement.offsetTop
          const offsetBottom = nextAnchorElement?.offsetTop ?? Number.POSITIVE_INFINITY

          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    containerElement.addEventListener('scroll', handleScroll)
    return () => containerElement.removeEventListener('scroll', handleScroll)
  }, [sections, viewMode])

  const renderPersonalInfoEditor = () => (
    renderSectionShell(
      'personalInfo',
      '👤 个人信息',
      `${data.personalInfo.name || '未填写姓名'} · ${data.personalInfo.title || '未填写职位'}`,
      <>
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
        <label>PDF 文件名</label>
        <input
          type="text"
          placeholder="留空时默认使用“姓名-简历”"
          value={data.exportSettings?.pdfFileName || ''}
          onChange={(e) => updateData(['exportSettings', 'pdfFileName'], e.target.value)}
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
              <span className="editor-action-icon">
                <UploadIcon />
              </span>
              上传头像
            </button>
            {data.personalInfo.avatar && (
              <button
                type="button"
                className="btn-avatar-clear"
                onClick={handleClearAvatar}
              >
                <span className="editor-action-icon">
                  <TrashIcon />
                </span>
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
      </>
    )
  )

  const renderWorkExperienceEditor = () => (
    renderSectionShell(
      'workExperience',
      '💼 工作经历',
      `${data.workExperience.length} 段经历 · ${totalProjects} 个项目`,
      <>
      {data.workExperience.map((work: any, workIndex: number) => (
        <div key={workIndex} className="nested-item">
          <div className="nested-item-header">
            <h4>工作经历 #{workIndex + 1}</h4>
            <button
              type="button"
              className="btn-remove"
              onClick={() => removeArrayItem(['workExperience'], workIndex)}
            >
              <span className="editor-action-icon">
                <TrashIcon />
              </span>
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
                    type="button"
                    className="btn-remove-small"
                    onClick={() => removeArrayItem(['workExperience', workIndex, 'projects'], projectIndex)}
                  >
                    <span className="editor-action-icon">
                      <TrashIcon />
                    </span>
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
                        type="button"
                        className="btn-remove-small"
                        aria-label="删除职责"
                        title="删除职责"
                        onClick={() => removeArrayItem(['workExperience', workIndex, 'projects', projectIndex, 'responsibilities'], respIndex)}
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn-add-small"
                    onClick={() => addArrayItem(['workExperience', workIndex, 'projects', projectIndex, 'responsibilities'], '')}
                  >
                    <span className="editor-action-icon">
                      <PlusIcon />
                    </span>
                    添加职责
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn-add"
              onClick={() => addArrayItem(['workExperience', workIndex, 'projects'], {
                name: '',
                description: '',
                responsibilities: []
              })}
            >
              <span className="editor-action-icon">
                <PlusIcon />
              </span>
              添加项目
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
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
        <span className="editor-action-icon">
          <PlusIcon />
        </span>
        添加工作经历
      </button>
      </>
    )
  )

  const renderSkillsEditor = () => (
    renderSectionShell(
      'skills',
      '🛠️ 专业技能',
      `${data.skills.length} 项技能`,
      <>
        <div className="form-group">
          <label>技能列表</label>
        {data.skills.map((skill: string, index: number) => (
          <div key={index} className="array-item">
            <div className="array-item-header">
              <h5>技能 #{index + 1}</h5>
              <button
                type="button"
                className="btn-remove-small"
                onClick={() => removeArrayItem(['skills'], index)}
              >
                <span className="editor-action-icon">
                  <TrashIcon />
                </span>
                删除
              </button>
            </div>
            <textarea
              value={skill}
              onChange={(e) => updateData(['skills', index], e.target.value)}
            />
          </div>
        ))}
        <button
          type="button"
          className="btn-add"
          onClick={() => addArrayItem(['skills'], '')}
        >
          <span className="editor-action-icon">
            <PlusIcon />
          </span>
          添加技能
        </button>
        </div>
      </>
    )
  )

  const renderEducationEditor = () => (
    renderSectionShell(
      'education',
      '🎓 教育经历',
      `${data.education.length} 段教育经历`,
      <>
      {data.education.map((edu: any, index: number) => (
        <div key={index} className="nested-item">
          <div className="nested-item-header">
            <h4>教育经历 #{index + 1}</h4>
            <button
              type="button"
              className="btn-remove"
              onClick={() => removeArrayItem(['education'], index)}
            >
              <span className="editor-action-icon">
                <TrashIcon />
              </span>
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
        type="button"
        className="btn-add"
        onClick={() => addArrayItem(['education'], {
          degree: '',
          school: '',
          major: '',
          startDate: '',
          endDate: ''
        })}
      >
        <span className="editor-action-icon">
          <PlusIcon />
        </span>
        添加教育经历
      </button>
      </>
    )
  )

  const renderOpenSourceProjectsEditor = () => (
    renderSectionShell(
      'openSourceProjects',
      '🔗 开源项目',
      `${data.openSourceProjects.length} 个开源项目`,
      <>
      {data.openSourceProjects.map((project: any, index: number) => (
        <div key={index} className="nested-item">
          <div className="nested-item-header">
            <h4>项目 #{index + 1}</h4>
            <button
              type="button"
              className="btn-remove"
              onClick={() => removeArrayItem(['openSourceProjects'], index)}
            >
              <span className="editor-action-icon">
                <TrashIcon />
              </span>
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
        type="button"
        className="btn-add"
        onClick={() => addArrayItem(['openSourceProjects'], {
          name: '',
          description: '',
          link: ''
        })}
      >
        <span className="editor-action-icon">
          <PlusIcon />
        </span>
        添加开源项目
      </button>
      </>
    )
  )

  const renderArticlesEditor = () => (
    renderSectionShell(
      'articles',
      '📝 文章',
      `${data.articles.length} 篇文章`,
      <>
      {data.articles.map((article: any, index: number) => (
        <div key={index} className="nested-item">
          <div className="nested-item-header">
            <h4>文章 #{index + 1}</h4>
            <button
              type="button"
              className="btn-remove"
              onClick={() => removeArrayItem(['articles'], index)}
            >
              <span className="editor-action-icon">
                <TrashIcon />
              </span>
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
        type="button"
        className="btn-add"
        onClick={() => addArrayItem(['articles'], {
          title: '',
          link: ''
        })}
      >
        <span className="editor-action-icon">
          <PlusIcon />
        </span>
        添加文章
      </button>
      </>
    )
  )

  const sectionRenderers: Record<string, () => React.ReactNode> = {
    personalInfo: renderPersonalInfoEditor,
    workExperience: renderWorkExperienceEditor,
    skills: renderSkillsEditor,
    education: renderEducationEditor,
    openSourceProjects: renderOpenSourceProjectsEditor,
    articles: renderArticlesEditor,
  }

  const renderedSections = (
    viewMode === 'focused'
      ? [activeSection]
      : sections.map((section) => section.id)
  ).map((sectionId) => (
    <React.Fragment key={sectionId}>
      {sectionRenderers[sectionId]()}
    </React.Fragment>
  ))

  return (
    <div className="resume-editor-panel">
      <div className="editor-scroll-area" ref={editorScrollRef}>
        <div className="editor-header">
          <div className="editor-header-main">
            <div>
              <p className="editor-kicker">ResumeForge Workbench</p>
              <h2>简历编辑</h2>
            </div>
            <div className="editor-status">
              <span className="editor-status-pill">实时预览</span>
              <span className="editor-status-pill muted">本地保存</span>
              {selectedJsonFileName && (
                <>
                  <span className="editor-status-pill file-linked" title={selectedJsonFileName}>
                    JSON: {selectedJsonFileName}
                  </span>
                  <span className={`editor-status-pill sync-status ${jsonSyncStatus}`}>
                    {jsonSyncTextMap[jsonSyncStatus]}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="editor-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJson}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="editor-action-button"
              onClick={onSelectJsonFile}
            >
              <span className="editor-action-icon">
                <FileTextIcon />
              </span>
              选择文件
            </button>
            <button
              type="button"
              className="editor-action-button"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="editor-action-icon">
                <UploadIcon />
              </span>
              导入
            </button>
            <button
              type="button"
              className="editor-action-button"
              onClick={handleExportJson}
            >
              <span className="editor-action-icon">
                <DownloadIcon />
              </span>
              导出
            </button>
            {onReset && (
              <button
                type="button"
                className="editor-action-button danger"
                onClick={() => {
                  if (window.confirm('确定要重置为默认数据吗？所有未导出的编辑将丢失。')) {
                    onReset()
                    setActionMessage('已恢复默认数据')
                  }
                }}
              >
                <span className="editor-action-icon">
                  <RefreshIcon />
                </span>
                重置
              </button>
            )}
          </div>
        </div>

        <div className="editor-workbench-strip">
          <div className="editor-overview-card">
            <div className="editor-overview-main">
              <span className="editor-overview-badge">当前模块</span>
              <h3>{activeSectionMeta.icon} {activeSectionMeta.label}</h3>
              <p>
                {viewMode === 'focused'
                  ? '聚焦编辑模式下，一次只显示当前模块，适合连续填写和快速切换。'
                  : '查看全部模式下，会显示完整表单，顶部标签会定位到对应模块。'}
              </p>
            </div>
            <div className="editor-overview-side">
              <div className="view-mode-switch" role="tablist" aria-label="模块查看模式">
                <button
                  type="button"
                  className={`view-mode-button ${viewMode === 'focused' ? 'active' : ''}`}
                  onClick={() => handleViewModeChange('focused')}
                >
                  聚焦编辑
                </button>
                <button
                  type="button"
                  className={`view-mode-button ${viewMode === 'all' ? 'active' : ''}`}
                  onClick={() => handleViewModeChange('all')}
                >
                  查看全部
                </button>
              </div>
              <div className="editor-overview-stats">
                {quickStats.map((stat) => (
                  <div key={stat.label} className="overview-stat-item">
                    <span className="overview-stat-value">{stat.value}</span>
                    <span className="overview-stat-label">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {actionMessage && (
            <div className="editor-action-feedback" role="status">
              <span className="editor-action-dot" />
              <span>{actionMessage}</span>
            </div>
          )}
        </div>

        <div className="editor-tabs" ref={editorTabsRef}>
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`tab-button ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => scrollToSection(section.id)}
              ref={(el) => { tabRefs.current[section.id] = el }}
            >
              <span className="tab-icon">{section.icon}</span>
              <span className="tab-label">{section.label}</span>
            </button>
          ))}
        </div>

        <div className={`editor-content ${viewMode === 'focused' ? 'focused-mode' : 'all-mode'}`}>
          {renderedSections}
        </div>
      </div>

      {viewMode === 'all' && (
        <button
          type="button"
          className="btn-scroll-to-top"
          onClick={() => scrollToSection('personalInfo')}
        >
          回到顶部
        </button>
      )}
    </div>
  )
}

export default ResumeEditor
