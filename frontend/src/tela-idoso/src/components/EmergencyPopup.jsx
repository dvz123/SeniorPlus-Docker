import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Siren, PhoneCall, MessageCircle, Plus, Users, X, Loader2, RefreshCw } from 'lucide-react'
import { FaPhoneAlt, FaTrashAlt, FaWhatsapp } from 'react-icons/fa'
import { api } from '../../../tela-auth/src/services/api'
import { useAuth } from '../../../tela-auth/src/contexts/AuthContext'
import { useToast } from '../../../contexts/ToastContext'
import { useNotification } from '../../../contexts/NotificationContext'
import useResidentIdentity from '../hooks/useResidentIdentity'
import {
  formatPhoneForWhatsApp,
  buildEmergencyContacts,
  buildEmergencyWhatsAppMessage,
  mergeEmergencyCustomContacts,
  emergencyContactsAreEqual,
  normalizeEmergencyContact,
  mapBackendEmergencyContact,
  mapEmergencyContactToPayload,
  normalizeCpf,
} from '../../../utils/emergency'
import '../styles/EmergencyPopup.css'

export default function EmergencyPopup({ isOpen, onClose }) {
  const { currentUser } = useAuth()
  const { showSuccess, showError, showInfo } = useToast()
  const { notifyEmergencyAction } = useNotification()
  const [calling, setCalling] = useState(false)
  const [sending, setSending] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [submittingContact, setSubmittingContact] = useState(false)
  const [removingContactId, setRemovingContactId] = useState(null)
  const storageKeys = useMemo(() => ['idosoEmergencyNumbers', 'emergencyCustomNumbers'], [])

  const residentIdentity = useResidentIdentity({ currentUser })
  const elderlyCpf = useMemo(
    () => normalizeCpf(residentIdentity?.cpf || currentUser?.cpf || currentUser?.assistedPerson?.cpf),
    [residentIdentity?.cpf, currentUser?.cpf, currentUser?.assistedPerson?.cpf],
  )

  const loadStoredCustomNumbers = useCallback(() => {
    if (typeof window === 'undefined') return []
    let collected = []

    storageKeys.forEach((key) => {
      try {
        const raw = window.localStorage?.getItem?.(key)
        if (!raw) return
        const parsed = JSON.parse(raw)
        collected = mergeEmergencyCustomContacts(collected, parsed)
      } catch (error) {
        // ignore malformed entries
      }
    })

    return collected
  }, [storageKeys])

  const [localContacts, setLocalContacts] = useState(() => loadStoredCustomNumbers())
  const [remoteContacts, setRemoteContacts] = useState([])
  const [draftContact, setDraftContact] = useState({ name: '', phone: '' })

  const panelRef = useRef(null)
  const contactSectionRef = useRef(null)
  const [highlightContacts, setHighlightContacts] = useState(false)
  const emitContactsUpdated = useCallback(() => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new Event('emergencyContactsUpdated'))
  }, [])

  const profileCustomContacts = useMemo(
    () =>
      mergeEmergencyCustomContacts(
        currentUser?.customEmergencyContacts,
        currentUser?.assistedPerson?.customEmergencyContacts,
        currentUser?.elderlyProfile?.customEmergencyContacts,
        currentUser?.profile?.customEmergencyContacts,
      ),
    [currentUser],
  )

  useEffect(() => {
    setLocalContacts((previous) => {
      const merged = mergeEmergencyCustomContacts(previous, profileCustomContacts)
      return emergencyContactsAreEqual(previous, merged) ? previous : merged
    })
  }, [profileCustomContacts])

  const mergedContacts = useMemo(
    () =>
      buildEmergencyContacts({
        primaryContact: currentUser?.emergencyContact,
        primaryName: currentUser?.emergencyContactName,
        customContacts: mergeEmergencyCustomContacts(remoteContacts, localContacts),
      }),
    [remoteContacts, localContacts, currentUser?.emergencyContact, currentUser?.emergencyContactName],
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const serialized = JSON.stringify(localContacts)
      storageKeys.forEach((key) => window.localStorage?.setItem?.(key, serialized))
    } catch (error) {
      // ignore persistence errors
    }
  }, [localContacts, storageKeys])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const syncFromStorage = () => {
      const stored = loadStoredCustomNumbers()
      setLocalContacts((previous) =>
        emergencyContactsAreEqual(previous, stored) ? previous : stored,
      )
    }

    window.addEventListener('storage', syncFromStorage)
    window.addEventListener('emergencyContactsUpdated', syncFromStorage)
    return () => {
      window.removeEventListener('storage', syncFromStorage)
      window.removeEventListener('emergencyContactsUpdated', syncFromStorage)
    }
  }, [loadStoredCustomNumbers])

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

  const fetchRemoteContacts = useCallback(async () => {
    if (!elderlyCpf) {
      setRemoteContacts([])
      return
    }
    setLoadingContacts(true)
    try {
      const response = await api.listEmergencyContacts(elderlyCpf)
      const normalized = Array.isArray(response)
        ? mergeEmergencyCustomContacts(response.map((item) => mapBackendEmergencyContact(item)))
        : []
      setRemoteContacts(normalized)
    } catch (error) {
      console.error('Falha ao carregar contatos remotos', error)
      if (showError) {
        showError(error?.message || 'Não foi possível carregar os contatos salvos pelo cuidador.')
      }
    } finally {
      setLoadingContacts(false)
    }
  }, [elderlyCpf, showError])

  useEffect(() => {
    if (!isOpen) return
    fetchRemoteContacts()
  }, [isOpen, fetchRemoteContacts])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const handleExternalUpdate = () => {
      fetchRemoteContacts()
    }
    window.addEventListener('emergencyContactsUpdated', handleExternalUpdate)
    return () => window.removeEventListener('emergencyContactsUpdated', handleExternalUpdate)
  }, [fetchRemoteContacts])

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

  const handleDraftChange = (field) => (event) => {
    const value = event.target.value
    setDraftContact((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmitCustom = async (event) => {
    event.preventDefault()
    const name = draftContact.name?.trim()
    const phone = draftContact.phone?.trim()

    if (!name || !phone) {
      if (showError) showError('Informe nome e telefone para adicionar o contato.')
      return
    }

    const normalizedDraft = normalizeEmergencyContact({
      id: `custom_${Date.now()}`,
      name,
      phone,
      relation: 'Personalizado',
    })

    if (!elderlyCpf) {
      setLocalContacts((prev) => mergeEmergencyCustomContacts(prev, normalizedDraft))
      setDraftContact({ name: '', phone: '' })
      if (showSuccess) showSuccess('Contato adicionado à lista de emergência.')
      notifyEmergencyAction({ action: 'contato-adicionado', contact: normalizedDraft, status: 'success' })
      setHighlightContacts(true)
      setTimeout(() => setHighlightContacts(false), 1500)
      emitContactsUpdated()
      return
    }

    setSubmittingContact(true)
    try {
      const payload = mapEmergencyContactToPayload({
        name,
        phone,
        relation: 'Personalizado',
      })
      const created = await api.createEmergencyContact(elderlyCpf, payload)
      const normalized = mapBackendEmergencyContact(created)
      setRemoteContacts((prev) => mergeEmergencyCustomContacts(prev, normalized))
      setDraftContact({ name: '', phone: '' })
      if (showSuccess) showSuccess('Contato de emergência salvo.')
      notifyEmergencyAction({ action: 'contato-adicionado', contact: normalized, status: 'success' })
      setHighlightContacts(true)
      setTimeout(() => setHighlightContacts(false), 1500)
      emitContactsUpdated()
    } catch (error) {
      console.error('Falha ao salvar contato remoto', error)
      if (showError) {
        showError(error?.message || 'Não foi possível salvar o contato agora.')
      }
    } finally {
      setSubmittingContact(false)
    }
  }

  const handleRemoveContact = async (contact) => {
    if (!contact) return

    if (contact.backendId && elderlyCpf) {
      setRemovingContactId(contact.id)
      try {
        await api.deleteEmergencyContact(elderlyCpf, contact.backendId)
        setRemoteContacts((prev) => prev.filter((item) => item.backendId !== contact.backendId))
        if (showSuccess) showSuccess('Contato removido com sucesso.')
        notifyEmergencyAction({ action: 'contato-removido', contact })
        emitContactsUpdated()
      } catch (error) {
        console.error('Falha ao remover contato remoto', error)
        if (showError) showError(error?.message || 'Não foi possível remover o contato agora.')
      } finally {
        setRemovingContactId(null)
      }
      return
    }

    setLocalContacts((prev) => {
      let removed = null
      const next = prev.filter((item) => {
        if (String(item.id) !== String(contact.id)) return true
        removed = item
        return false
      })
      if (removed) {
        notifyEmergencyAction({ action: 'contato-removido', contact: removed })
        emitContactsUpdated()
      }
      return next
    })
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
          <X aria-hidden="true" />
        </button>

        <header className="emergency-header">
          <div className="emergency-header__icon" aria-hidden="true">
            <Siren size={48} strokeWidth={1.5} />
          </div>
          <div className="emergency-header__content">
            <span className="emergency-header__eyebrow">Central de emergência</span>
            <h2>Como podemos te ajudar?</h2>
            <p>Alcance rapidamente o SAMU ou alguém de confiança. Você pode gerenciar contatos e enviar mensagens em segundos.</p>
            <div className="emergency-header__cta">
              <button type="button" className="cta-button cta-button--primary" onClick={handleAmbulanceCall}>
                <PhoneCall size={18} aria-hidden="true" />
                <span>Ligar 192</span>
              </button>
              <button type="button" className="cta-button" onClick={handleShowContacts}>
                <Users size={18} aria-hidden="true" />
                <span>Ver contatos</span>
              </button>
            </div>
          </div>
        </header>

        <div className="emergency-body">
          <section
            ref={contactSectionRef}
            className={`emergency-column emergency-column--contacts${highlightContacts ? ' is-highlighted' : ''}`}
            id="emergency-contacts"
            aria-label="Contatos de emergência"
          >
            <header className="column-header contacts-header">
              <div>
                <h3>Contatos de confiança</h3>
                <p>
                  {mergedContacts.length > 0
                    ? `${mergedContacts.length} contato${mergedContacts.length === 1 ? '' : 's'} disponível${mergedContacts.length === 1 ? '' : 's'}`
                    : 'Adicione contatos para facilitar o socorro.'}
                </p>
              </div>
              <button
                type="button"
                className="refresh-button"
                onClick={fetchRemoteContacts}
                disabled={loadingContacts}
              >
                {loadingContacts ? <Loader2 size={16} className="spinner" aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
                <span>{loadingContacts ? 'Atualizando' : 'Atualizar'}</span>
              </button>
            </header>

            <div className="contact-list">
              {loadingContacts ? (
                <p className="contact-empty" aria-live="polite">Carregando contatos salvos...</p>
              ) : mergedContacts.length === 0 ? (
                <p className="contact-empty">Nenhum contato cadastrado ainda.</p>
              ) : (
                mergedContacts.map((contact) => {
                  const allowRemoval = contact.source === 'custom' || contact.source === 'caregiver'
                  const isRemoving = removingContactId === contact.id
                  return (
                    <article className="contact-card" key={contact.id || contact.phone}>
                      <div className="contact-card__main">
                        <strong>{contact.name}</strong>
                        <span className="contact-card__phone">{contact.phone}</span>
                        {contact.relation ? <small className="contact-card__relation">{contact.relation}</small> : null}
                        {contact.description ? (
                          <small className="contact-card__description">{contact.description}</small>
                        ) : null}
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
                        {allowRemoval && (
                          <button
                            type="button"
                            className="contact-button contact-button--remove"
                            onClick={() => handleRemoveContact(contact)}
                            disabled={isRemoving}
                            aria-label={`Remover contato ${contact.name}`}
                          >
                            {isRemoving ? <Loader2 size={16} className="spinner" aria-hidden="true" /> : <FaTrashAlt aria-hidden="true" />}
                            <span>{isRemoving ? 'Removendo...' : 'Remover'}</span>
                          </button>
                        )}
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </section>

          <section className="emergency-column emergency-column--form" aria-label="Adicionar novo contato">
            <header className="column-header">
              <h3>Novo contato de confiança</h3>
              <p>Mantenha a lista atualizada para que o cuidador tenha sempre os números corretos.</p>
            </header>

            <form className="contact-form" onSubmit={handleSubmitCustom}>
              <div className="contact-form__header">
                <h4>Adicionar manualmente</h4>
                {submittingContact && (
                  <span className="contact-form__loading">
                    <Loader2 size={16} className="spinner" aria-hidden="true" /> Salvando...
                  </span>
                )}
              </div>
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
              <button type="submit" className="contact-form__submit" disabled={submittingContact}>
                {submittingContact ? (
                  <Loader2 size={18} className="spinner" aria-hidden="true" />
                ) : (
                  <Plus size={18} aria-hidden="true" />
                )}
                <span>Adicionar contato</span>
              </button>
            </form>

            {!elderlyCpf && (
              <small className="contact-form__hint">Cadastre-se para sincronizar automaticamente com seu cuidador.</small>
            )}

            <div className="contact-form__support">
              <p>Os contatos cadastrados aparecem automaticamente ao lado e ficam disponíveis para toda a equipe.</p>
              <button type="button" className="cta-button" onClick={handleShowContacts}>
                <Users size={16} aria-hidden="true" />
                <span>Ver lista completa</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
