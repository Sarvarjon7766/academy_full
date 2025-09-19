import axios from 'axios'
import { useEffect, useState } from 'react'
import { FiBook, FiDollarSign, FiSearch, FiUser, FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

const TeachersManage = () => {
  const navigate = useNavigate()
  const [teachers, setTeachers] = useState([])
  const [filteredTeachers, setFilteredTeachers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState('')

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/teacher/getAll`)
        if (res.data.success) {
          const filtered = res.data.teachers.filter(teacher => teacher.isAdmin === false)
          setTeachers(filtered)
          setFilteredTeachers(filtered)
        }
      } catch (error) {
        console.error("O'qituvchilarni olishda xatolik:", error)
      }
    }

    fetchTeachers()
  }, [])

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase()
    setSearchTerm(value)

    const filtered = teachers.filter((teacher) =>
      teacher.fullName.toLowerCase().includes(value) ||
      teacher.phone.toLowerCase().includes(value) ||
      (teacher.address && teacher.address.toLowerCase().includes(value))
    )
    setFilteredTeachers(filtered)
  }

  const openUpdateModal = (teacher, e) => {
    e.stopPropagation()
    setSelectedTeacher(teacher)
    setUpdateModalOpen(true)
  }

  const openDetailModal = (teacher) => {
    setSelectedTeacher(teacher)
    setDetailModalOpen(true)
  }

  const closeModals = () => {
    setSelectedTeacher(null)
    setUpdateModalOpen(false)
    setDetailModalOpen(false)
  }

  const updateHandler = () => {
    if (!selectedSection) return

    navigate('/admin/teacher-register', {
      state: {
        teacher: selectedTeacher,
        section: selectedSection,
      },
    })
  }

  const getLatestSalary = (teacher) => {
    return teacher.salaryHistory?.[teacher.salaryHistory.length - 1] || { salary: teacher.salary, share_of_salary: teacher.share_of_salary }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto">

        {/* Qidiruv va jami hisobot */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <FiSearch size={18} />
              </div>
              <input
                type="text"
                placeholder="O'qituvchi ismi, telefon yoki manzil bo'yicha qidirish..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <div className="bg-blue-100 text-blue-800 rounded-lg px-3 py-2 font-medium flex items-center whitespace-nowrap">
              <span className="mr-2">Jami:</span>
              <span className="text-lg font-bold">{filteredTeachers.length}</span>
            </div>
          </div>
        </div>

        {/* Jadval qismi */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">№</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Ism Familiya</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Telefon</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Fanlar</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Maosh</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Ulushi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-4 text-center text-gray-500">
                      O'qituvchilar topilmadi
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((teacher, index) => (
                    <tr
                      key={teacher._id}
                      className="hover:bg-blue-50 cursor-pointer"
                      onClick={() => openDetailModal(teacher)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="bg-gray-200 rounded-lg w-8 h-8 mr-2 flex items-center justify-center">
                            <FiUser className="text-blue-600" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">{teacher.fullName}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {teacher.phone}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {teacher.subjects ? (
                            teacher.subjects.slice(0, 2).map((subject, idx) => (
                              <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                {subject.subjectName}
                              </span>
                            ))
                          ) : (
                            teacher.subjectNames && teacher.subjectNames.split(',').slice(0, 2).map((subject, idx) => (
                              <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                {subject.trim()}
                              </span>
                            ))
                          )}
                          {(teacher.subjects && teacher.subjects.length > 2) && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              +{teacher.subjects.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {getLatestSalary(teacher).salary?.toLocaleString() || 'N/A'} UZS
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 inline-flex text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                          {getLatestSalary(teacher).share_of_salary ?? 'N/A'}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => openUpdateModal(teacher, e)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                        >
                          Yangilash
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* O'qituvchi ma'lumotlari modal oynasi */}
      {detailModalOpen && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 p-5 text-white rounded-t-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{selectedTeacher.fullName}</h2>
                <button
                  onClick={closeModals}
                  className="text-white bg-indigo-500 hover:text-blue-200"
                >
                  <FiX size={24} />
                </button>
              </div>
              <p className="text-blue-200 mt-1">{selectedTeacher.phone}</p>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Shaxsiy ma'lumotlar */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <FiUser className="mr-2 text-blue-600" />
                    Shaxsiy ma'lumotlar
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-600">Manzil</p>
                      <p className="text-gray-800">{selectedTeacher.address || 'Manzil kiritilmagan'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Tug'ilgan sana</p>
                      <p className="text-gray-800">{new Date(selectedTeacher.date_of_birth).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Jins</p>
                      <p className="text-gray-800">{selectedTeacher.gender}</p>
                    </div>
                  </div>
                </div>

                {/* Kasbiy ma'lumotlar */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <FiBook className="mr-2 text-indigo-600" />
                    Kasbiy ma'lumotlar
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-600">Malaka</p>
                      <p className="text-gray-800">{selectedTeacher.qualification}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">O'qitadigan fanlar</p>
                      <p className="text-gray-800">
                        {selectedTeacher.subjects ?
                          selectedTeacher.subjects.map(s => s.subjectName).join(', ') :
                          selectedTeacher.subjectNames}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Moliyaviy ma'lumotlar */}
                <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <FiDollarSign className="mr-2 text-green-600" />
                    Moliyaviy ma'lumotlar
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600">Oylik maosh</p>
                      <p className="text-xl font-bold text-gray-800">
                        {getLatestSalary(selectedTeacher).salary?.toLocaleString() || 'N/A'} UZS
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Ulushi</p>
                      <p className="text-xl font-bold text-gray-800">
                        {getLatestSalary(selectedTeacher).share_of_salary ?? 'N/A'}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yangilash modal oynasi */}
      {updateModalOpen && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="bg-blue-600 p-5 text-white rounded-t-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Ma'lumotlarni yangilash</h2>
                <button
                  onClick={closeModals}
                  className="text-white bg-indigo-500 hover:text-blue-200"
                >
                  <FiX size={20} />
                </button>
              </div>
              <p className="text-blue-200 mt-1">{selectedTeacher.fullName}</p>
            </div>

            <div className="p-5">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Yangilash bo'limini tanlang
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                >
                  <option value="">Tanlang</option>
                  <option value="0">Shaxsiy ma'lumotlar</option>
                  <option value="1">Fanlar</option>
                  <option value="2">Oylik maosh</option>
                </select>
              </div>

              <div className="flex justify-end items-center gap-3 mt-6">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
                >
                  Bekor qilish
                </button>

                <button
                  onClick={updateHandler}
                  disabled={!selectedSection}
                  className={`px-4 py-2 rounded-lg font-medium text-white ${selectedSection
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-400 cursor-not-allowed'
                    }`}
                >
                  Yangilash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeachersManage