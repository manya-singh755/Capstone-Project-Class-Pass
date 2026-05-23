import { useState, useEffect } from 'react'

export default function Header({ roleBadge, roleClass }) {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      let h = now.getHours(), m = now.getMinutes()
      const ampm = h >= 12 ? 'PM' : 'AM'
      h = h % 12 || 12
      setTime(`${h}:${m.toString().padStart(2, '0')} ${ampm}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="header">
      <div className="header-left">
        <h1>Lovely Professional <span>University</span></h1>
      </div>
      <div className="header-right">
        <div className="header-time"><i className="fas fa-clock"></i>{time}</div>
        <span className={`role-badge ${roleClass || ''}`}>
          <i className={`fas ${roleClass === 'student' ? 'fa-user-graduate' : roleClass === 'teacher' ? 'fa-chalkboard-teacher' : 'fa-shield-alt'}`}></i>
          {roleBadge}
        </span>
        <button className="notif-btn"><i className="fas fa-bell"></i><span className="dot"></span></button>
      </div>
    </header>
  )
}
