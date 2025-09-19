import axios from "axios"
import { useCallback, useEffect, useMemo, useState } from "react"
import { FiAlertCircle, FiCalendar, FiCheckCircle, FiClock, FiCreditCard, FiDollarSign, FiFilter, FiInfo, FiSearch, FiUser, FiX, FiXCircle } from "react-icons/fi"

const EmployerFinance = () => {
	const [employers, setEmployers] = useState([])
	const [payments, setPayments] = useState([])
	const [selectedEmployer, setSelectedEmployer] = useState(null)
	const [year, setYear] = useState(new Date().getFullYear())
	const [month, setMonth] = useState(new Date().getMonth() + 1)
	const [amountPaid, setAmountPaid] = useState("")
	const [amountDue, setAmountDue] = useState(0)
	const [existingPayment, setExistingPayment] = useState(null)
	const [loading, setLoading] = useState(false)
	const [errorMessage, setErrorMessage] = useState("")
	const [successMessage, setSuccessMessage] = useState("")
	const [showPaymentModal, setShowPaymentModal] = useState(false)
	const [currentMonthStatus, setCurrentMonthStatus] = useState({})
	const [searchTerm, setSearchTerm] = useState("")
	const [filterStatus, setFilterStatus] = useState("all")

	const token = localStorage.getItem("token")
	const monthNames = useMemo(() => [
		"Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
		"Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
	], [])

	// ✅ Hodimlarni olish
	const fetchEmployers = useCallback(async () => {
		try {
			const { data } = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/employer/getAll`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			)
			if (data.success) {
				setEmployers(data.employer)
				// Har bir hodim uchun joriy oy to'lov holatini olish
				data.employer.forEach(employer => {
					fetchCurrentMonthPaymentStatus(employer._id)
				})
			}
		} catch (error) {
			console.error("Xatolik (fetchEmployers):", error.message)
			setErrorMessage("Hodimlarni yuklashda xatolik yuz berdi")
		}
	}, [token])

	// ✅ Barcha to'lovlarni olish
	const fetchPayments = useCallback(async () => {
		try {
			setLoading(true)
			const { data } = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/employer/payment-getAll`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			)
			if (data.success) setPayments(data.payments)
		} catch (error) {
			console.error("Xatolik (fetchPayments):", error.message)
			setErrorMessage("To'lovlarni yuklashda xatolik yuz berdi")
		} finally {
			setLoading(false)
		}
	}, [token])

	// ✅ Hodimning joriy oy to'lov holatini olish
	const fetchCurrentMonthPaymentStatus = useCallback(async (employerId) => {
		try {
			const currentYear = new Date().getFullYear()
			const currentMonth = new Date().getMonth() + 1

			const { data } = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/employer/payment-check`,
				{
					employerId,
					year: currentYear,
					month: currentMonth,
				}
			)

			if (data.success) {
				setCurrentMonthStatus(prev => ({
					...prev,
					[employerId]: data.payment || { status: "To'lanmagan", amountPaid: 0 }
				}))
			}
		} catch (error) {
			console.error("Xatolik (fetchCurrentMonthPaymentStatus):", error.message)
		}
	}, [])

	// ✅ Tanlangan hodim uchun to'lovni tekshirish
	const checkPayment = useCallback(async (employerId) => {
		if (!employerId) return
		try {
			const { data } = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/employer/payment-check`,
				{
					employerId,
					year,
					month,
				}
			)
			return data.payment || null
		} catch (error) {
			console.error("Xatolik (checkPayment):", error.message)
			return null
		}
	}, [year, month])

	// ✅ To'lov miqdorini tekshirish
	const validatePaymentAmount = useCallback((amount) => {
		if (!selectedEmployer) return false

		const maxAllowed = existingPayment
			? existingPayment.balanceAmount
			: selectedEmployer.salary

		return amount <= maxAllowed
	}, [selectedEmployer, existingPayment])

	// ✅ Modalni ochish va hodimni tanlash
	const openPaymentModal = useCallback(async (employer) => {
		setSelectedEmployer(employer)
		setYear(new Date().getFullYear())
		setMonth(new Date().getMonth() + 1)
		setAmountPaid("")

		// Hodimning tanlangan oy uchun to'lov holatini tekshirish
		const payment = await checkPayment(employer._id)
		setExistingPayment(payment)
		setAmountDue(payment?.amountDue || employer.salary)

		setShowPaymentModal(true)
	}, [checkPayment])

	// ✅ Modalni yopish
	const closePaymentModal = useCallback(() => {
		setShowPaymentModal(false)
		setSelectedEmployer(null)
		setExistingPayment(null)
		setAmountPaid("")
		setErrorMessage("")
	}, [])

	// ✅ Yangi to'lov yoki qo'shimcha to'lov yaratish
	const handleCreatePayment = useCallback(async () => {
		if (!selectedEmployer) {
			setErrorMessage("Iltimos, hodimni tanlang!")
			return
		}

		if (!amountPaid || amountPaid <= 0) {
			setErrorMessage("Iltimos, to'lov miqdorini kiriting!")
			return
		}

		const paymentAmount = Number(amountPaid)

		if (!validatePaymentAmount(paymentAmount)) {
			const maxAllowed = existingPayment
				? existingPayment.balanceAmount
				: selectedEmployer.salary
			setErrorMessage(`To'lov miqdori ${maxAllowed.toLocaleString()} so'mdan ko'p bo'lishi mumkin emas!`)
			return
		}

		try {
			const { data } = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/employer/employer-payment`,
				{
					employerId: selectedEmployer._id,
					year,
					month,
					amountPaid: paymentAmount,
					amountDue: existingPayment?.amountDue || selectedEmployer.salary,
				},
				{ headers: { Authorization: `Bearer ${token}` } }
			)

			if (data.success) {
				setSuccessMessage(data.message)
				closePaymentModal()
				fetchPayments()
				fetchCurrentMonthPaymentStatus(selectedEmployer._id)

				// 3 soniyadan so'ng xabarlarni tozalash
				setTimeout(() => {
					setSuccessMessage("")
				}, 3000)
			}
		} catch (error) {
			console.error("Xatolik (handleCreatePayment):", error.message)
			setErrorMessage("To'lovni qo'shishda xatolik yuz berdi")
		}
	}, [selectedEmployer, amountPaid, validatePaymentAmount, existingPayment, year, month, token, closePaymentModal, fetchPayments, fetchCurrentMonthPaymentStatus])

	// Statusga qarab rang
	const getStatusColor = useCallback((status) => {
		switch (status) {
			case "To'langan": return "bg-green-100 text-green-800"
			case "To'lanmoqda": return "bg-yellow-100 text-yellow-800"
			case "Qarz": return "bg-red-100 text-red-800"
			case "To'lanmagan": return "bg-gray-100 text-gray-800"
			default: return "bg-gray-100 text-gray-800"
		}
	}, [])

	// Statusga qarab icon
	const getStatusIcon = useCallback((status) => {
		switch (status) {
			case "To'langan": return <FiCheckCircle className="text-green-500" />
			case "To'lanmoqda": return <FiClock className="text-yellow-500" />
			case "Qarz": return <FiXCircle className="text-red-500" />
			default: return <FiClock className="text-gray-500" />
		}
	}, [])

	// Maksimal ruxsat etilgan to'lov miqdorini hisoblash
	const getMaxAllowedAmount = useCallback(() => {
		if (!selectedEmployer) return 0
		return existingPayment
			? existingPayment.balanceAmount
			: selectedEmployer.salary
	}, [selectedEmployer, existingPayment])

	// Filtered employers based on search
	const filteredEmployers = useMemo(() => {
		return employers.filter(employer => {
			const matchesSearch = employer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
				employer.position.toLowerCase().includes(searchTerm.toLowerCase())
			const paymentStatus = currentMonthStatus[employer._id] || { status: "To'lanmagan" }
			const matchesStatus = filterStatus === "all" || paymentStatus.status === filterStatus

			return matchesSearch && matchesStatus
		})
	}, [employers, searchTerm, filterStatus, currentMonthStatus])

	// Filtered payments based on search
	const filteredPayments = useMemo(() => {
		return payments.filter(payment => {
			const employer = employers.find(e => e._id === payment.employerId)
			const matchesSearch = employer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				employer?.position?.toLowerCase().includes(searchTerm.toLowerCase())
			const matchesStatus = filterStatus === "all" || payment.status === filterStatus
			return matchesSearch && matchesStatus
		})
	}, [payments, employers, searchTerm, filterStatus])

	const totalPaymentsAmount = useMemo(() => {
		return payments.reduce((sum, p) => sum + p.amountPaid, 0)
	}, [payments])

	useEffect(() => {
		fetchEmployers()
		fetchPayments()
	}, [fetchEmployers, fetchPayments])

	// Xabarlarni tozalash
	useEffect(() => {
		if (errorMessage) {
			const timer = setTimeout(() => {
				setErrorMessage("")
			}, 5000)
			return () => clearTimeout(timer)
		}
	}, [errorMessage])

	return (
		<div className="min-h-screen bg-gray-50 p-4 md:p-6">
			<div className="max-w-7xl mx-auto">
				{/* Xabarlar */}
				{errorMessage && (
					<div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
						<FiAlertCircle className="mr-2" />
						{errorMessage}
					</div>
				)}

				{successMessage && (
					<div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
						<FiCheckCircle className="mr-2" />
						{successMessage}
					</div>
				)}

				{/* Sarlavha */}
				<div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
					<div>
						<h1 className="text-2xl md:text-3xl font-bold text-gray-800">Hodimlar Moliyasi</h1>
						<p className="text-gray-600 mt-1 text-sm md:text-base">Hodimlarning maosh to'lovlarini boshqarish</p>
					</div>
					<div className="flex items-center bg-white px-4 py-2 rounded-lg shadow-sm">
						<FiDollarSign className="text-blue-500 text-xl mr-2" />
						<span className="font-semibold text-sm md:text-base">
							Jami to'lovlar: {totalPaymentsAmount.toLocaleString()} so'm
						</span>
					</div>
				</div>

				{/* Qidiruv va filtrlash */}
				<div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
					<div className="flex flex-col md:flex-row gap-3">
						<div className="relative flex-1">
							<FiSearch className="absolute left-3 top-3.5 text-gray-400" />
							<input
								type="text"
								placeholder="Hodim nomi yoki lavozimi boʻyicha qidirish..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						<div className="w-full md:w-48">
							<div className="relative">
								<FiFilter className="absolute left-3 top-3.5 text-gray-400" />
								<select
									value={filterStatus}
									onChange={(e) => setFilterStatus(e.target.value)}
									className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								>
									<option value="all">Barcha holatlar</option>
									<option value="To'langan">To'langan</option>
									<option value="To'lanmoqda">To'lanmoqda</option>
									<option value="Qarz">Qarz</option>
									<option value="To'lanmagan">To'lanmagan</option>
								</select>
							</div>
						</div>
					</div>
				</div>

				{/* Asosiy kontent */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Hodimlar ro'yxati */}
					<div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-4 md:p-6">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-lg md:text-xl font-semibold flex items-center">
								<FiUser className="mr-2 text-blue-500" />
								Hodimlar ro'yxati
							</h2>
							<span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
								{filteredEmployers.length} ta
							</span>
						</div>

						{employers.length === 0 ? (
							<div className="text-center py-8">
								<FiUser className="mx-auto text-4xl text-gray-300 mb-3" />
								<p className="text-gray-500">Hodimlar mavjud emas</p>
							</div>
						) : filteredEmployers.length === 0 ? (
							<div className="text-center py-8">
								<FiUser className="mx-auto text-4xl text-gray-300 mb-3" />
								<p className="text-gray-500">Qidiruv bo'yicha hodim topilmadi</p>
							</div>
						) : (
							<div className="overflow-y-auto max-h-[400px] pr-2">
								<div className="space-y-3">
									{filteredEmployers.map(employer => {
										const paymentStatus = currentMonthStatus[employer._id] || { status: "To'lanmagan", amountPaid: 0 }

										return (
											<div
												key={employer._id}
												className="border border-gray-200 rounded-lg p-3 hover:bg-blue-50 transition cursor-pointer"
												onClick={() => openPaymentModal(employer)}
											>
												<div className="flex justify-between items-start mb-2">
													<h3 className="font-medium text-sm md:text-base">{employer.fullName}</h3>
													<span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(paymentStatus.status)}`}>
														{paymentStatus.status}
													</span>
												</div>
												<div className="flex justify-between text-xs md:text-sm text-gray-600 mb-1">
													<span>{employer.position}</span>
													<span>{employer.salary.toLocaleString()} so'm</span>
												</div>
												{paymentStatus.status !== "To'lanmagan" && (
													<div className="text-xs text-gray-500">
														To'langan: {paymentStatus.amountPaid.toLocaleString()} so'm
													</div>
												)}
											</div>
										)
									})}
								</div>
							</div>
						)}
					</div>

					{/* To'lovlar tarixi */}
					<div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4 md:p-6">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
							<h2 className="text-lg md:text-xl font-semibold flex items-center mb-3 sm:mb-0">
								<FiCreditCard className="mr-2 text-blue-500" />
								To'lovlar tarixi
							</h2>
							<div className="flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
								<span>Jami: {payments.length} ta to'lov</span>
							</div>
						</div>

						{loading ? (
							<div className="flex justify-center items-center h-40">
								<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
							</div>
						) : filteredPayments.length === 0 ? (
							<div className="text-center py-10">
								<FiCreditCard className="mx-auto text-4xl text-gray-300 mb-3" />
								<p className="text-gray-500">Hali to'lovlar mavjud emas</p>
								<p className="text-gray-400 text-sm mt-1">To'lov qilish uchun hodimni tanlang</p>
							</div>
						) : (
							<div className="overflow-x-auto">
								<div className="min-w-[600px] md:min-w-full">
									<table className="w-full">
										<thead>
											<tr className="text-left text-sm text-gray-500 border-b">
												<th className="pb-3 font-medium px-2">Hodim</th>
												<th className="pb-3 font-medium px-2">Oy/Yil</th>
												<th className="pb-3 font-medium px-2">Umumiy</th>
												<th className="pb-3 font-medium px-2">To'langan</th>
												<th className="pb-3 font-medium px-2">Qoldiq</th>
												<th className="pb-3 font-medium px-2">Status</th>
											</tr>
										</thead>
										<tbody className="divide-y">
											{filteredPayments.map((p) => {
												const employer = employers.find(e => e._id === p.employerId)
												return (
													<tr key={p._id} className="hover:bg-gray-50 transition">
														<td className="py-4 px-2">
															<div className="font-medium text-sm md:text-base">
																{employer?.fullName || p.employerId}
															</div>
															<div className="text-xs md:text-sm text-gray-500">
																{employer?.position || ""}
															</div>
														</td>
														<td className="py-4 px-2">
															<div className="font-medium text-sm md:text-base">{monthNames[p.month - 1]}</div>
															<div className="text-xs md:text-sm text-gray-500">{p.year}</div>
														</td>
														<td className="py-4 px-2 font-medium text-sm md:text-base">{p.amountDue.toLocaleString()}</td>
														<td className="py-4 px-2 font-medium text-green-600 text-sm md:text-base">{p.amountPaid.toLocaleString()}</td>
														<td className="py-4 px-2 font-medium text-sm md:text-base">{p.balanceAmount.toLocaleString()}</td>
														<td className="py-4 px-2">
															<div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(p.status)}`}>
																{getStatusIcon(p.status)}
																<span className="ml-1">{p.status}</span>
															</div>
														</td>
													</tr>
												)
											})}
										</tbody>
									</table>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* To'lov modali */}
				{showPaymentModal && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
						<div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
							{/* Modal sarlavhasi */}
							<div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
								<h3 className="text-xl font-semibold">To'lov qilish</h3>
								<button
									onClick={closePaymentModal}
									className="text-gray-400 bg-white hover:text-gray-600 rounded-full p-1 hover:bg-gray-100"
								>
									<FiX size={24} />
								</button>
							</div>

							{/* Modal kontenti */}
							<div className="p-6">
								{selectedEmployer && (
									<>
										{/* Hodim ma'lumotlari */}
										<div className="bg-blue-50 p-4 rounded-lg mb-6">
											<div className="flex justify-between items-center mb-3">
												<h3 className="font-medium">{selectedEmployer.fullName}</h3>
												<span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
													{selectedEmployer.position}
												</span>
											</div>
											<div className="flex justify-between mb-2">
												<span className="text-sm text-gray-600">Oylik maosh:</span>
												<span className="font-semibold">{selectedEmployer.salary.toLocaleString()} so'm</span>
											</div>
											<div className="flex justify-between">
												<span className="text-sm text-gray-600">Telefon:</span>
												<span className="font-medium">{selectedEmployer.phone || "Mavjud emas"}</span>
											</div>
										</div>

										{/* Oy va yil */}
										<div className="grid grid-cols-2 gap-4 mb-6">
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">Yil</label>
												<div className="relative">
													<input
														type="number"
														value={year}
														onChange={(e) => setYear(Number(e.target.value))}
														className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
														min="2020"
														max="2030"
													/>
													<FiCalendar className="absolute right-3 top-3.5 text-gray-400" />
												</div>
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">Oy</label>
												<div className="relative">
													<select
														value={month}
														onChange={(e) => setMonth(Number(e.target.value))}
														className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
													>
														{monthNames.map((name, index) => (
															<option key={index} value={index + 1}>
																{name}
															</option>
														))}
													</select>
													<FiCalendar className="absolute right-3 top-3.5 text-gray-400" />
												</div>
											</div>
										</div>

										{/* To'lov miqdori */}
										<div className="mb-6">
											<label className="block text-sm font-medium text-gray-700 mb-2">
												To'lov miqdori (so'm)
												<span className="text-red-500 ml-1">*</span>
											</label>
											<div className="relative">
												<input
													type="number"
													value={amountPaid}
													onChange={(e) => {
														const value = e.target.value
														if (value === "" || (!isNaN(value) && Number(value) >= 0)) {
															setAmountPaid(value)
															setErrorMessage("")
														}
													}}
													className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
													placeholder="To'lov miqdorini kiriting"
													max={getMaxAllowedAmount()}
												/>
												<FiDollarSign className="absolute right-3 top-3.5 text-gray-400" />
											</div>
											<div className="flex justify-between mt-2">
												<span className="text-xs text-gray-500">
													Maksimal: {getMaxAllowedAmount().toLocaleString()} so'm
												</span>
												{amountPaid && (
													<span className={`text-xs ${Number(amountPaid) > getMaxAllowedAmount() ? 'text-red-500' : 'text-green-500'}`}>
														Qoldiq: {(getMaxAllowedAmount() - Number(amountPaid)).toLocaleString()} so'm
													</span>
												)}
											</div>
										</div>

										{/* Mavjud to'lov ma'lumoti */}
										{existingPayment && (
											<div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-200">
												<div className="flex items-center mb-2">
													<FiInfo className="text-yellow-500 mr-2" />
													<span className="font-medium">Mavjud to'lov</span>
												</div>
												<div className="text-sm space-y-1">
													<div className="flex justify-between">
														<span>Jami summa:</span>
														<span className="font-medium">{existingPayment.amountDue.toLocaleString()} so'm</span>
													</div>
													<div className="flex justify-between">
														<span>To'langan:</span>
														<span className="font-medium">{existingPayment.amountPaid.toLocaleString()} so'm</span>
													</div>
													<div className="flex justify-between">
														<span>Qoldiq:</span>
														<span className="font-medium">{existingPayment.balanceAmount.toLocaleString()} so'm</span>
													</div>
													<div className="flex justify-between mt-2 pt-2 border-t border-yellow-200">
														<span>Status:</span>
														<span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(existingPayment.status)}`}>
															{existingPayment.status}
														</span>
													</div>
												</div>
											</div>
										)}

										{/* To'lov tugmasi */}
										<button
											onClick={handleCreatePayment}
											disabled={!amountPaid || Number(amountPaid) <= 0 || Number(amountPaid) > getMaxAllowedAmount()}
											className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${!amountPaid || Number(amountPaid) <= 0 || Number(amountPaid) > getMaxAllowedAmount()
												? 'bg-gray-300 text-gray-500 cursor-not-allowed'
												: 'bg-blue-600 text-white hover:bg-blue-700'
												}`}
										>
											{existingPayment ? "Qo'shimcha to'lov qilish" : "To'lovni qo'shish"}
										</button>
									</>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default EmployerFinance