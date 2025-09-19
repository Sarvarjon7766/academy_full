const { model, Schema } = require('mongoose')

const schoolExpenseSchema = new Schema({
	schoolExpenseName: {
		type: String,
		required: true
	},
	schoolExpensePrice: {
		type: Number,
		required: true
	},
	enrollment_date: {
		type: Date,
		default: Date.now
	}
})

module.exports = model('school_expense', schoolExpenseSchema)
