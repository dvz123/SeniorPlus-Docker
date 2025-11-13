import { Heart, Shield, Zap, FileText, CheckCircle } from "lucide-react"
import '../styles/global.css'

const Partnerships = () => {
  const partnerships = [
    {
      icon: Heart,
      title: "Centros de Convivência",
      description: "Parcerias com instituições que promovem atividades sociais e educativas para idosos",
      color: "bg-red-100 text-red-500 border-red-200",
    },
    {
      icon: Shield,
      title: "Instituições de Saúde",
      description: "Colaboração com hospitais e clínicas especializadas em geriatria",
      color: "bg-blue-100 text-blue-500 border-blue-200",
    },
    {
      icon: Zap,
      title: "Tecnologia Assistiva",
      description: "Integração com empresas de dispositivos de monitoramento e IoT",
      color: "bg-purple-100 text-purple-500 border-purple-200",
    },
    {
      icon: FileText,
      title: "Farmácias e Consultorias",
      description: "Rede de apoio para distribuição e suporte operacional especializado",
      color: "bg-green-100 text-green-500 border-green-200",
    },
  ]

  const businessModels = [
    {
      title: "Assinaturas Premium",
      description: "Recursos avançados como personalização de lembretes e conteúdos exclusivos",
      features: ["Lembretes personalizados", "Conteúdos exclusivos", "Consultoria especializada"],
    },
    {
      title: "Publicidade Segmentada",
      description: "Anúncios relevantes sobre produtos e serviços de saúde e bem-estar",
      features: ["Anúncios relevantes", "Preservação da experiência", "Conteúdo de qualidade"],
    },
    {
      title: "Suporte Humanizado",
      description: "Atendimento personalizado via telefone e aplicativo com abordagem empática",
      features: ["Atendimento personalizado", "Suporte via telefone", "Abordagem empática"],
    },
  ]

  return (
    <section className="section section-alt">
      <div className="container">
        <h2 className="section-title-large">Parcerias Estratégicas</h2>
        <p className="section-description-large">
          Construindo um ecossistema sustentável para o cuidado integral da terceira idade
        </p>

        <div className="grid grid-4">
          {partnerships.map((partnership, index) => (
            <div key={index} className="card" style={{ textAlign: "center" }}>
              <div className="card-content" style={{ padding: "2rem" }}>
                <div
                  className={`flex items-center justify-center ${partnership.color} border rounded-xl shadow-sm`}
                  style={{ margin: "0 auto 1rem", width: "4rem", height: "4rem" }}
                >
                  <partnership.icon size={28} />
                </div>
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                    color: "var(--color-text)",
                    marginBottom: "0.75rem",
                  }}
                >
                  {partnership.title}
                </h3>
                <p style={{ color: "var(--color-text-light)", fontSize: "0.875rem", lineHeight: "1.5" }}>
                  {partnership.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Business Model */}
        <div className="card" style={{ marginTop: "4rem", padding: "2rem 3rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h3 style={{ fontSize: "1.875rem", fontWeight: "bold", color: "var(--color-text)", marginBottom: "1rem" }}>
              Modelo de Negócio Sustentável
            </h3>
            <p style={{ fontSize: "1.125rem", color: "var(--color-text-light)" }}>
              Múltiplas fontes de receita para garantir a continuidade e evolução da plataforma
            </p>
          </div>

          <div className="grid grid-3">
            {businessModels.map((model, index) => (
              <div key={index} className="card" style={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
                <div className="card-header">
                  <h4 className="card-title">{model.title}</h4>
                  <p className="card-description">{model.description}</p>
                </div>
                <div className="card-content">
                  <ul className="feature-list">
                    {model.features.map((feature, idx) => (
                      <li key={idx} className="feature-item">
                        <CheckCircle size={16} className="check-icon" />
                        <span className="feature-text">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Partnerships
