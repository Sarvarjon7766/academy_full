import axios from 'axios'
import { useEffect, useState } from 'react'
import { FaArrowRight, FaBed, FaCheck, FaHotel, FaSearch, FaSpinner, FaTimes, FaUserFriends } from 'react-icons/fa'

const RoomAttachment = ({ studentId, onHotelChange }) => {
	const [rooms, setRooms] = useState([])
	const [error, setError] = useState('')
	const [selectedRoom, setSelectedRoom] = useState(null)
	const [selectedBedIndex, setSelectedBedIndex] = useState(null)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [assignedRoom, setAssignedRoom] = useState(null)
	const [isLoading, setIsLoading] = useState(true)
	const [searchTerm, setSearchTerm] = useState('')
	const [isCheckingAssignment, setIsCheckingAssignment] = useState(true)

	// Talabaning yotoqxona holatini tekshirish
	useEffect(() => {
		const checkStudentAssignment = async () => {
			try {
				const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/room/check-student/${studentId}`)

				if (res.data.success && res.data.room) {
					setAssignedRoom(res.data.room)
					// Agar talaba allaqachon biriktirilgan bo'lsa, keyingi qadamga o'tamiz
					setTimeout(() => {
						onHotelChange()
					}, 1500)
				}
			} catch (err) {
				console.error("Talaba holatini tekshirishda xatolik:", err)
				setError("Talaba holatini tekshirishda xatolik yuz berdi.")
			} finally {
				setIsCheckingAssignment(false)
			}
		}

		if (studentId) {
			checkStudentAssignment()
		}
	}, [studentId, onHotelChange])

	// Xonalarni yuklash
	useEffect(() => {
		if (!isCheckingAssignment) {
			fetchRooms()
		}
	}, [isCheckingAssignment])

	const fetchRooms = async () => {
		setIsLoading(true)
		try {
			const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/room/getAll`)
			if (res.data.success) {
				setRooms(res.data.data)
			} else {
				setError(res.data.message || "Xonalarni olishda xatolik")
			}
		} catch (err) {
			console.error("Xonalarni olishda xatolik:", err)
			setError("Xonalarni olishda xatolik yuz berdi.")
		} finally {
			setIsLoading(false)
		}
	}

	// Yotoq bosilganda
	const handleBedClick = (room, bedIndex) => {
		if (assignedRoom) {
			return // Agar allaqachon biriktirilgan bo'lsa, hech narsa qilmaymiz
		}

		if (room.beds[bedIndex] && room.beds[bedIndex].includes("bo'sh")) {
			setSelectedRoom(room)
			setSelectedBedIndex(bedIndex)
			setIsModalOpen(true)
		}
	}

	// Biriktirish
	const handleAssignBed = async () => {
		try {
			const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/room/add-hotel/${studentId}`, {
				roomNumber: selectedRoom.roomNumber,
				bedIndex: selectedBedIndex,
			})

			if (res.data.success) {
				setIsModalOpen(false)
				// Yangi ma'lumotlarni yuklash
				const assignedRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/room/check-student/${studentId}`)
				if (assignedRes.data.success && assignedRes.data.room) {
					setAssignedRoom(assignedRes.data.room)
					// Keyingi qadamga o'tish
					onHotelChange()
				}
			} else {
				setError(res.data.message || "Biriktirishda xatolik")
			}
		} catch (err) {
			console.error("Biriktirishda xatolik:", err)
			setError("Yotoqqa biriktirishda xatolik yuz berdi.")
		}
	}

	// Yotoq holati klassini olish
	const getBedStatusClass = (bed) => {
		if (!bed) return "bg-gray-100 text-gray-700 border-gray-300 cursor-not-allowed"
		if (bed.includes("bo'sh")) return "bg-green-100 text-green-700 border-green-300 hover:bg-green-200 cursor-pointer"
		if (bed.includes("band")) return "bg-blue-100 text-blue-700 border-blue-300 cursor-not-allowed"
		return "bg-gray-100 text-gray-700 border-gray-300 cursor-not-allowed"
	}

	// Agar talaba holati tekshirilayotgan bo'lsa, loading ko'rsatish
	if (isCheckingAssignment) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[400px]">
				<div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4 flex items-center justify-center">
					<FaSpinner className="text-blue-500 text-xl" />
				</div>
				<p className="text-lg text-gray-600">Talaba holati tekshirilmoqda...</p>
			</div>
		)
	}

	// Agar talaba allaqachon biriktirilgan bo'lsa
	if (assignedRoom) {
		return (
			<div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
				<div className="text-center mb-6">
					<div className="bg-green-100 text-green-800 rounded-full p-4 inline-flex items-center justify-center mb-4">
						<FaCheck className="text-2xl" />
					</div>
					<h2 className="text-2xl font-bold text-green-700 mb-2">Talaba Yotoqxonaga Biriktirilgan</h2>
					<p className="text-gray-600">
						Talaba allaqachon <strong>{assignedRoom.roomNumber}-xonaga</strong> biriktirilgan.
						Keyingi bosqichga o'tilmoqda...
					</p>
				</div>
				<div className="flex justify-center">
					<div className="animate-pulse flex items-center text-blue-600">
						<FaArrowRight className="mr-2" />
						<span>Keyingi bosqichga o'tish</span>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="max-w-7xl mx-auto p-4">
			<div className="text-center mb-8">
				<div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 inline-block mb-6">
					<div className="flex items-center justify-center gap-3">
						<FaHotel className="text-3xl" />
						<h1 className="text-2xl sm:text-4xl font-extrabold">
							Mehmonxona Xonalarini Boshqarish
						</h1>
					</div>
					<p className="mt-2 opacity-90">Bo'sh yotoqlarni tanlab talabalarni biriktiring</p>
				</div>
			</div>

			{error && (
				<div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg flex items-center">
					<FaTimes className="mr-2 text-red-500" />
					{error}
				</div>
			)}

			<div className="bg-white rounded-xl shadow-md p-5 mb-8">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div className="relative flex-1">
						<input
							type="text"
							placeholder="Xona raqami yoki yotoqni qidirish..."
							className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
						<FaSearch className="absolute left-3 top-3.5 text-gray-400" />
					</div>

					<div className="flex items-center gap-3">
						<div className="flex items-center">
							<div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
							<span className="text-sm">Bo'sh</span>
						</div>
						<div className="flex items-center">
							<div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
							<span className="text-sm">Band</span>
						</div>
						<div className="flex items-center">
							<div className="w-4 h-4 bg-gray-500 rounded-full mr-2"></div>
							<span className="text-sm">Boshqa</span>
						</div>
					</div>
				</div>
			</div>

			{isLoading ? (
				<div className="flex flex-col items-center justify-center min-h-[300px]">
					<div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
					<p className="text-lg text-gray-600">Xonalar ma'lumotlari yuklanmoqda...</p>
				</div>
			) : (
				<>
					{rooms.length > 0 ? (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{rooms.map(room => (
								<div key={room._id} className="bg-gradient-to-br from-white to-blue-50 border border-gray-200 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
									<div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50">
										<div className="flex items-center justify-between mb-3">
											<h2 className="text-xl font-bold text-blue-800 flex items-center">
												<FaHotel className="mr-2" />
												Xona #{room.roomNumber}
											</h2>
											<span className="bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full shadow">
												{room.roomCapacity} kishi
											</span>
										</div>

										<div className="flex items-center text-sm text-gray-600 mb-4">
											<FaUserFriends className="mr-2" />
											<span>{room.roomCapacity - room.beds.filter(bed => bed && bed.includes("bo'sh")).length}/{room.roomCapacity} band</span>
										</div>
									</div>

									<div className="p-5">
										<h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
											<FaBed className="mr-2 text-blue-600" />
											Yotoqlar:
										</h3>

										<div className="grid grid-cols-2 gap-3">
											{room.beds.map((bed, index) => (
												<div
													key={index}
													onClick={() => handleBedClick(room, index)}
													className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center
                            ${getBedStatusClass(bed)}`}
												>
													<div className="text-lg font-bold">#{index + 1}</div>
													<div className="text-sm text-center mt-1">{bed}</div>
												</div>
											))}
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50">
							<div className="text-gray-400 mb-4">
								<svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<h3 className="text-xl font-medium text-gray-700 mb-2">Hech qanday xona topilmadi</h3>
							<p className="text-gray-500">Boshqa qidiruv so'rovi yoki boshqa filtrni sinab ko'ring</p>
						</div>
					)}
				</>
			)}

			{/* MODAL */}
			{isModalOpen && selectedRoom && (
				<div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex justify-center items-center p-4">
					<div className="bg-white rounded-2xl overflow-hidden w-full max-w-md shadow-2xl animate-pop-in">
						<div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white">
							<h2 className="text-xl font-bold flex items-center">
								<FaBed className="mr-2" />
								Yotoqni biriktirish
							</h2>
						</div>

						<div className="p-6">
							<div className="flex flex-col items-center mb-6">
								<div className="bg-blue-100 text-blue-800 rounded-full p-4 mb-4">
									<FaBed className="text-3xl" />
								</div>
								<p className="text-gray-700 text-center">
									<strong className="text-lg">{selectedRoom.roomNumber}-xona</strong>ning <br />
									<strong className="text-xl">{selectedBedIndex + 1}-yotog'iga</strong> talabani biriktirmoqchimisiz?
								</p>
							</div>

							<div className="flex justify-center gap-4">
								<button
									className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition flex items-center shadow"
									onClick={() => setIsModalOpen(false)}
								>
									<FaTimes className="mr-2" />
									Bekor qilish
								</button>
								<button
									className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center shadow"
									onClick={handleAssignBed}
								>
									<FaCheck className="mr-2" />
									Biriktirish
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default RoomAttachment