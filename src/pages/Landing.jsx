import { Link } from 'react-router-dom'
import '../styles/landing.css'

export default function Landing() {
  return (
    <div className="landing">
      {/* Animated BG */}
      <div className="bg-pattern">
        <div className="circle"></div><div className="circle"></div><div className="circle"></div>
      </div>

      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-brand">
          <div className="logo">CP</div>
          <h1>CLASS<span>-PASS</span></h1>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <Link to="/login" className="login-btn">Sign In</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-tag">
            <i className="fas fa-microchip"></i>
            IoT-Powered Smart Campus System
          </div>
          <h1>Find <span className="green">Empty</span> Classrooms.<br/>Book <span className="accent">Instantly</span>.</h1>
          <p>CLASS-PASS uses IoT motion sensors to detect real-time classroom occupancy at Lovely Professional University. Students find study spaces; teachers handle emergencies — all in one click.</p>
          <div className="cta-group">
            <Link to="/login" className="cta-btn student-cta">
              <i className="fas fa-user-graduate"></i>Student Portal
            </Link>
            <Link to="/login" className="cta-btn teacher-cta">
              <i className="fas fa-chalkboard-teacher"></i>Teacher Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <div className="features-title">How It Works</div>
        <div className="features-grid">
          {[
            { icon: 'fa-satellite-dish', color: 'orange', title: 'IoT Sensor Detection', desc: 'PIR motion sensors monitor board & projector activity to differentiate active teaching from idle movement.' },
            { icon: 'fa-door-open', color: 'green', title: 'Real-Time Availability', desc: 'See which classrooms are vacant right now, with live color-coded status across buildings and floors.' },
            { icon: 'fa-bolt', color: 'blue', title: 'Emergency Reallocation', desc: 'Projector broke? Board damaged? Teachers instantly book the nearest available alternative classroom.' },
            { icon: 'fa-chart-line', color: 'purple', title: 'Smart Analytics', desc: 'Admin dashboards show utilization heatmaps, peak hours, and infrastructure issue trends.' },
          ].map((f, i) => (
            <div className="feature-card" key={i}>
              <div className={`icon ${f.color}`}><i className={`fas ${f.icon}`}></i></div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer" id="about">
        © 2026 CLASS-PASS · Lovely Professional University, Phagwara, Punjab · Capstone Project
      </footer>
    </div>
  )
}
