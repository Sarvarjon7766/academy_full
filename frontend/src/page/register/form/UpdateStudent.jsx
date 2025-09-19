// src/components/studentupdate/UpdateStudent.jsx
import { useEffect, useState } from 'react'
import { FiArrowLeft, FiBook, FiPackage, FiPlusCircle, FiTrash2, FiUser } from 'react-icons/fi'
import { useLocation, useNavigate } from 'react-router-dom'
import { AdditionalSubjectUpdate, DeleteStudent, MainSubjectUpdate, OtherCostsUpdate, PersonalUpdate } from './studentupdate/index'

const UpdateStudent = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { student, section } = location.state || {}
  const [activeSection, setActiveSection] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (!student) {
      navigate('/student-list')
    }

    // Agar location state'dan section kelgan bo'lsa, uni aktiv qilamiz
    if (section !== undefined) {
      setActiveSection(Number(section))
    }
  }, [student, section, navigate])

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showSuccess])

  const sections = [
    { id: 0, title: "Shaxsiy ma'lumotlar", icon: <FiUser />, color: "from-blue-500 to-blue-600" },
    { id: 1, title: "Asosiy fanlar", icon: <FiBook />, color: "from-purple-500 to-purple-600" },
    { id: 2, title: "Qo'shimcha fanlar", icon: <FiPlusCircle />, color: "from-green-500 to-green-600" },
    { id: 3, title: "Qo'shimcha xizmatlar", icon: <FiPackage />, color: "from-yellow-500 to-yellow-600" },
    { id: 4, title: "Talabani arxivlash", icon: <FiTrash2 />, color: "from-red-500 to-red-600" },
  ]

  const handleUpdateSuccess = () => {
    setShowSuccess(true)
  }

  if (!student) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Talaba ma'lumotlari yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6">
      <div className="mx-auto">
        {/* Orqaga qaytish va sarlavha */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center bg-blue-200 text-blue-600 hover:text-blue-800 font-medium transition mr-4"
          >
            <FiArrowLeft className="mr-2" /> Orqaga
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Talaba profili va bo'lim navigatsiyasi */}
          <div className="md:flex">
            {/* Bo'lim navigatsiyasi */}
            <div className="w-full p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Yangilash bo'limini tanlang:</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {sections.map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => setActiveSection(sec.id)}
                      className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all ${activeSection === sec.id
                          ? `bg-gradient-to-br ${sec.color} text-white shadow-md transform -translate-y-1`
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                    >
                      <span className="text-xl mb-1">{sec.icon}</span>
                      <span className="text-xs font-medium text-center">{sec.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bo'lim sarlavhasi */}
              <div className="flex items-center mb-6">
                <div className={`p-2 rounded-lg mr-3 ${activeSection === 0 ? 'bg-blue-100 text-blue-600' :
                    activeSection === 1 ? 'bg-purple-100 text-purple-600' :
                      activeSection === 2 ? 'bg-green-100 text-green-600' :
                        activeSection === 3 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                  }`}>
                  {sections.find(s => s.id === activeSection)?.icon}
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  {sections.find(s => s.id === activeSection)?.title}
                </h2>
              </div>

              {/* Aktiv bo'lim kontenti */}
              <div className="border-none  p-4 sm:p-6">
                {activeSection === 0 && (
                  <PersonalUpdate
                    student={student}
                    onSuccess={handleUpdateSuccess}
                  />
                )}
                {activeSection === 1 && (
                  <MainSubjectUpdate
                    student={student}
                    onSuccess={handleUpdateSuccess}
                  />
                )}
                {activeSection === 2 && (
                  <AdditionalSubjectUpdate
                    student={student}
                    onSuccess={handleUpdateSuccess}
                  />
                )}
                {activeSection === 3 && (
                  <OtherCostsUpdate
                    student={student}
                    onSuccess={handleUpdateSuccess}
                  />
                )}
                {activeSection === 4 && (
                  <DeleteStudent
                    student={student}
                    onSuccess={() => navigate('/student-list')}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UpdateStudent