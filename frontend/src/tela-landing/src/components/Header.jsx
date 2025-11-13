import '../styles/global.css'
import { useState } from "react"
import { Menu, X } from "lucide-react"

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
  <header className="landing-header">
      <div className="container header-container">
        {/* Logo */}
        <div className="logo-container">
          {/* restored original logo element (h2) and use CSS to increase size harmonically */}
          <h2>Senior+</h2>
        </div>

        {/* Desktop Navigation */}
        <nav className="nav-desktop">
          <a href="#funcionalidades" className="nav-link">
            Funcionalidades
          </a>
          <a href="#planos" className="nav-link">
            Planos
          </a>
          <a href="#sobre" className="nav-link">
            Sobre
          </a>
          <a href="#contato" className="nav-link">
            Contato
          </a>
        </nav>

        {/* Desktop CTA */}
        <div className="nav-desktop">
          <a href="/login">
            <button className="btn btn-ghost">Entrar</button>
          </a>
          <a href="/registrar">
            <button className="btn btn-primary">Teste Grátis</button>
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button className="menu-button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <div className="container">
            <nav className="mobile-nav">
              <a href="#funcionalidades" className="mobile-nav-link">
                Funcionalidades
              </a>
              <a href="#planos" className="mobile-nav-link">
                Planos
              </a>
              <a href="#sobre" className="mobile-nav-link">
                Sobre
              </a>
              <a href="#contato" className="mobile-nav-link">
                Contato
              </a>
              <div
                className="mobile-nav-buttons"
                style={{ display: "flex", flexDirection: "column", gap: "0.5rem", paddingTop: "1rem" }}
              >
                <a href="/login"><button className="btn btn-ghost" style={{ justifyContent: "flex-start" }}>Entrar</button></a>
                <a href="/registrar"><button className="btn btn-primary">Teste Grátis</button></a>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
