const { model, Schema } = require('mongoose')

const employerPayent = new Schema({
	employerId: {
		type: Schema.Types.ObjectId,
		ref: 'employer',
		required: true
	},
	year: {
		type: Number,
		required: true
	},
	month: {
		type: Number,
		required: true,
		min: 1,
		max: 12
	},
	amountPaid: {
		type: Number,
		required: true,
		default: 0
	},
	amountDue: {
		type: Number,
		required: true
	},
	balanceAmount: {
		type: Number,
		required: true,
		default: 0
	},
	status: {
		type: String,
		enum: ["To'langan", "To'lanmoqda", "To'lanmagan"],
		default: "To'lanmagan"
	},
	paymentDate: {
		type: Date,
		default: Date.now
	},
}, {
	timestamps: true
})

module.exports = model('employerpayment', employerPayent)
