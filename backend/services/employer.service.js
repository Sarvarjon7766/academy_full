const { default: mongoose } = require('mongoose')
const employerModel = require('../modules/employer.model')
const employerPaymentModel = require('../modules/employer.payment.model')

class EmployerService {
	async create(data) {
		try {
			const login = data.login
			const exsistEmployer = await employerModel.findOne({ login })
			if (exsistEmployer) {
				return { success: false, message: "bu loginga Hodim biriktirilgan" }
			}
			const upData = { ...data, date_of_birth: new Date(data.date_of_birth), role: 5, status: 'active' }
			const employer = await employerModel.create(data)
			console.log(employer)
			if (employer) {
				return { success: true, message: "Yangi hodim qo'shildi" }
			}
			return { success: false, message: "Yangi hodim qo'shilmadi" }

		} catch (error) {
			return { success: false, message: "Hodim qo'shishda xatolik", error: error }
		}
	}
	async getAll() {
		try {
			const employer = await employerModel.find({ status: 'active' })
			if (employer) {
				return { success: true, employer }
			}
			return { success: false, message: "Hodimlarni olishda xatolik" }

		} catch (error) {
			return { success: false, message: "Hodim qo'shishda xatolik" }
		}
	}
	async paymentCheck(data) {
		try {
			console.log("Kelgan data:", data)
			const { employerId, year, month } = data

			// ❌ Agar employerId, year yoki month bo'lmasa, xatolik qaytaramiz
			if (!employerId || !year || !month) {
				return { success: false, message: "employerId, year va month talab qilinadi" }
			}

			// ✅ Shu hodim va shu oy/yil uchun mavjud to'lovni qidiramiz
			const existingPayment = await employerPaymentModel.findOne({
				employerId,
				year,
				month
			})

			// Agar to'lov mavjud bo'lsa, uni qaytaramiz
			if (existingPayment) {
				return {
					success: true,
					message: "To'lov ma'lumoti topildi",
					payment: existingPayment
				}
			}

			// Agar topilmasa, null qaytaramiz
			return {
				success: true,
				message: "Bu oyda to'lov topilmadi",
				payment: null
			}
		} catch (error) {
			console.error("Xatolik (paymentCheck):", error.message)
			return {
				success: false,
				message: "Server xatosi: " + error.message
			}
		}
	}

	async paymentgetAll() {
		try {
			let payments = await employerPaymentModel.find()
			if (payments) {
				return { success: true, payments }
			}
			return { success: false, message: "Paymentlarni olishda xatolik" }

		} catch (error) {
			return { success: false, message: "Hodim qo'shishda xatolik" }
		}
	}
	async employerPayment(data) {
		try {
			const newEmployerId = new mongoose.Types.ObjectId(data.employerId)
			const { year, month, amountPaid, amountDue } = data

			// Shu hodim va shu oy uchun mavjud to'lovni tekshiramiz
			let existingPayment = await employerPaymentModel.findOne({
				employerId: newEmployerId,
				year,
				month
			})

			if (existingPayment) {
				// Agar to'lov allaqachon to'liq bo'lsa -> yangi yozuv qilinmaydi
				if (existingPayment.amountPaid >= existingPayment.amountDue) {
					return {
						success: false,
						message: `Bu hodim uchun ${month}/${year} oyi to'lovi allaqachon to'liq amalga oshirilgan`
					}
				}

				// Qo'shimcha to'lovni qo'shamiz
				const newAmountPaid = existingPayment.amountPaid + amountPaid
				const newBalanceAmount = existingPayment.amountDue - newAmountPaid

				// Statusni yangilaymiz
				let newStatus = "To'lanmoqda"
				if (newAmountPaid >= existingPayment.amountDue) {
					newStatus = "To'langan"
				}

				existingPayment.amountPaid = newAmountPaid
				existingPayment.balanceAmount = newBalanceAmount < 0 ? 0 : newBalanceAmount
				existingPayment.status = newStatus
				existingPayment.paymentDate = new Date()

				await existingPayment.save()

				return {
					success: true,
					message: "Qo'shimcha to'lov muvaffaqiyatli qo'shildi",
					data: existingPayment
				}
			}

			// Agar shu oy uchun to'lov yo'q bo'lsa - yangi yozuv yaratamiz
			const balanceAmount = amountDue - amountPaid
			let status = "To'lanmagan"
			if (amountPaid >= amountDue) {
				status = "To'langan"
			} else if (amountPaid > 0 && amountPaid < amountDue) {
				status = "To'lanmoqda"
			}

			const payment = await employerPaymentModel.create({
				employerId: newEmployerId,
				year,
				month,
				amountPaid,
				amountDue,
				balanceAmount,
				status,
				paymentDate: new Date()
			})

			return {
				success: true,
				message: "Yangi to'lov muvaffaqiyatli qo'shildi",
				data: payment
			}

		} catch (error) {
			console.error("❌ employerPayment xatolik:", error)
			return {
				success: false,
				message: "Hodim to'lovini saqlashda xatolik",
				error: error.message
			}
		}
	}
}
module.exports = new EmployerService()