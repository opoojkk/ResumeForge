import React from 'react'

interface ContactItem {
  icon: React.ReactNode
  text: string
  link?: string
}

interface HeaderProps {
  name: string
  title: string
  avatar?: string
  location?: string
  locationIcon?: React.ReactNode
  contacts: ContactItem[]
}

export default function Header({ name, title, avatar, location, locationIcon, contacts }: HeaderProps) {
  return (
    <header className="resume-header">
      <div className="header-left">
        {avatar && (
          <div className="avatar">
            <img src={avatar} alt={name} referrerPolicy="no-referrer" crossOrigin="anonymous" />
          </div>
        )}
        <div className="header-info">
          <h1 className="name">{name}</h1>
          <p className="title">{title}</p>
        </div>
      </div>
      <div className="header-right">
        {location && (
          <div className="contact-item">
            <span className="contact-icon">
              {locationIcon || <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle></svg>}
            </span>
            <span className="contact-text">{location}</span>
          </div>
        )}
        {contacts.map((contact, index) => (
          <div key={index} className="contact-item">
            <span className="contact-icon">{contact.icon}</span>
            {contact.link ? (
              <a href={contact.link} className="contact-text">{contact.text}</a>
            ) : (
              <span className="contact-text">{contact.text}</span>
            )}
          </div>
        ))}
      </div>
    </header>
  )
}
