import axios from 'axios'
import { useEffect, useState } from 'react'
import { FaCalendarAlt, FaChartPie } from 'react-icons/fa'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis,
} from 'recharts'
import MonthlyPaymentControl from '../../register/MonthlyPaymentControl'

const StudentFinance = () => {
  const now = new Date()
  const [activeTab, setActiveTab] = useState('summary')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [pieData, setPieData] = useState([
    { name: 'To‘liq to‘langan', value: 0, color: '#22c55e' },
    { name: 'Qisman to‘langan', value: 0, color: '#facc15' },
    { name: 'Kechiktirilgan', value: 0, color: '#ef4444' }
  ])

  const barData = [
    { month: 'Yan', amount: 4000 },
    { month: 'Fev', amount: 3000 },
    { month: 'Mar', amount: 2000 },
    { month: 'Apr', amount: 2780 },
    { month: 'May', amount: 1890 },
    { month: 'Iyn', amount: 2390 },
    { month: 'Iyl', amount: 3490 },
  ]

  const lineData = [
    { week: '1-hafta', amount: 1000 },
    { week: '2-hafta', amount: 1500 },
    { week: '3-hafta', amount: 1200 },
    { week: '4-hafta', amount: 1700 },
  ]

  const years = Array.from({ length: 11 }, (_, i) => 2020 + i)
  const months = [
    { value: 1, label: "Yanvar" }, { value: 2, label: "Fevral" }, { value: 3, label: "Mart" },
    { value: 4, label: "Aprel" }, { value: 5, label: "May" }, { value: 6, label: "Iyun" },
    { value: 7, label: "Iyul" }, { value: 8, label: "Avgust" }, { value: 9, label: "Sentabr" },
    { value: 10, label: "Oktabr" }, { value: 11, label: "Noyabr" }, { value: 12, label: "Dekabr" }
  ]

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/payment/monthly-check`, {
          params: { year, month }
        })

        if (res.data.success) {
          const {
            paidStudents,
            partialStudents,
            completelyUnpaidStudents
          } = res.data

          setPieData([
            { name: 'To‘liq to‘langan', value: paidStudents, color: '#22c55e' },
            { name: 'Qisman to‘langan', value: partialStudents, color: '#facc15' },
            { name: 'Kechiktirilgan', value: completelyUnpaidStudents, color: '#ef4444' }
          ])
        }
      } catch (error) {
        console.error('Talabalarni olishda xatolik:', error)
      }
    }

    fetchStudents()
  }, [year, month])

  return (
    <div className="p-4 bg-gray-50 min-h-screen">

      {/* Tablar */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 flex items-center gap-2 rounded-lg ${activeTab === 'summary' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          <FaChartPie />
          Umumiy
        </button>
        <button
          onClick={() => setActiveTab('monthly-report')}
          className={`px-4 py-2 flex items-center gap-2 rounded-lg ${activeTab === 'monthly-report' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          <FaCalendarAlt />
          Oylik
        </button>
      </div>

      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Filtrlash */}
          <div className="space-y-6">
            {/* Filtrlash */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl shadow-md border border-blue-100">

              <div className="flex flex-wrap gap-5">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Yilni tanlang</label>
                  <div className="relative">
                    <select
                      className="w-full bg-white border border-gray-300 rounded-xl py-3 px-4 appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value))}
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Oyni tanlang</label>
                  <div className="relative">
                    <select
                      className="w-full bg-white border border-gray-300 rounded-xl py-3 px-4 appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
                      value={month}
                      onChange={(e) => setMonth(parseInt(e.target.value))}
                    >
                      {months.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* To'lov statistikasi kartalar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pieData.map((item, index) => (
              <div key={index} className="bg-white p-5 rounded-lg shadow-sm border flex flex-col items-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
                <p className="text-3xl font-bold mt-2" style={{ color: item.color }}>{item.value}</p>
                <p className="text-sm text-gray-500 mt-1">talaba</p>
              </div>
            ))}
          </div>

          {/* Grafiklar */}
          <div className="bg-white p-5 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold mb-5 text-center">To'lov tahlillari</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pie Chart */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-700 text-center">To'lov holatlari</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-700 text-center">Oylik to'lovlar</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="amount" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Line Chart */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-700 text-center">Haftalik to'lovlar</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'monthly-report' && (
        <div className="bg-white">
          <MonthlyPaymentControl />
        </div>
      )}
    </div>
  )
}

export default StudentFinance