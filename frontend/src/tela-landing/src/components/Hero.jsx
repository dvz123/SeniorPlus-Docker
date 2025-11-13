import '../styles/global.css'
import { ArrowRight } from "lucide-react"
import heroImg from '../assets/img/idoso2-hero.jpg'

const Hero = () => {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-grid" style={{ alignItems: 'center', gridTemplateColumns: '1fr 1fr' }}>
          {/* Left: image. Right: headline/text */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img src={heroImg} alt="Idoso ilustrativo" style={{ width: '100%', maxWidth: 420, borderRadius: 12 }} />
          </div>

          <div className="hero-content" style={{ textAlign: 'left' }}>
            <div>
              <span className="badge">🎉 Teste grátis por 7 dias</span>

              <h1 className="hero-title" style={{ marginTop: "1.5rem", fontSize: '3rem' }}>
                Autonomia e bem-estar para
                <span className="hero-title-highlight"> a terceira idade</span>
              </h1>

              <p className="hero-description" style={{ marginTop: "1.5rem", fontSize: '1.25rem' }}>
                Uma plataforma digital integral que promove a independência dos idosos através de tecnologia acessível e
                funcionalidades inteligentes.
              </p>
            </div>

            <div className="hero-buttons">
              <a href="/registrar">
                <button className="btn btn-primary btn-lg">
                  Começar agora
                  <ArrowRight className="ml-2" size={20} />
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
