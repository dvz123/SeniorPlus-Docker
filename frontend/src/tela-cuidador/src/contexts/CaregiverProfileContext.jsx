import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useAuth } from "../../../tela-auth/src/contexts/AuthContext"

const CaregiverProfileContext = createContext()

const STORAGE_KEY = "caregiverProfile"

const defaultProfile = {
  displayName: "",
  headline: "",
  about: "",
  photoUrl: "",
  phone: "",
  email: "",
  connectionMessage: "",
  updatedAt: null,
}

export const useCaregiverProfile = () => {
  const context = useContext(CaregiverProfileContext)
  if (!context) {
    throw new Error("useCaregiverProfile deve ser usado dentro de um CaregiverProfileProvider")
  }
  return context
}

const normalizeProfile = (raw = {}) => ({
  ...defaultProfile,
  ...raw,
})

export const CaregiverProfileProvider = ({ children }) => {
  const { currentUser, updateCurrentUser } = useAuth()
  const [caregiverProfile, setCaregiverProfile] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      if (!cached) return normalizeProfile()
      return normalizeProfile(JSON.parse(cached))
    } catch (error) {
      console.warn("Falha ao carregar perfil do cuidador do storage", error)
      return normalizeProfile()
    }
  })

  const persist = useCallback((value) => {
    setCaregiverProfile((prev) => {
      const next = normalizeProfile(typeof value === "function" ? value(prev) : value)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch (error) {
        console.warn("Falha ao persistir perfil do cuidador", error)
      }
      return next
    })
  }, [])

  useEffect(() => {
    if (!currentUser) {
      persist(defaultProfile)
      return
    }

    if (currentUser.role && currentUser.role !== "caregiver") {
      // Preserve the persisted caregiver profile when a different role logs in (e.g., elderly view).
      return
    }

    const name = currentUser.name || currentUser.nome || currentUser.fullName || currentUser.username || ""
    const emailFromUser = currentUser.email || ""
    const phoneFromUser = currentUser.telefone || currentUser.phone || ""
    const avatarFromUser = currentUser.photoUrl || currentUser.fotoUrl || ""

    persist((prev) => {
      const merged = normalizeProfile({
        ...prev,
        displayName: prev.displayName || name,
        email: prev.email || emailFromUser,
        phone: prev.phone || phoneFromUser,
        photoUrl: prev.photoUrl || avatarFromUser,
      })
      return merged
    })
  }, [currentUser, persist])

  const updateCaregiverProfile = useCallback(
    (updates = {}) => {
      if (!updates || typeof updates !== "object") return

      persist((prev) => {
        const next = normalizeProfile({
          ...prev,
          ...updates,
          updatedAt: new Date().toISOString(),
        })

        if (updateCurrentUser) {
          const patch = {}
          if (updates.displayName) patch.name = updates.displayName
          if (updates.photoUrl !== undefined) patch.photoUrl = updates.photoUrl
          if (updates.email) patch.email = updates.email
          if (updates.phone) patch.phone = updates.phone
          updateCurrentUser(patch)
        }

        return next
      })
    },
    [persist, updateCurrentUser],
  )

  const resetCaregiverProfile = useCallback(() => {
    const base = normalizeProfile()
    if (currentUser) {
      base.displayName = currentUser.name || currentUser.nome || currentUser.fullName || currentUser.username || ""
      base.email = currentUser.email || ""
    }
    persist({ ...base, updatedAt: new Date().toISOString() })
  }, [currentUser, persist])

  const value = useMemo(
    () => ({
      caregiverProfile,
      updateCaregiverProfile,
      resetCaregiverProfile,
    }),
    [caregiverProfile, updateCaregiverProfile, resetCaregiverProfile],
  )

  return <CaregiverProfileContext.Provider value={value}>{children}</CaregiverProfileContext.Provider>
}
