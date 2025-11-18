import { RESIDENT_STORAGE_KEYS } from './chatIdentity'

const EMERGENCY_STORAGE_KEYS = ['idosoEmergencyNumbers', 'emergencyCustomNumbers']
const EMERGENCY_STORAGE_PREFIXES = EMERGENCY_STORAGE_KEYS.map((key) => `${key}:`)
const CHAT_SELECTION_KEYS = ['caregiverChatResidentKey']
const CHAT_STORAGE_PREFIXES = ['familyChat_']

const getStorages = () => {
  if (typeof window === 'undefined') {
    return []
  }
  const storages = []
  if (window.localStorage) {
    storages.push(window.localStorage)
  }
  if (window.sessionStorage) {
    storages.push(window.sessionStorage)
  }
  return storages
}

const removeKey = (storage, key) => {
  if (!storage || typeof storage.removeItem !== 'function' || !key) return
  try {
    storage.removeItem(key)
  } catch (_) {
    // ignore storage failures
  }
}

const clearStaticKeys = (keys) => {
  if (!keys || keys.length === 0) return
  getStorages().forEach((storage) => {
    keys.forEach((key) => removeKey(storage, key))
  })
}

const clearKeysByPrefix = (prefixes) => {
  if (!prefixes || prefixes.length === 0) return
  getStorages().forEach((storage) => {
    if (!storage || typeof storage.length !== 'number' || typeof storage.key !== 'function') {
      return
    }
    const keysToRemove = []
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index)
      if (!key) continue
      if (prefixes.some((prefix) => key.startsWith(prefix))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => removeKey(storage, key))
  })
}

export const clearResidentIdentityStorage = () => {
  clearStaticKeys(RESIDENT_STORAGE_KEYS)
}

export const clearEmergencyContactStorage = () => {
  clearStaticKeys(EMERGENCY_STORAGE_KEYS)
  clearKeysByPrefix(EMERGENCY_STORAGE_PREFIXES)
}

export const clearChatStorage = () => {
  clearStaticKeys(CHAT_SELECTION_KEYS)
  clearKeysByPrefix([...CHAT_STORAGE_PREFIXES])
}

export const clearUserScopedStorage = () => {
  clearResidentIdentityStorage()
  clearEmergencyContactStorage()
  clearChatStorage()
}

export default clearUserScopedStorage
