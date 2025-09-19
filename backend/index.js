const express = require('express')
const cors = require('cors')
const { json } = require('body-parser')
const dotenv = require('dotenv')
const connectDB = require('./config/mongoDB')
const fileUpload = require('express-fileupload')

//cron
const { runCronJob, runStudentPayment, runMonthlyBillCron } = require('./helper/corn.message')
// Routerlarni chaqirish
const { studentrouter, teacherrouter, applicationrouter, adsrouter, messagerouter, subjectrouter, addsubjectrouter, hostelrouter, defaultrouter, registerrouter, transportrouter, paymentrouter, attandancerouter, grouprouter, productrouter, profilerouter, roomsrouter, statistiksrouter, employerrouter, teacherattandancerouter, avansrouter, teacherpaymentrouter, studentpaymentrouter, departmentexpensesrouter, schoolexprensesroute } = require('./routes')


// Environment variables
dotenv.config()
connectDB()
runCronJob()
runStudentPayment()
runMonthlyBillCron()

const app = express()

// const corsOptions = {
//   origin: function (origin, callback) {
//     if (!origin || origin === process.env.CLIENT_URL) {
//       callback(null, true)
//     } else {
//       callback(new Error('Not allowed by CORS'))
//     }
//   },
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   credentials: true
// }


// app.use(cors(corsOptions))
app.use(cors({
  origin: true,
  credentials: true
}))
app.use('/static', express.static('static'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())


// Fayl yuklashni qo'llab-quvvatlash uchun middleware
app.use(fileUpload()) // Fayl yuklash middleware'ini qo'shish

// Routerlarni ulash
app.use('/api/statistics', statistiksrouter)
app.use('/api/teacher-attandance', teacherattandancerouter)
app.use('/api/student', studentrouter)
app.use('/api/avans', avansrouter)
app.use('/api/teacher', teacherrouter)
app.use('/api/employer', employerrouter)
app.use('/api/teacher-payment', teacherpaymentrouter)
app.use('/api/student-payment', studentpaymentrouter)

app.use('/api/application', applicationrouter)
app.use('/api/ads', adsrouter)
app.use('/api/subject', subjectrouter)

app.use('/api/message', messagerouter)
app.use('/api/addsubject', addsubjectrouter)
app.use('/api/hostel', hostelrouter)
app.use('/api/default', defaultrouter)
app.use('/api/register', registerrouter)
app.use('/api/transport', transportrouter)
app.use('/api/school-expenses', schoolexprensesroute)
app.use('/api/product', productrouter)
app.use('/api/payment', paymentrouter)
app.use('/api/attandance', attandancerouter)
app.use('/api/group', grouprouter)
app.use('/api/profile', profilerouter)
app.use('/api/room', roomsrouter)
app.use('/api/depexpenses', departmentexpensesrouter)



const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
