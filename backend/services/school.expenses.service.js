const schoolExpenseModel = require('../modules/school.expenses.model')

class SchoolExpenseService {
	async create(data) {
		try {
			const schoolExpense = await schoolExpenseModel.create(data)
			return { success: true, message: "Maktab xarajati qo'shildi", schoolExpense }
		} catch (error) {
			return { success: false, message: error.message }
		}
	}

	async update(id, data) {
		try {
			const schoolExpense = await schoolExpenseModel.findByIdAndUpdate(id, data, { new: true })
			if (!schoolExpense) {
				return { success: false, message: "Maktab xarajati topilmadi" }
			}
			return { success: true, message: "Maktab xarajati yangilandi", schoolExpense }
		} catch (error) {
			return { success: false, message: error.message }
		}
	}

	async delete(id) {
		try {
			const deleted = await schoolExpenseModel.findByIdAndDelete(id)
			if (!deleted) {
				return { success: false, message: "Maktab xarajati topilmadi" }
			}
			return { success: true, message: "Maktab xarajati o'chirildi" }
		} catch (error) {
			return { success: false, message: error.message }
		}
	}

	async getAll() {
		try {
			const schoolExpenses = await schoolExpenseModel.find()
			return { success: true, message: "Hamma maktab xarajatlari", schoolExpenses }
		} catch (error) {
			return { success: false, message: error.message }
		}
	}

	async getById(id) {
		try {
			const schoolExpense = await schoolExpenseModel.findById(id)
			if (!schoolExpense) {
				return { success: false, message: "Maktab xarajati topilmadi" }
			}
			return { success: true, message: "Maktab xarajati topildi", schoolExpense }
		} catch (error) {
			return { success: false, message: error.message }
		}
	}
}

module.exports = new SchoolExpenseService()
