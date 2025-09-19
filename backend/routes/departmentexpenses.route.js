const express = require('express')
const { create, getAll, getOneMonth } = require('../controllers/department.expenses.controller')
const router = express.Router()

router.post('/create', create)
router.get('/getAll', getAll)
router.post('/getOneMonth', getOneMonth)

module.exports = router