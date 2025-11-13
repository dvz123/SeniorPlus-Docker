import { Calendar, Bell, Activity, BookOpen, AlertTriangle, Smartphone } from "lucide-react"
import '../styles/global.css'

const Features = () => {
  const features = [
    {
      icon: Calendar,
      title: "Agendamento de Consultas",
      description:
        "Sistema intuitivo para marcar e gerenciar consultas médicas com lembretes automáticos e sincronização.",
      iconColor: "#2563eb",
      bgColor: "#eff6ff",
    },
    {
      icon: Bell,
      title: "Lembretes de Medicamentos",
      description: "Notificações inteligentes para administração de medicamentos com controle de dosagem e horários.",
      iconColor: "#0d9488",
      bgColor: "#f0fdfa",
    },
    {
      icon: Activity,
      title: "Registro de Atividades",
      description: "Acompanhe atividades diárias, exercícios e rotinas para manter um estilo de vida ativo e saudável.",
      iconColor: "#9333ea",
      bgColor: "#faf5ff",
    },
    {
      icon: BookOpen,
      title: "Conteúdos Educativos",
      description: "Acesso a vídeos, textos e materiais multimídia sobre saúde, bem-estar e autocuidado.",
      iconColor: "#16a34a",
      bgColor: "#f0fdf4",
    },
    {
      icon: AlertTriangle,
      title: "Suporte de Emergência",
      description: "Sistema de alertas e contatos de emergência para situações que requerem atenção imediata.",
      iconColor: "#dc2626",
      bgColor: "#fef2f2",
    },
    {
      icon: Smartphone,
      title: "Acesso Multiplataforma",
      description: "Disponível em smartphones, tablets e desktops com design responsivo e acessível.",
      iconColor: "#4f46e5",
      bgColor: "#eef2ff",
    },
  ]

  return (
    <section id="funcionalidades" className="section">
      <div className="container">
        <h2 className="section-title-large">Funcionalidades Inteligentes</h2>
        <p className="section-description-large">
          Recursos desenvolvidos especificamente para promover autonomia e bem-estar da terceira idade
        </p>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          {features.map((feature, index) => (
            <div key={index} style={{
              background: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              padding: '1.5rem',
              transition: 'box-shadow 0.3s'
            }}>
                <div style={{ padding: '1.5rem 1.5rem 0.75rem', textAlign: 'center' }}>
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  background: feature.bgColor,
                  transition: 'transform 0.3s'
                }}>
                  <feature.icon style={{ color: feature.iconColor }} size={24} />
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem'
                }}>{feature.title}</h3>
                <p style={{
                  color: '#6b7280',
                  lineHeight: 1.5
                }}>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
