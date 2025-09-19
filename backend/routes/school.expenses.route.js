const express = require('express')
const { create, getAll, update, delete: deleteExpense, getById } = require('../controllers/school.exprenses.controller')

const router = express.Router()

router.post('/create', create)
router.get('/getAll', getAll)
router.get('/get/:id', getById)
router.put('/update/:id', update)
router.delete('/delete/:id', deleteExpense)

module.exports = router
