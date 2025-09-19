import axios from 'axios'
import { useEffect, useState } from 'react'

const EmployerList = () => {
  const [employers, setEmployers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmployer, setSelectedEmployer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchEmployers = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/employer/getAll`)
        if (res.data.success) {
          setEmployers(res.data.employer)
          setError(null)
        } else {
          setError('Xodimlarni yuklashda xatolik yuz berdi')
        }
      } catch (err) {
        console.error('Xodimlarni olishda xatolik:', err)
        setError('Serverga ulana olmadi. Iltimos, internet aloqasini tekshiring')
      } finally {
        setLoading(false)
      }
    }

    fetchEmployers()
  }, [])

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase())
  }

  const filteredEmployers = employers.filter((emp) =>
    (emp.fullName?.toLowerCase() || '').includes(searchTerm) ||
    (emp.phone || '').includes(searchTerm) ||
    (emp.address?.toLowerCase() || '').includes(searchTerm)
  )

  const closeModal = () => {
    setSelectedEmployer(null)
  }

  const renderGenderIcon = (gender) => {
    if (gender === 'Erkak') return '👨'
    if (gender === 'Ayol') return '👩'
    return '👤'
  }

  const formatSalary = (salary) => {
    if (!salary) return '-'
    return salary.toLocaleString('uz-UZ') + ' so\'m'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto">
        {/* Qidiruv va statistikalar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-2/3">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Xodim ismi, telefon yoki manzil bo'yicha qidirish..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>

            <div className="flex items-center gap-2 bg-blue-100 px-3 py-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-blue-800 font-medium">
                Jami: <span className="text-blue-600">{employers.length}</span>
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mt-4">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-red-800 font-medium">{error}</h3>
              </div>
            </div>
          ) : (
            <div className="border-none  rounded-lg shadow-sm bg-white overflow-x-auto mt-4">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Ism Familiya</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 hidden sm:table-cell">Lavozimi</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Telefon</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 hidden md:table-cell">Manzil</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center py-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Hech qanday xodim topilmadi
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredEmployers.map((emp) => (
                      <tr
                        key={emp._id}
                        onClick={() => setSelectedEmployer(emp)}
                        className="border-t border-gray-100 hover:bg-blue-50 transition cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center mr-2">
                              {renderGenderIcon(emp.gender)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{emp.fullName}</div>
                              <div className="text-xs text-gray-600 sm:hidden">{emp.position}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell text-sm text-gray-600">{emp.position}</td>
                        <td className="py-3 px-4">
                          <a href={`tel:${emp.phone}`} className="text-blue-600 hover:text-blue-800 text-sm">
                            {emp.phone}
                          </a>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell text-sm text-gray-600">{emp.address || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.status === 'Ishlaydi'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {emp.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Xodim ma'lumotlari modal oynasi */}
      {selectedEmployer && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 p-4 text-white rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">
                    {selectedEmployer.fullName}
                  </h2>
                  <p className="text-blue-100 text-sm">{selectedEmployer.position}</p>
                </div>
                <button
                  className="text-white bg-indigo-500 hover:text-blue-200"
                  onClick={closeModal}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Shaxsiy ma'lumotlar */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h3 className="font-semibold text-gray-800 mb-2">Shaxsiy ma'lumotlar</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tug'ilgan sana:</span>
                      <span className="font-medium">
                        {selectedEmployer.date_of_birth
                          ? new Date(selectedEmployer.date_of_birth).toLocaleDateString()
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jinsi:</span>
                      <span className="font-medium">
                        {renderGenderIcon(selectedEmployer.gender)} {selectedEmployer.gender || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Qo'shimcha ma'lumot:</span>
                      <span className="font-medium">{selectedEmployer.additionalInfo || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Ish haqida ma'lumot */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h3 className="font-semibold text-gray-800 mb-2">Ish haqida ma'lumot</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lavozim:</span>
                      <span className="font-medium">{selectedEmployer.position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Maosh:</span>
                      <span className="font-medium text-green-600">
                        {formatSalary(selectedEmployer.salary)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${selectedEmployer.status === 'Ishlaydi' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                        {selectedEmployer.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kontakt ma'lumotlari */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="font-semibold text-gray-800 mb-2">Kontakt ma'lumotlari</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center">
                    <div className="bg-blue-100 text-blue-800 rounded p-2 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-600">Email</p>
                      <p className="font-medium">
                        {selectedEmployer.email || 'Kiritilmagan'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="bg-blue-100 text-blue-800 rounded p-2 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-600">Telefon</p>
                      <p className="font-medium">{selectedEmployer.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 px-4 py-3 rounded-b-lg flex justify-end">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                onClick={closeModal}
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployerList