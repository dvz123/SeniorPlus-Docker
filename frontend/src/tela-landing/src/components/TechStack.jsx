import { Database } from "lucide-react"
import '../styles/global.css'

const TechStack = () => {
  const technologies = [
    { name: "React.js", description: "Interface moderna" },
    { name: "Spring Boot", description: "Backend robusto" },
    { name: "MySQL", description: "Banco de dados relacional confiável" },
    { name: "OAuth 2.0", description: "Autenticação segura" },
  ]

  return (
    <section id="tecnologia" className="tech-stack">
      <div className="container">
        <h2 className="section-title">Tecnologia Moderna e Confiável</h2>
        <p className="section-description">
          Desenvolvido com as melhores tecnologias para garantir performance e segurança
        </p>
        <div className="tech-grid">
          {technologies.map((tech, index) => (
            <div key={index} className="tech-item">
              <div className="tech-icon">
                <Database size={32} color="#0d9488" />
              </div>
              <div className="tech-name">{tech.name}</div>
              <div className="tech-description">{tech.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TechStack
