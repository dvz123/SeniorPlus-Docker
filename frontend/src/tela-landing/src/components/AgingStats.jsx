import { Shield, Heart, Users, BookOpen } from "lucide-react"
import tecnologiaImg from '../assets/img/idoso1-landing.jpg';

import '../styles/global.css'

const AgingStats = () => {
  const stats = [
    {
      number: "30.2M",
      label: "Idosos no Brasil",
      description: "População com 60+ anos em 2022",
      source: "IBGE",
    },
    {
      number: "3x",
      label: "Crescimento até 2050",
      description: "Pessoas idosas com necessidade de cuidados",
      source: "OPAS",
    },
    {
      number: "28%",
      label: "Usam internet",
      description: "Idosos com 60+ anos conectados",
      source: "IBGE",
    },
    {
      number: "73%",
      label: "Preferem casa",
      description: "Idosos que querem envelhecer em casa",
      source: "Pesquisas",
    },
  ]

  const visionFeatures = [
    {
      icon: Shield,
      title: "Inclusão Digital",
      description: "Interface acessível que facilita o primeiro contato com a tecnologia",
    },
    {
      icon: Heart,
      title: "Autonomia Promovida",
      description: "Ferramentas que incentivam a independência e o autocuidado",
    },
    {
      icon: Users,
      title: "Rede de Apoio",
      description: "Conecta familiares, cuidadores e profissionais de saúde",
    },
  ]

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title-large">O envelhecimento populacional é realidade</h2>
        <p className="section-description-large">
          Dados que mostram a urgência de soluções digitais para a terceira idade
        </p>

        <div className="grid grid-4" style={{ marginBottom: "5rem" }}>
          {stats.map((stat, index) => (
            <div key={index} className="card stats-card">
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-description">{stat.description}</div>
              <div className="stat-source">Fonte: {stat.source}</div>
            </div>
          ))}
        </div>

        {/* Project Vision */}
        <div className="grid grid-2" style={{ gap: "4rem", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div>
              <h3
                style={{ fontSize: "1.875rem", fontWeight: "bold", color: "var(--color-text)", marginBottom: "1rem" }}
              >
                Nossa visão para o futuro
              </h3>
              <p style={{ fontSize: "1.125rem", color: "var(--color-text-light)", lineHeight: "1.6" }}>
                O Senior+ surge como resposta aos desafios do envelhecimento populacional, oferecendo uma solução
                digital que promove autonomia, inclusão e bem-estar para a terceira idade.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem"}}>
              {visionFeatures.map((feature, index) => (
                <div key={index} style={{ display: "flex", gap: "1rem", alignItems:"flex-start", marginRight:"2rem" }}>
                  <div className="feature-icon bg-teal-50" style={{ flexShrink: 0 }}>
                    <feature.icon size={24} className="text-teal-600" />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <h4
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: "600",
                        color: "var(--color-text)",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {feature.title}
                    </h4>
                    <p style={{ color: "var(--color-text-light)" }}>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <div
              style={{
                background: "linear-gradient(to bottom right, #f0fdfa, #dbeafe)",
                borderRadius: "1rem",
                padding: "2rem",
              }}
            >
              <img
                src={tecnologiaImg}
                alt="Idosos utilizando tecnologia"
                style={{ width: "100%", borderRadius: "0.75rem" }}
              />

              {/* Floating 'Inovação' element kept; removed the FATEC card to simplify visual */}
              <div
                style={{
                  position: "absolute",
                  top: "1rem",
                  right: "1rem",
                  background: "white",
                  borderRadius: "0.5rem",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  padding: "0.75rem",
                  border: "1px solid var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    width: "0.75rem",
                    height: "0.75rem",
                    backgroundColor: "#10b981",
                    borderRadius: "50%",
                    animation: "pulse 2s infinite",
                  }}
                ></div>
                <span style={{ fontSize: "0.875rem", fontWeight: "500", color: "var(--color-text)" }}>Inovação</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AgingStats