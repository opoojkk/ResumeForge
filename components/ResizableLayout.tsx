'use client'

import React from 'react'
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from 'react-resizable-panels'

const LAYOUT_STORAGE_KEY = 'resume-forge-panels'

type ResizableLayoutProps = {
  editor: React.ReactNode
  preview: React.ReactNode
}

/**
 * 左右可拖拽分栏布局，参照 magic-resume 交互。
 * 比例通过 autoSaveId 持久化到 localStorage，纯静态部署可用。
 */
export default function ResizableLayout({ editor, preview }: ResizableLayoutProps) {
  return (
    <PanelGroup
      direction="horizontal"
      className="resume-layout resume-layout-resizable"
      autoSaveId={LAYOUT_STORAGE_KEY}
    >
      <Panel defaultSize={50} minSize={25} maxSize={75} className="resume-panel-editor">
        <div className="workbench-pane workbench-pane-editor">
          {editor}
        </div>
      </Panel>
      <PanelResizeHandle className="resize-handle" aria-label="调整编辑区与预览区宽度">
        <div className="resize-handle__grip" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </PanelResizeHandle>
      <Panel defaultSize={50} minSize={25} maxSize={75} className="resume-panel-preview">
        <div className="workbench-pane workbench-pane-preview">
          {preview}
        </div>
      </Panel>
    </PanelGroup>
  )
}
