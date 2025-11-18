import { useEffect, useMemo, useState } from 'react'

import {
  collectIdentitySources,
  collectStoredResidentEntries,
  mergeIdentityRecords,
  normalizeIdentifierDigits,
  resolveResidentCpf,
  resolveResidentId,
} from '../../../utils/chatIdentity'

const NAME_KEYS = ['nome', 'name', 'displayName', 'fullName', 'apelido', 'firstName']
const AVATAR_KEYS = ['fotoUrl', 'photoUrl', 'avatarUrl', 'avatar', 'imageUrl', 'picture', 'foto']

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

const buildInitials = (name) => {
  if (!name) return ''
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const useResidentIdentity = ({ currentUser, fallbackProfile } = {}) => {
  const [residentRecords, setResidentRecords] = useState(() => collectStoredResidentEntries())

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const refresh = () => {
      const storedEntries = collectStoredResidentEntries()
      setResidentRecords((prev) => mergeIdentityRecords(prev, storedEntries))
    }
    window.addEventListener('storage', refresh)
    window.addEventListener('residentProfileUpdated', refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('residentProfileUpdated', refresh)
    }
  }, [])

  const identitySources = useMemo(() => {
    const baseSources = [
      ...(residentRecords || []),
      fallbackProfile,
      currentUser?.assistedPerson,
      currentUser?.elderlyProfile,
      currentUser?.profile,
      currentUser,
    ]
    return collectIdentitySources(baseSources)
  }, [residentRecords, fallbackProfile, currentUser])

  const resolvedCpf = useMemo(() => resolveResidentCpf(identitySources), [identitySources])
  const resolvedId = useMemo(() => resolveResidentId(identitySources), [identitySources])

  const candidateProfiles = useMemo(() => {
    return [
      ...(identitySources || []),
      fallbackProfile,
      currentUser?.assistedPerson,
      currentUser?.elderlyProfile,
      currentUser?.profile,
      currentUser,
    ].filter(Boolean)
  }, [identitySources, fallbackProfile, currentUser])

  const preferredProfile = useMemo(() => {
    if (!candidateProfiles.length) return null
    const matchesResolvedIdentity = (candidate) => {
      if (!candidate) return false
      const sources = collectIdentitySources([candidate])
      const candidateCpf = resolveResidentCpf(sources)
      const candidateId = resolveResidentId(sources)
      if (resolvedCpf && candidateCpf && normalizeIdentifierDigits(candidateCpf) === resolvedCpf) {
        return true
      }
      if (resolvedId && candidateId && String(candidateId) === String(resolvedId)) {
        return true
      }
      return false
    }

    const matched = candidateProfiles.find(matchesResolvedIdentity)
    if (matched) return matched
    return candidateProfiles.find((candidate) => Boolean(pickFirst(candidate, NAME_KEYS))) || candidateProfiles[0] || null
  }, [candidateProfiles, resolvedCpf, resolvedId])

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

  return {
    profile: preferredProfile,
    name,
    avatarUrl,
    initials,
    cpf: resolvedCpf || null,
    residentId: resolvedId || null,
  }
}

export default useResidentIdentity
