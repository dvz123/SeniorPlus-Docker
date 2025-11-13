import '../styles/global.css'
import { Award, CheckCircle, Zap } from "lucide-react"

const Pricing = () => {
  const features = [
    "Agendamento ilimitado de consultas",
    "Lembretes personalizados de medicamentos",
    "Registro completo de atividades",
    "Acesso a conteúdos educativos premium",
    "Suporte de emergência 24/7",
    "Sincronização multiplataforma",
    "Relatórios detalhados de saúde",
    "Backup automático e seguro",
    "Integração com dispositivos de monitoramento",
    "Suporte técnico especializado",
  ]

  return (
    <section id="planos" className="pricing">
      <div className="container">
        <h2 className="section-title-large">Plano transparente e acessível</h2>
        <p className="section-description-large">Acesso completo a todas as funcionalidades por um preço justo</p>

        <div className="pricing-card card">
          {/* Popular Badge */}
          <div className="pricing-badge">
            <Award size={16} style={{ marginRight: "0.5rem" }} />
            <span>Plano Completo</span>
          </div>

          <div className="pricing-header">
            <h3 className="pricing-title">Senior+ Premium</h3>
            <div className="pricing-price">
              <span className="pricing-amount">R$ 29,90</span>
              <span className="pricing-period">/mês</span>
            </div>
            <p className="pricing-description">Tudo que você precisa para autonomia e bem-estar</p>
          </div>

          <div className="pricing-content">
            <div className="pricing-features">
              {features.map((feature, index) => (
                <div key={index} className="pricing-feature">
                  <CheckCircle size={20} className="pricing-feature-icon" />
                  <span className="pricing-feature-text">{feature}</span>
                </div>
              ))}
            </div>

            <div className="pricing-actions">
              <button className="btn btn-primary btn-lg" style={{ display: "flex", alignItems: "center" }}>
                Começar teste grátis
                <Zap size={20} style={{ marginLeft: "0.5rem" }} />
              </button>
              <button className="btn btn-outline btn-lg">Saber mais sobre o projeto</button>
            </div>

            <p className="pricing-note">✅ 7 dias grátis • ✅ Cancele quando quiser • ✅ Sem taxa de setup</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Pricing
