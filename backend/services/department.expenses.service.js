const departmentexpensesModel = require('../modules/departmentexpenses.model')

class DepartmentExpensesService {
	async create(data) {
		try {
			const expenses = await departmentexpensesModel.create(data)

			if (expenses) {
				return { success: true, message: "Yangi to'lov qo'shildi", data: expenses }
			} else {
				return { success: false, message: "To'lov qo'shishda xatolik kelib chiqdi" }
			}

		} catch (error) {
			return {
				success: false,
				message: "Serverda xatolik: " + error.message
			}
		}
	}
	async getAll() {
		try {
			const expenses = await departmentexpensesModel.find().sort({ date: -1 }) // eng so'nggi xarajatlarni birinchi qaytaradi
			return { success: true, data: expenses }
		} catch (error) {
			console.error("Xatolik (getAll):", error.message)
			return {
				success: false,
				message: "Serverda xatolik: " + error.message
			}
		}
	}
	async getOneMonth(year, month) {
		try {
			const startDate = new Date(year, month - 1, 1)
			const endDate = new Date(year, month, 1)
			const expenses = await departmentexpensesModel.find({
				date: { $gte: startDate, $lt: endDate }
			}).sort({ date: 1 })
			return { success: true, data: expenses }

		} catch (error) {
			console.error("Xatolik (getOneMonth):", error.message)
			return {
				success: false,
				message: "Serverda xatolik: " + error.message
			}
		}
	}




}
module.exports = new DepartmentExpensesService()