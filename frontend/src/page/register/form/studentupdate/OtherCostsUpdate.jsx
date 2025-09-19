import axios from "axios"
import { useEffect, useState } from "react"
import AddRooms from "./AddRooms"

const OtherCostsUpdate = ({ student }) => {
	const [selectedHostel, setSelectedHostel] = useState(false)
	const [rooms, setRooms] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState("")
	const [success, setSuccess] = useState("")
	const [xizmatlar, setXizmatlar] = useState({
		yotoqxona: [],
		mahsulot: [],
		transport: [],
	})
	const [schoolExpenses, setSchoolExpenses] = useState(student.school_expenses || 0)
	const [showSchoolExpensesInput, setShowSchoolExpensesInput] = useState(!student.school_expenses)

	const studentId = student._id

	useEffect(() => {
		console.log(student)
		const fetchServices = async () => {
			setLoading(true)
			setError("")

			try {
				const [hostelRes, productRes, transportRes] = await Promise.all([
					axios.get(`${import.meta.env.VITE_API_URL}/api/hostel/getAll`),
					axios.get(`${import.meta.env.VITE_API_URL}/api/product/getAll`),
					axios.get(`${import.meta.env.VITE_API_URL}/api/transport/getAll`),
				])

				const selectedIds = {
					hostel: student.hostel?._id,
					product: student.product?._id,
					transport: student.transport?._id,
				}

				setXizmatlar({
					yotoqxona: hostelRes.data.hostels.map(item => ({
						...item,
						tanlangan: item._id === selectedIds.hostel,
						turi: "yotoqxona",
						narx: item.hostelPrice,
					})),
					mahsulot: productRes.data.products.map(item => ({
						...item,
						tanlangan: item._id === selectedIds.product,
						turi: "mahsulot",
						narx: item.productPrice,
					})),
					transport: transportRes.data.transports.map(item => ({
						...item,
						tanlangan: item._id === selectedIds.transport,
						turi: "transport",
						narx: item.transportPrice,
					})),
				})
			} catch (err) {
				setError("Xizmat ma'lumotlari yuklanmadi")
			} finally {
				setLoading(false)
			}
		}

		if (studentId) {
			fetchServices()
		}
	}, [studentId])

	const toggleSelection = (type, id) => {
		setXizmatlar(prev => ({
			...prev,
			[type]: prev[type].map(item =>
				item._id === id ? { ...item, tanlangan: !item.tanlangan } : item
			),
		}))
	}

	const calculateMonthlyPayment = (student) => {
		console.log(student)
		if (!student) return 0
		let total = 0

		// Asosiy fanlar
		if (student.main_subjects?.length > 0) {
			console.log(student.main_subjects)
			total += student.main_subjects.reduce((sum, subj) => sum + (subj.price || 0), 0)
		}

		// Qo'shimcha fanlar
		if (student.additionalSubjects?.length > 0) {
			console.log(student.additionalSubjects)
			total += student.additionalSubjects.reduce((sum, subj) => sum + (subj.price || 0), 0)
		}

		// Xizmatlar
		if (student.hostel?.hostelPrice) total += student.hostel.hostelPrice
		if (student.product?.productPrice) total += student.product.productPrice
		if (student.transport?.transportPrice) total += student.transport.transportPrice

		// Maktab xarajatlari
		if (student.school_expenses) total += student.school_expenses

		return total
	}

	// To'lovni yaratish funksiyasi
	const createPayment = async (studentData) => {
		const monthlyPayment = calculateMonthlyPayment(studentData)
		console.log(monthlyPayment)

		try {
			const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/payment/register-history`, {
				student: studentData._id,
				amount_due: monthlyPayment,
				amount_paid: 0,
				isPaid: false,
				details: []
			})

			if (res.data.success) {
				console.log("To'lov muvaffaqiyatli yaratildi")
				return true
			} else {
				console.error("To'lov yaratishda xatolik:", res.data.message)
				return false
			}
		} catch (error) {
			console.error("To'lovni ro'yxatga olishda xatolik:", error)
			return false
		}
	}

	const handleSubmit = async () => {
		setError("")
		setSuccess("")

		const selectedServices = {
			hostel: xizmatlar.yotoqxona.filter(item => item.tanlangan),
			mahsulot: xizmatlar.mahsulot.filter(item => item.tanlangan),
			transport: xizmatlar.transport.filter(item => item.tanlangan),
		}

		// Yangi updateData obyekti
		const updateData = {
			xizmatlar: selectedServices
		}

		// Agar school_expenses input ko'rsatilgan bo'lsa yoki yangi qiymat kiritilgan bo'lsa
		if (showSchoolExpensesInput || schoolExpenses !== student.school_expenses) {
			updateData.school_expenses = schoolExpenses
		} else if (student.school_expenses) {
			// Agar oldin school_expenses mavjud bo'lsa, uni null qilib yuborish
			updateData.school_expenses = null
		}

		try {
			const res = await axios.put(
				`${import.meta.env.VITE_API_URL}/api/student/other-cost-update/${studentId}`,
				updateData
			)

			if (res.data.success) {
				setSuccess("Xizmatlarga muvaffaqiyatli yozildingiz")

				// Yangilangan talaba ma'lumotlari
				const updatedStudent = res.data.student || student
				console.log(updatedStudent)
				// To'lovni avtomatik yaratish
				const paymentCreated = await createPayment(updatedStudent)

				if (paymentCreated) {
					setSuccess(prev => prev + " va to'lov yaratildi")
				} else {
					setError("Xizmatlar yangilandi, lekin to'lov yaratishda xatolik yuz berdi")
				}

				setSelectedHostel(res.data.isHostel)

				// Agar yotoqxona tanlangan bo'lsa, AddRooms komponentiga o'tamiz
				if (res.data.isHostel) {
					setSelectedHostel(true)
				}
			} else {
				setError(res.data.message || "Noma'lum xatolik yuz berdi")
			}
		} catch (err) {
			setError("Ro'yxatdan o'tishda xatolik yuz berdi")
			console.error(err)
		}
	}

	const allServices = [
		...xizmatlar.mahsulot,
		...xizmatlar.transport,
		...xizmatlar.yotoqxona,
	]

	if (selectedHostel) {
		return <AddRooms onHostel={() => setSelectedHostel(false)} studentId={student._id} />
	}

	return (
		<div className="mx-auto p-4 bg-white rounded-lg shadow-lg border border-gray-200">
			<h2 className="text-xl font-bold text-gray-800 mb-4">Qo'shimcha xizmatlar</h2>
			<p className="text-gray-600 mb-6">Talaba uchun qo'shimcha xizmatlarni tanlang yoki maktab xarajatlarini kiriting.</p>

			{error && (
				<div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4 text-sm">
					{error}
				</div>
			)}

			{success && (
				<div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded mb-4 text-sm">
					{success}
				</div>
			)}

			{loading ? (
				<div className="text-center py-6">
					<div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
					<p className="mt-3 text-gray-600">Ma'lumotlar yuklanmoqda...</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{allServices.length > 0 ? (
						allServices.map(service => (
							<div
								key={service._id}
								className={`p-4 border rounded-lg flex flex-col cursor-pointer transition-all h-full ${service.tanlangan
									? "bg-blue-50 border-blue-400 shadow-sm"
									: "hover:bg-gray-50 border-gray-200"
									}`}
								onClick={() => toggleSelection(service.turi, service._id)}
							>
								<div className="flex items-start mb-3">
									<div
										className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center mr-3 mt-1 ${service.tanlangan
											? "bg-blue-600 border-blue-600"
											: "border-gray-400"
											}`}
									>
										{service.tanlangan && (
											<svg
												className="w-3 h-3 text-white"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={3}
													d="M5 13l4 4L19 7"
												/>
											</svg>
										)}
									</div>

									<div className="flex-1">
										<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
											<h4 className="font-medium text-gray-800 mb-2 sm:mb-0">
												{service.hostelName ||
													service.productName ||
													service.transportName}
											</h4>
											{service.narx && (
												<span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-medium whitespace-nowrap">
													{service.narx.toLocaleString("uz-UZ")} so'm
												</span>
											)}
										</div>
										<p className="text-sm text-gray-600 mt-2">
											{service.description}
										</p>
									</div>
								</div>
							</div>
						))
					) : (
						<div className="col-span-full text-center py-8 border border-dashed rounded-lg bg-gray-50">
							<div className="text-gray-400 mb-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-12 w-12 mx-auto"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={1}
										d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
							<p className="text-gray-500">Hech qanday xizmat topilmadi</p>
						</div>
					)}
				</div>
			)}
			{/* Maktab xarajatlari inputi - faqat school_expenses mavjud bo'lmaganda ko'rsatiladi */}
			{showSchoolExpensesInput && (
				<div className="mb-6 p-4 w-1/2 bg-gray-50 rounded-lg">
					<h3 className="font-medium text-gray-800 mb-2">Maktab xarajatlari</h3>
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
						<input
							type="number"
							value={schoolExpenses}
							defaultValue={student.monthly_payment}
							onChange={(e) => setSchoolExpenses(Number(e.target.value))}
							className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
							placeholder="Maktab xarajatlarini kiriting"
						/>
						<span className="text-gray-600 whitespace-nowrap mt-2 sm:mt-0">so'm</span>
					</div>
					<p className="text-sm text-gray-500 mt-2">Kelishilgan narxni kiriting</p>
				</div>
			)}

			<div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t">
				<button
					onClick={handleSubmit}
					className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm w-full sm:w-auto"
				>
					Yangilash
				</button>
			</div>
		</div>
	)
}

export default OtherCostsUpdate