import { useCallback, useEffect, useState } from "react"
import "../styles/AtualizarDados.css"
import BackButton from "../../../components/BackButton"
import { api } from "../../../tela-auth/src/services/api"
import { useAuth } from "../../../tela-auth/src/contexts/AuthContext"
import { useToast } from "../../../contexts/ToastContext"

const emptyForm = {
  cpf: "",
  rg: "",
  nome: "",
  email: "",
  dataNascimento: "",
  telefone: "",
  peso: "",
  altura: "",
  tipoSanguineo: "",
  observacao: "",
  imc: "",
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
    peso: peso !== "" ? String(peso) : "",
    altura: alturaCm !== "" ? String(alturaCm) : "",
    tipoSanguineo: idoso?.tipoSanguineo || "",
    observacao: idoso?.observacao || "",
    imc: calcularImc(peso, alturaCm) || idoso?.imc || "",
  }
}

const normalizeCpf = (value) => (value || "").replace(/\D/g, "")

function AtualizarDados() {
  const { currentUser } = useAuth()
  const { showError, showSuccess } = useToast()

  const [formData, setFormData] = useState(emptyForm)
  const [linkedIdosos, setLinkedIdosos] = useState([])
  const [selectedCpf, setSelectedCpf] = useState("")
  const [mensagem, setMensagem] = useState(null)
  const [carregandoLista, setCarregandoLista] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [processandoVinculo, setProcessandoVinculo] = useState(false)
  const [cpfParaVincular, setCpfParaVincular] = useState("")

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
