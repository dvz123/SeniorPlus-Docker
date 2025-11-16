import { useState, useEffect, useRef } from "react"
import { useEvents } from "../contexts/EventsContext"
import { useMedication } from "../contexts/MedicationContext"
import { useUser } from "../contexts/UserContext"
import { useToast } from "../../../contexts/ToastContext"
import { useTheme } from "../../../contexts/ThemeContext"
import "../styles/Relatorios.css"
import BackButton from "../../../components/BackButton"

function Relatorios() {
  const { events } = useEvents()
  const { medications = [], medicationHistory = [] } = useMedication()
  const { user } = useUser()
  const { showSuccess, showError } = useToast()
  const { darkMode } = useTheme()
  // const [setReportType] = useState("events")
  const [chartType, setChartType] = useState("bar")
  const [eventChartType, setEventChartType] = useState("bar")
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  })
  const [activeTab, setActiveTab] = useState("eventos")
  const [isExporting, setIsExporting] = useState(false)

  // Chart references
  const categoryChartRef = useRef(null)
  const timelineChartRef = useRef(null)
  const medicationChartRef = useRef(null)
  const adherenceChartRef = useRef(null)

  // const handleReportTypeChange = (e) => {
  //   setReportType(e.target.value)
  // }

  const handleChartTypeChange = (e) => {
    if (activeTab !== "eventos") return
    const value = e.target.value
    setChartType(value)
    setEventChartType(value)
  }

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target
    setDateRange({
      ...dateRange,
      [name]: value,
    })
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === "eventos") {
      setChartType(eventChartType)
    } else {
      setChartType("pie")
    }
  }

  // Filter events by date range
  const filteredEvents = events
    ? events.filter((event) => {
        const eventDate = new Date(event.date)
        const startDate = new Date(dateRange.start)
        const endDate = new Date(dateRange.end)
        return eventDate >= startDate && eventDate <= endDate
      })
    : []

  // Group events by category
  const eventsByCategory = filteredEvents.reduce((acc, event) => {
    const category = event.category || "Outros"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(event)
    return acc
  }, {})

  // Calculate category statistics
  const categoryStats = Object.keys(eventsByCategory)
    .map((category) => ({
      category,
      count: eventsByCategory[category].length,
      percentage: Math.round((eventsByCategory[category].length / (filteredEvents.length || 1)) * 100) || 0,
    }))
    .sort((a, b) => b.count - a.count)

  // Group events by date
  const eventsByDate = filteredEvents.reduce((acc, event) => {
    const date = event.date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(event)
    return acc
  }, {})

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString("pt-BR", options)
  }

  // Format date for chart labels
  const formatDateShort = (dateString) => {
    const options = { day: "2-digit", month: "2-digit" }
    return new Date(dateString).toLocaleDateString("pt-BR", options)
  }

  // Get dates between start and end date
  const getDatesInRange = (startDate, endDate) => {
    const dates = []
    const currentDate = new Date(startDate)
    const end = new Date(endDate)

    while (currentDate <= end) {
      dates.push(new Date(currentDate).toISOString().split("T")[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return dates
  }

  // Get event counts by date
  const getEventCountsByDate = () => {
    const dates = getDatesInRange(dateRange.start, dateRange.end)
    return dates.map((date) => {
      return {
        date,
        count: eventsByDate[date]?.length || 0,
      }
    })
  }

  // Calculate medication adherence
  const calculateMedicationAdherence = () => {
    if (!medicationHistory || medicationHistory.length === 0) return []

    const medications = {}

    medicationHistory.forEach((history) => {
      if (!history) return

      const historyDate = new Date(history.date)
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)

      if (historyDate >= startDate && historyDate <= endDate) {
        if (!medications[history.medicationId]) {
          medications[history.medicationId] = {
            name: history.medicationName || `Medicamento ${history.medicationId}`,
            taken: 0,
            missed: 0,
          }
        }

        if (history.taken) {
          medications[history.medicationId].taken += 1
        } else {
          medications[history.medicationId].missed += 1
        }
      }
    })

    return Object.values(medications)
  }

  // Export data to CSV
  const exportToCSV = () => {
    setIsExporting(true)

    try {
      let csvContent = ""
      let filename = ""

      if (activeTab === "eventos") {
        // Header
        csvContent = "Data,Título,Categoria,Horário Início,Horário Fim,Local\n"

        // Data
        filteredEvents.forEach((event) => {
          csvContent += `${event.date},${event.title},${event.category},${event.startTime},${event.endTime},${event.location || ""}\n`
        })

        filename = `eventos_${user?.name || "idoso"}_${new Date().toISOString().split("T")[0]}.csv`
      } else {
        // Header
        csvContent = "Medicamento,Doses Tomadas,Doses Perdidas,Taxa de Adesão\n"

        // Data
        const adherenceData = calculateMedicationAdherence()
        adherenceData.forEach((med) => {
          const total = med.taken + med.missed
          const adherenceRate = total > 0 ? Math.round((med.taken / total) * 100) : 0
          csvContent += `${med.name},${med.taken},${med.missed},${adherenceRate}%\n`
        })

        filename = `medicamentos_${user?.name || "idoso"}_${new Date().toISOString().split("T")[0]}.csv`
      }

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      showSuccess("Relatório exportado com sucesso!")
    } catch (error) {
      console.error("Erro ao exportar dados:", error)
      showError("Erro ao exportar relatório. Tente novamente.")
    } finally {
      setIsExporting(false)
    }
  }

  // Render chart using canvas and JavaScript
  useEffect(() => {
    if (activeTab === "eventos") {
      renderEventCharts()
      
    } else if (activeTab === "medicamentos") {
      renderMedicationCharts()
    }// eslint-disable-next-line
  }, [activeTab, chartType, categoryStats, dateRange, medicationHistory, darkMode])

  const prepareCanvas = (canvas) => {
    if (!canvas) return null
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const width = Math.max(1, Math.round(rect.width))
    const height = Math.max(1, Math.round(rect.height))

    if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
      canvas.width = width * ratio
      canvas.height = height * ratio
    }

    const ctx = canvas.getContext("2d")
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.imageSmoothingQuality = "high"
    return { ctx, width, height }
  }

  // Render event charts
  const renderEventCharts = () => {
    const categorySurface = prepareCanvas(categoryChartRef.current)
    const timelineSurface = prepareCanvas(timelineChartRef.current)
    if (!categorySurface || !timelineSurface) return

    const { ctx: categoryCtx, width: categoryWidth, height: categoryHeight } = categorySurface
    const { ctx: timelineCtx, width: timelineWidth, height: timelineHeight } = timelineSurface

    categoryCtx.clearRect(0, 0, categoryWidth, categoryHeight)
    timelineCtx.clearRect(0, 0, timelineWidth, timelineHeight)

    if (chartType === "bar") {
      renderCategoryBarChart(categorySurface)
    } else {
      renderCategoryPieChart(categorySurface)
    }

    renderTimelineChart(timelineSurface)
  }

  // Render medication charts
  const renderMedicationCharts = () => {
    const medicationSurface = prepareCanvas(medicationChartRef.current)
    const adherenceSurface = prepareCanvas(adherenceChartRef.current)
    if (!medicationSurface || !adherenceSurface) return

    const { ctx: medicationCtx, width: medicationWidth, height: medicationHeight } = medicationSurface
    const { ctx: adherenceCtx, width: adherenceWidth, height: adherenceHeight } = adherenceSurface

    medicationCtx.clearRect(0, 0, medicationWidth, medicationHeight)
    adherenceCtx.clearRect(0, 0, adherenceWidth, adherenceHeight)

    renderMedicationPieChart(medicationSurface)
    renderAdherenceChart(adherenceSurface)
  }

  // Render category bar chart
  const renderCategoryBarChart = ({ ctx, width: chartWidth, height: chartHeight }) => {
    if (categoryStats.length === 0) {
      ctx.font = "16px 'Inter', Arial, sans-serif"
      ctx.fillStyle = getTextColor()
      ctx.textAlign = "center"
      ctx.fillText("Sem dados para exibir", chartWidth / 2, chartHeight / 2)
      return
    }

    const theme = getChartTheme()
    const categoryLabels = categoryStats.map((stat) => stat.category)
    const categoryData = categoryStats.map((stat) => stat.count)
    const categoryColors = getCategoryColors(categoryLabels)

    const topMargin = 56
    const bottomMargin = 68
    const leftMargin = 64
    const rightMargin = 32
    const usableHeight = chartHeight - topMargin - bottomMargin
    const usableWidth = chartWidth - leftMargin - rightMargin
    const maxValue = Math.max(...categoryData, 1)
    const unitHeight = usableHeight / maxValue
    const barGap = Math.max(12, Math.min(24, usableWidth / Math.max(categoryLabels.length * 3, 1)))
    const barWidth = Math.max(18, (usableWidth - (categoryLabels.length - 1) * barGap) / categoryLabels.length)
    const gridStep = Math.max(1, Math.ceil(maxValue / 4))

    ctx.clearRect(0, 0, chartWidth, chartHeight)

    ctx.font = "600 18px 'Inter', Arial, sans-serif"
    ctx.fillStyle = theme.text
    ctx.textAlign = "center"
    ctx.fillText("Eventos por Categoria", chartWidth / 2, topMargin - 24)

    ctx.save()
    ctx.strokeStyle = theme.grid
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    for (let gridValue = 0; gridValue <= maxValue; gridValue += gridStep) {
      const y = chartHeight - bottomMargin - gridValue * unitHeight
      ctx.moveTo(leftMargin, y)
      ctx.lineTo(chartWidth - rightMargin, y)
    }
    ctx.stroke()
    ctx.restore()

    ctx.beginPath()
    ctx.strokeStyle = theme.axis
    ctx.lineWidth = 1.5
    ctx.moveTo(leftMargin, topMargin - 10)
    ctx.lineTo(leftMargin, chartHeight - bottomMargin)
    ctx.lineTo(chartWidth - rightMargin + 6, chartHeight - bottomMargin)
    ctx.stroke()

    categoryLabels.forEach((label, index) => {
      const value = categoryData[index]
      const barHeight = value * unitHeight
      const x = leftMargin + index * (barWidth + barGap)
      const y = chartHeight - bottomMargin - barHeight

      ctx.fillStyle = categoryColors[index]
      ctx.fillRect(x, y, barWidth, barHeight)

      const displayLabel = label.length > 14 ? `${label.slice(0, 12)}…` : label
      ctx.fillStyle = theme.text
      ctx.font = "500 12px 'Inter', Arial, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "alphabetic"
      if (categoryLabels.length > 6) {
        ctx.save()
        ctx.translate(x + barWidth / 2, chartHeight - bottomMargin + 40)
        ctx.rotate((-28 * Math.PI) / 180)
        ctx.fillText(displayLabel, 0, 0)
        ctx.restore()
      } else {
        ctx.fillText(displayLabel, x + barWidth / 2, chartHeight - bottomMargin + 36)
      }

      const valueText = String(value)
      ctx.font = "600 12px 'Inter', Arial, sans-serif"
      const textMetrics = ctx.measureText(valueText)
      const tagWidth = textMetrics.width + 12
      const tagHeight = 20
      const tagInside = barHeight > tagHeight + 16
      let tagX = x + barWidth / 2 - tagWidth / 2
      tagX = Math.max(tagX, leftMargin)
      tagX = Math.min(tagX, chartWidth - rightMargin - tagWidth)
      let tagY = tagInside ? y + 8 : y - tagHeight - 8
      if (tagY < topMargin) tagY = topMargin + 4

      ctx.fillStyle = theme.valueBackground
      ctx.fillRect(tagX, tagY, tagWidth, tagHeight)

      ctx.fillStyle = theme.valueText
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(valueText, tagX + tagWidth / 2, tagY + tagHeight / 2)
    })
  }

  // Render category pie chart
  const renderCategoryPieChart = ({ ctx, width: chartWidth, height: chartHeight }) => {
    if (categoryStats.length === 0) {
      // No data to display
      ctx.font = "16px Arial"
      ctx.fillStyle = getTextColor()
      ctx.textAlign = "center"
      ctx.fillText("Sem dados para exibir", chartWidth / 2, chartHeight / 2)
      return
    }

    const categoryLabels = categoryStats.map((stat) => stat.category)
    const categoryData = categoryStats.map((stat) => stat.count)
    const categoryColors = getCategoryColors(categoryLabels)
    const radius = Math.min(chartWidth, chartHeight) / 2 - 40
    const centerX = chartWidth / 2
    const centerY = chartHeight / 2

    // Draw title
    ctx.font = "16px Arial"
    ctx.fillStyle = getTextColor()
    ctx.textAlign = "center"
    ctx.fillText("Distribuição por Categoria", centerX, 20)

    // Calculate total
    const total = categoryData.reduce((sum, value) => sum + value, 0)

    // Draw pie slices
    let startAngle = 0
    categoryData.forEach((value, index) => {
      const sliceAngle = (2 * Math.PI * value) / total

      // Draw slice
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
      ctx.closePath()
      ctx.fillStyle = categoryColors[index]
      ctx.fill()

      // Draw label line and text
      const midAngle = startAngle + sliceAngle / 2
      const labelRadius = radius * 1.2
      const labelX = centerX + Math.cos(midAngle) * labelRadius
      const labelY = centerY + Math.sin(midAngle) * labelRadius

      ctx.beginPath()
      ctx.moveTo(centerX + Math.cos(midAngle) * radius, centerY + Math.sin(midAngle) * radius)
      ctx.lineTo(labelX, labelY)
      ctx.strokeStyle = getTextColor()
      ctx.stroke()

      // Draw label
      ctx.font = "12px Arial"
      ctx.fillStyle = getTextColor()
      ctx.textAlign = midAngle < Math.PI ? "left" : "right"
      ctx.fillText(`${categoryLabels[index]} (${Math.round((value / total) * 100)}%)`, labelX, labelY)

      startAngle += sliceAngle
    })
  }

  // Render timeline chart
  const renderTimelineChart = ({ ctx, width: chartWidth, height: chartHeight }) => {
    const eventCounts = getEventCountsByDate()

    if (eventCounts.every((item) => item.count === 0)) {
      ctx.font = "16px 'Inter', Arial, sans-serif"
      ctx.fillStyle = getTextColor()
      ctx.textAlign = "center"
      ctx.fillText("Sem dados para exibir", chartWidth / 2, chartHeight / 2)
      return
    }

    const timelineLabels = eventCounts.map((item) => formatDateShort(item.date))
    const timelineData = eventCounts.map((item) => item.count)
    const theme = getChartTheme()
    const topMargin = 56
    const bottomMargin = 60
    const leftMargin = 64
    const rightMargin = 32
    const plotWidth = chartWidth - leftMargin - rightMargin
    const plotHeight = chartHeight - topMargin - bottomMargin
    const maxValue = Math.max(...timelineData, 1)
    const n = timelineLabels.length
    const pointSpacing = n > 1 ? plotWidth / (n - 1) : 0
    const heightRatio = plotHeight / maxValue
    const step = Math.max(1, Math.ceil(maxValue / 5))

    ctx.clearRect(0, 0, chartWidth, chartHeight)

    ctx.font = "600 18px 'Inter', Arial, sans-serif"
    ctx.fillStyle = theme.text
    ctx.textAlign = "center"
    ctx.fillText("Eventos por Dia", chartWidth / 2, topMargin - 24)

    const rangeLabel = `${formatDateShort(dateRange.start)} - ${formatDateShort(dateRange.end)}`
    ctx.font = "500 12px 'Inter', Arial, sans-serif"
    ctx.fillStyle = theme.detail
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"
    ctx.fillText(rangeLabel, chartWidth - rightMargin, topMargin - 24)

    ctx.save()
    ctx.strokeStyle = theme.grid
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    for (let value = 0; value <= maxValue; value += step) {
      const y = chartHeight - bottomMargin - value * heightRatio
      ctx.moveTo(leftMargin, y)
      ctx.lineTo(chartWidth - rightMargin, y)
    }
    ctx.stroke()
    ctx.restore()

    ctx.beginPath()
    ctx.strokeStyle = theme.axis
    ctx.lineWidth = 1.5
    ctx.moveTo(leftMargin, topMargin - 10)
    ctx.lineTo(leftMargin, chartHeight - bottomMargin)
    ctx.lineTo(chartWidth - rightMargin + 6, chartHeight - bottomMargin)
    ctx.stroke()

    const coordinates = timelineData.map((value, index) => {
      const x = leftMargin + index * pointSpacing
      const y = chartHeight - bottomMargin - value * heightRatio
      return { x, y, value, label: timelineLabels[index], index }
    })

    if (coordinates.length > 0) {
      const gradient = ctx.createLinearGradient(0, topMargin, 0, chartHeight - bottomMargin)
      gradient.addColorStop(0, theme.accentFill)
      gradient.addColorStop(1, "rgba(10,161,116,0)")

      ctx.beginPath()
      ctx.moveTo(leftMargin, chartHeight - bottomMargin)
      coordinates.forEach(({ x, y }, idx) => {
        if (idx === 0) {
          ctx.lineTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      const lastX = coordinates[coordinates.length - 1]?.x ?? leftMargin
      ctx.lineTo(lastX, chartHeight - bottomMargin)
      ctx.closePath()
      ctx.fillStyle = gradient
      ctx.fill()
    }

    ctx.beginPath()
    ctx.strokeStyle = theme.accentLine
    ctx.lineWidth = 2.5
    coordinates.forEach(({ x, y }, idx) => {
      if (idx === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    coordinates.forEach(({ x, y, value, index, label }) => {
      ctx.beginPath()
      ctx.fillStyle = theme.accent
      ctx.arc(x, y, 4.5, 0, 2 * Math.PI)
      ctx.fill()
      ctx.lineWidth = 1.5
      ctx.strokeStyle = theme.markerBorder
      ctx.stroke()

      if (value > 0) {
        const tag = String(value)
        ctx.font = "600 12px 'Inter', Arial, sans-serif"
        ctx.textAlign = "center"
        const tentativeY = y - 12
        const textWidth = ctx.measureText(tag).width + 12
        const textHeight = 18
        const tagTop = tentativeY < topMargin ? y + 12 : tentativeY - textHeight
        ctx.fillStyle = theme.valueBackground
        ctx.fillRect(x - textWidth / 2, tagTop, textWidth, textHeight)
        ctx.fillStyle = theme.valueText
        ctx.textBaseline = "middle"
        ctx.fillText(tag, x, tagTop + textHeight / 2)
      }

      const shouldDrawLabel =
        index % Math.max(1, Math.ceil(coordinates.length / 8)) === 0 || index === coordinates.length - 1
      if (shouldDrawLabel) {
        ctx.fillStyle = theme.text
        ctx.font = "500 11px 'Inter', Arial, sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "alphabetic"
        ctx.fillText(label, x, chartHeight - bottomMargin + 32)
      }
    })
  }

  // Render medication pie chart
  const renderMedicationPieChart = ({ ctx, width: chartWidth, height: chartHeight }) => {
    const medicationUsage = {}

    if (!medicationHistory || medicationHistory.length === 0) {
      // No data to display
      ctx.font = "16px Arial"
      ctx.fillStyle = getTextColor()
      ctx.textAlign = "center"
      ctx.fillText("Sem dados de medicamentos para exibir", chartWidth / 2, chartHeight / 2)
      return
    }

    medicationHistory.forEach((history) => {
      if (!history) return

      const historyDate = new Date(history.date)
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)

      if (historyDate >= startDate && historyDate <= endDate && history.taken) {
        const medName = history.medicationName || `Medicamento ${history.medicationId}`
        if (!medicationUsage[medName]) {
          medicationUsage[medName] = 0
        }
        medicationUsage[medName] += 1
      }
    })

    const medicationLabels = Object.keys(medicationUsage)

    if (medicationLabels.length === 0) {
      // No data to display
      ctx.font = "16px Arial"
      ctx.fillStyle = getTextColor()
      ctx.textAlign = "center"
  ctx.fillText("Sem dados de medicamentos para exibir", chartWidth / 2, chartHeight / 2)
      return
    }

    const medicationData = Object.values(medicationUsage)
    const medicationColors = getMedicationColors(medicationLabels)

    const radius = Math.min(chartWidth, chartHeight) / 2 - 40
    const centerX = chartWidth / 2
    const centerY = chartHeight / 2

    // Draw title
    ctx.font = "16px Arial"
    ctx.fillStyle = getTextColor()
    ctx.textAlign = "center"
    ctx.fillText("Distribuição de Medicamentos", centerX, 20)

    // Calculate total
    const total = medicationData.reduce((sum, value) => sum + value, 0)

    // Draw pie slices
    let startAngle = 0
    medicationData.forEach((value, index) => {
      const sliceAngle = (2 * Math.PI * value) / total

      // Draw slice
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
      ctx.closePath()
      ctx.fillStyle = medicationColors[index]
      ctx.fill()

      // Draw label line and text
      const midAngle = startAngle + sliceAngle / 2
      const labelRadius = radius * 1.2
      const labelX = centerX + Math.cos(midAngle) * labelRadius
      const labelY = centerY + Math.sin(midAngle) * labelRadius

      ctx.beginPath()
      ctx.moveTo(centerX + Math.cos(midAngle) * radius, centerY + Math.sin(midAngle) * radius)
      ctx.lineTo(labelX, labelY)
      ctx.strokeStyle = getTextColor()
      ctx.stroke()

      // Draw label
      ctx.font = "12px Arial"
      ctx.fillStyle = getTextColor()
      ctx.textAlign = midAngle < Math.PI ? "left" : "right"
      const truncatedLabel =
        medicationLabels[index].length > 10 ? medicationLabels[index].substring(0, 8) + "..." : medicationLabels[index]
      ctx.fillText(`${truncatedLabel} (${Math.round((value / total) * 100)}%)`, labelX, labelY)

      startAngle += sliceAngle
    })
  }

  // Render adherence chart
  const renderAdherenceChart = ({ ctx, width: chartWidth, height: chartHeight }) => {
    const adherenceData = calculateMedicationAdherence()

    // Draw title
    ctx.font = "16px Arial"
    ctx.fillStyle = getTextColor()
    ctx.textAlign = "center"
    ctx.fillText("Adesão aos Medicamentos", chartWidth / 2, 20)

    if (!adherenceData || adherenceData.length === 0) {
      ctx.font = "14px Arial"
      ctx.fillStyle = getTextColor()
      ctx.textAlign = "center"
      ctx.fillText("Sem dados de adesão para o período selecionado", chartWidth / 2, chartHeight / 2)
      return
    }

    const barHeight = 30
    const barSpacing = 15
    const startY = 50
    const maxLabelWidth = 100
    const barStartX = maxLabelWidth + 20
    const barMaxWidth = chartWidth - barStartX - 50

    adherenceData.forEach((med, index) => {
      const y = startY + index * (barHeight + barSpacing)
      const total = med.taken + med.missed
      const adherenceRate = total > 0 ? med.taken / total : 0

      // Draw medication name
      ctx.font = "12px Arial"
      ctx.fillStyle = getTextColor()
      ctx.textAlign = "right"
      const truncatedName = med.name.length > 15 ? med.name.substring(0, 12) + "..." : med.name
      ctx.fillText(truncatedName, barStartX - 10, y + barHeight / 2 + 4)

      // Draw background bar
      ctx.fillStyle = "#e5e7eb"
      ctx.fillRect(barStartX, y, barMaxWidth, barHeight)

      // Draw adherence bar
      const adherenceWidth = barMaxWidth * adherenceRate
      ctx.fillStyle = getAdherenceColor(adherenceRate)
      ctx.fillRect(barStartX, y, adherenceWidth, barHeight)

      // Draw adherence percentage
      ctx.font = "12px Arial"
      ctx.fillStyle = "#ffffff"
      ctx.textAlign = "center"
      if (adherenceWidth > 40) {
        ctx.fillText(`${Math.round(adherenceRate * 100)}%`, barStartX + adherenceWidth / 2, y + barHeight / 2 + 4)
      } else {
        ctx.fillStyle = getTextColor()
        ctx.textAlign = "left"
        ctx.fillText(`${Math.round(adherenceRate * 100)}%`, barStartX + adherenceWidth + 5, y + barHeight / 2 + 4)
      }

      // Draw taken/missed counts
      ctx.font = "12px Arial"
      ctx.fillStyle = getTextColor()
      ctx.textAlign = "left"
      ctx.fillText(`${med.taken}/${total}`, barStartX + barMaxWidth + 10, y + barHeight / 2 + 4)
    })
  }

  // Helper functions for charts
  const isDarkModeActive = () =>
    document.documentElement.classList.contains("dark-mode") || document.body.classList.contains("dark-mode")

  const getChartTheme = () => {
    const dark = isDarkModeActive()
    const accentBase = "#0aa174"
    return {
      text: dark ? "#e2e8f0" : "#1f2937",
      axis: dark ? "rgba(148, 163, 184, 0.45)" : "rgba(71, 85, 105, 0.45)",
      grid: dark ? "rgba(148, 163, 184, 0.18)" : "rgba(148, 163, 184, 0.25)",
      valueBackground: dark ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.85)",
      valueText: dark ? "#f8fafc" : "#0f172a",
      accent: accentBase,
      accentLine: dark ? "#34d399" : accentBase,
      accentFill: dark ? "rgba(52, 211, 153, 0.25)" : "rgba(10, 161, 116, 0.18)",
      detail: dark ? "#94a3b8" : "#475569",
      markerBorder: dark ? "#0f172a" : "#ffffff",
    }
  }

  const getCategoryColors = (categories) => {
    const colorMap = {
      atividade: "#0aa174",
      consulta: "#3b82f6",
      social: "#8b5cf6",
      medicação: "#ef4444",
      outros: "#64748b",
    }

    return categories.map((category) => colorMap[category.toLowerCase()] || "#64748b")
  }

  const getMedicationColors = (medications) => {
    const colors = [
      "#0aa174",
      "#3b82f6",
      "#8b5cf6",
      "#ef4444",
      "#f59e0b",
      "#10b981",
      "#6366f1",
      "#ec4899",
      "#14b8a6",
      "#f43f5e",
    ]

    return medications.map((_, index) => colors[index % colors.length])
  }

  const getAdherenceColor = (rate) => {
    if (rate >= 0.8) return "#0aa174"
    if (rate >= 0.5) return "#f59e0b"
    return "#ef4444"
  }

  const getTextColor = () => getChartTheme().text

  // Safely get counts for medication history
  const getTakenCount = () => {
    if (!medicationHistory) return 0
    return medicationHistory.filter(
      (h) =>
        h && new Date(h.date) >= new Date(dateRange.start) && new Date(h.date) <= new Date(dateRange.end) && h.taken,
    ).length
  }

  const getMissedCount = () => {
    if (!medicationHistory) return 0
    return medicationHistory.filter(
      (h) =>
        h && new Date(h.date) >= new Date(dateRange.start) && new Date(h.date) <= new Date(dateRange.end) && !h.taken,
    ).length
  }

  return (
    <div className="container">
      <main className="main">
        <BackButton />

        <div className="page-header">
          <h1>Relatórios do Idoso</h1>
          <p>Visualize e analise os dados de atividades, eventos e medicamentos do idoso sob seus cuidados.</p>
          {user && (
            <div className="patient-info">
              <span className="patient-name">Paciente: {user.name}</span>
              <span className="patient-age">Idade: {user.age} anos</span>
            </div>
          )}
        </div>

        <div className="report-tabs">
          <button
            className={`tab-button ${activeTab === "eventos" ? "active" : ""}`}
            onClick={() => handleTabChange("eventos")}
          >
            Eventos e Atividades
          </button>
          <button
            className={`tab-button ${activeTab === "medicamentos" ? "active" : ""}`}
            onClick={() => handleTabChange("medicamentos")}
          >
            Medicamentos
          </button>
        </div>

        <div className="report-controls">
          <div className="report-filters">
            <div className="filter-group">
              <label htmlFor="dateStart">De:</label>
              <input type="date" id="dateStart" name="start" value={dateRange.start} onChange={handleDateRangeChange} />
            </div>
            <div className="filter-group">
              <label htmlFor="dateEnd">Até:</label>
              <input type="date" id="dateEnd" name="end" value={dateRange.end} onChange={handleDateRangeChange} />
            </div>
            {activeTab === "eventos" && (
              <div className="filter-group">
                <label htmlFor="chartType">Tipo de Gráfico:</label>
                <select id="chartType" value={chartType} onChange={handleChartTypeChange}>
                  <option value="bar">Barras</option>
                  <option value="pie">Pizza/Donut</option>
                </select>
              </div>
            )}
            <button className="export-button" onClick={exportToCSV} disabled={isExporting}>
              {isExporting ? "Exportando..." : "Exportar CSV"}
            </button>
          </div>
        </div>

        {activeTab === "eventos" && (
          <>
            <div className="report-summary">
              <div className="summary-card">
                <div className="summary-value">{filteredEvents.length}</div>
                <div className="summary-label">Total de Eventos</div>
              </div>
              <div className="summary-card">
                <div className="summary-value">{Object.keys(eventsByDate).length}</div>
                <div className="summary-label">Dias com Atividades</div>
              </div>
              <div className="summary-card">
                <div className="summary-value">{Object.keys(eventsByCategory).length}</div>
                <div className="summary-label">Categorias</div>
              </div>
            </div>

            <div className="charts-container">
              <div className="chart-card">
                <h2>Distribuição por Categoria</h2>
                <div className="chart-container">
                  <canvas ref={categoryChartRef} width="400" height="300"></canvas>
                </div>
                <div className="chart-legend">
                  {categoryStats.map((stat, idx) => {
                    const color = getCategoryColors([stat.category])[0]
                    return (
                      <div key={stat.category + idx} className="chart-legend-item">
                        <span className="chart-legend-swatch" style={{ backgroundColor: color }}></span>
                        <span>{stat.category}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="chart-card">
                <h2>Linha do Tempo de Eventos</h2>
                <div className="chart-container">
                  <canvas ref={timelineChartRef} width="400" height="300"></canvas>
                </div>
              </div>
            </div>

            <div className="report-content">
              <h2>Eventos por Data</h2>

              {Object.keys(eventsByDate).length === 0 ? (
                <div className="no-data">
                  <p>Nenhum evento encontrado para o período selecionado.</p>
                </div>
              ) : (
                <div className="date-events">
                  {Object.keys(eventsByDate)
                    .sort((a, b) => new Date(b) - new Date(a))
                    .map((date) => (
                      <div key={date} className="date-section">
                        <h3>{formatDate(date)}</h3>
                        <div className="date-events-list">
                          {eventsByDate[date]
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map((event) => (
                              <div key={event.id} className="event-card-small">
                                <div
                                  className={`event-category-small ${(event.category || "outros").toLowerCase()}`}
                                ></div>
                                <div className="event-details-small">
                                  <h4>{event.title}</h4>
                                  <p className="event-time-small">
                                    {event.startTime} - {event.endTime}
                                  </p>
                                  {event.location && <p className="event-location-small">{event.location}</p>}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "medicamentos" && (
          <>
            <div className="report-summary">
              <div className="summary-card">
                <div className="summary-value">{medications ? medications.length : 0}</div>
                <div className="summary-label">Total de Medicamentos</div>
              </div>
              <div className="summary-card">
                <div className="summary-value">{getTakenCount()}</div>
                <div className="summary-label">Doses Tomadas</div>
              </div>
              <div className="summary-card">
                <div className="summary-value">{getMissedCount()}</div>
                <div className="summary-label">Doses Perdidas</div>
              </div>
            </div>

            <div className="charts-container">
              <div className="chart-card">
                <h2>Uso de Medicamentos</h2>
                <div className="chart-container">
                  <canvas ref={medicationChartRef} width="400" height="300"></canvas>
                </div>
              </div>

              <div className="chart-card">
                <h2>Adesão aos Medicamentos</h2>
                <div className="chart-container">
                  <canvas ref={adherenceChartRef} width="400" height="300"></canvas>
                </div>
              </div>
            </div>

            <div className="report-content">
              <h2>Detalhes de Adesão aos Medicamentos</h2>

              {calculateMedicationAdherence().length === 0 ? (
                <div className="no-data">
                  <p>Nenhum registro de medicamento encontrado para o período selecionado.</p>
                </div>
              ) : (
                <div className="medication-adherence-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Medicamento</th>
                        <th>Doses Tomadas</th>
                        <th>Doses Perdidas</th>
                        <th>Taxa de Adesão</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculateMedicationAdherence().map((med, index) => {
                        const total = med.taken + med.missed
                        const adherenceRate = total > 0 ? Math.round((med.taken / total) * 100) : 0
                        return (
                          <tr key={index}>
                            <td>{med.name}</td>
                            <td>{med.taken}</td>
                            <td>{med.missed}</td>
                            <td>
                              <div className="adherence-bar-container">
                                <div
                                  className="adherence-bar"
                                  style={{
                                    width: `${adherenceRate}%`,
                                    backgroundColor:
                                      adherenceRate >= 80 ? "#0aa174" : adherenceRate >= 50 ? "#f59e0b" : "#ef4444",
                                  }}
                                ></div>
                                <span>{adherenceRate}%</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default Relatorios
