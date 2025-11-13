import { Users, Heart, Shield, CheckCircle } from "lucide-react"
import '../styles/global.css'

const TargetAudience = () => {
  const audiences = [
    {
      icon: Users,
      title: "Idosos",
      description:
        "Interface acessível com botões grandes, fontes ampliadas e alto contraste para facilitar o uso diário.",
      bgColor: "#3b82f6",
      features: ["Design inclusivo", "Navegação simplificada", "Conteúdo educativo"],
    },
    {
      icon: Heart,
      title: "Familiares",
      description: "Acompanhe seus entes queridos à distância com relatórios e notificações importantes.",
      bgColor: "#14b8a6",
      features: ["Monitoramento remoto", "Relatórios detalhados", "Alertas em tempo real"],
    },
    {
      icon: Shield,
      title: "Cuidadores",
      description: "Ferramentas profissionais para organizar rotinas e manter registros precisos.",
      bgColor: "#a855f7",
      features: ["Gestão de rotinas", "Histórico completo", "Comunicação integrada"],
    },
  ]

  return (
    <section className="section section-alt">
      <div className="container">
        <h2 className="section-title-large">Para quem desenvolvemos</h2>
        <p className="section-description-large">
          Nossa plataforma conecta todos os envolvidos no cuidado, promovendo autonomia e bem-estar
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          {audiences.map((item, index) => (
            <div key={index} style={{
              background: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}>
              <div style={{ textAlign: "center", padding: "2rem 1.5rem" }}>
                <div style={{
                  margin: "0 auto 1rem",
                  width: "4rem",
                  height: "4rem",
                  borderRadius: "1rem",
                  background: item.bgColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <item.icon size={32} color="white" />
                </div>
                <h3 style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  marginBottom: "0.5rem"
                }}>
                  {item.title}
                </h3>
                <p style={{
                  color: "#6b7280",
                  lineHeight: "1.6"
                }}>{item.description}</p>
              </div>
              <div style={{ padding: "0 1.5rem 1.5rem" }}>
                <ul style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0
                }}>
                  {item.features.map((feature, idx) => (
                    <li key={idx} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "0.5rem"
                    }}>
                      <CheckCircle size={16} style={{ color: "#0aa174" }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TargetAudience
