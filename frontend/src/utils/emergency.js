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

const cleanDigits = (value) => String(value || '').replace(/\D/g, '')

export const normalizeCpf = (value) => {
  if (!value) return ''
  return String(value).replace(/\D/g, '')
}

export const normalizeEmergencyContact = (contact, { defaultRelation = 'Personalizado' } = {}) => {
  if (!contact || typeof contact !== 'object') return null

  const name =
    contact.name ||
    contact.nome ||
    contact.displayName ||
    contact.fullName ||
    contact.contactName ||
    ''

  const phone = contact.phone || contact.telefone || contact.number || contact.contato || ''
  if (!phone) return null

  const digits = cleanDigits(phone)
  let rawId = contact.id ?? contact.identifier ?? null
  let backendId = contact.backendId ?? null

  if (
    backendId == null &&
    typeof rawId === 'string' &&
    /^backend_\d+$/.test(rawId)
  ) {
    backendId = Number(rawId.replace('backend_', ''))
  }

  if (backendId != null && (!rawId || (typeof rawId === 'string' && !rawId.startsWith('backend_')))) {
    rawId = `backend_${backendId}`
  }

  const id = rawId != null
    ? String(rawId)
    : digits
      ? `contact_${digits}`
      : `contact_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  const relation =
    contact.relation ||
    contact.parentesco ||
    contact.vinculo ||
    contact.description ||
    contact.descricao ||
    contact.role ||
    defaultRelation

  const description = contact.description || contact.descricao || contact.observacoes || null

  const source =
    contact.source ||
    (backendId != null ? 'caregiver' : String(id).startsWith('custom_') ? 'custom' : 'default')

  return {
    id,
    backendId,
    source,
    name: name || 'Contato',
    phone,
    relation,
    description,
  }
}

export const mergeEmergencyCustomContacts = (...sources) => {
  const byId = new Map()

  sources
    .filter(Boolean)
    .forEach((source) => {
      const list = Array.isArray(source) ? source : [source]
      list.forEach((item) => {
        const normalized = normalizeEmergencyContact(item)
        if (!normalized) return
        const key = normalized.id || cleanDigits(normalized.phone) || normalized.name
        if (!key) return

        if (!byId.has(key)) {
          byId.set(key, normalized)
          return
        }

        const existing = byId.get(key)
        byId.set(key, {
          ...existing,
          ...normalized,
          relation: normalized.relation || existing.relation,
          description: normalized.description || existing.description || null,
        })
      })
    })

  return Array.from(byId.values())
}

export const emergencyContactsAreEqual = (a = [], b = []) => {
  if (a === b) return true
  if (!Array.isArray(a) || !Array.isArray(b)) return false
  if (a.length !== b.length) return false

  const serialize = (list) =>
    list
      .map((item) => normalizeEmergencyContact(item))
      .filter(Boolean)
      .map((item) =>
        [item.id || '', cleanDigits(item.phone), item.name || '', item.relation || '', item.description || ''].join(
          '::',
        ),
      )
      .sort()

  const serializedA = serialize(a)
  const serializedB = serialize(b)

  return serializedA.every((value, index) => value === serializedB[index])
}

export const buildEmergencyContacts = ({
  primaryContact,
  primaryName,
  customContacts = [],
  includeDefaults = true,
} = {}) => {
  const byKey = new Map()

  const pushContact = (contact, options) => {
    const normalized = normalizeEmergencyContact(contact, options)
    if (!normalized) return
    const key = normalized.id || cleanDigits(normalized.phone) || normalized.name
    if (!key) return
    if (!byKey.has(key)) {
      byKey.set(key, normalized)
      return
    }
    const existing = byKey.get(key)
    byKey.set(key, {
      ...existing,
      ...normalized,
      relation: normalized.relation || existing.relation,
      description: normalized.description || existing.description || null,
    })
  }

  if (primaryContact) {
    pushContact(
      {
        id: 'primary_contact',
        name: primaryName || 'Contato',
        phone: primaryContact,
        relation: 'Familiar',
      },
      { defaultRelation: 'Familiar' },
    )
  }

  if (includeDefaults) {
    DEFAULT_EMERGENCY_CONTACTS.forEach((contact) => pushContact(contact, { defaultRelation: contact.relation }))
  }

  mergeEmergencyCustomContacts(customContacts).forEach((contact) =>
    pushContact(contact, { defaultRelation: contact.relation || 'Personalizado' }),
  )

  return Array.from(byKey.values())
}

export const mapBackendEmergencyContact = (entity) => {
  if (!entity) return null
  return normalizeEmergencyContact({
    id: entity.id != null ? `backend_${entity.id}` : entity.id,
    backendId: entity.id,
    name: entity.nome,
    phone: entity.telefone,
    relation: entity.relacao || 'Personalizado',
    description: entity.observacoes,
    source: 'caregiver',
  })
}

export const mapEmergencyContactToPayload = (contact) => {
  if (!contact) return null
  return {
    nome: contact.name,
    telefone: contact.phone,
    relacao: contact.relation || 'Personalizado',
    observacoes: contact.description || null,
  }
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
