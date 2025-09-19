const SchoolExpenseService = require('../services/school.expenses.service')

class SchoolExpenseController {
	async create(req, res) {
		try {
			const data = req.body
			console.log("Yangi maktab xarajati ma'lumotlari:", data)

			const result = await SchoolExpenseService.create(data)
			if (result.success) {
				return res.status(201).json(result)
			}
			return res.status(400).json(result)
		} catch (error) {
			console.error("Maktab xarajati yaratishda xatolik:", error)
			return res.status(500).json({ success: false, message: error.message })
		}
	}

	async update(req, res) {
		try {
			const { id } = req.params
			const data = req.body
			console.log("Yangilanayotgan xarajat ID:", id)
			console.log("Yangilanish ma'lumotlari:", data)

			const result = await SchoolExpenseService.update(id, data)
			if (result.success) {
				return res.status(200).json(result)
			}
			return res.status(404).json(result) // topilmasa 404
		} catch (error) {
			console.error("Maktab xarajati yangilashda xatolik:", error)
			return res.status(500).json({ success: false, message: error.message })
		}
	}

	// ✅ Maktab xarajatini o‘chirish
	async delete(req, res) {
		try {
			const { id } = req.params
			console.log("O'chirilayotgan xarajat ID:", id)

			const result = await SchoolExpenseService.delete(id)
			if (result.success) {
				return res.status(200).json(result)
			}
			return res.status(404).json(result) // topilmasa 404
		} catch (error) {
			console.error("Maktab xarajati o'chirishda xatolik:", error)
			return res.status(500).json({ success: false, message: error.message })
		}
	}

	// ✅ Hamma maktab xarajatlarini olish
	async getAll(req, res) {
		try {
			const result = await SchoolExpenseService.getAll()
			if (result.success) {
				return res.status(200).json(result)
			}
			return res.status(400).json(result)
		} catch (error) {
			console.error("Maktab xarajatlarini olishda xatolik:", error)
			return res.status(500).json({ success: false, message: error.message })
		}
	}

	// ✅ Bitta maktab xarajatini ID orqali olish
	async getById(req, res) {
		try {
			const { id } = req.params
			console.log("Qidirilayotgan xarajat ID:", id)

			const result = await SchoolExpenseService.getById(id)
			if (result.success) {
				return res.status(200).json(result)
			}
			return res.status(404).json(result) // topilmasa 404
		} catch (error) {
			console.error("Maktab xarajatini olishda xatolik:", error)
			return res.status(500).json({ success: false, message: error.message })
		}
	}
}

module.exports = new SchoolExpenseController()
