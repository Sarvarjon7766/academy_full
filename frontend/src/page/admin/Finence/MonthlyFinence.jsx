import axios from 'axios'
import { useEffect, useState } from 'react'

const MonthlyFinance = () => {
	const [stats, setStats] = useState(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/payment/getMonth`)
				if (res.data.success) {
					setStats(res.data.stats)
				}
			} catch (error) {
				console.error('Ma\'lumotlarni yuklashda xatolik:', error)
			} finally {
				setLoading(false)
			}
		}
		fetchData()
	}, [])

	// Format date function
	const formatDate = (dateString) => {
		const options = { day: 'numeric', month: 'long', year: 'numeric' }
		return new Date(dateString).toLocaleDateString('uz-UZ', options)
	}

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
				<p className="mt-4 text-gray-600">Ma'lumotlar yuklanmoqda...</p>
			</div>
		)
	}

	if (!stats) {
		return (
			<div className="flex flex-col items-center justify-center h-96 text-center p-6">
				<div className="text-6xl mb-4">📊</div>
				<h2 className="text-2xl font-bold text-gray-700 mb-2">Bu oy uchun hali statistika chiqarilmagan</h2>
				<p className="text-gray-500">Joriy oy uchun ma'lumotlar mavjud emas. Iltimos, keyinroq tekshirib ko'ring.</p>
			</div>
		)
	}

	return (
		<div className="mx-auto p-4 md:p-6">

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
				<div className="bg-white rounded-xl p-5 shadow-md flex items-center border-l-4 border-blue-500">
					<div className="text-3xl mr-4">💰</div>
					<div>
						<h3 className="text-sm text-gray-500">Jami Balans</h3>
						<p className={`text-lg font-bold ${stats.totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
							{stats.totalAmount.toLocaleString('uz-UZ')} so'm
						</p>
					</div>
				</div>

				<div className="bg-white rounded-xl p-5 shadow-md flex items-center border-l-4 border-green-500">
					<div className="text-3xl mr-4">⬇️</div>
					<div>
						<h3 className="text-sm text-gray-500">Kirim</h3>
						<p className="text-lg font-bold text-green-600">
							+{stats.positiveAmount.toLocaleString('uz-UZ')} so'm
						</p>
					</div>
				</div>

				<div className="bg-white rounded-xl p-5 shadow-md flex items-center border-l-4 border-red-500">
					<div className="text-3xl mr-4">⬆️</div>
					<div>
						<h3 className="text-sm text-gray-500">Chiqim</h3>
						<p className="text-lg font-bold text-red-600">
							-{Math.abs(stats.negativeAmount).toLocaleString('uz-UZ')} so'm
						</p>
					</div>
				</div>

				<div className="bg-white rounded-xl p-5 shadow-md flex items-center border-l-4 border-purple-500">
					<div className="text-3xl mr-4">📊</div>
					<div>
						<h3 className="text-sm text-gray-500">Tranzaksiyalar</h3>
						<p className="text-lg font-bold text-gray-700">{stats.totalTransactions} ta</p>
					</div>
				</div>
			</div>

			<div className="bg-white rounded-xl shadow-md overflow-hidden">
				<h2 className="text-xl font-semibold p-5 border-b bg-gray-50 text-gray-800">Oxirgi Tranzaksiyalar</h2>
				<div className="divide-y">
					{stats.transactions.map((transaction) => (
						<div key={transaction._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors">
							<div className="flex items-center mb-3 md:mb-0 flex-1">
								<div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold mr-3">
									{transaction.student ? transaction.student.fullName.split(' ').map(n => n[0]).join(''):"-"}
								</div>
								<div>
									<h4 className="font-medium text-gray-800">{transaction.student && transaction.student.fullName}</h4>
									<p className="text-sm text-gray-500">{transaction.student && transaction.student.phone}</p>
								</div>
							</div>
							<div className={`text-lg font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
								{transaction.amount >= 0 ? '+' : ''}{transaction.amount.toLocaleString('uz-UZ')} so'm
							</div>
							
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

export default MonthlyFinance