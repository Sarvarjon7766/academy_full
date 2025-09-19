import axios from 'axios'
import { useEffect, useState } from "react"
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"

// Statik ma'lumotlar
const COLORS = ["#10B981", "#F59E0B", "#EF4444", "#6366F1", "#8B5CF6", "#EC4899"]

const AdminHome = () => {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    employees: 0,
    subjects: 0
  })

  const [paymentStats, setPaymentStats] = useState([
    { name: "To'langan", value: 35 },
    { name: 'Qisman to‘langan', value: 25 },
    { name: "Qarzdor", value: 40 },
  ])

  const [dynamicData, setDynamicData] = useState({
    studentGrowth: [
      { oy: "Yanvar", oquvchilar: 120 },
      { oy: "Fevral", oquvchilar: 145 },
      { oy: "Mart", oquvchilar: 180 },
      { oy: "Aprel", oquvchilar: 210 },
      { oy: "May", oquvchilar: 250 },
    ],
    teacherActivity: [
      { ism: "Aliyev A.", darslar: 45 },
      { ism: "Hasanova D.", darslar: 52 },
      { ism: "Yusupov S.", darslar: 38 },
      { ism: "Rahmonova N.", darslar: 48 },
      { ism: "Karimov J.", darslar: 41 },
    ]
  })

  // API chaqiruvlari
  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/statistics/getStatistiks`)

        if (statsRes.data.success) {
          setStats({
            students: statsRes.data.student || 0,
            teachers: statsRes.data.teacher || 0,
            employees: statsRes.data.employer || 0,
            subjects: statsRes.data.subject || 0
          })
        }
      } catch (error) {
        console.error('Xatolik yuz berdi:', error)
      }
    }

    fetchData()
  }, [])

  // O'quvchilar o'sish grafigi
  const StudentGrowthChart = () => (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={dynamicData.studentGrowth}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
        <XAxis dataKey="oy" />
        <YAxis />
        <Tooltip
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Line
          type="monotone"
          dataKey="oquvchilar"
          name="O'quvchilar soni"
          stroke="#6366F1"
          strokeWidth={3}
          dot={{ r: 5, fill: '#6366F1' }}
          activeDot={{ r: 7, fill: '#4F46E5' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )

  // To'lovlar statistikasi
  const PaymentPieChart = () => (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={paymentStats}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {paymentStats.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`${value} ta`, "O'quvchilar"]}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )

  // O'qituvchilar faolligi
  const TeacherActivityChart = () => (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={dynamicData.teacherActivity}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
        <XAxis dataKey="ism" />
        <YAxis />
        <Tooltip
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Bar dataKey="darslar" name="O'tilgan darslar" fill="#10B981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Statistik kartalar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link to="/admin/student">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-medium text-gray-600">O‘quvchilar</h2>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stats.students}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/admin/teacher">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-medium text-gray-600">O‘qituvchilar</h2>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stats.teachers}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/admin/employer">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-medium text-gray-600">Xodimlar</h2>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stats.employees}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/admin/subject">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-medium text-gray-600">Fanlar</h2>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stats.subjects}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Grafiklar bo'limi */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* O‘quvchilar o‘sish grafigi */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="bg-indigo-100 text-indigo-600 p-1.5 rounded-md mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </span>
              O‘quvchilar o‘sishi
            </h2>
            <StudentGrowthChart />
          </div>

          {/* To‘lovlar statistikasi */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="bg-green-100 text-green-600 p-1.5 rounded-md mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              To'lovlar statistikasi
            </h2>
            <PaymentPieChart />
          </div>
        </div>

        {/* O‘qituvchilar faolligi */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="bg-purple-100 text-purple-600 p-1.5 rounded-md mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </span>
            O'qituvchilar faolligi
          </h2>
          <TeacherActivityChart />
        </div>

        {/* Qisqa statistik ma'lumotlar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Bugungi darslar</h3>
                <p className="text-xl font-bold text-gray-800">42 ta</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Yangi o'quvchilar</h3>
                <p className="text-xl font-bold text-gray-800">7 ta</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-100">
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Keyingi imtihon</h3>
                <p className="text-xl font-bold text-gray-800">5 kun</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminHome