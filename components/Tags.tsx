import React from 'react'

interface TagsProps {
  tags: string[]
  variant?: 'primary' | 'secondary'
}

export default function Tags({ tags, variant = 'primary' }: TagsProps) {
  return (
    <div className="tags-container">
      {tags.map((tag, index) => (
        <span key={index} className={`tag tag-${variant}`}>
          {tag}
        </span>
      ))}
    </div>
  )
}
