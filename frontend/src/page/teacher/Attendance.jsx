import axios from 'axios'
import { useEffect, useState } from "react"
import { FaChartLine, FaChevronLeft, FaPaperPlane, FaUserCheck, FaUserTimes } from "react-icons/fa"
import { FiCheckCircle } from "react-icons/fi"
import { useLocation, useNavigate } from "react-router-dom"

const Attendance = () => {
  const token = localStorage.getItem('token')
  const location = useLocation()
  const navigate = useNavigate()
  const { groupId, students } = location.state || {}
  const [permission, setPermission] = useState(false)
  const [showSubmitButton, setShowSubmitButton] = useState(false)
  const [attendance, setAttendance] = useState({})
  const today = new Date().setHours(0, 0, 0, 0)
  const [stats, setStats] = useState({ present: 0, total: 0 })
  const [isLoading, setIsLoading] = useState(false)

  // Authentication and data validation
  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    if (!groupId || !students?.length) {
      navigate('/teacher')
      return
    }

    setPermission(true)
  }, [token, navigate, groupId, students])

  // Initialize attendance state
  useEffect(() => {
    if (students?.length) {
      const initialAttendance = students.reduce((acc, student) => {
        acc[student.id] = { attended: false, grade: '' }
        return acc
      }, {})
      setAttendance(initialAttendance)
      setStats({ present: 0, total: students.length })
    }
  }, [students])

  const markAttendance = (id) => {
    setAttendance(prev => {
      const newAttendance = {
        ...prev,
        [id]: {
          ...prev[id],
          attended: !prev[id]?.attended,
          grade: prev[id]?.attended ? '' : prev[id]?.grade
        }
      }

      // Update stats
      const presentCount = Object.values(newAttendance).filter(a => a.attended).length
      setStats({ present: presentCount, total: students.length })

      return newAttendance
    })

    setShowSubmitButton(true)
  }

  const handleGradeChange = (id, value) => {
    // Validate grade input (0-100)
    let gradeValue = value
    if (gradeValue !== '') {
      const numericValue = Number(gradeValue)
      if (isNaN(numericValue)) return
      gradeValue = Math.min(100, Math.max(0, numericValue))
    }

    setAttendance(prev => ({
      ...prev,
      [id]: { ...prev[id], grade: gradeValue }
    }))
  }

  const submitAttendance = async () => {
    setIsLoading(true)
    try {
      // Transform to required format: { studentId: { attended: boolean, grade: number } }
      const attendanceData = students.reduce((acc, student) => {
        const studentAttendance = attendance[student.id] || { attended: false, grade: '' }
        acc[student.id] = {
          attended: studentAttendance.attended,
          grade: studentAttendance.attended ? Number(studentAttendance.grade) || 0 : 0
        }
        return acc
      }, {})

      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/attandance/create`,
        {
          attendance: attendanceData,
          gId: { groupId }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      alert(data.message || "Davomat muvaffaqiyatli qayd etildi!")
      navigate('/teacher')
    } catch (error) {
      alert(error.response?.data?.message || "Xatolik yuz berdi!")
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate attendance percentage
  const attendancePercentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0

  // Early return for permission errors
  if (!permission) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center p-6 bg-white rounded-xl shadow-sm max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Yuklanmoqda...</h2>
          <p className="text-gray-600">Talabalar ro'yxati yuklanmoqda</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/teacher')}
            className="flex items-center gap-2 bg-white py-2 px-4 rounded-lg shadow-sm hover:shadow transition text-blue-600 font-medium"
          >
            <FaChevronLeft />
            <span>Orqaga</span>
          </button>

          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">Davomatni belgilash</h1>
            <p className="text-gray-600 text-sm mt-1">
              {new Date(today).toLocaleDateString('uz-UZ', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white py-2 px-3 rounded-lg shadow-sm">
            <FaChartLine className="text-blue-500" />
            <span className="font-medium">
              <span className="text-green-600">{stats.present}</span> / {stats.total}
            </span>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FaUserCheck className="text-blue-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700">Davomat statistikasi</h3>
                <p className="text-gray-500 text-xs">{stats.present} ta talaba ishtirok etmoqda</p>
              </div>
            </div>

            <div className="w-full sm:w-48">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">Davomat foizi</span>
                <span className="text-xs font-bold text-gray-700">{attendancePercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${attendancePercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-50">
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">№</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Talaba</th>
                  <th className="py-3 px-4 text-center text-sm font-medium text-gray-700">Davomat</th>
                  <th className="py-3 px-4 text-center text-sm font-medium text-gray-700">Baho</th>
                  <th className="py-3 px-4 text-center text-sm font-medium text-gray-700">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student, index) => (
                  <tr
                    key={student.id}
                    className="hover:bg-blue-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded text-xs">
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center mr-2">
                          <span className="text-sm font-medium text-blue-700">
                            {student.studentName.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm">{student.studentName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => markAttendance(student.id)}
                        className={`p-2 rounded-lg transition ${attendance[student.id]?.attended
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                      >
                        {attendance[student.id]?.attended ? (
                          <FaUserCheck size={16} />
                        ) : (
                          <FiCheckCircle size={16} />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="relative max-w-[100px] mx-auto">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          disabled={!attendance[student.id]?.attended}
                          value={attendance[student.id]?.grade}
                          onChange={(e) =>
                            handleGradeChange(student.id, e.target.value)
                          }
                          placeholder="0-100"
                          className={`w-full p-2 rounded border text-sm ${attendance[student.id]?.attended
                            ? 'bg-white border-blue-300 focus:border-blue-500'
                            : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                            }`}
                        />
                        {attendance[student.id]?.attended && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500 text-xs">
                            %
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${attendance[student.id]?.attended
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}>
                        {attendance[student.id]?.attended ? (
                          <>
                            <FaUserCheck className="m-1 text-lg" />
                            Ishtirok etdi
                          </>
                        ) : (
                          <>
                            <FaUserTimes className="m-1 text-lg" />
                            Kelmagan
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden grid grid-cols-1 gap-3 mb-8">
          {students.map((student, index) => (
            <div
              key={student.id}
              className="bg-white rounded-lg shadow-sm p-4 hover:shadow transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-700">
                      {student.studentName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-800">{student.studentName}</h3>
                    <p className="text-xs text-gray-600">#{index + 1}</p>
                  </div>
                </div>

                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${attendance[student.id]?.attended
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
                  }`}>
                  {attendance[student.id]?.attended ? 'Ishtirok etdi' : 'Kelmagan'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => markAttendance(student.id)}
                  className={`p-2 rounded-lg transition ${attendance[student.id]?.attended
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                  {attendance[student.id]?.attended ? (
                    <FaUserCheck size={16} />
                  ) : (
                    <FiCheckCircle size={16} />
                  )}
                </button>

                <div className="relative w-28">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    disabled={!attendance[student.id]?.attended}
                    value={attendance[student.id]?.grade}
                    onChange={(e) =>
                      handleGradeChange(student.id, e.target.value)
                    }
                    placeholder="0-100"
                    className={`w-full p-2 rounded border text-sm ${attendance[student.id]?.attended
                      ? 'bg-white border-blue-300 focus:border-blue-500'
                      : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                      }`}
                  />
                  {attendance[student.id]?.attended && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500 text-xs">
                      %
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        {showSubmitButton && (
          <div className="fixed bottom-4 left-0 right-0 flex justify-center px-4">
            <button
              onClick={submitAttendance}
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg shadow hover:shadow-md transition w-full max-w-sm"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Jo'natilmoqda...</span>
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  <span>Saqlash</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Attendance