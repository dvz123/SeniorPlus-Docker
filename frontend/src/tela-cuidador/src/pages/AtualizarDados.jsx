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
    const { name, value } = event.target

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

  const openPhotoPicker = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      if (showError) {
        showError("Formato de imagem inválido. Utilize PNG, JPG ou WEBP.")
      }
      event.target.value = ""
      setPhotoFileName("")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      showError?.("A imagem deve ter no máximo 2 MB.")
      event.target.value = ""
      setPhotoFileName("")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      setFormData((prev) => ({
        ...prev,
        fotoUrl: result,
      }))
      setPhotoFileName(file.name)
    }
    reader.onerror = () => {
      console.error(reader.error)
      showError?.("Não foi possível carregar a imagem selecionada.")
      setPhotoFileName("")
    }

    reader.readAsDataURL(file)
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

    setSalvando(true)

    try {
      if (jaVinculado) {
        await api.put(`/api/v1/idoso/${cpfNormalizado}`, payload)
        const mensagemSucesso = "Dados do idoso atualizados com sucesso!"
        setMensagem({ tipo: "success", texto: mensagemSucesso })
        if (showSuccess) {
          showSuccess(mensagemSucesso)
        }
      } else {
        await api.post("/api/v1/idoso", payload)
        const mensagemSucesso = "Idoso cadastrado e vinculado com sucesso!"
        setMensagem({ tipo: "success", texto: mensagemSucesso })
        if (showSuccess) {
          showSuccess(mensagemSucesso)
        }
      }

      if (updateElderlyData) {
        updateElderlyData(
          mapFormToElderlyData({
            ...formData,
            cpf: cpfNormalizado,
            fotoUrl: payload.fotoUrl || formData.fotoUrl,
          }),
        )
      }

      await carregarVinculos(cpfNormalizado)
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
                placeholder="Digite o CPF"
                value={cpfParaVincular}
                onChange={(e) => setCpfParaVincular(e.target.value)}
                maxLength={18}
                disabled={processandoVinculo}
              />
              <button type="submit" className="primary-button" disabled={processandoVinculo}>
                {processandoVinculo ? "Vinculando..." : "Vincular"}
              </button>
            </div>
            <p className="helper-text">Utilize esta opção quando o idoso já estiver cadastrado na plataforma.</p>
          </form>
        </section>

        {mensagem && <p className={`mensagem ${mensagem.tipo}`}>{mensagem.texto}</p>}

        <form className="update-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="cpf">CPF</label>
              <input
                id="cpf"
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                required
                maxLength={18}
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
            <div className="form-group">
              <label htmlFor="nomeContatoEmergencia">Nome do contato de emergência</label>
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
              <label htmlFor="contatoEmergencia">Telefone do contato de emergência</label>
              <input
                id="contatoEmergencia"
                type="text"
                name="contatoEmergencia"
                placeholder="Ex: (11) 99999-9999"
                value={formData.contatoEmergencia}
                onChange={handleChange}
              />
            </div>
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
              <label htmlFor="tipoSanguineo">Tipo Sanguíneo</label>
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
            <div className="form-group full-width">
              <label htmlFor="fotoIdoso">Foto do idoso</label>
              <div className="photo-input">
                {formData.fotoUrl ? (
                  <div className="photo-preview">
                    <img src={formData.fotoUrl} alt="Pré-visualização do idoso" onError={handlePhotoRemoval} />
                    <button type="button" className="outline-button" onClick={handlePhotoRemoval}>
                      Remover foto
                    </button>
                  </div>
                ) : null}

                <button
                  type="button"
                  className="outline-button photo-upload-trigger"
                  onClick={openPhotoPicker}
                >
                  {photoFileName ? "Trocar imagem" : "Selecionar imagem"}
                </button>
                {photoFileName && <span className="selected-photo-name">{photoFileName}</span>}
                <input
                  id="fotoIdoso"
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePhotoUpload}
                  className="photo-file-input"
                />
                <input
                  type="text"
                  name="fotoUrl"
                  placeholder="Ou informe uma URL pública"
                  value={formData.fotoUrl}
                  onChange={handleChange}
                />
                <p className="helper-text">Aceita imagens até 2 MB nos formatos PNG, JPG ou WEBP.</p>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-button" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default AtualizarDados
