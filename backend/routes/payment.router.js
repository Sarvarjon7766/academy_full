const express = require('express')
const { checkPayment, Pay, getPayments, paymentHistory, resgistratationPaymentHistory, StudentBill, BillPaymentStudent, getMonth } = require('../controllers/payment.controller')
const router = express.Router()



router.get('/check', checkPayment)
router.get('/getPaymants', getPayments)
router.get('/history', paymentHistory)
router.post('/register-history', resgistratationPaymentHistory)
router.get('/student-bill/:studentId', StudentBill)
router.post('/pay', Pay)
router.post('/bill-payment-student', BillPaymentStudent)
router.get('/getMonth', getMonth)



module.exports = router