import axios from "axios"
import { useEffect, useState } from "react"

const YearlyFinance = () => {
	const [expenses, setExpenses] = useState([])
	const [amount, setAmount] = useState("")
	const [note, setNote] = useState("")
	const [date, setDate] = useState("")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)
	const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
	const [selectedMonth, setSelectedMonth] = useState("all")
	const [stats, setStats] = useState({
		total: 0,
		monthlyAverage: 0,
		lastMonthTotal: 0,
		dailyAverage: 0
	})
	const [showModal, setShowModal] = useState(false)

	const token = localStorage.getItem("token")

	// Barcha xarajatlarni olish
	const fetchExpenses = async () => {
		setLoading(true)
		setError(null)
		try {
			const { data } = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/depexpenses/getAll`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			)
			if (data.success) {
				setExpenses(data.data || [])
				calculateStats(data.data || [])
			} else {
				setError(data.message || "Xarajatlarni olishda xatolik")
			}
		} catch (err) {
			setError("Server bilan bog'lanishda xatolik")
		} finally {
			setLoading(false)
		}
	}

	// Bitta oyni olish
	const fetchOneMonthExpenses = async () => {
		if (selectedMonth === "all") {
			fetchExpenses()
			return
		}

		setLoading(true)
		setError(null)
		try {
			const { data } = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/depexpenses/getOneMonth`,
				{ year: selectedYear, month: selectedMonth },
				{ headers: { Authorization: `Bearer ${token}` } }
			)
			if (data.success) {
				setExpenses(data.data || [])
				calculateStats(data.data || [])
			} else {
				setError(data.message || "Xarajatlarni olishda xatolik")
			}
		} catch (err) {
			setError("Server bilan bog'lanishda xatolik")
		} finally {
			setLoading(false)
		}
	}

	// Statistikani hisoblash
	const calculateStats = (expensesData) => {
		if (!expensesData.length) {
			setStats({ total: 0, monthlyAverage: 0, lastMonthTotal: 0, dailyAverage: 0 })
			return
		}

		// Jami summa
		const total = expensesData.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)

		// Oy bo'yicha guruhlash
		const monthlyExpenses = {}
		expensesData.forEach(exp => {
			const date = new Date(exp.date)
			const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`

			if (!monthlyExpenses[monthYear]) {
				monthlyExpenses[monthYear] = 0
			}
			monthlyExpenses[monthYear] += parseFloat(exp.amount)
		})

		// Oylik o'rtacha
		const monthlyAverage = total / Object.keys(monthlyExpenses).length

		// Oxirgi oy jami
		const lastMonth = new Date()
		lastMonth.setMonth(lastMonth.getMonth() - 1)
		const lastMonthKey = `${lastMonth.getFullYear()}-${lastMonth.getMonth() + 1}`
		const lastMonthTotal = monthlyExpenses[lastMonthKey] || 0

		// Kunlik o'rtacha
		const firstDate = new Date(Math.min(...expensesData.map(e => new Date(e.date))))
		const daysDiff = Math.ceil((new Date() - firstDate) / (1000 * 60 * 60 * 24))
		const dailyAverage = total / (daysDiff || 1)

		setStats({
			total,
			monthlyAverage,
			lastMonthTotal,
			dailyAverage
		})
	}

	// Yangi xarajat qo'shish
	const createExpenses = async (e) => {
		e.preventDefault()
		try {
			const { data } = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/depexpenses/create`,
				{
					amount,
					note,
					date: date ? new Date(date) : new Date(),
				},
				{ headers: { Authorization: `Bearer ${token}` } }
			)
			if (data.success) {
				setAmount("")
				setNote("")
				setDate("")
				setShowModal(false)
				if (selectedMonth === "all") {
					fetchExpenses()
				} else {
					fetchOneMonthExpenses()
				}
			} else {
				setError(data.message || "Xarajat qo'shishda xatolik")
			}
		} catch (err) {
			setError("Server bilan bog'lanishda xatolik")
		}
	}

	useEffect(() => {
		fetchExpenses()
	}, [])

	useEffect(() => {
		if (selectedMonth === "all") {
			fetchExpenses()
		} else {
			fetchOneMonthExpenses()
		}
	}, [selectedMonth, selectedYear])

	// Progress bar uchun foizni hisoblash
	const calculatePercentage = (current, previous) => {
		if (!previous) return 100
		return Math.min(Math.round((current / previous) * 100), 100)
	}

	// Oy nomlarini olish
	const getMonthName = (monthNumber) => {
		const months = [
			"Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
			"Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
		]
		return months[monthNumber - 1] || ""
	}

	return (
		<div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
			<header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
				<div>
					<h1 className="text-3xl font-bold text-gray-800 flex items-center">
						<span className="bg-blue-100 p-3 rounded-xl mr-3 shadow-sm">🧾</span>
						Departament Xarajatlari
					</h1>
					<p className="text-gray-600 mt-2">Barcha xarajatlaringizni boshqaring va tahlil qiling</p>
				</div>

				<button
					onClick={() => setShowModal(true)}
					className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-medium flex items-center justify-center shadow-md hover:shadow-lg transition-all"
				>
					<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
					</svg>
					Yangi Xarajat
				</button>
			</header>

			{/* Filtrlash */}
			<div className="bg-white p-5 rounded-2xl shadow-sm mb-8 flex flex-col sm:flex-row gap-4 items-center">
				<h3 className="text-lg font-semibold text-gray-800 mr-auto">Filtrlash</h3>

				<div className="flex flex-wrap gap-3">
					<select
						value={selectedYear}
						onChange={(e) => setSelectedYear(parseInt(e.target.value))}
						className="border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						<option value={2023}>2023</option>
						<option value={2024}>2024</option>
						<option value={2025}>2025</option>
					</select>

					<select
						value={selectedMonth}
						onChange={(e) => setSelectedMonth(e.target.value)}
						className="border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						<option value="all">Barcha oylar</option>
						<option value={1}>Yanvar</option>
						<option value={2}>Fevral</option>
						<option value={3}>Mart</option>
						<option value={4}>Aprel</option>
						<option value={5}>May</option>
						<option value={6}>Iyun</option>
						<option value={7}>Iyul</option>
						<option value={8}>Avgust</option>
						<option value={9}>Sentabr</option>
						<option value={10}>Oktabr</option>
						<option value={11}>Noyabr</option>
						<option value={12}>Dekabr</option>
					</select>
				</div>
			</div>

			{/* Statistikalar qismi */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
				<div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow">
					<div className="flex justify-between items-start">
						<div>
							<h3 className="text-gray-500 text-sm font-medium">Jami Xarajat</h3>
							<p className="text-2xl font-bold text-gray-800 mt-1">{stats.total.toLocaleString()} so'm</p>
						</div>
						<div className="bg-blue-100 p-3 rounded-xl">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
					</div>
					<div className="flex items-center mt-4">
						<span className="text-green-500 text-sm flex items-center bg-green-100 px-2 py-1 rounded-full">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
							</svg>
							+12% o'tgan oydan
						</span>
					</div>
				</div>

				<div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-green-500 hover:shadow-md transition-shadow">
					<div className="flex justify-between items-start">
						<div>
							<h3 className="text-gray-500 text-sm font-medium">Oylik O'rtacha</h3>
							<p className="text-2xl font-bold text-gray-800 mt-1">{stats.monthlyAverage.toLocaleString(undefined, { maximumFractionDigits: 0 })} so'm</p>
						</div>
						<div className="bg-green-100 p-3 rounded-xl">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
							</svg>
						</div>
					</div>
					<div className="w-full bg-gray-200 rounded-full h-2 mt-4">
						<div
							className="bg-green-500 h-2 rounded-full transition-all duration-500"
							style={{ width: `${calculatePercentage(stats.monthlyAverage, stats.lastMonthTotal)}%` }}
						></div>
					</div>
				</div>

				<div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-purple-500 hover:shadow-md transition-shadow">
					<div className="flex justify-between items-start">
						<div>
							<h3 className="text-gray-500 text-sm font-medium">Kunlik O'rtacha</h3>
							<p className="text-2xl font-bold text-gray-800 mt-1">{stats.dailyAverage.toLocaleString(undefined, { maximumFractionDigits: 0 })} so'm</p>
						</div>
						<div className="bg-purple-100 p-3 rounded-xl">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
							</svg>
						</div>
					</div>
					<div className="flex items-center mt-4">
						<span className="text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded-full">So'nggi 30 kun</span>
					</div>
				</div>

				<div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-yellow-500 hover:shadow-md transition-shadow">
					<div className="flex justify-between items-start">
						<div>
							<h3 className="text-gray-500 text-sm font-medium">Xarajatlar Soni</h3>
							<p className="text-2xl font-bold text-gray-800 mt-1">{expenses.length}</p>
						</div>
						<div className="bg-yellow-100 p-3 rounded-xl">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
							</svg>
						</div>
					</div>
					<div className="flex items-center mt-4">
						<span className="text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded-full">Jami yozilgan xarajatlar</span>
					</div>
				</div>
			</div>

			{/* Xarajatlar ro'yxati */}
			<div className="bg-white rounded-2xl shadow-sm overflow-hidden">
				<div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between">
					<h2 className="text-xl font-semibold text-gray-800 mb-3 sm:mb-0">
						{selectedMonth === "all"
							? "Barcha Xarajatlar"
							: `${selectedYear}-yil ${getMonthName(parseInt(selectedMonth))} oyi xarajatlari`}
					</h2>
					<p className="text-gray-600">
						Jami: <span className="font-semibold">{expenses.length}</span> xarajat
					</p>
				</div>

				{/* Xatolik ko'rsatish */}
				{error && (
					<div className="bg-red-100 text-red-700 p-4 m-4 rounded-xl flex items-center">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						{error}
					</div>
				)}

				{/* Yuklanish holati */}
				{loading ? (
					<div className="flex flex-col items-center justify-center p-10">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-3"></div>
						<p className="text-gray-500">Xarajatlar yuklanmoqda...</p>
					</div>
				) : expenses.length === 0 ? (
					<div className="flex flex-col items-center justify-center p-10 text-center">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<h3 className="text-lg font-medium text-gray-700 mb-1">Hech qanday xarajat topilmadi</h3>
						<p className="text-gray-500 text-sm mb-4">Yangi xarajat qo'shing yoki boshqa filtrlarni tanlang</p>
						<button
							onClick={() => setShowModal(true)}
							className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl text-sm font-medium"
						>
							Xarajat Qo'shish
						</button>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-gray-100">
								<tr>
									<th className="p-4 text-left text-sm font-medium text-gray-600">Sana</th>
									<th className="p-4 text-left text-sm font-medium text-gray-600">Miqdor</th>
									<th className="p-4 text-left text-sm font-medium text-gray-600">Izoh</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200">
								{expenses.map((exp) => (
									<tr key={exp._id} className="hover:bg-blue-50 transition-colors">
										<td className="p-4">
											<div className="flex items-center">
												<div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
													<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
													</svg>
												</div>
												<div>
													<p className="font-medium text-gray-900">{new Date(exp.date).toLocaleDateString("uz-UZ")}</p>
													<p className="text-sm text-gray-500">{new Date(exp.date).toLocaleDateString("uz-UZ", { weekday: 'long' })}</p>
												</div>
											</div>
										</td>
										<td className="p-4">
											<p className="font-semibold text-red-600">{parseFloat(exp.amount).toLocaleString()} so'm</p>
										</td>
										<td className="p-4">
											<p className="text-gray-800">{exp.note || "Izohsiz"}</p>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Modal - Xarajat qo'shish */}
			{showModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-lg w-full max-w-md">
						<div className="p-6 border-b border-gray-200">
							<h2 className="text-xl font-semibold text-gray-800 flex items-center">
								<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
								</svg>
								Yangi Xarajat
							</h2>
						</div>

						<form onSubmit={createExpenses} className="p-6 flex flex-col gap-5">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Miqdor (so'm)</label>
								<input
									type="number"
									placeholder="0"
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
									className="border border-gray-300 p-3 rounded-xl w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Izoh</label>
								<input
									type="text"
									placeholder="Xarajat uchun izoh"
									value={note}
									onChange={(e) => setNote(e.target.value)}
									className="border border-gray-300 p-3 rounded-xl w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Sana</label>
								<input
									type="date"
									value={date}
									onChange={(e) => setDate(e.target.value)}
									className="border border-gray-300 p-3 rounded-xl w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
								<p className="text-gray-500 text-xs mt-2">Agar sana tanlanmasa, bugungi sana qo'llaniladi</p>
							</div>

							<div className="flex gap-3 pt-3">
								<button
									type="button"
									onClick={() => setShowModal(false)}
									className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
								>
									Bekor Qilish
								</button>
								<button
									type="submit"
									className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
								>
									<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
									</svg>
									Saqlash
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	)
}

export default YearlyFinance