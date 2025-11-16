import { createContext, useState, useContext, useEffect, useCallback } from "react"
import { v4 as uuidv4 } from "uuid"
import { useAuth } from "../../../tela-auth/src/contexts/AuthContext"
import { useToast } from "../../../contexts/ToastContext"

const MedicationContext = createContext()

const LEGACY_MEDICATION_KEY = "medications"
const SHARED_MEDICATION_KEY = "seniorplus:medications"
const LEGACY_HISTORY_KEY = "medicationHistory"
const SHARED_HISTORY_KEY = "seniorplus:medicationHistory"

export const useMedication = () => useContext(MedicationContext)

export const MedicationProvider = ({ children }) => {
  const { currentUser } = useAuth()
  const { showSuccess, showError, showWarning } = useToast()

  const parseTimes = (timeValue) => {
    if (!timeValue) return []
    if (Array.isArray(timeValue)) return timeValue.filter(Boolean).map((t) => t.trim())
    return String(timeValue)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
  }

  const normalizeMedication = (medication) => {
    if (!medication) return null
    const base = {
      id: medication.id || uuidv4(),
      name: medication.name || medication.nome || "",
      dosage: medication.dosage || medication.dosagem || "",
      frequency: medication.frequency || medication.frequencia || "",
      time: medication.time || medication.horarios || "",
      times: parseTimes(medication.times || medication.time || medication.horarios),
      startDate: medication.startDate || medication.dataInicio || new Date().toISOString().split("T")[0],
      endDate: medication.endDate || medication.dataFim || "",
      status: medication.status || "active",
      instructions: medication.instructions || medication.instrucoes || "",
      reminders: typeof medication.reminders === "boolean" ? medication.reminders : true,
      notes: medication.notes || medication.observacoes || "",
      createdAt: medication.createdAt || new Date().toISOString(),
      updatedAt: medication.updatedAt || new Date().toISOString(),
    }

    if (!Array.isArray(base.times) || base.times.length === 0) {
      base.times = parseTimes(base.time)
    }

    return base
  }

  const parseStoredValue = useCallback((raw) => {
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
      if (Array.isArray(parsed?.items)) return parsed.items
      return []
    } catch (error) {
      console.error("Erro ao ler dados compartilhados:", error)
      return []
    }
  }, [])

  const loadInitialMedications = useCallback(() => {
    if (typeof window === "undefined") return []
    const shared = parseStoredValue(window.localStorage.getItem(SHARED_MEDICATION_KEY))
    if (shared.length > 0) return shared.map((med) => normalizeMedication(med)).filter(Boolean)

    const legacy = parseStoredValue(window.localStorage.getItem(LEGACY_MEDICATION_KEY))
    if (legacy.length > 0) return legacy.map((med) => normalizeMedication(med)).filter(Boolean)

    return []
  }, [parseStoredValue])

  const loadInitialHistory = useCallback(() => {
    if (typeof window === "undefined") return []
    const shared = parseStoredValue(window.localStorage.getItem(SHARED_HISTORY_KEY))
    if (shared.length > 0) return shared

    const legacy = parseStoredValue(window.localStorage.getItem(LEGACY_HISTORY_KEY))
    return legacy
  }, [parseStoredValue])

  const [medications, setMedications] = useState(() => loadInitialMedications())

  const [medicationHistory, setMedicationHistory] = useState(() => loadInitialHistory())

  // Limpar dados quando o usuário fizer logout
  useEffect(() => {
    if (!currentUser) {
      setMedications(loadInitialMedications())
      setMedicationHistory(loadInitialHistory())
    }
  }, [currentUser, loadInitialHistory, loadInitialMedications])

  useEffect(() => {
    if (typeof window === "undefined") return undefined

    const handleStorage = (event) => {
      if (event.key === SHARED_MEDICATION_KEY && event.newValue) {
        setMedications(parseStoredValue(event.newValue).map((med) => normalizeMedication(med)).filter(Boolean))
      }
      if (event.key === SHARED_HISTORY_KEY && event.newValue) {
        setMedicationHistory(parseStoredValue(event.newValue))
      }
    }

    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [parseStoredValue])

  // Salvar dados no localStorage quando mudarem
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(LEGACY_MEDICATION_KEY, JSON.stringify(medications))
    } catch (error) {
      console.warn("Falha ao persistir medicamentos (legacy)", error)
    }
    try {
      window.localStorage.setItem(
        SHARED_MEDICATION_KEY,
        JSON.stringify({ items: medications, updatedAt: new Date().toISOString() }),
      )
    } catch (error) {
      console.warn("Falha ao persistir medicamentos compartilhados", error)
    }
  }, [medications])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(LEGACY_HISTORY_KEY, JSON.stringify(medicationHistory))
    } catch (error) {
      console.warn("Falha ao persistir histórico de medicamentos (legacy)", error)
    }
    try {
      window.localStorage.setItem(
        SHARED_HISTORY_KEY,
        JSON.stringify({ items: medicationHistory, updatedAt: new Date().toISOString() }),
      )
    } catch (error) {
      console.warn("Falha ao persistir histórico compartilhado", error)
    }
  }, [medicationHistory])

  const addMedication = (name, dosage, frequency, time, startDate, endDate, instructions, notes = "") => {
    const newMedication = normalizeMedication({
      id: uuidv4(),
      name,
      dosage,
      frequency,
      time,
      startDate,
      endDate,
      status: "active",
      instructions,
      reminders: true,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    setMedications([...medications, newMedication])
    showSuccess(`Medicamento ${name} adicionado com sucesso!`)
    return newMedication
  }

  const updateMedication = (id, updatedMedication) => {
    setMedications(
      medications.map((medication) => {
        if (medication.id === id) {
          return normalizeMedication({
            ...medication,
            ...updatedMedication,
            updatedAt: new Date().toISOString(),
            id,
          })
        }
        return medication
      }),
    )
    showSuccess(`Medicamento atualizado com sucesso!`)
  }

  const deleteMedication = (id) => {
    const medicationToDelete = medications.find((med) => med.id === id)
    setMedications(medications.filter((medication) => medication.id !== id))
    if (medicationToDelete) {
      showSuccess(`Medicamento ${medicationToDelete.name} removido com sucesso!`)
    }
  }

  const recordMedicationTaken = (medicationId, taken, meta, extra) => {
    const medication = medications.find((med) => med.id === medicationId)

    if (!medication) {
      showError("Medicamento não encontrado!")
      return null
    }

    let notes = ""
    let slot = ""

    if (typeof meta === "string" || meta === undefined) {
      notes = typeof meta === "string" ? meta : ""
      if (typeof extra === "string") {
        slot = extra
      }
    } else if (meta && typeof meta === "object") {
      notes = meta.notes || meta.observacao || ""
      slot = meta.timeSlot || meta.slot || meta.horario || meta.schedule || ""
    }

    if (!notes && slot) {
      notes = `Horário ${slot}`
    }

    const normalizedSlot = slot ? slot.trim() : ""
    const now = new Date()
    const dateIso = now.toISOString().split("T")[0]
    const timeISO = now.toTimeString().split(" ")[0].substring(0, 5)

    const newRecord = {
      id: uuidv4(),
      medicationId,
      medicationName: medication.name,
      date: dateIso,
      time: timeISO,
      taken,
      slot: normalizedSlot || null,
      notes,
      createdAt: now.toISOString(),
    }

    setMedicationHistory((prev) => {
      if (!normalizedSlot) {
        return [...prev, newRecord]
      }
      const filtered = prev.filter((record) => {
        if (record.medicationId !== medicationId) return true
        if (record.date !== dateIso) return true
        const recordSlot = (record.slot || record.timeSlot || "").trim()
        return recordSlot !== normalizedSlot
      })
      return [...filtered, newRecord]
    })

    const readableSlot = normalizedSlot ? ` (${normalizedSlot})` : ""
    if (taken) {
      showSuccess(`Medicamento ${medication.name}${readableSlot} registrado como tomado!`)
    } else {
      showWarning(`Medicamento ${medication.name}${readableSlot} registrado como não tomado!`)
    }

    return newRecord
  }

  const getMedicationHistory = (medicationId) => {
    return medicationHistory
      .filter((record) => record.medicationId === medicationId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  const getActiveMedications = () => {
    return medications
      .filter((medication) => medication.status === "active")
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  const getTodayMedications = () => {
    const today = new Date().toISOString().split("T")[0]
    return medications.filter((medication) => {
      const startDate = new Date(medication.startDate)
      const endDate = medication.endDate ? new Date(medication.endDate) : new Date(2099, 11, 31)
      const todayDate = new Date(today)
      return medication.status === "active" && startDate <= todayDate && endDate >= todayDate
    })
  }

  // Função para importar medicamentos de CSV
  const importMedicationsFromCSV = (csvData) => {
    try {
      if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
        showError("Dados CSV inválidos ou vazios")
        return []
      }

      // Processar os dados CSV e adicionar como medicamentos
      const newMedications = csvData.map((item) =>
        normalizeMedication({
          id: uuidv4(),
          name: item.nome || item.name || "",
          dosage: item.dosagem || item.dosage || "",
          frequency: item.frequencia || item.frequency || "",
          time: item.horario || item.time || "",
          startDate: item.dataInicio || item.startDate || new Date().toISOString().split("T")[0],
          endDate: item.dataFim || item.endDate || "",
          status: "active",
          instructions: item.instrucoes || item.instructions || "",
          reminders: true,
          notes: item.observacoes || item.notes || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      )

      // Validar os dados antes de adicionar
      const validMedications = newMedications.filter((med) => med.name && med.dosage)

      if (validMedications.length === 0) {
        showError("Nenhum medicamento válido encontrado no arquivo CSV")
        return []
      }

      setMedications((prev) => [...prev, ...validMedications])
      showSuccess(`${validMedications.length} medicamentos importados com sucesso!`)
      return validMedications
    } catch (error) {
      console.error("Erro ao importar medicamentos:", error)
      showError(`Erro ao importar medicamentos: ${error.message}`)
      return []
    }
  }

  return (
    <MedicationContext.Provider
      value={{
        medications,
        medicationHistory,
        addMedication,
        updateMedication,
        deleteMedication,
        recordMedicationTaken,
        getMedicationHistory,
        getActiveMedications,
        getTodayMedications,
        importMedicationsFromCSV,
      }}
    >
      {children}
    </MedicationContext.Provider>
  )
}

export default MedicationProvider
