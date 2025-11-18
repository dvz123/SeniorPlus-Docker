import { useCallback, useEffect, useRef, useState } from "react"
import "../styles/AtualizarDados.css"
import BackButton from "../../../components/BackButton"
import { api } from "../../../tela-auth/src/services/api"
import { useAuth } from "../../../tela-auth/src/contexts/AuthContext"
import { useToast } from "../../../contexts/ToastContext"
import { useUser } from "../contexts/UserContext"

const emptyForm = {
  cpf: "",
  rg: "",
  nome: "",
  email: "",
  dataNascimento: "",
  telefone: "",
  idade: "",
  genero: "",
  estadoCivil: "",
  peso: "",
  altura: "",
  tipoSanguineo: "",
  observacao: "",
  imc: "",
  alergias: "",
  fotoUrl: "",
  nomeContatoEmergencia: "",
  contatoEmergencia: "",
}

const SUPPORTED_PHOTO_TYPES = ["image/png", "image/jpeg", "image/webp"]
const MAX_PHOTO_FILE_SIZE = 2 * 1024 * 1024 // 2 MB em bytes
const MAX_INLINE_IMAGE_BYTES = 1.8 * 1024 * 1024 // margem de segurança para envio em JSON
const MAX_IMAGE_DIMENSION = 1024

const extractBase64Payload = (value = "") => {
  if (!value) return ""
  const commaIndex = value.indexOf(",")
  return commaIndex >= 0 ? value.slice(commaIndex + 1) : value
}

const estimateBase64Bytes = (value = "") => {
  const payload = extractBase64Payload(value)
  if (!payload) return 0
  const padding = (payload.match(/=+$/) || [""])[0].length
  return Math.ceil((payload.length * 3) / 4 - padding)
}

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
      } else {
        reject(new Error("Não foi possível converter a imagem selecionada."))
      }
    }
    reader.onerror = () => reject(reader.error || new Error("Falha ao carregar a imagem."))
    reader.readAsDataURL(file)
  })

const scaleDimensions = (width, height, maxDimension) => {
  if (!width || !height) {
    return { width, height }
  }
  const largerSide = Math.max(width, height)
  if (largerSide <= maxDimension) {
    return { width, height }
  }
  const scale = maxDimension / largerSide
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  }
}

const resizeDataUrl = (dataUrl, mimeType) =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve(dataUrl)
      return
    }
    const image = new Image()
    image.onload = () => {
      const { width, height } = scaleDimensions(image.width, image.height, MAX_IMAGE_DIMENSION)
      if (!width || !height) {
        resolve(dataUrl)
        return
      }
      if (width === image.width && height === image.height) {
        resolve(dataUrl)
        return
      }
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        resolve(dataUrl)
        return
      }
      ctx.drawImage(image, 0, 0, width, height)
      const normalizedType = mimeType === "image/png" || mimeType === "image/webp" ? mimeType : "image/jpeg"
      const quality = normalizedType === "image/png" ? undefined : 0.86
      resolve(canvas.toDataURL(normalizedType, quality))
    }
    image.onerror = () => reject(new Error("Não foi possível processar a imagem."))
    image.src = dataUrl
  })

const processPhotoFile = async (file) => {
  const base64 = await readFileAsDataUrl(file)
  try {
    const optimized = await resizeDataUrl(base64, file.type)
    return optimized
  } catch (error) {
    console.warn("Falha ao otimizar a imagem do idoso", error)
    return base64
  }
}

const persistResidentProfileCache = (record) => {
  if (typeof window === "undefined" || !record) return
  try {
    window.localStorage.setItem("residentProfile", JSON.stringify(record))
    window.dispatchEvent(new Event("residentProfileUpdated"))
  } catch (error) {
    console.warn("Não foi possível atualizar o cache local do perfil do idoso", error)
  }
}

const calcularImc = (peso, alturaEmCm) => {
  const pesoNumero = parseFloat(peso)
  const alturaNumeroCm = parseFloat(alturaEmCm)

  if (!pesoNumero || !alturaNumeroCm || alturaNumeroCm === 0) {
    return ""
  }

  const alturaMetros = alturaNumeroCm / 100
  if (!Number.isFinite(alturaMetros) || alturaMetros <= 0) {
    return ""
  }

  const imc = pesoNumero / (alturaMetros * alturaMetros)
  if (!Number.isFinite(imc)) {
    return ""
  }

  return imc.toFixed(2)
}

const mapApiToForm = (idoso) => {
  if (!idoso) {
    return emptyForm
  }

  const peso = idoso?.peso != null ? Number(idoso.peso) : ""
  const alturaMetros = idoso?.altura != null ? Number(idoso.altura) : ""
  const alturaCm = alturaMetros !== "" && Number.isFinite(alturaMetros)
    ? (alturaMetros * 100).toFixed(1).replace(/\.0$/, "")
    : ""

  return {
    cpf: idoso?.cpf || "",
    rg: idoso?.rg || "",
    nome: idoso?.nome || "",
    email: idoso?.email || "",
    dataNascimento: idoso?.dataNascimento ? String(idoso.dataNascimento).substring(0, 10) : "",
    telefone: idoso?.telefone || "",
    idade: idoso?.idade != null ? String(idoso.idade) : "",
    genero: idoso?.genero || "",
    estadoCivil: idoso?.estadoCivil || "",
    peso: peso !== "" ? String(peso) : "",
    altura: alturaCm !== "" ? String(alturaCm) : "",
    tipoSanguineo: idoso?.tipoSanguineo || "",
    observacao: idoso?.observacao || "",
    alergias: idoso?.alergias || "",
    fotoUrl: idoso?.fotoUrl || "",
    imc: calcularImc(peso, alturaCm) || idoso?.imc || "",
    nomeContatoEmergencia: idoso?.nomeContatoEmergencia || "",
    contatoEmergencia: idoso?.contatoEmergencia || "",
  }
}

const normalizeCpf = (value) => (value || "").replace(/\D/g, "")

const parseAllergiesList = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => item.trim())
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

const calculateAgeFromDate = (dateValue) => {
  if (!dateValue) return null
  const birthDate = new Date(dateValue)
  if (Number.isNaN(birthDate.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const hasHadBirthday =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate())
  if (!hasHadBirthday) {
    age -= 1
  }
  return Number.isFinite(age) && age >= 0 ? age : null
}

const mapApiToElderlyData = (idoso) => {
  if (!idoso) return null

  const alturaMetros = idoso?.altura != null ? Number(idoso.altura) : null
  const ageFromField = idoso?.idade != null ? Number(idoso.idade) : null
  const computedAge = calculateAgeFromDate(idoso?.dataNascimento)

  return {
    id: idoso?.cpf || idoso?.id || "",
    cpf: idoso?.cpf || "",
    name: idoso?.nome || "",
    email: idoso?.email || "",
    phone: idoso?.telefone || "",
    photoUrl: idoso?.fotoUrl || "",
    bloodType: idoso?.tipoSanguineo || "",
    maritalStatus: idoso?.estadoCivil || "",
    gender: idoso?.genero || "",
    weight: idoso?.peso != null ? Number(idoso.peso) : null,
    height: alturaMetros,
    birthDate: idoso?.dataNascimento || "",
    observation: idoso?.observacao || "",
    imc: idoso?.imc || "",
    age: Number.isFinite(ageFromField) && ageFromField > 0 ? ageFromField : computedAge,
    allergies: parseAllergiesList(idoso?.alergias),
    emergencyContact: idoso?.contatoEmergencia || "",
    emergencyContactName: idoso?.nomeContatoEmergencia || "",
    address: idoso?.endereco || "",
    medicalConditions: Array.isArray(idoso?.condicoesMedicas) ? idoso.condicoesMedicas : [],
  }
}

const mapFormToElderlyData = (form) => {
  if (!form) return null
  const alturaMetros = form.altura ? Number(form.altura) / 100 : null
  const idade = form.idade != null && form.idade !== "" ? Number(form.idade) : null
  return {
    id: form.cpf || form.id || "",
    cpf: form.cpf || "",
    name: form.nome || "",
    email: form.email || "",
    phone: form.telefone || "",
    photoUrl: form.fotoUrl || "",
    bloodType: form.tipoSanguineo || "",
    maritalStatus: form.estadoCivil || "",
    gender: form.genero || "",
    weight: form.peso ? Number(form.peso) : null,
    height: Number.isFinite(alturaMetros) ? alturaMetros : null,
    birthDate: form.dataNascimento || "",
    observation: form.observacao || "",
    imc: form.imc || "",
    age: Number.isFinite(idade) && idade > 0 ? idade : calculateAgeFromDate(form.dataNascimento),
    allergies: parseAllergiesList(form.alergias),
    emergencyContact: form.contatoEmergencia || "",
    emergencyContactName: form.nomeContatoEmergencia || "",
  }
}

function AtualizarDados() {
  const { currentUser } = useAuth()
  const { showError, showSuccess } = useToast()
  const { updateElderlyData } = useUser() || {}

  const [formData, setFormData] = useState(emptyForm)
  const [linkedIdosos, setLinkedIdosos] = useState([])
  const [selectedCpf, setSelectedCpf] = useState("")
  const [mensagem, setMensagem] = useState(null)
  const [carregandoLista, setCarregandoLista] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [processandoVinculo, setProcessandoVinculo] = useState(false)
  const [cpfParaVincular, setCpfParaVincular] = useState("")
  const fileInputRef = useRef(null)
  const [photoFileName, setPhotoFileName] = useState("")

  const handleChange = (event) => {
    const { name } = event.target
    const rawValue = event.target.value
    const value = name === "fotoUrl" ? rawValue.trim() : rawValue

    if (name === "fotoUrl" && value && value.startsWith("data:image")) {
      const approxBytes = estimateBase64Bytes(value)
      if (approxBytes > MAX_INLINE_IMAGE_BYTES) {
        showError?.("A imagem colada ultrapassa o limite permitido. Escolha um arquivo menor (até 1,8 MB).")
        return
      }
    }

    setFormData((prev) => {
      const atualizado = {
        ...prev,
        [name]: value,
      }

      if (name === "peso" || name === "altura") {
        atualizado.imc = calcularImc(
          name === "peso" ? value : atualizado.peso,
          name === "altura" ? value : atualizado.altura,
        )
      }

      return atualizado
    })

    if (name === "fotoUrl") {
      setPhotoFileName("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!SUPPORTED_PHOTO_TYPES.includes(file.type)) {
      showError?.("Formato de imagem inválido. Utilize PNG, JPG ou WEBP.")
      event.target.value = ""
      setPhotoFileName("")
      return
    }

    if (file.size > MAX_PHOTO_FILE_SIZE) {
      showError?.("A imagem deve ter até 2 MB antes da otimização.")
      event.target.value = ""
      setPhotoFileName("")
      return
    }

    try {
      const optimizedDataUrl = await processPhotoFile(file)
      const approxBytes = estimateBase64Bytes(optimizedDataUrl)
      if (approxBytes > MAX_INLINE_IMAGE_BYTES) {
        showError?.("Mesmo após otimizar, a imagem ficou grande demais. Escolha um arquivo menor (até 1,8 MB).")
        event.target.value = ""
        setPhotoFileName("")
        return
      }

      setFormData((prev) => ({
        ...prev,
        fotoUrl: optimizedDataUrl,
      }))
      setPhotoFileName(file.name)
    } catch (error) {
      console.error("Erro ao processar imagem do idoso:", error)
      showError?.("Não foi possível processar a imagem selecionada. Tente novamente com um arquivo menor.")
      event.target.value = ""
      setPhotoFileName("")
    }
  }

  const handlePhotoRemoval = () => {
    setFormData((prev) => ({
      ...prev,
      fotoUrl: "",
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setPhotoFileName("")
  }

  const resetMensagem = useCallback(() => setMensagem(null), [])

  const carregarIdoso = useCallback(
    async (cpf) => {
      if (!cpf) {
        setFormData(emptyForm)
        return
      }
      try {
        const data = await api.get(`/api/v1/idoso/${cpf}`)
        setFormData(mapApiToForm(data))
        if (updateElderlyData) {
          updateElderlyData(mapApiToElderlyData(data))
        }
      } catch (error) {
        console.error(error)
        const mensagemErro = error?.message || "Não foi possível carregar os dados do idoso selecionado."
        setMensagem({ tipo: "error", texto: mensagemErro })
        if (showError) {
          showError(mensagemErro)
        }
      }
    },
    [showError],
  )

  const carregarVinculos = useCallback(
    async (cpfParaSelecionar = "") => {
      if (!currentUser?.cpf) {
        return
      }

      setCarregandoLista(true)
      resetMensagem()

      try {
        const resposta = await api.get(`/api/v1/idoso/cuidador/${currentUser.cpf}`)
        const lista = Array.isArray(resposta) ? resposta : []

        setLinkedIdosos(lista)

        if (lista.length === 0) {
          setSelectedCpf("")
          setFormData(emptyForm)
          return
        }

        const cpfValido = cpfParaSelecionar && lista.some((item) => item.cpf === cpfParaSelecionar)
          ? cpfParaSelecionar
          : lista[0].cpf

        setSelectedCpf(cpfValido)
        await carregarIdoso(cpfValido)
      } catch (error) {
        console.error(error)
        const mensagemErro = error?.message || "Não foi possível carregar os idosos vinculados."
        setMensagem({ tipo: "error", texto: mensagemErro })
        setLinkedIdosos([])
        setSelectedCpf("")
        setFormData(emptyForm)
        if (showError) {
          showError(mensagemErro)
        }
      } finally {
        setCarregandoLista(false)
      }
    },
    [carregarIdoso, currentUser?.cpf, resetMensagem, showError],
  )

  useEffect(() => {
    carregarVinculos()
  }, [carregarVinculos])

  const handleSubmit = async (event) => {
    event.preventDefault()
    resetMensagem()

    const cpfNormalizado = normalizeCpf(formData.cpf)
    if (cpfNormalizado.length !== 11) {
      const mensagemErro = "Informe um CPF válido com 11 dígitos."
      setMensagem({ tipo: "error", texto: mensagemErro })
      if (showError) {
        showError(mensagemErro)
      }
      return
    }

    const alturaMetros = formData.altura ? parseFloat(formData.altura) / 100 : null
    const alturaMetrosAjustada = alturaMetros != null && Number.isFinite(alturaMetros)
      ? Math.round(alturaMetros * 100) / 100
      : null

    const payload = {
      ...formData,
      cpf: cpfNormalizado,
      cuidadorCpf: currentUser?.cpf || "",
      peso: formData.peso ? parseFloat(formData.peso) : null,
      altura: alturaMetrosAjustada,
      imc: calcularImc(formData.peso, formData.altura) || formData.imc || null,
      dataNascimento: formData.dataNascimento || null,
      idade: formData.idade ? Number.parseInt(formData.idade, 10) : null,
      genero: formData.genero?.trim() || null,
      estadoCivil: formData.estadoCivil?.trim() || null,
      alergias: formData.alergias ? String(formData.alergias) : null,
      fotoUrl: formData.fotoUrl || null,
      nomeContatoEmergencia: formData.nomeContatoEmergencia?.trim() || null,
      contatoEmergencia: formData.contatoEmergencia?.trim() || null,
    }

    const jaVinculado = linkedIdosos.some((idoso) => idoso.cpf === cpfNormalizado)

    if (payload.fotoUrl && payload.fotoUrl.startsWith("data:image")) {
      const approxBytes = estimateBase64Bytes(payload.fotoUrl)
      if (approxBytes > MAX_INLINE_IMAGE_BYTES) {
        const mensagemErro = "A imagem selecionada ultrapassa o limite permitido. Escolha um arquivo menor (até 1,8 MB)."
        setMensagem({ tipo: "error", texto: mensagemErro })
        showError?.(mensagemErro)
        return
      }
    }

    setSalvando(true)

    try {
      let savedRecord = null
      if (jaVinculado) {
        savedRecord = await api.put(`/api/v1/idoso/${cpfNormalizado}`, payload)
        const mensagemSucesso = "Dados do idoso atualizados com sucesso!"
        setMensagem({ tipo: "success", texto: mensagemSucesso })
        showSuccess?.(mensagemSucesso)
      } else {
        savedRecord = await api.post("/api/v1/idoso", payload)
        const mensagemSucesso = "Idoso cadastrado e vinculado com sucesso!"
        setMensagem({ tipo: "success", texto: mensagemSucesso })
        showSuccess?.(mensagemSucesso)
      }

      if (savedRecord) {
        setFormData(mapApiToForm(savedRecord))
        persistResidentProfileCache(savedRecord)
        updateElderlyData?.(mapApiToElderlyData(savedRecord))
      } else if (updateElderlyData) {
        updateElderlyData(
          mapFormToElderlyData({
            ...formData,
            cpf: cpfNormalizado,
            fotoUrl: payload.fotoUrl || formData.fotoUrl,
          }),
        )
      }

      await carregarVinculos(savedRecord?.cpf || cpfNormalizado)
    } catch (error) {
      console.error(error)
      const mensagemErro = error?.message || "Erro ao salvar os dados do idoso."
      setMensagem({ tipo: "error", texto: mensagemErro })
      if (showError) {
        showError(mensagemErro)
      }
    } finally {
      setSalvando(false)
    }
  }

  const handleSelectChange = async (event) => {
    const novoCpf = event.target.value
    setSelectedCpf(novoCpf)
    resetMensagem()
    await carregarIdoso(novoCpf)
  }

  const handleNovoCadastro = () => {
    resetMensagem()
    setSelectedCpf("")
    setFormData(emptyForm)
  }

  const handleDesvincular = async () => {
    if (!selectedCpf) {
      return
    }

    setProcessandoVinculo(true)
    resetMensagem()

    try {
      await api.delete(`/api/v1/idoso/${selectedCpf}/cuidador`)
      const mensagemSucesso = "Idoso desvinculado com sucesso."
      setMensagem({ tipo: "success", texto: mensagemSucesso })
      if (showSuccess) {
        showSuccess(mensagemSucesso)
      }
      await carregarVinculos()
    } catch (error) {
      console.error(error)
      const mensagemErro = error?.message || "Não foi possível desvincular o idoso."
      setMensagem({ tipo: "error", texto: mensagemErro })
      if (showError) {
        showError(mensagemErro)
      }
    } finally {
      setProcessandoVinculo(false)
    }
  }

  const handleVincularExistente = async (event) => {
    event.preventDefault()
    resetMensagem()

    const cpfNormalizado = normalizeCpf(cpfParaVincular)
    if (cpfNormalizado.length !== 11) {
      const mensagemErro = "Informe um CPF válido para vincular."
      setMensagem({ tipo: "error", texto: mensagemErro })
      if (showError) {
        showError(mensagemErro)
      }
      return
    }

    setProcessandoVinculo(true)

    try {
      await api.post('/api/v1/vinculos/solicitacoes', {
        idosoCpf: cpfNormalizado,
        mensagem: `Solicitação enviada por ${currentUser?.nome || 'cuidador'} em ${new Date().toLocaleString('pt-BR')}`,
      })

      const mensagemSucesso = "Solicitação enviada! Aguarde o idoso aceitar o vínculo."
      setMensagem({ tipo: "success", texto: mensagemSucesso })
      if (showSuccess) {
        showSuccess(mensagemSucesso)
      }

      setCpfParaVincular("")
    } catch (error) {
      console.error(error)
      const mensagemErro = error?.message || "Não foi possível enviar a solicitação de vínculo."
      setMensagem({ tipo: "error", texto: mensagemErro })
      if (showError) {
        showError(mensagemErro)
      }
    } finally {
      setProcessandoVinculo(false)
    }
  }

  return (
    <div className="container">
      <main className="main">
        <BackButton />

        <div className="page-header">
          <h1>Atualizar Dados do Idoso</h1>
          <p>Gerencie as informações dos idosos vinculados ao cuidador.</p>
        </div>

        <section className="link-card">
          <div className="link-card-header">
            <h2>Vínculo com o cuidador</h2>
            <span className="link-counter">{linkedIdosos.length} idoso(s) vinculado(s)</span>
          </div>

          <div className="link-card-body">
            <div className="select-wrapper">
              <label htmlFor="idosoSelecionado">Idoso vinculado</label>
              <select
                id="idosoSelecionado"
                value={selectedCpf}
                onChange={handleSelectChange}
                disabled={carregandoLista || linkedIdosos.length === 0}
              >
                {linkedIdosos.length === 0 ? (
                  <option value="">Nenhum idoso vinculado</option>
                ) : (
                  linkedIdosos.map((idoso) => (
                    <option key={idoso.cpf} value={idoso.cpf}>
                      {idoso.nome || "Sem nome"} — CPF {idoso.cpf}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="link-actions">
              <button
                type="button"
                className="outline-button"
                onClick={() => carregarVinculos(selectedCpf)}
                disabled={carregandoLista}
              >
                {carregandoLista ? "Atualizando..." : "Recarregar"}
              </button>
              <button
                type="button"
                className="outline-button"
                onClick={handleNovoCadastro}
                disabled={carregandoLista}
              >
                Novo cadastro
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={handleDesvincular}
                disabled={processandoVinculo || !selectedCpf}
              >
                {processandoVinculo ? "Processando..." : "Desvincular"}
              </button>
            </div>
          </div>

          <form className="link-existing-form" onSubmit={handleVincularExistente}>
            <label htmlFor="cpfVincular">Vincular idoso existente pelo CPF</label>
            <div className="link-existing-row">
              <input
                id="cpfVincular"
                type="text"
                name="cpfVincular"
                value={cpfParaVincular}
                onChange={(event) => setCpfParaVincular(event.target.value)}
                placeholder="Digite o CPF do idoso"
                maxLength={18}
              />
              <button type="submit" disabled={processandoVinculo}>
                {processandoVinculo ? "Enviando..." : "Enviar solicitação"}
              </button>
            </div>
          </form>
        </section>

        <section className="update-form">
          {mensagem ? (
            <div className={`mensagem ${mensagem.tipo}`} role="status">
              {mensagem.texto}
            </div>
          ) : null}

          <form className="idoso-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <h2>Dados pessoais</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="cpf">CPF</label>
                  <input
                    id="cpf"
                    type="text"
                    name="cpf"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={handleChange}
                    maxLength={18}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="rg">RG</label>
                  <input
                    id="rg"
                    type="text"
                    name="rg"
                    value={formData.rg}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="nome">Nome</label>
                  <input
                    id="nome"
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="telefone">Telefone</label>
                  <input
                    id="telefone"
                    type="text"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="dataNascimento">Data de Nascimento</label>
                  <input
                    id="dataNascimento"
                    type="date"
                    name="dataNascimento"
                    value={formData.dataNascimento}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="idade">Idade</label>
                  <input
                    id="idade"
                    type="number"
                    name="idade"
                    min="0"
                    max="130"
                    value={formData.idade}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="genero">Gênero</label>
                  <select id="genero" name="genero" value={formData.genero} onChange={handleChange}>
                    <option value="">Selecione</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Não-binário">Não-binário</option>
                    <option value="Prefere não informar">Prefere não informar</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="estadoCivil">Estado civil</label>
                  <select id="estadoCivil" name="estadoCivil" value={formData.estadoCivil} onChange={handleChange}>
                    <option value="">Selecione</option>
                    <option value="Solteiro(a)">Solteiro(a)</option>
                    <option value="Casado(a)">Casado(a)</option>
                    <option value="Divorciado(a)">Divorciado(a)</option>
                    <option value="Viúvo(a)">Viúvo(a)</option>
                    <option value="União estável">União estável</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2>Saúde e emergência</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="peso">Peso (kg)</label>
                  <input
                    id="peso"
                    type="number"
                    step="0.01"
                    name="peso"
                    value={formData.peso}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="altura">Altura (cm)</label>
                  <input
                    id="altura"
                    type="number"
                    step="1"
                    name="altura"
                    value={formData.altura}
                    onChange={handleChange}
                  />
                  <div className="field-hint imc-hint" aria-live="polite">
                    IMC: {formData.imc || "—"}
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="tipoSanguineo">Tipo sanguíneo</label>
                  <select
                    id="tipoSanguineo"
                    name="tipoSanguineo"
                    value={formData.tipoSanguineo}
                    onChange={handleChange}
                  >
                    <option value="">Selecione</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="nomeContatoEmergencia">Contato de emergência</label>
                  <input
                    id="nomeContatoEmergencia"
                    type="text"
                    name="nomeContatoEmergencia"
                    placeholder="Quem deve ser avisado em emergências"
                    value={formData.nomeContatoEmergencia}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contatoEmergencia">Telefone do contato</label>
                  <input
                    id="contatoEmergencia"
                    type="text"
                    name="contatoEmergencia"
                    placeholder="Ex: (11) 99999-9999"
                    value={formData.contatoEmergencia}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="observacao">Observações</label>
                  <textarea
                    id="observacao"
                    name="observacao"
                    rows="3"
                    value={formData.observacao}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="alergias">Alergias</label>
                  <textarea
                    id="alergias"
                    name="alergias"
                    rows="3"
                    placeholder="Informe alergias separadas por vírgula"
                    value={formData.alergias}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2>Foto do idoso</h2>
              <div className="photo-field">
                <label className="photo-input" aria-label="Enviar foto do idoso">
                  {formData.fotoUrl ? (
                    <img src={formData.fotoUrl} alt="Pré-visualização do idoso" onError={handlePhotoRemoval} />
                  ) : (
                    <span className="photo-placeholder">Adicionar foto</span>
                  )}
                  <input
                    id="fotoIdoso"
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handlePhotoUpload}
                  />
                </label>

                <div className="photo-actions">
                  {formData.fotoUrl ? (
                    <button type="button" className="outline-button" onClick={handlePhotoRemoval}>
                      Remover foto
                    </button>
                  ) : null}
                  {photoFileName ? (
                    <span className="selected-photo-name" aria-live="polite">
                      Arquivo selecionado: {photoFileName}
                    </span>
                  ) : null}
                </div>

                <p className="helper-text">
                  Utilize arquivos PNG, JPG ou WEBP de até 2 MB. As imagens são otimizadas automaticamente para caber no prontuário.
                </p>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}

export default AtualizarDados
