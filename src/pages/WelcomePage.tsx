import { Link } from 'react-router-dom'
import './pages.css'

export function WelcomePage() {
  return <section className="welcome-page"><p className="eyebrow">VisaPilot</p><h1>Plan your immigration pathway with clarity.</h1><p>This is the initial application foundation. Product capabilities will be added in future phases.</p><Link className="primary-link" to="/app">Open workspace</Link></section>
}
