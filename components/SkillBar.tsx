import React from 'react'

interface Skill {
  name: string
  level: number // 1-5
}

interface SkillBarProps {
  skills: Skill[]
}

export default function SkillBar({ skills }: SkillBarProps) {
  return (
    <div className="skill-bar-container">
      {skills.map((skill, index) => (
        <div key={index} className="skill-item">
          <div className="skill-header">
            <span className="skill-name">{skill.name}</span>
            <span className="skill-level">{skill.level}/5</span>
          </div>
          <div className="skill-bar">
            <div 
              className="skill-bar-fill" 
              style={{ width: `${(skill.level / 5) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
