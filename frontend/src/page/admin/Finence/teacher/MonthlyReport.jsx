import axios from "axios"
import { useCallback, useEffect, useMemo, useState } from "react"
import toast, { Toaster } from "react-hot-toast"
import { FaCalendarAlt, FaCheck, FaDownload, FaMoneyBillWave, FaQuestion, FaTimes, FaUserTie } from "react-icons/fa"
import { utils, writeFileXLSX } from "xlsx"

// Constants
const monthNames = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
]

const MonthlyReport = () => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const [data, setData] = useState([])
  const [activeTeacher, setActiveTeacher] = useState(null)
  const [avans, setTeacherAvans] = useState(0)
  const [paymentStatus, setPaymentStatus] = useState({})
  const [shareOfSalary, setShareOfSalary] = useState(0)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [isLoading, setIsLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalData, setModalData] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState("")

  // Memoized check for future months
  const isFutureMonth = useMemo(() => {
    return selectedYear > currentYear ||
      (selectedYear === currentYear && selectedMonth > currentMonth)
  }, [selectedYear, selectedMonth, currentYear, currentMonth])

  // Fetch teacher salary data
  useEffect(() => {
    if (isFutureMonth) {
      setData([])
      return
    }

    const fetchData = async () => {
      setIsLoading(true)
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/teacher/teacher-selery`, {
          params: { year: selectedYear, month: selectedMonth },
        })
        setData(res.data.data)
      } catch (err) {
        console.error("Xatolik:", err)
        toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [selectedYear, selectedMonth, isFutureMonth])

  useEffect(() => {
    const fetchAvans = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/avans/teacher-avans`, {
          params: {
            year: selectedYear,
            month: selectedMonth,
            teacherId: activeTeacher
          },
        })
        if (res.data.success) {
          setTeacherAvans(res.data.avans)
        }
      } catch (error) {
        toast.error("Avansni yuklashda xatolik yuz berdi")
      }
    }

    if (!activeTeacher || !selectedYear || selectedMonth === null || selectedMonth === undefined) return

    fetchAvans()
  }, [activeTeacher, selectedYear, selectedMonth])

  // To'lov holatini tekshirish funksiyasi
  const checkPayment = async (teacherId) => {
    try {
      if (!teacherId || selectedMonth == null || !selectedYear) return

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/teacher-payment/paymentcheck`, {
        params: {
          year: selectedYear,
          month: selectedMonth,
          teacherId: teacherId
        }
      })

      if (res.data.success) {
        setPaymentStatus(prev => ({
          ...prev,
          [teacherId]: res.data.tulov
        }))
      } else {
        setPaymentStatus(prev => ({
          ...prev,
          [teacherId]: false
        }))
      }
    } catch (error) {
      console.error("Check payment error:", error)
      toast.error("To'lov holatini tekshirishda xatolik yuz berdi")
    }
  }

  // To'lov holatini tekshirish
  useEffect(() => {
    if (activeTeacher) {
      checkPayment(activeTeacher)
    }
  }, [activeTeacher, selectedMonth, selectedYear])

  // Toggle teacher details
  const toggleTeacher = useCallback((teacher) => {
    setActiveTeacher(prev => {
      // Agar yangi o'qituvchi tanlansa, uning to'lov holatini tekshir
      if (prev !== teacher.teacherId) {
        checkPayment(teacher.teacherId)
      }
      return prev === teacher.teacherId ? null : teacher.teacherId
    })
    setShareOfSalary(teacher.share_of_salary)
  }, [])

  // Calculate salary calculation
  const calculateHisoblanma = useCallback((student, validDaysLength, shareValue) => {
    if (!student?.attendance || !Array.isArray(student.attendance) || validDaysLength <= 0) return 0

    const attendance = student.attendance

    const kelganCount = attendance.reduce((acc, a) => acc + (a.Status === "Kelgan" ? 1 : 0), 0)
    const kelmaganCount = attendance.reduce((acc, a) => acc + (a.Status === "Kelmagan" ? 1 : 0), 0)

    // ✅ QOIDA:
    // Kelmagan ≤ 2  → Kelgan + Kelmagan
    // Kelmagan > 2  → faqat Kelgan
    const tolanadiganDarslar = (kelmaganCount <= 2)
      ? (kelganCount + kelmaganCount)
      : kelganCount

    if (tolanadiganDarslar === 0) return 0

    const fullUlush = (student.price || 0) * (shareValue || 0)

    // himoya: to'lanadigan darslar umumiy valid kunlardan oshib ketmasin
    const payableDays = Math.min(tolanadiganDarslar, validDaysLength)

    const hisoblanma = (fullUlush / validDaysLength) * payableDays
    return Number(hisoblanma.toFixed(2))
  }, [])

  // Excel formatini yanada yaxshilash uchun funksiya - YANGILANGAN VERSIYA
  const applyExcelFormatting = (ws, rowIndex, colCount, groupData) => {
    // Asosiy sarlavha formatlari
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < colCount; c++) {
        const cellRef = utils.encode_cell({ r, c })
        if (!ws[cellRef]) ws[cellRef] = {}

        if (r === 0) {
          // Asosiy sarlavha - KO'K FON, OQ MATN
          ws[cellRef].s = {
            font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
            alignment: { horizontal: "center", vertical: "center" },
            fill: { fgColor: { rgb: "2C3E50" } } // To'q ko'k fon
          }
        } else if (r === 1) {
          // Bo'sh qator
          ws[cellRef].s = {
            fill: { fgColor: { rgb: "FFFFFF" } }
          }
        } else if (r === 2) {
          // Sana ma'lumoti
          ws[cellRef].s = {
            font: { bold: true, color: { rgb: "2C3E50" } },
            alignment: { horizontal: "center", vertical: "center" },
            fill: { fgColor: { rgb: "ECF0F1" } } // Och kulrang fon
          }
        }
      }
    }

    // Fan nomi
    const fanCellRef = utils.encode_cell({ r: 3, c: 0 })
    if (ws[fanCellRef]) {
      ws[fanCellRef].s = {
        font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "3498DB" } } // Ko'k fon
      }
    }

    // Jadval sarlavhalari va ma'lumotlari
    for (let r = 4; r < rowIndex; r++) {
      for (let c = 0; c < colCount; c++) {
        const cellRef = utils.encode_cell({ r, c })
        if (ws[cellRef]) {
          // Guruh nomlari - KO'K FON, OQ MATN
          if (ws[cellRef].v && typeof ws[cellRef].v === 'string' && ws[cellRef].v.startsWith('Guruh:')) {
            ws[cellRef].s = {
              font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
              alignment: { horizontal: "left" },
              fill: { fgColor: { rgb: "2980B9" } } // To'q ko'k fon
            }
          }

          // Jadval sarlavhalari - KO'K FON, OQ MATN, QALIN YOZUV
          else if (r === 5 && ws[cellRef].v) {
            ws[cellRef].s = {
              font: { bold: true, color: { rgb: "FFFFFF" } },
              alignment: {
                horizontal: "center",
                vertical: "center",
                wrapText: true // Matnni qatorga tushirish
              },
              fill: { fgColor: { rgb: "34495E" } }, // To'q ko'k fon
              border: {
                top: { style: "thin", color: { rgb: "2C3E50" } },
                bottom: { style: "thin", color: { rgb: "2C3E50" } },
                left: { style: "thin", color: { rgb: "2C3E50" } },
                right: { style: "thin", color: { rgb: "2C3E50" } }
              }
            }
          }

          // Raqamlar ustuni (№)
          else if (c === 0 && !isNaN(ws[cellRef].v)) {
            ws[cellRef].s = {
              alignment: { horizontal: "center" },
              font: { bold: true, color: { rgb: "2C3E50" } },
              fill: { fgColor: { rgb: "E8F5E8" } }, // Och yashil fon
              border: {
                top: { style: "thin", color: { rgb: "ECF0F1" } },
                bottom: { style: "thin", color: { rgb: "ECF0F1" } },
                left: { style: "thin", color: { rgb: "ECF0F1" } },
                right: { style: "thin", color: { rgb: "ECF0F1" } }
              }
            }
          }

          // Ism familiya ustuni - QALIN YOZUV, MATN QATORGA TUSHIRISH
          else if (c === 1 && ws[cellRef].v) {
            ws[cellRef].s = {
              font: { bold: true, color: { rgb: "2C3E50" } },
              alignment: {
                horizontal: "left",
                vertical: "center",
                wrapText: true // Matnni qatorga tushirish
              },
              border: {
                top: { style: "thin", color: { rgb: "ECF0F1" } },
                bottom: { style: "thin", color: { rgb: "ECF0F1" } },
                left: { style: "thin", color: { rgb: "ECF0F1" } },
                right: { style: "thin", color: { rgb: "ECF0F1" } }
              }
            }
          }

          // Pul miqdorlari (Oyligi, Ulushi)
          else if (c >= 2 && c <= 3 && !isNaN(ws[cellRef].v)) {
            ws[cellRef].s = {
              alignment: { horizontal: "right" },
              numFmt: '#,##0.00',
              font: { color: { rgb: "2C3E50" } },
              border: {
                top: { style: "thin", color: { rgb: "ECF0F1" } },
                bottom: { style: "thin", color: { rgb: "ECF0F1" } },
                left: { style: "thin", color: { rgb: "ECF0F1" } },
                right: { style: "thin", color: { rgb: "ECF0F1" } }
              }
            }
          }

          // Hisoblanma ustuni - YASHIL FON
          else if (c === colCount - 2 && !isNaN(ws[cellRef].v)) {
            ws[cellRef].s = {
              alignment: { horizontal: "right" },
              numFmt: '#,##0.00',
              font: { bold: true, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "27AE60" } }, // Yashil fon
              border: {
                top: { style: "thin", color: { rgb: "2C3E50" } },
                bottom: { style: "thin", color: { rgb: "2C3E50" } },
                left: { style: "thin", color: { rgb: "2C3E50" } },
                right: { style: "thin", color: { rgb: "2C3E50" } }
              }
            }
          }

          // Ushlanma ustuni - QIZIL FON
          else if (c === colCount - 1 && !isNaN(ws[cellRef].v)) {
            ws[cellRef].s = {
              alignment: { horizontal: "right" },
              numFmt: '#,##0.00',
              font: { bold: true, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "E74C3C" } }, // Qizil fon
              border: {
                top: { style: "thin", color: { rgb: "2C3E50" } },
                bottom: { style: "thin", color: { rgb: "2C3E50" } },
                left: { style: "thin", color: { rgb: "2C3E50" } },
                right: { style: "thin", color: { rgb: "2C3E50" } }
              }
            }
          }

          // Ishtirok etmagan kunlar (❌ belgisi) - QIZIL FON
          else if (c >= 4 && c <= colCount - 3 && ws[cellRef].v === "-") {
            ws[cellRef].s = {
              alignment: { horizontal: "center", vertical: "center" },
              font: { bold: true, sz: 12 },
              fill: { fgColor: { rgb: "FFCCCB" } }, // Och qizil fon
              border: {
                top: { style: "thin", color: { rgb: "ECF0F1" } },
                bottom: { style: "thin", color: { rgb: "ECF0F1" } },
                left: { style: "thin", color: { rgb: "ECF0F1" } },
                right: { style: "thin", color: { rgb: "ECF0F1" } }
              }
            }
          }

          // Kelgan kunlar (✅ belgisi) - YASHIL FON
          else if (c >= 4 && c <= colCount - 3 && ws[cellRef].v === "+") {
            ws[cellRef].s = {
              alignment: { horizontal: "center", vertical: "center" },
              font: { bold: true, sz: 12 },
              fill: { fgColor: { rgb: "D4EDDA" } }, // Och yashil fon
              border: {
                top: { style: "thin", color: { rgb: "ECF0F1" } },
                bottom: { style: "thin", color: { rgb: "ECF0F1" } },
                left: { style: "thin", color: { rgb: "ECF0F1" } },
                right: { style: "thin", color: { rgb: "ECF0F1" } }
              }
            }
          }

          // Ustoz kunlari (👨‍🏫 belgisi) - SARIQ FON
          else if (c >= 4 && c <= colCount - 3 && ws[cellRef].v === "k") {
            ws[cellRef].s = {
              alignment: { horizontal: "center", vertical: "center" },
              font: { bold: true, sz: 12 },
              fill: { fgColor: { rgb: "FFF3CD" } }, // Och sariq fon
              border: {
                top: { style: "thin", color: { rgb: "ECF0F1" } },
                bottom: { style: "thin", color: { rgb: "ECF0F1" } },
                left: { style: "thin", color: { rgb: "ECF0F1" } },
                right: { style: "thin", color: { rgb: "ECF0F1" } }
              }
            }
          }

          // Jami qator - JAMLANMA FORMATI
          else if (ws[cellRef].v === "JAMI:") {
            ws[cellRef].s = {
              font: { bold: true, color: { rgb: "FFFFFF" } },
              alignment: { horizontal: "right" },
              fill: { fgColor: { rgb: "7F8C8D" } }, // Kulrang fon
              border: {
                top: { style: "medium", color: { rgb: "2C3E50" } },
                bottom: { style: "medium", color: { rgb: "2C3E50" } }
              }
            }
          }

          // Oddiy hujayralar
          else if (ws[cellRef].v) {
            ws[cellRef].s = {
              alignment: {
                horizontal: "center",
                vertical: "center",
                wrapText: true // Matnni qatorga tushirish
              },
              border: {
                top: { style: "thin", color: { rgb: "ECF0F1" } },
                bottom: { style: "thin", color: { rgb: "ECF0F1" } },
                left: { style: "thin", color: { rgb: "ECF0F1" } },
                right: { style: "thin", color: { rgb: "ECF0F1" } }
              }
            }
          }
        }
      }
    }
  }

  // Export to Excel - YANGILANGAN CREATIVE DESIGN
  const exportToExcel = useCallback((teacher) => {
    try {
      const wb = utils.book_new()
      const currentDate = new Date().toLocaleDateString('uz-UZ')

      teacher.subjects.forEach((subject) => {
        const ws = utils.aoa_to_sheet([])
        const merges = []
        let rowIndex = 0

        // ASOSIY SARLAVHA - KO'K FON
        utils.sheet_add_aoa(ws, [
          [`${teacher.teacherName} - ${monthNames[selectedMonth - 1]} ${selectedYear} Oylik Hisoboti`],
          [``], // Bo'sh qator
          [`Tuzilgan sana: ${currentDate} | Tizim: O'quv Markazi Boshqaruvi`]
        ], { origin: 'A1' })

        merges.push(
          { s: { r: 0, c: 0 }, e: { r: 0, c: 20 } },
          { s: { r: 2, c: 0 }, e: { r: 2, c: 20 } }
        )
        rowIndex += 3

        // FAN NOMI - KO'K FON
        utils.sheet_add_aoa(ws, [[`Fan: ${subject.subjectName}`]], { origin: `A${rowIndex + 1}` })
        merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 20 } })
        rowIndex += 2

        subject.groups.forEach((group) => {
          // Guruhdagi FAQAT Kelgan, Kelmagan va Ustoz statusidagi kunlarni to'plash
          const allDates = new Set()

          group.students.forEach((student) => {
            if (student.attendance && Array.isArray(student.attendance)) {
              student.attendance.forEach((att) => {
                if (att && att.date && ["Kelgan", "Kelmagan", "Ustoz"].includes(att.Status)) {
                  try {
                    const dateStr = att.date.includes('T') ? att.date.split('T')[0] : att.date
                    const d = new Date(dateStr)
                    if (!isNaN(d.getTime())) {
                      const day = String(d.getDate()).padStart(2, "0")
                      const month = String(d.getMonth() + 1).padStart(2, "0")
                      allDates.add(`${day}.${month}`)
                    }
                  } catch (error) {
                    console.error("Date parsing error:", error)
                  }
                }
              })
            }
          })

          // Sanalarni tartiblash
          const validDays = Array.from(allDates).sort((a, b) => {
            const [dayA, monthA] = a.split('.').map(Number)
            const [dayB, monthB] = b.split('.').map(Number)
            if (monthA !== monthB) return monthA - monthB
            return dayA - dayB
          })

          if (validDays.length === 0) {
            for (let i = 1; i <= 31; i++) {
              validDays.push(String(i).padStart(2, '0') + '.' + String(selectedMonth).padStart(2, '0'))
            }
          }

          // GURUH SARLAVHASI - KO'K FON
          utils.sheet_add_aoa(ws, [[`Guruh: ${group.groupName} | O'quvchilar: ${group.students.length} ta | Darslar: ${validDays.length} ta`]],
            { origin: `A${rowIndex + 1}` })
          merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: validDays.length + 7 } })
          rowIndex++

          // JADVAL SARLAVHASI - KO'K FON
          const headers = [
            "№",
            "Ism Familiya",
            "Oyligi\n(so'm)",
            "Ulushi\n(so'm)",
            ...validDays.map(day => day.replace('.', '/')),
            "Jami\ndars",
            "Hisoblanma\n(so'm)",
            "Ushlanma\n(so'm)"
          ]

          utils.sheet_add_aoa(ws, [headers], { origin: `A${rowIndex + 1}` })
          rowIndex++

          let totalSalary = 0, totalShare = 0, totalHisoblanma = 0, totalTulov = 0

          // HAR BIR O'QUVCHI MA'LUMOTLARI
          group.students.forEach((student, idx) => {
            const hisoblanma = calculateHisoblanma(student, validDays.length, shareOfSalary)
            const ulush = parseFloat((student.price * shareOfSalary).toFixed(2))
            const tulov = parseFloat((ulush - hisoblanma).toFixed(2))

            totalSalary += parseFloat(student.price || 0)
            totalShare += ulush
            totalHisoblanma += hisoblanma
            totalTulov += tulov

            const rowData = [
              idx + 1,
              student.fullName,
              Number(student.price) || 0,
              ulush,
            ]

            // DAVOMAT MA'LUMOTLARI
            validDays.forEach((dayMonth) => {
              const [day, month] = dayMonth.split('.')
              let statusSymbol = ""

              const match = student.attendance?.find((att) => {
                if (!att || !att.date || !["Kelgan", "Kelmagan", "Ustoz"].includes(att.Status)) return false
                try {
                  const dateStr = att.date.includes('T') ? att.date.split('T')[0] : att.date
                  const d = new Date(dateStr)
                  if (isNaN(d.getTime())) return false

                  const attDay = String(d.getDate()).padStart(2, "0")
                  const attMonth = String(d.getMonth() + 1).padStart(2, "0")

                  return attDay === day && attMonth === month
                } catch (error) {
                  return false
                }
              })

              if (match) {
                switch (match.Status) {
                  case 'Kelgan': statusSymbol = "+"; break
                  case 'Kelmagan': statusSymbol = "-"; break
                  case 'Ustoz': statusSymbol = "k"; break
                  case 'Ishtirok etmagan': statusSymbol = "q"; break
                  default: statusSymbol = "q"
                }
              }

              rowData.push(statusSymbol)
            })

            // QO'SHIMCHA MA'LUMOTLARI
            rowData.push(validDays.length)
            rowData.push(hisoblanma)
            rowData.push(tulov)

            utils.sheet_add_aoa(ws, [rowData], { origin: `A${rowIndex + 1}` })
            rowIndex++
          })

          // JAMI QATOR
          const totalRow = [
            "JAMI:",
            "",
            totalSalary.toFixed(2),
            totalShare.toFixed(2),
            ...Array(validDays.length).fill(""),
            validDays.length,
            totalHisoblanma.toFixed(2),
            totalTulov.toFixed(2)
          ]

          utils.sheet_add_aoa(ws, [totalRow], { origin: `A${rowIndex + 1}` })
          rowIndex += 2

          // USTUN ENLARINI SOZLASH
          const colWidths = [
            { wch: 5 },   // №
            { wch: 35 },  // Ism Familiya (kengroq)
            { wch: 12 },  // Oyligi
            { wch: 12 },  // Ulushi
            ...validDays.map(() => ({ wch: 8 })), // Kunlar (kengroq)
            { wch: 8 },   // Darslar soni
            { wch: 15 },  // Hisoblanma
            { wch: 15 },  // Ushlanma
          ]

          ws['!cols'] = colWidths
          ws['!merges'] = merges

          // EXCEL FORMATINI QO'LLASH
          applyExcelFormatting(ws, rowIndex, colWidths.length, group)
        })

        utils.book_append_sheet(wb, ws, subject.subjectName.slice(0, 25))
      })

      const fileName = `Oylik_Hisobot_${teacher.teacherName}_${monthNames[selectedMonth - 1]}_${selectedYear}.xlsx`

      writeFileXLSX(wb, fileName)

      toast.success((t) => (
        <div className="flex items-center">
          <FaCheck className="text-green-500 mr-2" />
          <span>Excel fayli muvaffaqiyatli yuklab olindi! 🎉</span>
        </div>
      ))
    } catch (error) {
      console.error("Excel export error:", error)
      toast.error("Excel faylini yuklab olishda xatolik yuz berdi")
    }
  }, [calculateHisoblanma, shareOfSalary, selectedMonth, selectedYear])

  // Handle payment saving
  const handleSavePayment = async () => {
    if (!paymentAmount || isNaN(paymentAmount)) {
      toast.error("Iltimos, to'lov summasini kiriting")
      return
    }

    const amount = Number(paymentAmount)
    const totalCalculated = modalData.totalCalculated || 0
    const avansUsed = avans || 0
    const paidBefore = modalData.paid || 0

    const totalPaidAfterThis = avansUsed + paidBefore + amount

    // Chegaradan oshib ketmasin
    if (totalPaidAfterThis > totalCalculated) {
      const max = totalCalculated - avansUsed - paidBefore
      toast.error(`To'lov summasi ortiqcha! Maksimal: ${formatCurrency(max)} so'm`)
      return
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/teacher-payment/create`, {
        teacherId: modalData.teacherId,
        amount: amount + avans,
        year: selectedYear,
        month: selectedMonth,
        avansUsed: avans,
        status: 'paid'
      })

      toast.success("To'lov muvaffaqiyatli saqlandi!")
      setModalOpen(false)
      setPaymentAmount("")

      // Update payment status locally
      setPaymentStatus(prev => ({
        ...prev,
        [modalData.teacherId]: true
      }))

      // Refresh teacher data
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/teacher/teacher-selery`, {
        params: { year: selectedYear, month: selectedMonth },
      })
      setData(res.data.data)
    } catch (err) {
      console.error(err)
      toast.error("Xatolik yuz berdi")
    }
  }

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "0"
    return amount.toLocaleString("ru-RU").replace(/,/g, ' ')
  }

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Kelgan': return <FaCheck className="text-green-600" />
      case 'Kelmagan': return <FaTimes className="text-red-600" />
      case 'Ustoz': return <FaUserTie className="text-yellow-600" />
      case 'Ishtirok etmagan': return <FaQuestion className="text-gray-400" />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4 md:p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">

        {/* Date Selectors */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-8 flex flex-col sm:flex-row gap-4 items-center">
          <div className="w-full sm:w-1/2">
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FaCalendarAlt className="mr-2 text-indigo-600" /> Yilni tanlang
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(+e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {Array.from({ length: 6 }, (_, i) => currentYear - 2 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-1/2">
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FaCalendarAlt className="mr-2 text-indigo-600" /> Oyni tanlang
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(+e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {monthNames.map((name, i) => (
                <option key={i} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {/* Future Month Message */}
        {!isLoading && isFutureMonth && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Eslatma</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Faqat hozirgi oydan oldingi oylarning hisoblanmasi ko'rish mumkin. Hozirgi va kelasi oylar uchun oylik hisoblanmasi hisoblanmagan.
            </p>
          </div>
        )}

        {/* Teacher Cards */}
        {!isLoading && !isFutureMonth && data.map((teacher) => (
          <TeacherCard
            key={teacher.teacherId}
            teacher={teacher}
            activeTeacher={activeTeacher}
            toggleTeacher={toggleTeacher}
            shareOfSalary={shareOfSalary}
            exportToExcel={exportToExcel}
            setModalData={setModalData}
            setModalOpen={setModalOpen}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            calculateHisoblanma={calculateHisoblanma}
            avans={avans}
            paymentStatus={paymentStatus[teacher.teacherId] || false}
            getStatusIcon={getStatusIcon}
            formatCurrency={formatCurrency}
          />
        ))}

        {/* No Data Message */}
        {!isLoading && !isFutureMonth && data.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="text-5xl mb-4 text-gray-300">📊</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Ma'lumot topilmadi</h3>
            <p className="text-gray-600">
              Tanlangan {monthNames[selectedMonth - 1]} {selectedYear} oyi uchun hech qanday hisobot mavjud emas.
            </p>
          </div>
        )}

        {/* Payment Modal */}
        {modalOpen && modalData && (
          <PaymentModal
            modalData={modalData}
            setModalOpen={setModalOpen}
            paymentAmount={paymentAmount}
            setPaymentAmount={setPaymentAmount}
            handleSavePayment={handleSavePayment}
            formatCurrency={formatCurrency}
            avans={avans}
            paymentStatus={paymentStatus[modalData.teacherId] || false}
          />
        )}
      </div>
    </div>
  )
}

// Teacher Card Component
const TeacherCard = ({
  teacher,
  activeTeacher,
  toggleTeacher,
  shareOfSalary,
  exportToExcel,
  setModalData,
  setModalOpen,
  selectedMonth,
  selectedYear,
  calculateHisoblanma,
  avans,
  paymentStatus,
  getStatusIcon,
  formatCurrency
}) => {
  const isActive = activeTeacher === teacher.teacherId

  // Calculate remaining amount for the teacher
  const totalSalary = teacher.totalCalculated || 0
  const paid = teacher.paid || 0
  const remainingToPay = Math.max(0, totalSalary - avans - paid)

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden mb-6 transition-all duration-300 ${isActive ? "ring-2 ring-indigo-500" : ""}`}>
      <div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 cursor-pointer hover:bg-indigo-50 transition-colors"
        onClick={() => toggleTeacher(teacher)}
      >
        <div className="flex-1">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-2 rounded-lg mr-3">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{teacher.teacherName}</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                  Jami: {formatCurrency(totalSalary)} so'm
                </span>

                {paymentStatus && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center">
                    <FaCheck className="mr-1" /> To'lov qilingan
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 mt-3 sm:mt-0">
          {isActive && !paymentStatus && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setModalData(teacher)
                setModalOpen(true)
              }}
              className="flex items-center text-sm bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-200 transition-colors"
            >
              <FaMoneyBillWave className="mr-1" /> To'lov
            </button>
          )}

          {isActive && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                exportToExcel(teacher)
              }}
              className="flex items-center text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors"
            >
              <FaDownload className="mr-1" />
            </button>
          )}

          <div className={`transform transition-transform ${isActive ? "rotate-180" : ""}`}>
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
      </div>

      {isActive && (
        <div className="border-t p-4 bg-gray-50">
          {teacher.subjects.map((subject) => (
            <div key={subject.subjectId} className="mb-6 last:mb-0">
              <div className="flex items-center mb-3">
                <div className="bg-purple-100 p-1.5 rounded-md mr-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                </div>
                <h4 className="text-md font-medium text-gray-800">{subject.subjectName}</h4>
              </div>

              {subject.groups.map((group) => (
                <GroupTable
                  key={group.groupId}
                  group={group}
                  shareOfSalary={shareOfSalary}
                  calculateHisoblanma={calculateHisoblanma}
                  getStatusIcon={getStatusIcon}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Group Table Component - TO'G'RILANGAN VERSIYA
const GroupTable = ({ group, shareOfSalary, calculateHisoblanma, getStatusIcon, formatCurrency }) => {
  // Calculate valid days for the group - TO'G'RILANDI
  const validDays = useMemo(() => {
    const groupDatesSet = new Set()

    group.students.forEach((student) => {
      if (student.attendance && Array.isArray(student.attendance)) {
        student.attendance.forEach((att) => {
          if (att && att.Status && att.date) {
            try {
              const dateStr = att.date.includes('T') ? att.date.split('T')[0] : att.date
              const d = new Date(dateStr)

              if (!isNaN(d.getTime())) {
                const day = String(d.getDate()).padStart(2, "0")
                const month = String(d.getMonth() + 1).padStart(2, "0")
                const fullDate = `${day}.${month}`

                if (["Kelgan", "Kelmagan", "Ustoz"].includes(att.Status)) {
                  groupDatesSet.add(fullDate)
                }
              }
            } catch (error) {
              console.error("Date parsing error:", error, att)
            }
          }
        })
      }
    })

    // Sanalarni tartiblash (avval oy, keyin kun bo'yicha)
    return Array.from(groupDatesSet).sort((a, b) => {
      const [dayA, monthA] = a.split('.').map(Number)
      const [dayB, monthB] = b.split('.').map(Number)

      if (monthA !== monthB) return monthA - monthB
      return dayA - dayB
    })
  }, [group])

  return (
    <div className="mb-6 border rounded-lg overflow-hidden bg-white">
      <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
        <h5 className="font-medium text-gray-700">Guruh: {group.groupName}</h5>
        <span className="text-sm text-gray-600">
          {group.students.length} ta o'quvchi, {validDays.length} ta dars
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-indigo-50 text-indigo-800">
              <th className="px-3 py-2 text-left border">#</th>
              <th className="px-3 py-2 text-left border">Ism Familiya</th>
              <th className="px-3 py-2 text-center border">Oyligi</th>
              <th className="px-3 py-2 text-center border">Ulushi</th>
              {validDays.map((dayMonth) => (
                <th key={dayMonth} className="px-2 py-2 text-center border">{dayMonth}</th>
              ))}
              <th className="px-3 py-2 text-center border">Darslar</th>
              <th className="px-3 py-2 text-center border">Hisoblanma</th>
              <th className="px-3 py-2 text-center border">Ushlanma</th>
            </tr>
          </thead>
          <tbody>
            {group.students.map((student, idx) => {
              const hisoblanma = calculateHisoblanma(student, validDays.length, shareOfSalary)
              const tulov = parseFloat(((student.price * shareOfSalary) - hisoblanma).toFixed(2))

              return (
                <tr key={student.studentId} className="hover:bg-gray-50 even:bg-gray-50">
                  <td className="px-3 py-2 border text-gray-600">{idx + 1}</td>
                  <td className="px-3 py-2 border font-medium">{student.fullName}</td>
                  <td className="px-3 py-2 border text-center">{formatCurrency(student.price)}</td>
                  <td className="px-3 py-2 border text-center">{formatCurrency(student.price * shareOfSalary)}</td>

                  {validDays.map((dayMonth) => {
                    const [day, month] = dayMonth.split('.')

                    // To'g'ri solishtirish uchun - sana formatini moslashtirish
                    const match = student.attendance?.find((att) => {
                      if (!att || !att.date) return false
                      try {
                        const dateStr = att.date.includes('T') ? att.date.split('T')[0] : att.date
                        const d = new Date(dateStr)
                        if (isNaN(d.getTime())) return false

                        const attDay = String(d.getDate()).padStart(2, "0")
                        const attMonth = String(d.getMonth() + 1).padStart(2, "0")

                        return attDay === day && attMonth === month
                      } catch (error) {
                        return false
                      }
                    })

                    return (
                      <td
                        key={dayMonth}
                        className="px-2 py-2 border text-center font-bold"
                        title={match ? `${match.Status} - ${new Date(match.date).toLocaleDateString()}` : ''}
                      >
                        {match ? getStatusIcon(match.Status) : ""}
                      </td>
                    )
                  })}

                  <td className="px-3 py-2 border text-center">{validDays.length}</td>
                  <td className="px-3 py-2 border text-center font-medium text-green-700">{formatCurrency(hisoblanma)}</td>
                  <td className="px-3 py-2 border text-center font-medium text-red-700">{formatCurrency(tulov)}</td>
                </tr>
              )
            })}

            {/* Group Totals */}
            <tr className="bg-gray-100 font-bold">
              <td colSpan="2" className="px-3 py-2 border text-right">Jami:</td>
              <td className="px-3 py-2 border text-center">
                {formatCurrency(group.students.reduce((sum, s) => sum + (s.price || 0), 0))}
              </td>
              <td className="px-3 py-2 border text-center">
                {formatCurrency(group.students.reduce((sum, s) => sum + (s.price * shareOfSalary || 0), 0))}
              </td>
              <td colSpan={validDays.length + 1}></td>
              <td className="px-3 py-2 border text-center text-green-700">
                {formatCurrency(group.students.reduce((sum, s) => {
                  const hisoblanma = calculateHisoblanma(s, validDays.length, shareOfSalary)
                  return sum + hisoblanma
                }, 0))}
              </td>
              <td className="px-3 py-2 border text-center text-red-700">
                {formatCurrency(group.students.reduce((sum, s) => {
                  const hisoblanma = calculateHisoblanma(s, validDays.length, shareOfSalary)
                  const tulov = (s.price * shareOfSalary) - hisoblanma
                  return sum + tulov
                }, 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Payment Modal Component
const PaymentModal = ({
  modalData,
  setModalOpen,
  paymentAmount,
  setPaymentAmount,
  handleSavePayment,
  formatCurrency,
  avans = 0,
  paymentStatus = false
}) => {
  const totalSalary = modalData.totalCalculated || 0
  const paid = modalData.paid || 0
  const remainingToPay = Math.max(0, totalSalary - avans - paid)

  const handleChange = (e) => {
    if (!paymentStatus) {
      let value = Number(e.target.value)
      if (isNaN(value)) value = 0
      if (value > remainingToPay) value = remainingToPay
      setPaymentAmount(value)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md relative">
        <div className="p-6">
          {/* Close Button */}
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setModalOpen(false)}
              className="text-gray-500 bg-white hover:text-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
              <FaMoneyBillWave className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">To'lov Holati</h2>
            <p className="text-gray-600 mt-1">{modalData.teacherName}</p>
          </div>

          {/* Payment Status */}
          {paymentStatus && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center">
              <FaCheck className="mr-2" />
              <span>Ushbu oy uchun to'lov allaqachon amalga oshirilgan</span>
            </div>
          )}

          {/* Summary */}
          <div className="space-y-3 mb-6 text-sm">
            <div className="flex justify-between border-b pb-1">
              <span>Jami oylik:</span>
              <span className="font-semibold">{formatCurrency(totalSalary)} so'm</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span>Avans:</span>
              <span className="font-semibold text-blue-600">{formatCurrency(avans)} so'm</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span>To'langan:</span>
              <span className="font-semibold text-green-600">{formatCurrency(paid)} so'm</span>
            </div>
            <div className="flex justify-between">
              <span>To'lash kerak:</span>
              <span className={`font-bold ${remainingToPay > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(remainingToPay)} so'm
              </span>
            </div>
          </div>

          {!paymentStatus ? (
            <>
              {/* Payment Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To'lov summasi (so'm)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={remainingToPay}
                    value={paymentAmount}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={`Masalan: ${remainingToPay}`}
                  />
                  <span className="absolute right-3 top-3 text-gray-500">so'm</span>
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>Min: 0 so'm</span>
                  <span>Max: {formatCurrency(remainingToPay)} so'm</span>
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSavePayment}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg shadow-md flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={paymentAmount <= 0}
              >
                <FaMoneyBillWave className="mr-2" /> To'lovni Saqlash
              </button>
            </>
          ) : (
            <button
              onClick={() => setModalOpen(false)}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 rounded-lg shadow-md flex items-center justify-center"
            >
              Yopish
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default MonthlyReport