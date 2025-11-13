import '../styles/global.css'
import {
  Phone,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  X,
  MessageCircle,
} from "lucide-react";

const Footer = () => {
  const projectLinks = [
    "Funcionalidades",
    "Tecnologia",
    "Metodologia",
    "Documentação",
  ];
  const contactLinks = [
    "Equipe de Desenvolvimento",
    "Documentação Técnica",
    "Apresentação",
  ];

  return (
    <footer id="contato" className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Company Info */}
          <div>
            <div className="logo-container">
              <h2>Senior+</h2>
            </div>
            <p className="footer-description">
              Plataforma digital integral para autonomia e bem-estar da terceira
              idade.
            </p>

            {/* Social Media */}
            <div className="social-links">
              <a href="https://www.instagram.com/accounts/login/" target="_blank" rel="noreferrer" className="social-link">
                <Instagram size={20} />
              </a>
              <a href="https://www.facebook.com/login/" target="_blank" rel="noreferrer" className="social-link">
                <Facebook size={20} />
              </a>
              <a href="https://x.com/login" target="_blank" rel="noreferrer" className="social-link">
                <X size={20} />
              </a>
              <a href="https://web.whatsapp.com/" target="_blank" rel="noreferrer" className="social-link">
                <Phone size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="footer-title">Projeto</h3>
            <ul className="footer-links">
              <li><a href="#tecnologia" className="footer-link">Tecnologia</a></li>
              <li><a href="#funcionalidades" className="footer-link">Funcionalidades</a></li>
              <li><a href="#documentacao" className="footer-link">Documentação</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="footer-title">Contato</h3>
            <ul className="footer-links">
              {contactLinks.map((item, index) => (
                <li key={index}>
                  <a href="#" className="footer-link">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="footer-divider"></div>
        <div className="contact-info">
          <div className="contact-item">
            <Phone size={20} className="contact-icon" />
            <span>Contato via Telefone</span>
          </div>
          <div className="contact-item">
            <Mail size={20} className="contact-icon" />
            <span>contato@seniorplus.com.br</span>
          </div>
          <div className="contact-item">
            <MapPin size={20} className="contact-icon" />
            <span>São Paulo, SP</span>
          </div>
        </div>

        {/* Bottom */}
        <div className="footer-divider"></div>
        <div className="footer-bottom">
          <p className="copyright">
            &copy; 2025 Senior+
          </p>
          <div className="footer-bottom-links">
            <a href="#" className="footer-bottom-link">
              Privacidade
            </a>
            <a href="#" className="footer-bottom-link">
              Termos
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
