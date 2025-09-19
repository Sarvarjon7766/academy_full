import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { FaArrowLeft, FaCalendarAlt, FaInfoCircle, FaMoneyBillWave, FaSearch, FaUserGraduate } from 'react-icons/fa'

const RegisterPayment = () => {
  const [students, setStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [paymentInfo, setPaymentInfo] = useState(null)
  const [amountDue, setAmountDue] = useState(null)
  const [amount, setAmount] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Talaba ma'lumotlaridan oylik to'lov miqdorini hisoblash
  const calculateMonthlyPayment = (student) => {
    if (!student) return 0

    let total = 0

    // Asosiy fanlar
    if (student.main_subjects && student.main_subjects.length > 0) {
      student.main_subjects.forEach(subject => {
        total += subject.price || 0
      })
    }

    // Qo'shimcha fanlar
    if (student.additionalSubjects && student.additionalSubjects.length > 0) {
      student.additionalSubjects.forEach(subject => {
        total += subject.price || 0
      })
    }

    // Yotoqxona
    if (student.hostel && student.hostel.hostelPrice) {
      total += student.hostel.hostelPrice
    }

    // Oshxona
    if (student.product && student.product.productPrice) {
      total += student.product.productPrice
    }

    // Transport
    if (student.transport && student.transport.transportPrice) {
      total += student.transport.transportPrice
    }

    // Maktab xarajatlari
    if (student.school_expenses) {
      total += student.school_expenses
    }

    return total
  }

  // Tanlangan talaba obyektini olish
  const selectedStudent = useMemo(() => {
    return students.find((student) => student._id === selectedStudentId)
  }, [selectedStudentId, students])

  // Filtrlangan talabalar ro'yxati
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students

    return students.filter(student => {
      const fullName = student.fullName || `${student.firstName} ${student.lastName}`
      return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.group?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.phone?.includes(searchTerm)
    })
  }, [students, searchTerm])

  // Talabalar ro'yxatini olish
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/student/getAll`)
        if (res.data.success) {
          console.log(res.data.students[0])
          setStudents(res.data.students)
        }

      } catch (error) {
        console.error('Talabalarni olishda xatolik:', error)
        setErrorMessage('Talabalarni yuklashda xatolik yuz berdi')
      }
    }
    fetchStudents()
  }, [])

  // Talaba tanlanganda amountDue ni o'rnatish
  useEffect(() => {
    if (selectedStudent) {
      const calculatedAmount = calculateMonthlyPayment(selectedStudent)
      setAmountDue(calculatedAmount)
    }
  }, [selectedStudent])

  // To'lov ma'lumotlarini olish (selectedStudentId, year yoki month o'zgarganda)
  useEffect(() => {
    const fetchPaymentInfo = async () => {
      if (!selectedStudentId || !year || !month) {
        setPaymentInfo(null)
        return
      }
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/payment/check`, {
          params: { studentId: selectedStudentId, year, month },
        })

        console.log("API Response:", res.data)

        // Agar to'lov mavjud bo'lsa
        if (res.data.payment && Object.keys(res.data.payment).length > 0) {
          setPaymentInfo(res.data.payment)
          setAmountDue(res.data.payment.amount_due)
        } else {
          // Agar to'lov mavjud bo'lmasa, talabaning oylik to'lovini hisoblaymiz
          setPaymentInfo(null)
          if (selectedStudent) {
            const calculatedAmount = calculateMonthlyPayment(selectedStudent)
            setAmountDue(calculatedAmount)
          }
        }

        setAmount('')
        setErrorMessage('')
      } catch (error) {
        console.error("To'lov ma'lumotini olishda xatolik:", error)
        setPaymentInfo(null)
        setAmount('')
        setErrorMessage('To\'lov ma\'lumotlarini yuklashda xatolik yuz berdi')
      }
    }
    fetchPaymentInfo()
  }, [selectedStudentId, year, month, selectedStudent])

  // Qoldiqni hisoblash
  const remainingAmount = paymentInfo
    ? paymentInfo.amount_due - paymentInfo.amount_paid
    : amountDue

  // To'lovni yuborish funksiyasi
  const handlePaymentSubmit = async () => {
    const payAmount = Number(amount)
    if (!amount || isNaN(payAmount) || payAmount <= 0) {
      setErrorMessage("Iltimos, to'lov summasini to'g'ri kiriting")
      return
    }
    if (remainingAmount !== null && payAmount > remainingAmount) {
      setErrorMessage(`To'lov summasi qoldiqdan katta bo'lishi mumkin emas. Qoldiq: ${remainingAmount.toLocaleString()} so'm`)
      return
    }
    if (paymentInfo && paymentInfo.isPaid) {
      setErrorMessage("To'lov allaqachon to'liq amalga oshirilgan")
      return
    }
    try {
      setLoading(true)
      setErrorMessage('')

      const paymentData = {
        studentId: selectedStudentId,
        year,
        month,
        amount: payAmount,
        amountDue: amountDue,
        comment: comment
      }

      // Agar paymentInfo mavjud bo'lsa, payment ID ni qo'shamiz
      if (paymentInfo) {
        paymentData.payment = paymentInfo._id
      }

      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/payment/pay`, paymentData)

      if (res.data.success) {
        setSuccessMessage("To'lov muvaffaqiyatli amalga oshirildi!")
        setAmount('')
        setComment('')
        // To'lov ma'lumotlarini yangilash
        const resCheck = await axios.get(`${import.meta.env.VITE_API_URL}/api/payment/check`, {
          params: { studentId: selectedStudentId, year, month },
        })

        // Yangilangan to'lov ma'lumotlarini o'rnatish
        if (resCheck.data.payment && Object.keys(resCheck.data.payment).length > 0) {
          setPaymentInfo(resCheck.data.payment)
        } else {
          setPaymentInfo(null)
        }

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('')
        }, 3000)
      } else {
        setErrorMessage("To'lovni amalga oshirishda xatolik yuz berdi")
      }
    } catch (error) {
      console.error("To'lovni amalga oshirishda xatolik:", error)
      setErrorMessage("To'lovni amalga oshirishda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  // Talabani tanlash funksiyasi
  const handleStudentSelect = (studentId) => {
    setSelectedStudentId(studentId)
    setIsDropdownOpen(false)
    setSearchTerm('')
  }

  // Format currency
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0 so\'m'
    return value.toLocaleString('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
  }

  // Talaba to'lov tafsilotlarini ko'rsatish
  const renderPaymentDetails = () => {
    if (!selectedStudent) return null

    const details = []
    let total = 0

    // Asosiy fanlar
    if (selectedStudent.main_subjects && selectedStudent.main_subjects.length > 0) {
      selectedStudent.main_subjects.forEach((subject, index) => {
        const subjectName = subject.subjectId?.subjectName || 'Asosiy fan'
        details.push(
          <div key={`main-${index}`} className="flex justify-between text-sm">
            <span>{subjectName}</span>
            <span className="font-medium">{formatCurrency(subject.price)}</span>
          </div>
        )
        total += subject.price || 0
      })
    }

    // Qo'shimcha fanlar
    if (selectedStudent.additionalSubjects && selectedStudent.additionalSubjects.length > 0) {
      selectedStudent.additionalSubjects.forEach((subject, index) => {
        const subjectName = subject.subjectId?.subjectName || 'Qo\'shimcha fan'
        details.push(
          <div key={`additional-${index}`} className="flex justify-between text-sm">
            <span>{subjectName}</span>
            <span className="font-medium">{formatCurrency(subject.price)}</span>
          </div>
        )
        total += subject.price || 0
      })
    }

    // Yotoqxona
    if (selectedStudent.hostel && selectedStudent.hostel.hostelPrice) {
      details.push(
        <div key="hostel" className="flex justify-between text-sm">
          <span>Yotoqxona ({selectedStudent.hostel.hostelName})</span>
          <span className="font-medium">{formatCurrency(selectedStudent.hostel.hostelPrice)}</span>
        </div>
      )
      total += selectedStudent.hostel.hostelPrice
    }

    // Oshxona
    if (selectedStudent.product && selectedStudent.product.productPrice) {
      details.push(
        <div key="product" className="flex justify-between text-sm">
          <span>Oshxona ({selectedStudent.product.productName})</span>
          <span className="font-medium">{formatCurrency(selectedStudent.product.productPrice)}</span>
        </div>
      )
      total += selectedStudent.product.productPrice
    }

    // Transport
    if (selectedStudent.transport && selectedStudent.transport.transportPrice) {
      details.push(
        <div key="transport" className="flex justify-between text-sm">
          <span>Transport</span>
          <span className="font-medium">{formatCurrency(selectedStudent.transport.transportPrice)}</span>
        </div>
      )
      total += selectedStudent.transport.transportPrice
    }

    // Maktab xarajatlari
    if (selectedStudent.school_expenses) {
      details.push(
        <div key="school-expenses" className="flex justify-between text-sm">
          <span>Maktab xarajatlari</span>
          <span className="font-medium">{formatCurrency(selectedStudent.school_expenses)}</span>
        </div>
      )
      total += selectedStudent.school_expenses
    }

    // Jami
    details.push(
      <div key="total" className="flex justify-between text-sm font-semibold border-t pt-2 mt-2">
        <span>Jami</span>
        <span className="text-green-600">{formatCurrency(total)}</span>
      </div>
    )

    return details
  }

  return (
    <div className="mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <button
          className="flex items-center bg-indigo-400 text-white hover:bg-indigo-500 mr-4 px-4 py-2 rounded-lg transition-colors"
          onClick={() => window.history.back()}
        >
          <FaArrowLeft className="mr-2" /> Orqaga
        </button>
        <h2 className="text-3xl font-bold text-gray-800 flex items-center">
          To'lovlar Boshqaruvi
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel - Student selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaUserGraduate className="mr-2 text-indigo-600" />
              Talaba Ma'lumotlari
            </h3>

            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Talabani qidirish yoki tanlash</label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Ism, familiya, guruh yoki telefon raqami bo'yicha qidirish"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsDropdownOpen(true)}
                  />
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <div
                          key={student._id}
                          className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => handleStudentSelect(student._id)}
                        >
                          <div className="font-medium">
                            {student.fullName || `${student.firstName} ${student.lastName}`}
                          </div>
                          <div className="text-sm text-gray-600">
                            {student.group && `Guruh: ${student.group} • `}
                            {student.phone && `Tel: ${student.phone}`}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500">
                        Hech qanday talaba topilmadi
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedStudent && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Familiya Ism</p>
                      <p className="font-medium">{selectedStudent.fullName || `${selectedStudent.firstName} ${selectedStudent.lastName}`}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Telefon</p>
                      <p className="font-medium">{selectedStudent.phone || 'Mavjud emas'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Guruh</p>
                      <p className="font-medium">{selectedStudent.group || 'Mavjud emas'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Oylik to'lov</p>
                      <p className="font-medium text-green-600">
                        {formatCurrency(amountDue)}
                      </p>
                    </div>
                  </div>

                  {/* To'lov tafsilotlari */}
                  <div className="mt-4 pt-4 border-t border-blue-100">
                    <p className="text-xs text-gray-500 mb-2">To'lov tarkibi:</p>
                    {renderPaymentDetails()}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaCalendarAlt className="mr-2 text-indigo-600" />
              To'lov Davri
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yil</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  min={2000}
                  max={2100}
                  placeholder="Masalan: 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Oy</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  {[
                    { value: 1, name: "Yanvar" }, { value: 2, name: "Fevral" }, { value: 3, name: "Mart" },
                    { value: 4, name: "Aprel" }, { value: 5, name: "May" }, { value: 6, name: "Iyun" },
                    { value: 7, name: "Iyul" }, { value: 8, name: "Avgust" }, { value: 9, name: "Sentabr" },
                    { value: 10, name: "Oktabr" }, { value: 11, name: "Noyabr" }, { value: 12, name: "Dekabr" }
                  ].map(({ value, name }) => (
                    <option key={value} value={value}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel - Payment information */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FaInfoCircle className="mr-2 text-indigo-600" />
            To'lov Holati
          </h3>

          {successMessage && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {errorMessage}
            </div>
          )}

          {paymentInfo ? (
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-bold text-gray-800">
                      {new Date(year, month - 1).toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' })}
                    </h4>
                    <p className={`text-sm font-semibold ${paymentInfo.isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                      {paymentInfo.isPaid ? 'To\'liq to\'langan' : 'Qisman to\'langan'}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500">Jami to'lov</p>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(paymentInfo.amount_due)}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-600">To'langan</span>
                    <span className="text-sm font-medium text-gray-600">
                      {formatCurrency(paymentInfo.amount_paid)} / {formatCurrency(paymentInfo.amount_due)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${(paymentInfo.amount_paid / paymentInfo.amount_due) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">To'langan summa</p>
                    <p className="text-lg font-semibold text-green-600">{formatCurrency(paymentInfo.amount_paid)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Qolgan summa</p>
                    <p className="text-lg font-semibold text-orange-500">{formatCurrency(remainingAmount)}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Oxirgi to'lov sanasi</p>
                  <p className="font-medium">
                    {paymentInfo.updatedAt ?
                      new Date(paymentInfo.updatedAt).toLocaleDateString('uz-UZ', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      }) :
                      'Mavjud emas'
                    }
                  </p>
                </div>
              </div>

              {remainingAmount > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Qo'shimcha to'lov</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">To'lov summasi (so'm)</label>
                      <input
                        type="number"
                        placeholder={remainingAmount}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="1"
                        max={remainingAmount}
                      />
                      <label className="block text-sm font-medium text-gray-700 mb-1 mt-3">Izoh</label>
                      <input
                        type="text"
                        placeholder="Eslatma qo'shish"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                    </div>

                    <button
                      onClick={handlePaymentSubmit}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-300 disabled:opacity-70 flex items-center justify-center"
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          To'lov amalga oshirilmoqda...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <FaMoneyBillWave className="mr-2" />
                          To'lovni tasdiqlash
                        </span>
                      )}
                    </button>

                    <p className="text-sm text-gray-500 mt-2">
                      Maksimal to'lov miqdori: {formatCurrency(remainingAmount)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : selectedStudentId ? (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-5 border border-yellow-200">
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mb-4">
                  <FaMoneyBillWave className="text-xl" />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">To'lov mavjud emas</h4>
                <p className="text-gray-600 mb-4">
                  <span className="font-semibold">{new Date(year, month - 1).toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' })}</span> oyi uchun to'lov qilinmagan
                </p>

                <div className="mb-6 p-4 bg-white rounded-lg border border-yellow-100">
                  <p className="text-sm text-gray-500">To'lov miqdori</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatCurrency(amountDue)}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To'lov summasi (so'm)</label>
                    <input
                      type="number"
                      placeholder="To'lash summasi"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="1"
                      max={amountDue}
                    />
                    <label className="block text-sm font-medium text-gray-700 mb-1 mt-3">Izoh</label>
                    <input
                      type="text"
                      placeholder="Eslatma qo'shish"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={handlePaymentSubmit}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-300 disabled:opacity-70 flex items-center justify-center"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        To'lov amalga oshirilmoqda...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <FaMoneyBillWave className="mr-2" />
                        To'lovni boshlash
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 text-gray-500 mb-4">
                <FaUserGraduate className="text-xl" />
              </div>
              <h4 className="text-xl font-semibold text-gray-700 mb-2">Talabani tanlang</h4>
              <p className="text-gray-500">
                To'lov ma'lumotlarini ko'rish uchun talaba, yil va oyni tanlang
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RegisterPayment