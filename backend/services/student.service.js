const { default: mongoose, Types } = require('mongoose')
const studentModel = require('../modules/student.model')
const subjectModel = require('../modules/subject.model')
const StudentSubjectService = require('./studentSubject.service')
const groupService = require('../services/group.service')
const jwt = require('jsonwebtoken')
const attandanceModel = require('../modules/attandance.model')
const attandanceService = require('./attandance.service')
const groupModel = require('../modules/group.model')
const roomsModel = require('../modules/rooms.model')
const GroupService = require('./group.service')
studentpaymentModel = require('../modules/StudentPayment.model')
const { ObjectId } = mongoose.Types

class StudentService {

	async createPersonal(data) {
		try {
			const login = data.login
			const exsistStudent = await studentModel.findOne({ login })
			if (!exsistStudent) {
				const student = await studentModel.create(data)
				if (student) {
					return { success: true, message: "Student yaratildi", studentId: student._id }
				} else {
					return { success: false, message: "student yaratishda xatolik", studentId: null }
				}
			}

		} catch (error) {
			console.error("Xatolik:", error)
			return { success: false, message: "Ichki xatolik yuz berdi", studentId: null }
		}
	}
	async updatePersonal(sId, data) {
		try {
			const { studentId } = sId
			console.log('Kelgan data:', data)
			const exsistStudent = await studentModel.findById(studentId).populate('groups.teacherId', 'fullName')
				.populate({
					path: 'groups.group',
					select: 'groupName'
				})
				.populate('main_subjects.subjectId', 'subjectName')
				.populate('additionalSubjects.subjectId', 'subjectName')
				.populate({
					path: 'hostel',
					select: 'hostelName hostelPrice',
					options: { strictPopulate: false }, // optional
				})
				.populate({
					path: 'product',
					select: 'productName productPrice',
					options: { strictPopulate: false },
				})
				.populate({
					path: 'transport',
					select: 'transportName transportPrice',
					options: { strictPopulate: false },
				})
			if (!exsistStudent) {
				return { message: 'Student topilmadi' }

			}
			Object.keys(data).forEach((key) => {
				exsistStudent[key] = data[key]
			})
			await exsistStudent.save()
			console.log('Yangilangan student:', exsistStudent)
			return { success: true, message: 'Student yangilandi', student: exsistStudent }
		} catch (error) {
			console.error("Xatolik:", error)
			return { success: false, message: "Ichki xatolik yuz berdi", studentId: null }
		}
	}
	async addMainSubjects(sId, data) {
		try {
			const { subjects } = data
			if (!mongoose.Types.ObjectId.isValid(sId)) {
				return { success: false, message: "❌ Noto'g'ri talabani ID kiritildi" }
			}
			if (!Array.isArray(subjects) || subjects.length === 0) {
				return { success: false, message: "❌ Fanlar ro'yxati bo'sh yoki noto'g'ri" }
			}
			const student = await studentModel.findById(sId)
			if (!student) {
				return { success: false, message: "❌ Talaba topilmadi" }
			}
			const oldsubjects = student.main_subjects
			const main_subjects = subjects.map(subject => ({
				subjectId: new mongoose.Types.ObjectId(subject.subjectId),
				price: Number(subject.price),
				groupId: subject.groupId ? new mongoose.Types.ObjectId(subject.groupId) : null,
				teacherId: subject.teacherId ? new mongoose.Types.ObjectId(subject.teacherId) : null
			}))
			const now = new Date()
			const main_subject_history = subjects.map(subject => ({
				subjectId: new mongoose.Types.ObjectId(subject.subjectId),
				price: Number(subject.price),
				groupId: subject.groupId ? new mongoose.Types.ObjectId(subject.groupId) : null,
				teacherId: subject.teacherId ? new mongoose.Types.ObjectId(subject.teacherId) : null,
				fromDate: now,
				toDate: null
			}))
			const newGroups = subjects.map(subject => ({
				group: subject.groupId ? new mongoose.Types.ObjectId(subject.groupId) : null,
				type: 'main',
				teacherId: subject.teacherId ? new mongoose.Types.ObjectId(subject.teacherId) : null
			}))

			student.main_subjects = main_subjects
			student.groups = student.groups.filter(g => g.type !== 'main').concat(newGroups)
			student.main_subject_history = main_subject_history

			await student.save()

			if (newGroups.length > 0) {
				console.log(newGroups)
				const addgroup = await groupService.studentAddGroup(student._id, oldsubjects, newGroups)
				if (!addgroup.success) {
					return { success: false, message: "⚠️ Guruhlarga qo'shishda xatolik yuz berdi" }
				}
			}

			return { success: true, message: "✅ Talaba muvaffaqiyatli ro'yxatdan o'tkazildi" }
		} catch (error) {
			console.error("🔥 Ichki xatolik:", error)
			return { success: false, message: "❌ Ichki xatolik yuz berdi" }
		}
	}


	async updateMainSubjects(sId, data) {
		try {
			const { newsubjects } = data
			const now = new Date()

			if (!ObjectId.isValid(sId)) {
				throw new Error("Noto'g'ri studentId: " + sId)
			}

			const studentId = new ObjectId(sId)
			const student = await studentModel.findById(studentId).lean()

			// === 1. Tarixdagi ochiq yozuvlarni yopish ===
			const updates = []
			for (let historyItem of student.main_subject_history) {
				const toDateIsZero = !historyItem.toDate || historyItem.toDate === 0 || historyItem.toDate === "0"
				if (!toDateIsZero) continue

				const match = student.main_subjects.some(mainItem =>
					mainItem.subjectId.toString() === historyItem.subjectId.toString() &&
					mainItem.teacherId.toString() === historyItem.teacherId.toString() &&
					mainItem.groupId.toString() === historyItem.groupId.toString()
				)

				if (match) {
					updates.push({
						_id: historyItem._id,
						update: { toDate: now }
					})
				}
			}

			for (let item of updates) {
				await studentModel.updateOne(
					{ _id: studentId, "main_subject_history._id": item._id },
					{ $set: { "main_subject_history.$.toDate": item.update.toDate } }
				)
			}

			// === 2. Eski main_subjects ni tozalash ===
			await studentModel.updateOne(
				{ _id: studentId },
				{ $set: { main_subjects: [] } }
			)

			// === 3. Eski "main" tipidagi guruhlardan olib tashlash ===
			const allMainGroupIds = student.groups
				?.filter(g => g.type === "main")
				?.map(g => g.group)

			if (allMainGroupIds?.length > 0) {
				await groupModel.updateMany(
					{ _id: { $in: allMainGroupIds } },
					{ $pull: { students: studentId } }
				)
			}

			await studentModel.updateOne(
				{ _id: studentId },
				{ $pull: { groups: { type: "main" } } }
			)

			// === 4. Yangi fanlarni va tarixini qo‘shish ===
			const mainSubjectsToInsert = []
			const mainSubjectsHistoryToInsert = []

			for (let subj of newsubjects) {
				const { subjectId, teacherId, groupId, price } = subj
				if (![subjectId, teacherId, groupId].every(ObjectId.isValid)) {
					throw new Error("Noto'g'ri ID (subjectId, teacherId yoki groupId): " + JSON.stringify(subj))
				}

				const subjectObj = {
					subjectId: new ObjectId(subjectId),
					teacherId: new ObjectId(teacherId),
					groupId: new ObjectId(groupId),
					price: Number(price),
				}

				mainSubjectsToInsert.push(subjectObj)
				mainSubjectsHistoryToInsert.push({
					...subjectObj,
					fromDate: now,
					toDate: null
				})
			}

			await studentModel.updateOne(
				{ _id: studentId },
				{
					$push: {
						main_subjects: { $each: mainSubjectsToInsert },
						main_subject_history: { $each: mainSubjectsHistoryToInsert }
					}
				}
			)

			// === 5. Yangi guruhlarga qo‘shish ===
			const newGroups = newsubjects.map(subj => ({
				group: new ObjectId(subj.groupId),
				teacherId: new ObjectId(subj.teacherId),
				type: "main"
			}))

			await studentModel.updateOne(
				{ _id: studentId },
				{ $push: { groups: { $each: newGroups } } }
			)

			const newGroupIds = newsubjects.map(subj => new ObjectId(subj.groupId))
			await groupModel.updateMany(
				{ _id: { $in: newGroupIds } },
				{ $addToSet: { students: studentId } }
			)

			return { success: true, message: "Main subjects va guruhlar yangilandi" }

		} catch (error) {
			console.error("updateMainSubjects xatosi:", error)
			return { success: false, message: "Ichki xatolik yuz berdi" }
		}
	}




	async MainSubject(sId) {
		try {
			const studentId = new mongoose.Types.ObjectId(sId)

			const student = await studentModel.findById(studentId)
				.populate('main_subjects.subjectId')
				.populate('main_subjects.groupId')
				.populate('main_subjects.teacherId')
				.populate('main_subject_history.subjectId')
				.populate('main_subject_history.groupId')
				.populate('main_subject_history.teacherId')

			if (!student) {
				return { success: false, message: "Talaba topilmadi" }
			}

			return {
				success: true,
				message: "Main subjectlar olindi",
				main_subjects: student.main_subjects,
				main_subject_history: student.main_subject_history
			}
		} catch (error) {
			console.error("Xatolik:", error)
			return { success: false, message: "Ichki xatolik yuz berdi" }
		}
	}
	async MainHistory(sId) {
		try {
			const studentId = new mongoose.Types.ObjectId(sId)

			const student = await studentModel.findById(studentId)
				.populate('main_subject_history.subjectId')
				.populate('main_subject_history.groupId')
				.populate('main_subject_history.teacherId')

			if (!student) {
				return { success: false, message: "Talaba topilmadi" }
			}

			return {
				success: true,
				message: "Main subjectlar olindi",
				main_subject_history: student.main_subject_history
			}
		} catch (error) {
			console.error("Xatolik:", error)
			return { success: false, message: "Ichki xatolik yuz berdi" }
		}
	}
	async addAdditionalSub(sId, data) {
		try {
			const { sunday, subjects } = data
			const { studentId } = sId

			if (!mongoose.Types.ObjectId.isValid(studentId)) {
				return { success: false, message: "Noto'g'ri talabani ID kiritildi" }
			}

			const student = await studentModel.findById(studentId)
			if (!student) {
				return { success: false, message: "Talaba topilmadi" }
			}
			const oldsubjects = student.additionalSubjects

			if (sunday === false) {
				if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
					return { success: false, message: "Fanlar ro'yxati bo'sh yoki noto'g'ri" }
				}

				const now = new Date()

				// Yangi fanlar
				const newAdditionalSubjects = subjects.map(sub => ({
					subjectId: new mongoose.Types.ObjectId(sub.subjectId),
					price: sub.price || 0,
					groupId: sub.groupId ? new mongoose.Types.ObjectId(sub.groupId) : null,
					teacherId: sub.teacherId ? new mongoose.Types.ObjectId(sub.teacherId) : null,
				}))

				// Yangi guruhlar
				const newGroups = subjects
					.filter(sub => sub.groupId)
					.map(sub => ({
						group: new mongoose.Types.ObjectId(sub.groupId),
						type: 'additional',
						teacherId: sub.teacherId ? new mongoose.Types.ObjectId(sub.teacherId) : null,
					}))

				// Eski additional guruhlarni o'chirish
				const oldAdditionalGroups = (student.groups || []).filter(g => g.type === 'additional')
				if (oldAdditionalGroups.length > 0) {
					await groupService.studentRemoveGroups(student._id, oldAdditionalGroups) // studentRemoveGroups -> studentRemoveGroup
				}

				// Tarixni yangilash
				const updatedSubjectIds = newAdditionalSubjects.map(item => item.subjectId.toString())
				student.additional_subject_history = (student.additional_subject_history || []).map(entry => {
					if (!entry.toDate && updatedSubjectIds.includes(entry.subjectId.toString())) {
						return { ...entry.toObject(), toDate: now }
					}
					return entry
				})

				// Yangi tarix yozuvlari
				const newHistoryEntries = newAdditionalSubjects.map(item => ({
					subjectId: item.subjectId,
					price: item.price,
					groupId: item.groupId,
					teacherId: item.teacherId,
					fromDate: now,
					toDate: null // toDate qo'shildi
				}))

				// Yangilash
				student.additionalSubjects = newAdditionalSubjects
				student.groups = [
					...(student.groups || []).filter(g => g.type !== 'additional'),
					...newGroups
				]
				student.additional_subject_history = [
					...(student.additional_subject_history || []),
					...newHistoryEntries
				]

				await student.save()

				if (newGroups.length > 0) {
					const addGroupResult = await groupService.studentAddGroup(student._id, oldsubjects, newGroups)
					if (!addGroupResult.success) {
						return { success: false, message: "Guruhlarni qo'shishda xatolik yuz berdi" }
					}
				}

				return { success: true, message: "Talabaga fanlar muvaffaqiyatli yangilandi" }
			} else {
				student.sunday = true
				await student.save()
				return { success: true, message: "Student muvaffaqiyatli yangilandi (yakshanba)" }
			}
		} catch (error) {
			console.error("Xatolik:", error.message || error)
			return { success: false, message: "Ichki xatolik yuz berdi" }
		}
	}

	async UpdateAdditionalSub(sId, data) {
		try {
			const now = new Date()
			const { sunday, subjects } = data

			// Studentni olish
			const student = await studentModel.findById(new mongoose.Types.ObjectId(sId.studentId))
			if (!student) {
				return { success: false, message: "Talaba topilmadi" }
			}

			const additionalSubjects = student.additionalSubjects || []
			const additional_subject_history = student.additional_subject_history || []
			const studentGroups = student.groups || []

			// Helper: history yozuvlarni yopish (toDate qo'yish)
			function closeOpenHistories(subjectsList) {
				subjectsList.forEach(subj => {
					const histIndex = additional_subject_history.findIndex(hist =>
						hist.subjectId.toString() === subj.subjectId.toString() &&
						hist.teacherId.toString() === subj.teacherId.toString() &&
						hist.groupId.toString() === subj.groupId.toString() &&
						!hist.toDate
					)
					if (histIndex !== -1) {
						additional_subject_history[histIndex].toDate = now
					}
				})
			}

			if (sunday) {
				closeOpenHistories(additionalSubjects)

				const additionalGroupIds = additionalSubjects.map(subj => subj.groupId.toString())

				const updatedGroups = studentGroups.filter(grp =>
					!(grp.type === "additional" && additionalGroupIds.includes(grp.group.toString()))
				)

				const removedGroupIds = studentGroups
					.filter(grp => grp.type === "additional" && additionalGroupIds.includes(grp.group.toString()))
					.map(grp => grp.group.toString())

				await Promise.all(
					removedGroupIds.map(groupId =>
						groupModel.updateOne(
							{ _id: groupId },
							{ $pull: { students: student._id } }
						)
					)
				)

				student.groups = updatedGroups

				// YANGI QO'SHILGAN QATOR: additionalSubjects ni tozalash
				student.additionalSubjects = []

				student.additional_subject_history = additional_subject_history
				student.sunday = true

				await student.save()

				return { success: true, message: "Yangilash muvaffaqiyatli bajarildi" }
			}
			else {
				// Sunday false holat

				closeOpenHistories(additionalSubjects)

				// Yangi history yozuvlar qo'shish
				subjects.forEach(subj => {
					additional_subject_history.push({
						subjectId: new mongoose.Types.ObjectId(subj.subjectId),
						teacherId: new mongoose.Types.ObjectId(subj.teacherId),
						groupId: new mongoose.Types.ObjectId(subj.groupId),
						price: subj.price,
						fromDate: now,
						toDate: null,
						_id: new mongoose.Types.ObjectId()
					})
				})

				// Studentning groups ichidan 'additional' turdagi guruhlarni olib tashlash
				const filteredGroups = studentGroups.filter(grp => grp.type !== "additional")

				// Yangi additional guruhlar yaratish
				const newAdditionalGroups = subjects.map(subj => ({
					group: new mongoose.Types.ObjectId(subj.groupId),
					type: "additional",
					teacherId: new mongoose.Types.ObjectId(subj.teacherId),
					_id: new mongoose.Types.ObjectId()
				}))

				student.groups = [...filteredGroups, ...newAdditionalGroups]

				// additionalSubjects ni yangilash
				student.additionalSubjects = subjects.map(subj => ({
					subjectId: new mongoose.Types.ObjectId(subj.subjectId),
					teacherId: new mongoose.Types.ObjectId(subj.teacherId),
					groupId: new mongoose.Types.ObjectId(subj.groupId),
					price: subj.price,
					_id: new mongoose.Types.ObjectId()
				}))

				student.additional_subject_history = additional_subject_history

				await student.save()

				// Eskirgan additional guruhlar (oldingi additionalSubjects guruhlari) dan talabani olib tashlash
				const oldAdditionalGroupIds = additionalSubjects.map(subj => subj.groupId.toString())
				await Promise.all(
					oldAdditionalGroupIds.map(groupId =>
						groupModel.updateOne(
							{ _id: groupId },
							{ $pull: { students: student._id } }
						)
					)
				)

				// Yangi kelgan guruhlarga talabani qo'shish
				await Promise.all(
					subjects.map(subj =>
						groupModel.updateOne(
							{ _id: new mongoose.Types.ObjectId(subj.groupId) },
							{ $addToSet: { students: student._id } }
						)
					)
				)

				return { success: true, message: "Sunday false holat muvaffaqiyatli bajarildi" }
			}

		} catch (error) {
			console.error("Xatolik:", error.message || error)
			return { success: false, message: "Ichki xatolik yuz berdi" }
		}
	}


	async AdditionalSubject(sId) {
		try {
			const studentId = new mongoose.Types.ObjectId(sId)

			const student = await studentModel.findById(studentId)
				.populate([
					{
						path: 'additionalSubjects.subjectId',
						select: 'subjectName mainPrice additionalPrice'
					},
					{
						path: 'additionalSubjects.groupId',
						select: 'groupName' // Kerakli maydonlar, o'zgartiring
					},
					{
						path: 'additionalSubjects.teacherId',
						select: 'fullName' // Kerakli maydonlar, o'zgartiring
					}
				])

			if (!student) {
				return { success: false, message: "Talaba topilmadi" }
			}

			// additionalSubjects ni kerakli formatga keltirish
			const formattedSubjects = student.additionalSubjects.map(item => ({
				_id: item.subjectId._id,
				subjectName: item.subjectId.subjectName,
				price: item.price,
				mainPrice: item.subjectId.mainPrice,
				additionalPrice: item.subjectId.additionalPrice,
				group: item.groupId ? {
					_id: item.groupId._id,
					groupName: item.groupId.groupName
				} : null,
				teacher: item.teacherId ? {
					_id: item.teacherId._id,
					fullName: item.teacherId.fullName
				} : null
			}))

			return { success: true, data: formattedSubjects }

		} catch (error) {
			console.error("Xatolik:", error.message || error)
			return { success: false, message: "Ichki xatolik yuz berdi" }
		}
	}


	async AddMonthlyPayment(sId, data, price) {
		try {
			if (!sId || !sId.studentId) {
				return { success: false, message: "Student ID is missing" }
			}

			const now = new Date()
			const studentId = new mongoose.Types.ObjectId(sId.studentId)

			const { hostel, mahsulot, transport } = data

			if (!Array.isArray(hostel) || !Array.isArray(mahsulot) || !Array.isArray(transport)) {
				return { success: false, message: "Invalid data format for yotoqxona, mahsulot or transport" }
			}

			const student = await studentModel.findById(studentId)
			if (!student) {
				return { success: false, message: "Student not found" }
			}

			function assignService(target, service, key, priceKey) {
				target[key] = service._id
				target[`${key}_history`].push({
					price: service[priceKey],
					fromDate: now,
					toDate: null,
				})
			}

			// xizmatlarni update qilish
			if (hostel.length > 0) {
				assignService(student, hostel[0], 'hostel', 'hostelPrice')
			}

			if (mahsulot.length > 0) {
				assignService(student, mahsulot[0], 'product', 'productPrice')
			}

			if (transport.length > 0) {
				assignService(student, transport[0], 'transport', 'transportPrice')
			}

			// === JAMI NARXNI HISOBLASH ===
			let totalPrice = 0

			// asosiy fanlar
			if (Array.isArray(student.main_subjects)) {
				totalPrice += student.main_subjects.reduce((sum, subj) => sum + (subj.price || 0), 0)
			}

			// qo'shimcha fanlar
			if (Array.isArray(student.additionalSubjects)) {
				totalPrice += student.additionalSubjects.reduce((sum, subj) => sum + (subj.price || 0), 0)
			}

			// hostel narxi (oxirgi tarixdagi narx)
			if (Array.isArray(student.hostel_history) && student.hostel_history.length > 0) {
				const lastHostel = student.hostel_history[student.hostel_history.length - 1]
				totalPrice += lastHostel.price || 0
			}

			// mahsulot narxi
			if (Array.isArray(student.product_history) && student.product_history.length > 0) {
				const lastProduct = student.product_history[student.product_history.length - 1]
				totalPrice += lastProduct.price || 0
			}

			// transport narxi
			if (Array.isArray(student.transport_history) && student.transport_history.length > 0) {
				const lastTransport = student.transport_history[student.transport_history.length - 1]
				totalPrice += lastTransport.price || 0
			}

			// === YANGI FIELD'LARNI TO'LDIRISH ===
			student.monthly_payment = price            // kelgan price o'zini saqlaymiz
			student.school_expenses = price != 0 ? price - totalPrice : 0  // kelgan price'dan jami hisoblangan narxni ayiramiz

			await student.save()

			return {
				success: true,
				message: "Additional expenses added successfully",
				isHotel: !!student.hostel,
				totalPrice,
				school_expenses: student.school_expenses
			}

		} catch (error) {
			console.error("Error:", error)
			return { success: false, message: "Internal error occurred" }
		}
	}

	async updateOtherCost(sId, data, price) {
		try {
			const { hostel = [], mahsulot = [], transport = [] } = data
			const now = new Date()

			const student = await studentModel.findById(new mongoose.Types.ObjectId(sId.studentId))
			if (!student) {
				throw new Error("Student not found")
			}

			// === HOSTEL UPDATE ===
			const newHostel = hostel[0] || null
			const newHostelId = newHostel ? newHostel._id : null

			if (String(student.hostel) !== String(newHostelId)) {
				// Oldingi hostel tarixini yopish
				if (Array.isArray(student.hostel_history) && student.hostel_history.length > 0) {
					const last = student.hostel_history.at(-1)
					if (!last.toDate) last.toDate = now
				}

				if (newHostelId) {
					console.log("Kvartira")
					console.log(newHostel)
					student.hostel_history.push({
						hostelId: newHostelId,
						price: newHostel.hostelPrice || 0,
						fromDate: now,
						toDate: null,
					})
					student.hostel = newHostelId
				} else {
					// Agar hostel olib tashlansa → xonalardan chiqaramiz
					try {
						const roomsWithStudent = await roomsModel.find({ beds: student._id })
						for (const room of roomsWithStudent) {
							room.beds = room.beds.map(bed =>
								String(bed) === String(student._id) ? null : bed
							)
							await room.save()
						}
					} catch (roomErr) {
						console.warn("Xonalarni yangilashda xatolik:", roomErr.message)
					}
					student.hostel = null
				}
			}

			// === PRODUCT UPDATE ===
			const newProduct = mahsulot[0] || null
			const newProductId = newProduct ? newProduct._id : null

			if (String(student.product) !== String(newProductId)) {
				if (Array.isArray(student.product_history) && student.product_history.length > 0) {
					const last = student.product_history.at(-1)
					if (!last.toDate) last.toDate = now
				}

				if (newProductId) {
					console.log("Oziq ovqat")
					console.log(newProduct)
					student.product_history.push({
						productId: newProductId,
						price: newProduct.productPrice || 0,
						fromDate: now,
						toDate: null,
					})
				}
				student.product = newProductId
			}

			// === TRANSPORT UPDATE ===
			const newTransport = transport[0] || null
			const newTransportId = newTransport ? newTransport._id : null

			if (String(student.transport) !== String(newTransportId)) {
				if (Array.isArray(student.transport_history) && student.transport_history.length > 0) {
					const last = student.transport_history.at(-1)
					if (!last.toDate) last.toDate = now
				}

				if (newTransportId) {
					console.log("Transport")
					console.log(newTransport)
					student.transport_history.push({
						transportId: newTransportId,
						price: newTransport.transportPrice || 0,
						fromDate: now,
						toDate: null,
					})
				}
				student.transport = newTransportId
			}

			let totalPrice = 0

			if (Array.isArray(student.main_subjects)) {
				console.log("asosiy fanlar")
				console.log(student.main_subjects)
				totalPrice += student.main_subjects.reduce((sum, subj) => sum + (subj.price || 0), 0)
			}

			if (Array.isArray(student.additionalSubjects)) {
				console.log("Qo'shimch fanlar")
				console.log(student.additionalSubjects)
				totalPrice += student.additionalSubjects.reduce((sum, subj) => sum + (subj.price || 0), 0)
			}

			if (Array.isArray(student.hostel_history) && student.hostel_history.length > 0) {
				const lastHostel = student.hostel_history.at(-1)
				console.log("Hotel")
				console.log(lastHostel)
				totalPrice += lastHostel.price || 0
			}

			if (Array.isArray(student.product_history) && student.product_history.length > 0) {
				const lastProduct = student.product_history.at(-1)
				console.log("oziq ovqat")
				console.log(lastProduct)
				totalPrice += lastProduct.price || 0
			}

			if (Array.isArray(student.transport_history) && student.transport_history.length > 0) {
				const lastTransport = student.transport_history.at(-1)
				console.log("Transport")
				console.log(lastTransport)
				totalPrice += lastTransport.price || 0
			}
			console.log("Salom Salom Salom Salom Salom ")
			console.log(totalPrice)
			console.log(price)
			console.log("Salom Salom Salom Salom Salom ")
			if (price !== undefined && price !== null && typeof price === "number") {
				if (price === 0) {
					student.monthly_payment = totalPrice + student.school_expenses
					student.school_expenses = student.school_expenses
				} else {
					student.monthly_payment = price
					student.school_expenses = price - totalPrice
				}
			} else {
				student.monthly_payment = totalPrice + student.school_expenses
				student.school_expenses = student.school_expenses
			}

			await student.save()
			const newstudent = await studentModel
				.findById(new mongoose.Types.ObjectId(sId.studentId))
				.populate(["hostel", "product", "transport"])

			console.log(newstudent)


			return {
				success: true,
				message: "Yangilandi",
				isHostel: !!student.hostel,
				totalPrice,
				school_expenses: student.school_expenses,
				student: newstudent
			}
		} catch (error) {
			console.error("Error:", error)
			return { success: false, message: "Internal error occurred" }
		}
	}



	async studentSubjects(sId) {
		try {
			const studentId = sId.studentId
			const student = await studentModel.findById(studentId)
				.populate({
					path: 'main_subjects.subjectId',
					select: 'subjectName mainPrice'
				})
				.populate({
					path: 'additionalSubjects.subjectId',
					select: 'subjectName additionalPrice'
				})
			if (student) {
				return { success: true, student }
			} else {
				return { success: false, data: [], message: "Student topilmadi" }
			}
		} catch (error) {
			console.error(error)
			return { success: false, message: "Ichki xatolik yuz berdi" }
		}
	}

	async getSunday() {
		try {
			const data = await studentModel.find()

			const today = new Date()
			today.setHours(0, 0, 0, 0)

			if (data.length > 0) {
				const checking = await attandanceService.checkingSundayAttandance(true, today)

				if (checking.success) {
					return { success: true, data }
				} else {
					return { success: false, message: checking.message } // xabarni qaytaring
				}
			}

			return { success: true, data } // data bo'sh bo'lsa ham qaytariladi
		} catch (error) {
			console.error("Error fetching Sunday data:", error)
			return { success: false, message: "Serverda xatolik yuz berdi" }
		}
	}

	async login(login, password) {
		try {
			const exsistStudent = await studentModel.findOne({ login })
			if (!exsistStudent) {
				return 'Foydalanuvchi topilmadi'
			}
			if (password == exsistStudent.password) {

				const token = jwt.sign({ id: exsistStudent._id, role: exsistStudent.role }, process.env.SECRET_KEY, { expiresIn: '1h' })
				return { token, success: true }
			}
			return 'parol xato'

		} catch (error) {
			throw new Error(error)
		}
	}

	async getAll() {
		try {
			const exsistStudents = await studentModel
				.find({ status: 'active' })
				.populate('groups.teacherId', 'fullName')
				.populate({
					path: 'groups.group',
					select: 'groupName'
				})
				.populate('main_subjects.subjectId', 'subjectName')
				.populate('main_subjects.teacherId', 'fullName')
				.populate('additionalSubjects.subjectId', 'subjectName')
				.populate({
					path: 'hostel',
					select: 'hostelName hostelPrice',
					options: { strictPopulate: false }, // optional
				})
				.populate({
					path: 'product',
					select: 'productName productPrice',
					options: { strictPopulate: false },
				})
				.populate({
					path: 'transport',
					select: 'transportName transportPrice',
					options: { strictPopulate: false },
				})



			if (!exsistStudents || exsistStudents.length === 0) {
				return { success: false, message: 'Foydalanuvchilar topilmadi' }
			}

			return { success: true, exsistStudents }
		} catch (error) {
			console.error('Xatolik:', error)
			throw new Error(error.message)
		}
	}
	async getAllfull() {
		try {
			const exsistStudents = await studentModel
				.find()
				.populate('groups.teacherId', 'fullName')
				.populate({
					path: 'groups.group',
					select: 'groupName'
				})
				.populate('main_subjects.subjectId', 'subjectName')
				.populate('main_subjects.teacherId', 'fullName')
				.populate('additionalSubjects.subjectId', 'subjectName')
				.populate({
					path: 'hostel',
					select: 'hostelName hostelPrice',
					options: { strictPopulate: false }, // optional
				})
				.populate({
					path: 'product',
					select: 'productName productPrice',
					options: { strictPopulate: false },
				})
				.populate({
					path: 'transport',
					select: 'transportName transportPrice',
					options: { strictPopulate: false },
				})



			if (!exsistStudents || exsistStudents.length === 0) {
				return { success: false, message: 'Foydalanuvchilar topilmadi' }
			}

			return { success: true, exsistStudents }
		} catch (error) {
			console.error('Xatolik:', error)
			throw new Error(error.message)
		}
	}


	async getOne(id) {
		try {
			const student = await studentModel.findById(new mongoose.Types.ObjectId(id)).populate('groups.teacherId', 'fullName')
				.populate({
					path: 'groups.group',
					select: 'groupName'
				})
				.populate('main_subjects.subjectId', 'subjectName')
				.populate('additionalSubjects.subjectId', 'subjectName')
				.populate({
					path: 'hostel',
					select: 'hostelName hostelPrice',
					options: { strictPopulate: false }, // optional
				})
				.populate({
					path: 'product',
					select: 'productName productPrice',
					options: { strictPopulate: false },
				})
				.populate({
					path: 'transport',
					select: 'transportName transportPrice',
					options: { strictPopulate: false },
				})

			if (student) {
				return { success: true, student }
			} else {
				return { success: false, message: 'Student toplmadi' }
			}
		} catch (error) {
			throw new Error(error)
		}
	}
	async StudentDelete(id) {
		try {
			// Talabani topish
			const student = await studentModel.findById(id)
			if (!student) {
				return { success: false, message: 'Talaba topilmadi' }
			}

			// Statusni "removed"ga o‘zgartirish
			student.status = 'removed'

			// Guruhlardan chiqarish
			const removeResult = await GroupService.StudentRemoved(id)
			console.log('Guruhlardan chiqarish natijasi:', removeResult)

			// O‘zgarishlarni saqlash
			await student.save()

			return { success: true, message: "Talaba o'chirildi (status: removed)" }

		} catch (error) {
			console.error('Talabani o‘chirishda xatolik:', error.message)
			return { success: false, message: 'O‘chirishda xatolik yuz berdi' }
		}
	}

	async StudentArchived(id) {
		try {
			// Talabani topish
			const student = await studentModel.findById(id)
			if (!student) {
				return { success: false, message: 'Talaba topilmadi' }
			}

			// Status va asosiy maydonlarni tozalash
			student.status = 'archived'
			student.hostel = null
			student.product = null
			student.transport = null

			const now = new Date()

			// Helper: berilgan history massivida toDate null bo‘lsa, hozirgi vaqtni yozish
			const updateToDateIfNull = (history) => {
				if (Array.isArray(history)) {
					history.forEach(item => {
						if (!item.toDate) {
							item.toDate = now
						}
					})
				}
			}

			// Barcha tarixiy massivlarni tekshirish
			updateToDateIfNull(student.main_subject_history)
			updateToDateIfNull(student.additional_subject_history)
			updateToDateIfNull(student.hostel_history)
			updateToDateIfNull(student.product_history)
			updateToDateIfNull(student.transport_history)

			// Guruhlardan chiqarish
			const removeResult = await GroupService.StudentRemoved(id)
			console.log('Guruhlardan chiqarish natijasi:', removeResult)

			// ✅ Talabaga tegishli barcha paymentlar isActive: 'archived' qilish
			const archivedPayments = await studentpaymentModel.updateMany(
				{ student: id },
				{ $set: { isActive: 'archived' } }
			)
			console.log(`Arxivga o‘tgan to‘lovlar soni: ${archivedPayments.modifiedCount}`)

			// Saqlash
			await student.save()

			return {
				success: true,
				message: "Talaba arxivga qo‘shildi",
				student
			}

		} catch (error) {
			console.error('Arxivlashda xatolik:', error.message)
			return { success: false, message: 'Arxivlashda xatolik yuz berdi' }
		}
	}






}

module.exports = new StudentService()