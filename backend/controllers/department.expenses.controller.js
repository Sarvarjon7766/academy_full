const DepartmentExpensesService = require('../services/department.expenses.service')
class DepartmentExpensesController {
	async create(req, res) {
		try {
			const result = await DepartmentExpensesService.create(req.body)

			if (result.success) {
				return res.status(201).json(result) // muvaffaqiyatli yaratildi
			} else {
				return res.status(400).json(result) // validatsiya xatosi yoki noto'g'ri ma'lumot
			}

		} catch (error) {
			console.error("Xatolik (controller.create):", error.message)
			return res.status(500).json({
				success: false,
				message: "Server xatosi: " + error.message
			})
		}
	}
	async getAll(req, res) {
		try {
			const result = await DepartmentExpensesService.getAll()

			if (!result.success) {
				// agar service xato yoki bo'sh ma'lumot qaytarsa
				return res.status(404).json({
					success: false,
					message: result.message || "Xarajatlar topilmadi"
				})
			}

			return res.status(200).json(result) // barcha xarajatlarni qaytaradi

		} catch (error) {
			console.error("Xatolik (controller.getAll):", error)
			return res.status(500).json({
				success: false,
				message: "Server xatosi: " + error.message
			})
		}
	}
	async getOneMonth(req, res) {
		try {
			const { year, month } = req.body

			if (!year || !month) {
				return res.status(400).json({
					success: false,
					message: "Yil va oy kiritilishi shart"
				})
			}

			const result = await DepartmentExpensesService.getOneMonth(Number(year), Number(month))

			if (result.success) {
				return res.status(200).json(result)
			} else {
				return res.status(404).json(result)
			}
		} catch (error) {
			console.error("Xatolik (controller.getOneMonth):", error)
			return res.status(500).json({
				success: false,
				message: "Server xatosi: " + error.message
			})
		}
	}


}

module.exports = new DepartmentExpensesController()