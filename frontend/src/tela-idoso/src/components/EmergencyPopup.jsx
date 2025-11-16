import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Siren, PhoneCall, MessageCircle, Plus, Users, ArrowUpRight } from 'lucide-react'
import { FaPhoneAlt, FaTrashAlt, FaWhatsapp } from 'react-icons/fa'
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
  const [draftContact, setDraftContact] = useState({ name: '', phone: '' })

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

  const primaryContact = useMemo(
    () => mergedContacts.find((contact) => contact.id === 'primary_contact') || null,
    [mergedContacts],
  )

  const secondaryContact = useMemo(() => {
    if (!mergedContacts.length) return null
    if (primaryContact) {
      return mergedContacts.find((contact) => contact.id !== 'primary_contact') || null
    }
    return mergedContacts[0]
  }, [mergedContacts, primaryContact])

  const whatsappTarget = primaryContact || secondaryContact

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

  const handlePrimaryCall = () => {
    const target = primaryContact || secondaryContact
    if (!target) {
      setHighlightContacts(true)
      if (showError) showError('Cadastre ao menos um contato de emergência.')
      return
    }
    handleCall(target)
  }

  const handlePrimaryWhatsApp = () => {
    const target = whatsappTarget
    if (!target) {
      setHighlightContacts(true)
      if (showError) showError('Cadastre ao menos um contato para enviar WhatsApp.')
      return
    }
    handleWhatsApp(target)
  }

  const handleDraftChange = (field) => (event) => {
    const value = event.target.value
    setDraftContact((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmitCustom = (event) => {
    event.preventDefault()
    const name = draftContact.name?.trim()
    const phone = draftContact.phone?.trim()

    if (!name || !phone) {
      if (showError) showError('Informe nome e telefone para adicionar o contato.')
      return
    }

    const id = `custom_${Date.now()}`
    const newContact = { id, name, phone, relation: 'Personalizado' }
    setCustomNumbers((prev) => [...prev, newContact])
    setDraftContact({ name: '', phone: '' })
    if (showSuccess) showSuccess('Contato adicionado à lista de emergência.')
    notifyEmergencyAction({ action: 'contato-adicionado', contact: newContact, status: 'success' })
    setHighlightContacts(true)
    setTimeout(() => setHighlightContacts(false), 1500)
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
        aria-label="Central de emergência"
      >
        <button type="button" className="emergency-close" onClick={onClose} aria-label="Fechar painel de emergência">
          <ArrowUpRight aria-hidden="true" />
        </button>

        <section className="emergency-hero">
          <div className="emergency-hero__icon" aria-hidden="true">
            <Siren size={48} strokeWidth={1.5} />
          </div>
          <div className="emergency-hero__content">
            <span className="emergency-hero__eyebrow">Central de emergência</span>
            <h2>Está tudo bem por aí?</h2>
            <p>Acione o SAMU, avise alguém de confiança ou cadastre novos contatos em poucos toques.</p>
            <div className="emergency-hero__cta">
              <button type="button" className="hero-button hero-button--primary" onClick={handleAmbulanceCall}>
                <PhoneCall size={18} aria-hidden="true" />
                <span>Ligar 192</span>
              </button>
              <button type="button" className="hero-button" onClick={handleShowContacts}>
                <Users size={18} aria-hidden="true" />
                <span>Ver contatos</span>
              </button>
            </div>
          </div>
        </section>

        <div className="emergency-layout">
          <section className="emergency-column emergency-column--actions" aria-label="Ações rápidas">
            <header className="column-header">
              <h3>Ações rápidas</h3>
              <p>Escolha a melhor forma de pedir ajuda agora.</p>
            </header>
            <div className="action-stack">
              <button
                type="button"
                className="action-card action-card--call"
                onClick={handlePrimaryCall}
                disabled={!primaryContact && !secondaryContact}
              >
                <span className="action-card__icon" aria-hidden="true">
                  <Users size={22} />
                </span>
                <span className="action-card__content">
                  <strong>Ligar para contato</strong>
                  <small>{primaryContact?.name || secondaryContact?.name || 'Cadastre um contato'}</small>
                </span>
              </button>
              <button
                type="button"
                className="action-card action-card--whatsapp"
                onClick={handlePrimaryWhatsApp}
                disabled={!whatsappTarget}
              >
                <span className="action-card__icon" aria-hidden="true">
                  <MessageCircle size={22} />
                </span>
                <span className="action-card__content">
                  <strong>Enviar WhatsApp</strong>
                  <small>
                    {whatsappTarget ? `Mensagem para ${whatsappTarget.name}` : 'Cadastre um contato'}
                  </small>
                </span>
              </button>
              <button type="button" className="action-card action-card--manage" onClick={handleShowContacts}>
                <span className="action-card__icon" aria-hidden="true">
                  <Plus size={22} />
                </span>
                <span className="action-card__content">
                  <strong>Gerenciar contatos</strong>
                  <small>Adicionar ou remover números confiáveis</small>
                </span>
              </button>
            </div>

            <div className="action-support">
              <h4>Sem contatos cadastrados?</h4>
              <p>Você pode incluir familiares, vizinhos ou profissionais de confiança na lista ao lado.</p>
              <button type="button" onClick={handleShowContacts}>
                Adicionar novo contato
                <ArrowUpRight size={16} aria-hidden="true" />
              </button>
            </div>
          </section>

          <section
            ref={contactSectionRef}
            className={`emergency-column emergency-column--contacts${highlightContacts ? ' is-highlighted' : ''}`}
            id="emergency-contacts"
            aria-label="Contatos de emergência"
          >
            <header className="column-header">
              <h3>Contatos de confiança</h3>
              <p>Toque em um contato para ligar ou enviar uma mensagem.</p>
            </header>

            <div className="contact-list">
              {mergedContacts.length === 0 ? (
                <p className="contact-empty">Nenhum contato cadastrado ainda.</p>
              ) : (
                mergedContacts.map((contact) => (
                  <article className="contact-card" key={contact.id || contact.phone}>
                    <div className="contact-card__main">
                      <strong>{contact.name}</strong>
                      <span>{contact.phone}</span>
                      {contact.relation ? <small>{contact.relation}</small> : null}
                    </div>
                    <div className="contact-card__actions" role="group" aria-label={`Ações para ${contact.name}`}>
                      <button
                        type="button"
                        className="contact-button contact-button--call"
                        onClick={() => handleCall(contact)}
                        disabled={calling}
                        aria-label={`Ligar para ${contact.name}`}
                      >
                        <FaPhoneAlt aria-hidden="true" />
                        <span>Ligar</span>
                      </button>
                      <button
                        type="button"
                        className="contact-button contact-button--whatsapp"
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
                          className="contact-button contact-button--remove"
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

            <form className="contact-form" onSubmit={handleSubmitCustom}>
              <h4>Adicionar novo contato</h4>
              <div className="contact-form__grid">
                <label className="contact-form__field">
                  <span>Nome</span>
                  <input
                    type="text"
                    name="name"
                    value={draftContact.name}
                    onChange={handleDraftChange('name')}
                    placeholder="Ex: Maria Silva"
                    autoComplete="name"
                  />
                </label>
                <label className="contact-form__field">
                  <span>Telefone</span>
                  <input
                    type="tel"
                    name="phone"
                    value={draftContact.phone}
                    onChange={handleDraftChange('phone')}
                    placeholder="(11) 99999-9999"
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </label>
              </div>
              <button type="submit" className="contact-form__submit">
                <Plus size={18} aria-hidden="true" /> Adicionar contato
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
