import { useState, useEffect, useMemo, useCallback } from "react"
import { useUser } from "../contexts/UserContext"
import { useToast } from "../../../contexts/ToastContext"
import { useNotification } from "../../../contexts/NotificationContext"
import { useAuth } from "../../../tela-auth/src/contexts/AuthContext"
import { api } from '../../../tela-auth/src/services/api'
import {
  formatPhoneForWhatsApp,
  buildEmergencyContacts,
  buildEmergencyWhatsAppMessage,
  mergeEmergencyCustomContacts,
  mapBackendEmergencyContact,
  mapEmergencyContactToPayload,
  normalizeCpf,
  normalizeEmergencyContact,
} from '../../../utils/emergency'
import "../styles/Emergencia.css"
import BackButton from "../../../components/BackButton"
import { FaWhatsapp } from "react-icons/fa"
import { Loader2 } from 'lucide-react'

const EMERGENCY_ACTIONS = new Set([
  'ligacao',
  'whatsapp',
  'sms',
  'localizacao',
  'contato-adicionado',
  'contato-removido',
])

function Emergencia() {
  const { elderlyData } = useUser()
  const { showSuccess, showInfo, showError } = useToast()
  const { notifications, notifyEmergencyAction, markAsRead } = useNotification()
  const { currentUser } = useAuth()
  const [calling, setCalling] = useState(false)
  const [sendingSMS, setSendingSMS] = useState(false)
  const [showEmergencyInfo, setShowEmergencyInfo] = useState(false)
  const [showAddNumberForm, setShowAddNumberForm] = useState(false)
  const [customNumbers, setCustomNumbers] = useState(() => {
    const savedNumbers = localStorage.getItem("emergencyCustomNumbers")
    return savedNumbers ? JSON.parse(savedNumbers) : []
  })
  const [remoteContacts, setRemoteContacts] = useState([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [savingContact, setSavingContact] = useState(false)
  const [removingContactId, setRemovingContactId] = useState(null)
  const [newNumber, setNewNumber] = useState({
    name: "",
    phone: "",
    description: "",
  })

  const elderlyCpf = useMemo(
    () =>
      normalizeCpf(
        elderlyData?.cpf ||
          elderlyData?.documento ||
          elderlyData?.cpfIdoso ||
          elderlyData?.cpfPaciente ||
          currentUser?.assistedPerson?.cpf ||
          currentUser?.elderlyProfile?.cpf ||
          currentUser?.cpfSelecionado,
      ),
    [elderlyData, currentUser],
  )

  const emitContactsUpdated = useCallback(() => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new Event('emergencyContactsUpdated'))
  }, [])

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
      console.error('Falha ao carregar contatos de emergência', error)
      if (showError) {
        showError(error?.message || 'Não foi possível carregar os contatos cadastrados.')
      }
    } finally {
      setLoadingContacts(false)
    }
  }, [elderlyCpf, showError])

  useEffect(() => {
    fetchRemoteContacts()
  }, [fetchRemoteContacts])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const handleExternalUpdate = () => {
      fetchRemoteContacts()
    }
    window.addEventListener('emergencyContactsUpdated', handleExternalUpdate)
    return () => window.removeEventListener('emergencyContactsUpdated', handleExternalUpdate)
  }, [fetchRemoteContacts])

  const emergencyContacts = useMemo(
    () =>
      buildEmergencyContacts({
        primaryContact: elderlyData?.emergencyContact,
        primaryName: elderlyData?.emergencyContactName || elderlyData?.nomeContatoEmergencia,
        customContacts: mergeEmergencyCustomContacts(remoteContacts, customNumbers),
      }),
    [elderlyData, remoteContacts, customNumbers],
  )

  const managedContacts = elderlyCpf ? remoteContacts : customNumbers

  const emergencyNotifications = notifications.filter((notification) =>
    EMERGENCY_ACTIONS.has(notification?.data?.action),
  )

  const formatNotificationTime = (dateString) => {
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(dateString))
    } catch (error) {
      return dateString
    }
  }

  if (!elderlyData?.emergencyContact) {
    emergencyContacts.unshift({
      id: 'placeholder_contact',
      name: elderlyData?.emergencyContactName || 'Contato de Emergência',
      phone: '119XXXXXXXX',
      relation: 'Familiar',
    })
  }

  useEffect(() => {
    localStorage.setItem("emergencyCustomNumbers", JSON.stringify(customNumbers))
  }, [customNumbers])

  const handleEmergencyCall = (contact) => {
    setCalling(true)

    // Simulação de chamada
    setTimeout(() => {
      setCalling(false)
      showSuccess(`Chamada para ${contact.name} realizada com sucesso!`)
      notifyEmergencyAction({ action: 'ligacao', contact })
    }, 2000)
  }

  const handleSendSMS = (contact) => {
    setSendingSMS(true)

    // Simulação de envio de SMS
    setTimeout(() => {
      setSendingSMS(false)
      showSuccess(`SMS enviado para ${contact.name} com sucesso!`)
      notifyEmergencyAction({ action: 'sms', contact })
    }, 2000)
  }

  const handleShowEmergencyInfo = () => {
    setShowEmergencyInfo(!showEmergencyInfo)
  }

  const handleShareLocation = () => {
    showInfo("Compartilhando localização atual...")

    // Simulação de compartilhamento de localização
    setTimeout(() => {
      showSuccess("Localização compartilhada com sucesso!")
      const locationContact = {
        id: elderlyData?.emergencyContact ? 'primary_contact' : 'location_share',
        name: elderlyData?.emergencyContactName || 'Contato de Emergência',
        phone: elderlyData?.emergencyContact || '',
      }
      notifyEmergencyAction({ action: 'localizacao', contact: locationContact })
    }, 2000)
  }

  const handleSendWhatsApp = (contact) => {
    (async () => {
      try {
        const phone = formatPhoneForWhatsApp(contact.phone || "")
        if (!phone) {
          showError('Telefone inválido para envio via WhatsApp')
          return
        }

        const message = buildEmergencyWhatsAppMessage({
          contactName: contact.name,
          requesterName: currentUser?.name,
          assistedName: elderlyData?.name,
        })

        // Tentar enviar via backend seguro primeiro
        try {
          await api.post('/api/whatsapp/send', { phone, message })
          showSuccess(`Mensagem enviada via servidor para ${contact.name}`)
          notifyEmergencyAction({ action: 'whatsapp', contact })
          return
        } catch (err) {
          console.warn('Envio via backend falhou, abrindo wa.me como fallback', err)
        }

        // Fallback: abrir wa.me
        const text = encodeURIComponent(message)
        const url = `https://wa.me/${phone}?text=${text}`
        window.open(url, '_blank')
        showSuccess(`Abrindo WhatsApp para ${contact.name}`)
        notifyEmergencyAction({ action: 'whatsapp', contact })
      } catch (e) {
        console.error(e)
        showError('Falha ao tentar enviar mensagem via WhatsApp')
        notifyEmergencyAction({ action: 'whatsapp', contact, status: 'error' })
      }
    })()
  }

  const handleAddNumber = () => {
    setShowAddNumberForm(!showAddNumberForm)
    if (!showAddNumberForm) {
      setNewNumber({
        name: "",
        phone: "",
        description: "",
      })
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewNumber((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSaveNumber = async () => {
    if (!newNumber.name || !newNumber.phone) {
      showError("Nome e telefone são obrigatórios!")
      return
    }

    if (!elderlyCpf) {
      const localContact = normalizeEmergencyContact({
        id: `custom_${Date.now()}`,
        name: newNumber.name,
        phone: newNumber.phone,
        relation: 'Personalizado',
        description: newNumber.description,
      })
      setCustomNumbers((prev) => mergeEmergencyCustomContacts(prev, localContact))
      setShowAddNumberForm(false)
      setNewNumber({ name: "", phone: "", description: "" })
      showSuccess("Número salvo localmente!")
      notifyEmergencyAction({ action: 'contato-adicionado', contact: localContact, status: 'success' })
      emitContactsUpdated()
      return
    }

    setSavingContact(true)
    try {
      const payload = mapEmergencyContactToPayload({
        name: newNumber.name,
        phone: newNumber.phone,
        relation: 'Personalizado',
        description: newNumber.description,
      })
      const created = await api.createEmergencyContact(elderlyCpf, payload)
      const normalized = mapBackendEmergencyContact(created)
      setRemoteContacts((prev) => mergeEmergencyCustomContacts(prev, normalized))
      showSuccess("Contato sincronizado com sucesso!")
      notifyEmergencyAction({ action: 'contato-adicionado', contact: normalized, status: 'success' })
      setShowAddNumberForm(false)
      setNewNumber({ name: "", phone: "", description: "" })
      emitContactsUpdated()
    } catch (error) {
      console.error('Falha ao salvar contato remoto', error)
      showError(error?.message || "Não foi possível salvar o contato agora.")
    } finally {
      setSavingContact(false)
    }
  }

  const handleDeleteNumber = async (contact) => {
    if (!contact) return

    if (contact.backendId && elderlyCpf) {
      setRemovingContactId(contact.id)
      try {
        await api.deleteEmergencyContact(elderlyCpf, contact.backendId)
        setRemoteContacts((prev) => prev.filter((item) => item.backendId !== contact.backendId))
        showSuccess("Contato removido com sucesso!")
        notifyEmergencyAction({ action: 'contato-removido', contact })
        emitContactsUpdated()
      } catch (error) {
        console.error('Falha ao remover contato remoto', error)
        showError(error?.message || "Não foi possível remover o contato agora.")
      } finally {
        setRemovingContactId(null)
      }
      return
    }

    setCustomNumbers((prev) => prev.filter((number) => String(number.id) !== String(contact.id)))
    showSuccess("Número removido com sucesso!")
    notifyEmergencyAction({ action: 'contato-removido', contact })
    emitContactsUpdated()
  }

  return (
    <div className="container">
      <main className="main">
        <BackButton />

        <div className="page-header">
          <h1>Emergência</h1>
          <p>Acesso rápido a contatos e informações de emergência.</p>
        </div>

        <div className="emergency-container">
          <div className="emergency-section">
            <div className="emergency-alert">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="emergency-icon"
              >
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" x2="12" y1="9" y2="13" />
                <line x1="12" x2="12.01" y1="17" y2="17" />
              </svg>
              <div className="emergency-alert-text">
                <h2>Em caso de emergência</h2>
                <p>
                  Utilize os contatos abaixo para solicitar ajuda imediata. Mantenha a calma e forneça informações
                  precisas sobre a situação. Em caso de emergência médica, ligue para o SAMU (192).
                </p>
              </div>
            </div>

            <div className="emergency-actions">
              <button className="emergency-button share-location" onClick={handleShareLocation}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="10" r="3" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                Compartilhar Localização
              </button>
              <button className="emergency-button show-info" onClick={handleShowEmergencyInfo}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="16" y2="12" />
                  <line x1="12" x2="12.01" y1="8" y2="8" />
                </svg>
                {showEmergencyInfo ? "Ocultar Informações" : "Mostrar Informações"}
              </button>
            </div>

            {showEmergencyInfo && (
              <div className="emergency-info">
                <h3>Informações do Paciente</h3>
                <div className="emergency-info-grid">
                  <div className="emergency-info-item">
                    <span className="emergency-info-label">Nome</span>
                    <span className="emergency-info-value">{elderlyData?.name || "Nome do Paciente"}</span>
                  </div>
                  <div className="emergency-info-item">
                    <span className="emergency-info-label">Idade</span>
                    <span className="emergency-info-value">{elderlyData?.age || "Idade"} anos</span>
                  </div>
                  <div className="emergency-info-item">
                    <span className="emergency-info-label">Tipo Sanguíneo</span>
                    <span className="emergency-info-value">{elderlyData?.bloodType || "Tipo Sanguíneo"}</span>
                  </div>
                  <div className="emergency-info-item">
                    <span className="emergency-info-label">Endereço</span>
                    <span className="emergency-info-value">{elderlyData?.address || "Endereço"}</span>
                  </div>
                </div>

                <h3>Condições Médicas</h3>
                <div className="emergency-conditions">
                  {elderlyData?.medicalConditions && elderlyData.medicalConditions.length > 0 ? (
                    elderlyData.medicalConditions.map((condition, index) => (
                      <div key={index} className="emergency-condition-tag">
                        {condition}
                      </div>
                    ))
                  ) : (
                    <p className="emergency-no-data">Nenhuma condição médica registrada.</p>
                  )}
                </div>

                <h3>Alergias</h3>
                <div className="emergency-allergies">
                  {elderlyData?.allergies && elderlyData.allergies.length > 0 ? (
                    elderlyData.allergies.map((allergy, index) => (
                      <div key={index} className="emergency-allergy-tag">
                        {allergy}
                      </div>
                    ))
                  ) : (
                    <p className="emergency-no-data">Nenhuma alergia registrada.</p>
                  )}
                </div>

                <h3>Medicamentos em Uso</h3>
                <div className="emergency-medications">
                  <p className="emergency-no-data">
                    Informações sobre medicamentos disponíveis na seção de Medicamentos.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="emergency-contacts-section">
            <div className="emergency-contacts-header">
              <h2>Contatos de Emergência</h2>
            </div>
            <div className="emergency-contacts">
              {emergencyContacts.map((contact, index) => (
                <div key={index} className="emergency-contact-card">
                  <div className="emergency-contact-info">
                    <h3 className="emergency-contact-name">{contact.name}</h3>
                    <p className="emergency-contact-relation">{contact.relation}</p>
                    <p className="emergency-contact-phone">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      {contact.phone}
                    </p>
                  </div>
                  <div className="emergency-contact-actions">
                    <button
                      className="emergency-contact-call"
                      onClick={() => handleEmergencyCall(contact)}
                      disabled={calling}
                      title="Ligar"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </button>
                    <button
                      className="emergency-contact-sms"
                      onClick={() => handleSendSMS(contact)}
                      disabled={sendingSMS}
                      title="Enviar SMS"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                    <button
                      className="emergency-contact-whatsapp"
                      onClick={() => handleSendWhatsApp(contact)}
                      title="Enviar WhatsApp"
                    >
                      <FaWhatsapp size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="emergency-notifications-section">
            <div className="emergency-notifications-header">
              <h2>Alertas recentes</h2>
              {emergencyNotifications.length > 0 && (
                <span className="emergency-notifications-count">
                  {`${emergencyNotifications.length} ${emergencyNotifications.length === 1 ? 'alerta' : 'alertas'}`}
                </span>
              )}
            </div>
            <div className="emergency-notifications-list">
              {emergencyNotifications.length > 0 ? (
                emergencyNotifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    className={`emergency-notification-card${notification.read ? '' : ' unread'}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <span className="emergency-notification-title">{notification.title}</span>
                    <span className="emergency-notification-message">{notification.message}</span>
                    <span className="emergency-notification-time">{formatNotificationTime(notification.time)}</span>
                  </button>
                ))
              ) : (
                <p className="emergency-notification-empty">Nenhum alerta registrado ainda.</p>
              )}
            </div>
          </div>

          <div className="custom-numbers-section">
            <div className="custom-numbers-header">
              <h2>Meus Números Importantes</h2>
              <div className="custom-numbers-actions">
                {elderlyCpf && (
                  <button
                    type="button"
                    className="add-number-btn"
                    onClick={fetchRemoteContacts}
                    disabled={loadingContacts}
                  >
                    {loadingContacts ? <Loader2 size={16} className="spinner" /> : "Atualizar"}
                  </button>
                )}
                <button type="button" className="add-number-btn" onClick={handleAddNumber}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  {showAddNumberForm ? "Cancelar" : "Adicionar Número"}
                </button>
              </div>
            </div>

            {!elderlyCpf && (
              <p className="custom-number-hint">
                Cadastre o CPF do idoso para sincronizar automaticamente esses contatos com o aplicativo do assistido.
              </p>
            )}

            {showAddNumberForm && (
              <div className="add-number-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Nome</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={newNumber.name}
                      onChange={handleInputChange}
                      placeholder="Ex: Farmácia"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Telefone</label>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      value={newNumber.phone}
                      onChange={handleInputChange}
                      placeholder="Ex: (11) 99999-9999"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="description">Descrição (opcional)</label>
                  <textarea
                    id="description"
                    name="description"
                    value={newNumber.description}
                    onChange={handleInputChange}
                    placeholder="Ex: Farmácia mais próxima que entrega medicamentos"
                  ></textarea>
                </div>
                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={handleAddNumber}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="save-btn"
                    onClick={handleSaveNumber}
                    disabled={savingContact}
                  >
                    {savingContact ? <Loader2 size={16} className="spinner" /> : "Salvar"}
                  </button>
                </div>
              </div>
            )}

            {managedContacts.length > 0 ? (
              <div className="custom-numbers-grid">
                {managedContacts.map((number) => (
                  <div key={number.id || number.phone} className="custom-number-card">
                    <h3 className="custom-number-name">{number.name}</h3>
                    {number.relation && <p className="emergency-contact-relation">{number.relation}</p>}
                    <p className="custom-number-phone">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      {number.phone}
                    </p>
                    {number.description && <p className="custom-number-description">{number.description}</p>}
                    <div className="custom-number-actions">
                      <button className="custom-number-call" onClick={() => handleEmergencyCall(number)}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        Ligar
                      </button>
                      <button
                        className="custom-number-whatsapp"
                        onClick={() => handleSendWhatsApp(number)}
                        title="Enviar WhatsApp"
                      >
                        <FaWhatsapp size={16} />
                      </button>
                      <button
                        className="custom-number-delete"
                        onClick={() => handleDeleteNumber(number)}
                        title="Excluir"
                        disabled={removingContactId === number.id}
                      >
                        {removingContactId === number.id ? (
                          <Loader2 size={16} className="spinner" />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-custom-numbers">
                <p>
                  {elderlyCpf
                    ? "Nenhum contato adicional cadastrado ainda."
                    : "Você ainda não adicionou números personalizados."}
                </p>
                <p>Clique em "Adicionar Número" para começar.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Emergencia
