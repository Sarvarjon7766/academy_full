const express = require('express')
const { create, getAll, employerPayment, paymentCheck, paymentgetAll } = require('../controllers/employer.controller')
const verifyToken = require('../middleware/verifyToken.middleware')
const router = express.Router()
router.post('/create', create)
router.get('/getAll', getAll)
router.post('/employer-payment', employerPayment)
router.post('/payment-check', paymentCheck)
router.get('/payment-getAll', paymentgetAll)

module.exports = router