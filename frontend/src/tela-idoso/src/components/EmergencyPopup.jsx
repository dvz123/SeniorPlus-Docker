import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Siren } from 'lucide-react'
import { FaBolt, FaPhoneAlt, FaTrashAlt, FaWhatsapp } from 'react-icons/fa'
import { api } from '../../../tela-auth/src/services/api'
import { useAuth } from '../../../tela-auth/src/contexts/AuthContext'
import { useToast } from '../../../contexts/ToastContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { formatPhoneForWhatsApp, buildEmergencyContacts, buildEmergencyWhatsAppMessage } from '../../../utils/emergency'
import '../styles/EmergencyPopup.css'

export default function EmergencyPopup({ isOpen, onClose }) {
  const { currentUser } = useAuth()
  const { showSuccess, showError, showInfo } = useToast()
  const { notifyEmergencyAction } = useNotification()
  const [calling, setCalling] = useState(false)
  const [sending, setSending] = useState(false)
  const [customNumbers, setCustomNumbers] = useState(() => {
    try {
      const raw = localStorage.getItem('idosoEmergencyNumbers')
      return raw ? JSON.parse(raw) : []
    } catch (error) {
      return []
    }
  })

  const panelRef = useRef(null)
  const contactSectionRef = useRef(null)
  const [highlightContacts, setHighlightContacts] = useState(false)

  const mergedContacts = useMemo(
    () =>
      buildEmergencyContacts({
        primaryContact: currentUser?.emergencyContact,
        primaryName: currentUser?.emergencyContactName,
        customContacts: customNumbers,
      }),
    [customNumbers, currentUser?.emergencyContact, currentUser?.emergencyContactName],
  )

  useEffect(() => {
    try {
      localStorage.setItem('idosoEmergencyNumbers', JSON.stringify(customNumbers))
    } catch (error) {
      // ignore persistence errors
    }
  }, [customNumbers])

  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose?.()
      }
    }

    const handlePointerDown = (event) => {
      if (!panelRef.current) return
      if (panelRef.current.contains(event.target)) return
      onClose?.()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [isOpen, onClose])

  const handleCall = (contact) => {
    const tel = `tel:${(contact.phone || '').replace(/\D/g, '')}`
    const isMobile = /Mobi|Android/i.test(navigator.userAgent)

    if (isMobile) {
      window.location.href = tel
      notifyEmergencyAction({ action: 'ligacao', contact })
      return
    }

    setCalling(true)
    setTimeout(() => {
      setCalling(false)
      if (showSuccess) showSuccess(`Chamada simulada para ${contact.name}`)
      else alert(`Chamada simulada para ${contact.name} (${contact.phone})`)
      notifyEmergencyAction({ action: 'ligacao', contact })
    }, 1200)
  }

  const handleWhatsApp = async (contact) => {
    setSending(true)
    try {
      const phone = formatPhoneForWhatsApp(contact.phone || '')
      if (!phone) {
        alert('Telefone inválido')
        return
      }

      const message = buildEmergencyWhatsAppMessage({
        contactName: contact.name,
        requesterName: currentUser?.name,
        assistedName: currentUser?.name,
      })

      try {
        await api.post('/api/whatsapp/send', { phone, message })
        if (showSuccess) showSuccess('Mensagem enviada via servidor')
        else alert('Mensagem enviada via servidor')
        notifyEmergencyAction({ action: 'whatsapp', contact })
        return
      } catch (error) {
        const text = encodeURIComponent(message)
        const url = `https://wa.me/${phone}?text=${text}`
        window.open(url, '_blank')
        if (showInfo) showInfo('Abrindo WhatsApp no navegador')
        notifyEmergencyAction({ action: 'whatsapp', contact })
      }
    } catch (error) {
      console.error(error)
      if (showError) showError('Falha ao enviar WhatsApp')
      else alert('Falha ao enviar WhatsApp')
      notifyEmergencyAction({ action: 'whatsapp', contact, status: 'error' })
    } finally {
      setSending(false)
    }
  }

  const handleAddCustom = () => {
    const name = prompt('Nome do contato:')
    if (!name) return
    const phone = prompt('Telefone (ex: (11) 99999-9999):')
    if (!phone) return
    const id = `custom_${Date.now()}`
    const newContact = { id, name, phone, relation: 'Personalizado' }
    setCustomNumbers((prev) => [...prev, newContact])
    if (showSuccess) showSuccess('Número adicionado')
    notifyEmergencyAction({ action: 'contato-adicionado', contact: newContact, status: 'success' })
  }

  const handleRemoveCustom = (id) => {
    const removed = customNumbers.find((contact) => contact.id === id)
    setCustomNumbers((prev) => prev.filter((contact) => contact.id !== id))
    if (removed) notifyEmergencyAction({ action: 'contato-removido', contact: removed })
  }

  const handleAmbulanceCall = () => {
    const number = '192'
    const tel = `tel:${number}`
    try {
      window.location.href = tel
      notifyEmergencyAction({ action: 'ligacao-ambulancia', contact: { phone: number } })
    } catch (error) {
      console.warn('Não foi possível abrir o discador automaticamente', error)
      if (showInfo) showInfo('Disque 192 em seu telefone para atendimento do SAMU.')
    }
  }

  const handleShowContacts = () => {
    if (!contactSectionRef.current) return
    contactSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setHighlightContacts(true)
    setTimeout(() => setHighlightContacts(false), 1800)
  }

  if (!isOpen) return null

  return (
    <div className="idoso-emergency-overlay" role="presentation">
      <div
        ref={panelRef}
        className="idoso-emergency-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Painel de emergência"
      >
        <button type="button" className="emergency-close" onClick={onClose} aria-label="Fechar painel de emergência">
          ×
        </button>

        <div className="emergency-hero">
          <div className="emergency-hero__icon" aria-hidden="true">
            <Siren size={36} strokeWidth={1.8} />
          </div>
          <div className="emergency-hero__text">
            <h2>Precisa de ajuda imediata?</h2>
            <p>Use os atalhos abaixo ou escolha um contato da sua lista de confiança.</p>
            <div className="emergency-primary-actions" role="group" aria-label="Ações rápidas de emergência">
              <button type="button" className="primary-action call" onClick={handleAmbulanceCall}>
                <FaPhoneAlt aria-hidden="true" />
                <span>Ligar 192 (Ambulância)</span>
              </button>
              <button type="button" className="primary-action quick" onClick={handleShowContacts}>
                <FaBolt aria-hidden="true" />
                <span>Ver contatos rápidos</span>
              </button>
            </div>
          </div>
        </div>

        <section
          ref={contactSectionRef}
          className="emergency-contacts"
          id="emergency-contacts"
          aria-label="Contatos de emergência"
        >
          <header className="emergency-contacts__header">
            <h3>Contatos salvos</h3>
            <button type="button" className="emergency-add" onClick={handleAddCustom}>
              Adicionar contato
            </button>
          </header>

          <div className={`emergency-contact-list${highlightContacts ? ' highlight' : ''}`}>
            {mergedContacts.length === 0 ? (
              <p className="emergency-empty">Nenhum contato cadastrado ainda.</p>
            ) : (
              mergedContacts.map((contact) => (
                <article className="emergency-contact-card" key={contact.id || contact.phone}>
                  <div className="contact-main">
                    <strong>{contact.name}</strong>
                    <span>{contact.phone}</span>
                  </div>
                  <div className="contact-actions" role="group" aria-label={`Ações para ${contact.name}`}>
                    <button
                      type="button"
                      className="contact-btn call"
                      onClick={() => handleCall(contact)}
                      disabled={calling}
                      aria-label={`Ligar para ${contact.name}`}
                    >
                      <FaPhoneAlt aria-hidden="true" />
                      <span>Ligar</span>
                    </button>
                    <button
                      type="button"
                      className="contact-btn whatsapp"
                      onClick={() => handleWhatsApp(contact)}
                      disabled={sending}
                      aria-label={`Enviar WhatsApp para ${contact.name}`}
                    >
                      <FaWhatsapp aria-hidden="true" />
                      <span>WhatsApp</span>
                    </button>
                    {contact.id && String(contact.id).startsWith('custom_') && (
                      <button
                        type="button"
                        className="contact-btn remove"
                        onClick={() => handleRemoveCustom(contact.id)}
                        aria-label={`Remover contato ${contact.name}`}
                      >
                        <FaTrashAlt aria-hidden="true" />
                        <span>Remover</span>
                      </button>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
