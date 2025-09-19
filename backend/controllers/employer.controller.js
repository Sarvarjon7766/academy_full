
const EmployerService = require('../services/employer.service')
class EmployerController {
	async create(req, res) {
		try {


			const data = await EmployerService.create(req.body)

			if (data.success) {
				return res.status(201).json(data)
			}
			return res.status(400).json(data)
		} catch (error) {
			res.status(500).json({ message: error, success: false })
		}
	}
	async getAll(req, res) {
		try {
			const data = await EmployerService.getAll()
			if (data.success) {
				return res.status(200).json(data)
			}
			return res.status(400).json(data)
		} catch (error) {
			res.status(500).json({ message: error, success: false })
		}
	}
	async employerPayment(req, res) {
		try {
			const data = await EmployerService.employerPayment(req.body)
			if (data.success) {
				return res.status(200).json(data)
			}
			return res.status(400).json(data)
		} catch (error) {
			res.status(500).json({ message: error, success: false })
		}
	}
	async paymentCheck(req, res) {
		try {
			console.log("Kelgan so'rov:", req.body)
			const result = await EmployerService.paymentCheck(req.body)
			if (result.success) {
				return res.status(200).json(result)
			} else {
				return res.status(400).json(result)
			}
		} catch (error) {
			console.error("Xatolik (controller.paymentCheck):", error.message)
			return res.status(500).json({
				success: false,
				message: "Server xatosi: " + error.message
			})
		}
	}

	async paymentgetAll(req, res) {
		try {
			const data = await EmployerService.paymentgetAll()
			if (data.success) {
				return res.status(200).json(data)
			}
			return res.status(400).json(data)
		} catch (error) {
			res.status(500).json({ message: error, success: false })
		}
	}

}
module.exports = new EmployerController()