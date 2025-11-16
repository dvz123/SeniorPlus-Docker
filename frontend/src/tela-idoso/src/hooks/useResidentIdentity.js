import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEYS = ['elderlyProfile', 'elderlyData', 'idosoProfile', 'residentProfile']
const NAME_KEYS = ['nome', 'name', 'displayName', 'fullName', 'apelido', 'firstName']
const AVATAR_KEYS = ['fotoUrl', 'photoUrl', 'avatarUrl', 'avatar', 'imageUrl', 'picture', 'foto']

const safeParse = (value) => {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch (_) {
    return null
  }
}

const pickFirst = (source, keys) => {
  if (!source || typeof source !== 'object') return null
  for (const key of keys) {
    const value = source[key]
    if (value && typeof value === 'string' && value.trim()) {
      return value
    }
  }
  return null
}

const loadStoredProfile = () => {
  if (typeof window === 'undefined') return null
  for (const key of STORAGE_KEYS) {
    const raw = window.localStorage?.getItem?.(key)
    const parsed = safeParse(raw)
    if (parsed) {
      return parsed
    }
  }
  return null
}

const buildInitials = (name) => {
  if (!name) return ''
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const useResidentIdentity = ({ currentUser, fallbackProfile } = {}) => {
  const [storedProfile, setStoredProfile] = useState(() => loadStoredProfile())

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const refresh = () => {
      setStoredProfile(loadStoredProfile())
    }
    window.addEventListener('storage', refresh)
    window.addEventListener('residentProfileUpdated', refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('residentProfileUpdated', refresh)
    }
  }, [])

  const preferredProfile = useMemo(() => {
    const candidates = [
      fallbackProfile,
      storedProfile,
      currentUser?.assistedPerson,
      currentUser?.elderlyProfile,
      currentUser?.profile,
      currentUser,
    ]
    return candidates.find((candidate) => Boolean(pickFirst(candidate, NAME_KEYS))) || null
  }, [fallbackProfile, storedProfile, currentUser])

  const name = useMemo(() => {
    return (
      pickFirst(preferredProfile, NAME_KEYS) ||
      pickFirst(currentUser, NAME_KEYS) ||
      currentUser?.email ||
      'Olá!'
    )
  }, [preferredProfile, currentUser])

  const avatarUrl = useMemo(() => {
    return pickFirst(preferredProfile, AVATAR_KEYS) || pickFirst(currentUser, AVATAR_KEYS) || null
  }, [preferredProfile, currentUser])

  const initials = useMemo(() => buildInitials(name), [name])

  return { profile: preferredProfile, name, avatarUrl, initials }
}

export default useResidentIdentity
