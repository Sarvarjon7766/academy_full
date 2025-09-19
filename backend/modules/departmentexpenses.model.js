const mongoose = require('mongoose')

const departmentexpensesSchema = new mongoose.Schema({
	amount: {
		type: Number,
		required: true,
		min: 0
	},
	note: {
		type: String,
		default: ''
	},
	date: {
		type: Date,
		default: Date.now
	}
}, {
	timestamps: true
})

module.exports = mongoose.model('DepartmentExpense', departmentexpensesSchema)
