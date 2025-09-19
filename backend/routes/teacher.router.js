const express = require('express')
const {login,update,deleted,subTeacher,getAll,getSubjects,getOne,ChangePassword,createPersonal,updatePersonal,AddSubjects,AddSalary,getTeacher,CheckSubject,CheckSalary,TeacherSelery,getOneTeacherSalary} = require('../controllers/teacher.controller')
const verifyToken = require('../middleware/verifyToken.middleware')
const router = express.Router()
const uploadFile = require('../middleware/upload');
router.post('/login',login)
router.post('/create-personal',createPersonal)
router.put('/create-personal/:id',updatePersonal)
router.post('/add-subjects',AddSubjects)
router.get('/check-subject/:id',CheckSubject)
router.get('/check-salary/:id',CheckSalary)
router.post('/add-salary',AddSalary)
router.get('/personal/:id',getTeacher)
router.get('/getAll',getAll)
router.get('/getOne',verifyToken,getOne)
router.get('/getSubjects',verifyToken,getSubjects)
router.put('/update/:id',update)
router.put('/changePassword/:id',ChangePassword)
router.delete('/delete/:id',deleted)
router.get('/subject/:subjectId',subTeacher)




router.get('/teacher-selery',TeacherSelery)
router.get('/teachermonth-selery',getOneTeacherSalary)

module.exports = router