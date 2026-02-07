import React from 'react'

interface TimelineItem {
  title: string
  company: string
  time: string
  desc: string
  highlights?: string[]
}

interface TimelineProps {
  items: TimelineItem[]
}

export default function Timeline({ items }: TimelineProps) {
  return (
    <div className="timeline">
      {items.map((item, index) => (
        <div key={index} className="timeline-item">
          <div className="timeline-header">
            <div className="timeline-title-group">
              <h3 className="timeline-title">{item.title}</h3>
              <span className="timeline-company">{item.company}</span>
            </div>
            <span className="timeline-time">{item.time}</span>
          </div>
          <p className="timeline-desc">{item.desc}</p>
          {item.highlights && item.highlights.length > 0 && (
            <ul className="timeline-highlights">
              {item.highlights.map((highlight, idx) => (
                <li key={idx}>{highlight}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}
