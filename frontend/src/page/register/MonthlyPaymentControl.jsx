import axios from 'axios'
import { saveAs } from 'file-saver'
import { useEffect, useRef, useState } from 'react'
import { FaCalendarAlt, FaFileExcel, FaFilter, FaHistory, FaInfoCircle, FaMoneyBillWave, FaPercent, FaSearch, FaTrash, FaUser } from 'react-icons/fa'
import * as XLSX from 'xlsx'

const MonthlyPaymentControl = () => {
	// State-lar (o'zgarmaydi)
	const [year, setYear] = useState(new Date().getFullYear())
	const [month, setMonth] = useState(new Date().getMonth() + 1)
	const [payments, setPayments] = useState([])
	const [filteredPayments, setFilteredPayments] = useState([])
	const [searchName, setSearchName] = useState('')
	const [filterPercentage, setFilterPercentage] = useState('')
	const [paymentStatus, setPaymentStatus] = useState('all')
	const [selectedPayment, setSelectedPayment] = useState(null)
	const [paymentHistory, setPaymentHistory] = useState([])
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [loading, setLoading] = useState(false)
	const [historyLoading, setHistoryLoading] = useState(false)
	const modalRef = useRef(null)

	// Ma'lumotlarni yuklash (o'zgarmaydi)
	useEffect(() => {
		const fetchData = async () => {
			setLoading(true)
			try {
				const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/payment/getPaymants`, {
					params: { year, month },
				})
				if (res.data.success) {
					setPayments(res.data.payments)
					setFilteredPayments(res.data.payments)
				}
			} catch (error) {
				console.error('Xatolik:', error)
			} finally {
				setLoading(false)
			}
		}
		fetchData()
	}, [year, month])

	// Filtrlash (o'zgarmaydi)
	useEffect(() => {
		let result = [...payments]

		if (searchName) {
			const searchTerm = searchName.toLowerCase()
			result = result.filter(pay =>
				pay.student?.fullName?.toLowerCase().includes(searchTerm)
			)
		}

		if (filterPercentage) {
			const percentage = parseFloat(filterPercentage)
			if (!isNaN(percentage)) {
				result = result.filter(pay => {
					const paidPercentage = (pay.amount_paid / pay.amount_due) * 100
					return paidPercentage < percentage
				})
			}
		}

		if (paymentStatus !== 'all') {
			result = result.filter(pay => {
				const paidPercentage = (pay.amount_paid / pay.amount_due) * 100

				if (paymentStatus === 'paid') return paidPercentage >= 100
				if (paymentStatus === 'partial') return paidPercentage > 0 && paidPercentage < 100
				if (paymentStatus === 'unpaid') return paidPercentage === 0

				return true
			})
		}

		setFilteredPayments(result)
	}, [searchName, filterPercentage, paymentStatus, payments])

	// Modal tashqarisiga bosilganda yopish (o'zgarmaydi)
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (modalRef.current && !modalRef.current.contains(event.target)) {
				closeModal()
			}
		}

		if (isModalOpen) {
			document.addEventListener('mousedown', handleClickOutside)
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isModalOpen])

	// To'lov tarixini yuklash (o'zgarmaydi)
	const fetchPaymentHistory = async (payment) => {
		setHistoryLoading(true)
		try {
			const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/payment/history`, {
				params: { payment }
			})

			if (res.data.success) {
				setPaymentHistory(res.data.paymentlogs)
			}
		} catch (error) {
			console.error("To'lov tarixini olishda xatolik:", error)
		} finally {
			setHistoryLoading(false)
		}
	}

	// Modalni ochish/yopish (o'zgarmaydi)
	const openPaymentModal = (payment) => {
		setSelectedPayment(payment)
		fetchPaymentHistory(payment)
		setIsModalOpen(true)
	}

	const closeModal = () => {
		setIsModalOpen(false)
		setSelectedPayment(null)
		setPaymentHistory([])
	}

	// Formatlash funksiyalari (o'zgarmaydi)
	const formatCurrency = (value) => {
		if (!value) return '0 so\'m'
		return new Intl.NumberFormat('uz-UZ').format(value) + ' so\'m'
	}

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString('uz-UZ', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	const calculatePaymentPercentage = (amountPaid, amountDue) => {
		if (amountDue === 0) return 0
		return Math.round((amountPaid / amountDue) * 100)
	}

	const getStatusColor = (percentage) => {
		if (percentage === 0) return 'bg-red-100 text-red-800'
		if (percentage < 50) return 'bg-orange-100 text-orange-800'
		if (percentage < 100) return 'bg-yellow-100 text-yellow-800'
		return 'bg-green-100 text-green-800'
	}

	// Excelga yuklab olish (o'zgarmaydi)
	const exportToExcel = (type = 'all') => {
		let dataToExport = []

		if (type === 'all') {
			dataToExport = payments.map(pay => ({
				'Talaba': pay.student?.fullName || 'Noma\'lum',
				'Manzil': pay.student?.address || '',
				'Telefon': pay.student?.phone || '',
				'Jami To\'lov': pay.amount_due,
				'To\'langan': pay.amount_paid,
				'Qolgan': pay.amount_due - pay.amount_paid,
				'Foiz': calculatePaymentPercentage(pay.amount_paid, pay.amount_due),
				'Holat': calculatePaymentPercentage(pay.amount_paid, pay.amount_due) === 0
					? "To'lanmagan"
					: calculatePaymentPercentage(pay.amount_paid, pay.amount_due) < 100
						? "Qisman to'langan"
						: "To'liq to'langan"
			}))
		} else {
			dataToExport = filteredPayments.map(pay => ({
				'Talaba': pay.student?.fullName || 'Noma\'lum',
				'Manzil': pay.student?.address || '',
				'Telefon': pay.student?.phone || '',
				'Jami To\'lov': pay.amount_due,
				'To\'langan': pay.amount_paid,
				'Qolgan': pay.amount_due - pay.amount_paid,
				'Foiz': calculatePaymentPercentage(pay.amount_paid, pay.amount_due),
				'Holat': calculatePaymentPercentage(pay.amount_paid, pay.amount_due) === 0
					? "To'lanmagan"
					: calculatePaymentPercentage(pay.amount_paid, pay.amount_due) < 100
						? "Qisman to'langan"
						: "To'liq to'langan"
			}))
		}

		const worksheet = XLSX.utils.json_to_sheet(dataToExport)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, "To'lovlar")

		const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
		const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

		let fileName = `To'lovlar_${year}-${month}`
		if (type !== 'all') fileName += `_${type}`

		saveAs(data, `${fileName}.xlsx`)
	}

	// Filtrlarni tozalash (o'zgarmaydi)
	const clearFilters = () => {
		setSearchName('')
		setFilterPercentage('')
		setPaymentStatus('all')
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="mx-auto">
				{/* Sarlavha qismi */}
				<div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
						<div>
							<h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
								<div className="bg-blue-500 text-white p-2 rounded-lg">
									<FaMoneyBillWave />
								</div>
								Oylik To'lovlar Nazorati
							</h1>
							<p className="text-gray-600 mt-1">
								{year}-yil {month}-oy uchun to'lovlar monitoringi
							</p>
						</div>

						<div className="flex flex-wrap gap-2">
							<button
								onClick={() => exportToExcel('all')}
								className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
							>
								<FaFileExcel /> Yuklash
							</button>

							<button
								onClick={clearFilters}
								className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
							>
								<FaTrash /> Tozalash
							</button>
						</div>
					</div>

					{/* Filtrlar paneli */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
						<div className="space-y-1">
							<label className="text-sm font-medium text-gray-700 flex items-center gap-2">
								<FaSearch className="text-blue-500" />
								Qidirish
							</label>
							<input
								type="text"
								value={searchName}
								onChange={(e) => setSearchName(e.target.value)}
								placeholder="Qidirish..."
								className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
							/>
						</div>

						<div className="space-y-1">
							<label className="text-sm font-medium text-gray-700 flex items-center gap-2">
								<FaPercent className="text-blue-500" />
								Foizi bo'yicha
							</label>
							<input
								type="number"
								value={filterPercentage}
								onChange={(e) => setFilterPercentage(e.target.value)}
								placeholder="65%"
								className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
								min="0"
								max="100"
							/>
						</div>

						<div className="space-y-1">
							<label className="text-sm font-medium text-gray-700 flex items-center gap-2">
								<FaFilter className="text-blue-500" />
								Holati
							</label>
							<select
								value={paymentStatus}
								onChange={(e) => setPaymentStatus(e.target.value)}
								className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
							>
								<option value="all">Barcha to'lovlar</option>
								<option value="paid">To'liq to'langanlar</option>
								<option value="partial">Qisman to'langanlar</option>
								<option value="unpaid">To'lanmaganlar</option>
							</select>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1">
								<label className="text-sm font-medium text-gray-700 flex items-center gap-2">
									<FaCalendarAlt className="text-blue-500" />
									Yil
								</label>
								<input
									type="number"
									value={year}
									onChange={(e) => setYear(Number(e.target.value))}
									className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
									min={2000}
									max={2100}
								/>
							</div>

							<div className="space-y-1">
								<label className="text-sm font-medium text-gray-700 flex items-center gap-2">
									<FaCalendarAlt className="text-blue-500" />
									Oy
								</label>
								<select
									value={month}
									onChange={(e) => setMonth(Number(e.target.value))}
									className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
								>
									{[
										{ value: 1, name: "Yanvar" }, { value: 2, name: "Fevral" },
										{ value: 3, name: "Mart" }, { value: 4, name: "Aprel" },
										{ value: 5, name: "May" }, { value: 6, name: "Iyun" },
										{ value: 7, name: "Iyul" }, { value: 8, name: "Avgust" },
										{ value: 9, name: "Sentabr" }, { value: 10, name: "Oktabr" },
										{ value: 11, name: "Noyabr" }, { value: 12, name: "Dekabr" }
									].map(({ value, name }) => (
										<option key={value} value={value}>{name}</option>
									))}
								</select>
							</div>
						</div>
					</div>

					{/* Jadval ma'lumotlari */}
					<div className="flex flex-wrap justify-between items-center mb-4">
						<div className="text-sm text-gray-600">
							Jami: <span className="font-bold">{filteredPayments.length}</span> ta to'lov
							{filterPercentage && ` (${filterPercentage}% dan kam)`}
						</div>

						<button
							onClick={() => exportToExcel('filtered')}
							className="text-green-600 bg-gray-300 hover:text-green-800 text-sm flex items-center gap-1 mt-2 md:mt-0"
						>
							<FaFileExcel /> Yuklash
						</button>
					</div>
				</div>

				{/* Jadval qismi */}
				{loading ? (
					<div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-sm">
						<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
						<span className="ml-3 text-gray-600">Ma'lumotlar yuklanmoqda...</span>
					</div>
				) : filteredPayments.length === 0 ? (
					<div className="bg-white rounded-xl shadow-sm p-8 text-center border border-dashed border-gray-300">
						<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
							<FaSearch className="text-xl" />
						</div>
						<h3 className="text-lg font-semibold text-gray-700 mb-2">To'lovlar topilmadi</h3>
						<p className="text-gray-600">
							{filterPercentage
								? `${filterPercentage}% dan kam to'langan talabalar topilmadi`
								: paymentStatus !== 'all'
									? `${paymentStatus === 'paid' ? "To'liq to'langan" : paymentStatus === 'partial' ? "Qisman to'langan" : "To'lanmagan"} talabalar topilmadi`
									: `${year}-yil ${month}-oy uchun to'lovlar mavjud emas`
							}
						</p>
					</div>
				) : (
					<div className="bg-white rounded-xl shadow-sm overflow-hidden">
						<div className="overflow-x-auto">
							<table className="min-w-full">
								<thead className="bg-gray-100">
									<tr>
										<th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Talaba</th>
										<th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Jami To'lov</th>
										<th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">To'langan</th>
										<th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Foiz</th>
										<th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Holat</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{filteredPayments.map((payment) => {
										const percentage = calculatePaymentPercentage(payment.amount_paid, payment.amount_due)
										const statusColor = getStatusColor(percentage)

										return (
											<tr
												key={payment._id}
												className="hover:bg-blue-50 cursor-pointer transition"
												onClick={() => openPaymentModal(payment)}
											>
												<td className="py-3 px-4">
													<div className="flex items-center">
														<div className="bg-blue-100 text-blue-600 rounded-lg p-2 mr-3">
															<FaUser />
														</div>
														<div>
															<div className="font-medium text-gray-900">
																{payment.student?.fullName || 'Noma\'lum'}
															</div>
															<div className="text-xs text-gray-500">
																{payment.student?.phone || 'Telefon yo\'q'}
															</div>
														</div>
													</div>
												</td>
												<td className="py-3 px-4 font-medium text-gray-900">
													{formatCurrency(payment.amount_due)}
												</td>
												<td className="py-3 px-4 text-green-600 font-medium">
													{formatCurrency(payment.amount_paid)}
												</td>
												<td className="py-3 px-4">
													<div className="flex items-center">
														<div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
															<div
																className={`h-2 rounded-full ${percentage === 0 ? 'bg-red-500' :
																	percentage < 50 ? 'bg-orange-500' :
																		percentage < 100 ? 'bg-yellow-500' : 'bg-green-500'
																	}`}
																style={{ width: `${percentage}%` }}
															></div>
														</div>
														<span className="text-sm font-medium">{percentage}%</span>
													</div>
												</td>
												<td className="py-3 px-4">
													<span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
														{percentage === 0
															? "To'lanmagan"
															: percentage < 100
																? "Qisman to'langan"
																: "To'liq to'langan"
														}
													</span>
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

			{/* Modal oynasi (o'zgarmaydi) */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div
						ref={modalRef}
						className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden"
					>
						<div className="bg-blue-500 p-4 text-white">
							<div className="flex justify-between items-center">
								<div>
									<h2 className="text-xl font-bold">
										{selectedPayment.student?.fullName}
									</h2>
									<p className="text-blue-100">
										{selectedPayment.student?.phone || 'Telefon mavjud emas'}
									</p>
								</div>
								<button
									onClick={closeModal}
									className="text-white text-2xl"
								>
									&times;
								</button>
							</div>
						</div>

						<div className="p-6 overflow-y-auto max-h-[60vh]">
							<h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
								<FaHistory className="text-blue-500" />
								To'lov Tarixi
							</h3>

							{historyLoading ? (
								<div className="flex justify-center items-center py-8">
									<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
									<span className="ml-3 text-gray-600">
										To'lov tarixi yuklanmoqda...
									</span>
								</div>
							) : paymentHistory.length === 0 ? (
								<div className="bg-gray-50 rounded-lg p-6 text-center border border-dashed border-gray-300">
									<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 text-gray-600 mb-3">
										<FaInfoCircle />
									</div>
									<p className="text-gray-600">
										Talabaning to'lov tarixi mavjud emas
									</p>
								</div>
							) : (
								<div className="space-y-3">
									{paymentHistory.map((payment) => (
										<div key={payment._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
											<div className="flex justify-between items-start">
												<div>
													<div className="font-medium text-gray-900">
														{formatCurrency(payment.amount)}
													</div>
													<div className="text-sm text-gray-600">
														{formatDate(payment.paidAt)}
													</div>
												</div>
												<div className="text-sm text-gray-700 text-right">
													{payment.comment || 'Izoh mavjud emas'}
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						<div className="bg-gray-100 px-6 py-3 border-t border-gray-200">
							<div className="text-sm text-gray-600">
								Jami to'lovlar: {paymentHistory.length} ta
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default MonthlyPaymentControl