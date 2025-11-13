export const DEFAULT_EMERGENCY_CONTACTS = [
  { id: 'samu', name: 'SAMU', phone: '192', relation: 'Serviço de Emergência' },
  { id: 'bombeiros', name: 'Bombeiros', phone: '193', relation: 'Serviço de Emergência' },
  { id: 'policia', name: 'Polícia', phone: '190', relation: 'Serviço de Emergência' },
]

export const formatPhoneForWhatsApp = (phone = '') => {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.length <= 11) return `55${digits}`
  return digits
}

export const buildEmergencyContacts = ({
  primaryContact,
  primaryName,
  customContacts = [],
} = {}) => {
  const merged = []

  if (primaryContact) {
    merged.push({
      id: 'primary_contact',
      name: primaryName || 'Contato',
      phone: primaryContact,
      relation: 'Familiar',
    })
  }

  DEFAULT_EMERGENCY_CONTACTS.forEach((contact) => merged.push(contact))

  customContacts.forEach((contact) => {
    if (!contact) return
    merged.push({
      id: contact.id || `custom_${contact.phone || Date.now()}`,
      name: contact.name || 'Contato',
      phone: contact.phone,
      relation: contact.relation || 'Personalizado',
    })
  })

  return merged
}

export const emitEmergencyNotification = ({
  addNotification,
  action,
  contact,
  status = 'success',
  title = 'Emergência',
}) => {
  if (typeof addNotification !== 'function' || !contact) return

  const resolveMessage = () => {
    if (action === 'whatsapp') return `WhatsApp enviado para ${contact.name}`
    if (action === 'ligacao') return `Ligação acionada para ${contact.name}`
    if (action === 'sms') return `SMS enviado para ${contact.name}`
    if (action === 'contato-adicionado') return `Contato de emergência adicionado: ${contact.name}`
    if (action === 'contato-removido') return `Contato de emergência removido: ${contact.name}`
    if (action === 'localizacao') return `Localização compartilhada com ${contact.name}`
    return `Ação de emergência executada com ${contact.name}`
  }

  addNotification({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: status === 'error' ? 'error' : action === 'contato-adicionado' ? 'success' : 'warning',
    title,
    message: resolveMessage(),
    time: new Date().toISOString(),
    read: false,
    data: {
      action,
      status,
      contactId: contact.id || contact.phone,
      contactName: contact.name,
    },
  })
}

export const buildEmergencyWhatsAppMessage = ({
  contactName,
  requesterName,
  assistedName,
  context, // informação complementar opcional
} = {}) => {
  const resolvedContact = contactName || 'contato'
  const resolvedAssisted = assistedName || 'nosso assistido'
  const sameRequesterAndAssisted = requesterName && (!assistedName || assistedName === requesterName)

  let baseMessage

  if (sameRequesterAndAssisted) {
    baseMessage = `Olá ${resolvedContact}, ${requesterName} precisa de ajuda.`
  } else if (requesterName && assistedName) {
    baseMessage = `Olá ${resolvedContact}, ${requesterName} precisa de ajuda para ${resolvedAssisted}.`
  } else if (assistedName) {
    baseMessage = `Olá ${resolvedContact}, precisamos de ajuda para ${resolvedAssisted}.`
  } else if (requesterName) {
    baseMessage = `Olá ${resolvedContact}, ${requesterName} está solicitando ajuda em uma emergência.`
  } else {
    baseMessage = `Olá ${resolvedContact}, preciso de ajuda em uma emergência.`
  }

  if (context) {
    return `${baseMessage} ${context}`.trim()
  }

  return baseMessage
}
