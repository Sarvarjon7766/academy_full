import axios from 'axios'
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  BarChart3,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  Users
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { MonthlyPaymentControl } from '../register'
import {
  BenefitsFinence,
  CashJournal,
  EmployerFinance,
  ExpenseReport,
  MonthlyFinence,
  StudentFinence,
  TeacherFinence,
  YearlyFinence,
} from './Finence/index'

const Finence = () => {
  const [isAvailable, setIsAvailable] = useState('finence')
  const [students, setStudents] = useState([])

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/student/getAll`)
        if (res.data.success) {
          setStudents(res.data.students)
        }
      } catch (error) {
        console.error('Talabalarni olishda xatolik:', error)
      }
    }
    fetchStudents()
  }, [])

  const sections = [
    {
      title: 'Talabalar',
      description: "Talabalar Moloyaviy hisobotlari",
      color: 'bg-green-100 border-green-300 text-green-700',
      icon: <Users className='w-6 h-6' />,
      route: 'studentfinence',
      number_of_students: students?.length
    },
    {
      title: 'O‘qituvchilar',
      description: "O'qituvchilar moliyaviy hisobotlari",
      color: 'bg-blue-100 border-blue-300 text-blue-700',
      icon: <BarChart3 className='w-6 h-6' />,
      route: 'teacherfinence'
    },
    {
      title: "Xodimlar",
      description: "Xodimlar Moliyaviy hisobotlari",
      color: 'bg-purple-100 border-purple-300 text-purple-700',
      icon: <Calendar className='w-6 h-6' />,
      route: 'employerfinance'
    },
    {
      title: "Xo'jalik bo'limi",
      description: "Xo'jalik mahsulotlari uchun mablag'lar kirdi chiqdisi",
      color: 'bg-purple-100 border-purple-300 text-purple-700',
      icon: <Calendar className='w-6 h-6' />,
      route: 'yearlyfinence'
    },
    {
      title: 'Oylik umumiy daromad',
      description: 'Har oyda tushgan umumiy mablag‘lar statistikasi.',
      color: 'bg-indigo-100 border-indigo-300 text-indigo-700',
      icon: <DollarSign className='w-6 h-6' />,
      route: 'monthlyfinence'
    },
    {
      title: 'Qarzdor talabalar',
      description: 'To‘lov muddati o‘tgan talabalar ro‘yxati.',
      color: 'bg-pink-100 border-pink-300 text-pink-700',
      icon: <AlertTriangle className='w-6 h-6' />,
      route: 'debtorsreport'
    },
    {
      title: 'Kassa: Kirim va chiqimlar',
      description: 'Kundalik kirim va chiqimlar jurnali.',
      color: 'bg-orange-100 border-orange-300 text-orange-700',
      icon: <FileText className='w-6 h-6' />,
      route: 'cashjournal'
    },
    {
      title: 'Xarajatlar tahlili',
      description: 'Markaz xarajatlarini kategoriya bo‘yicha tahlil.',
      color: 'bg-yellow-100 border-yellow-300 text-yellow-700',
      icon: <Banknote className='w-6 h-6' />,
      route: 'expensereport'
    },
    {
      title: 'Foyda va zarar hisobotlari',
      description: 'Oylik/yillik daromad va xarajatlar tahlili.',
      color: 'bg-red-100 border-red-300 text-red-700',
      icon: <TrendingUp className='w-6 h-6' />,
      route: 'profitfinence',
      colSpan: true
    },

  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Orqaga qaytish tugmasi - faqat asosiy bo'limda emasligida ko'rinadi */}
      {isAvailable !== 'finence' && (
        <div className="p-4 border-b bg-white">
          <button
            onClick={() => setIsAvailable('finence')}
            className="flex items-center rounded-full bg-white gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      )}

      {isAvailable === 'finence' && (
        <div className='p-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mx-auto'>
            {sections.map((section, index) => (
              <div
                key={index}
                onClick={() => setIsAvailable(section.route)}
                className={`border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${section.colSpan ? 'md:col-span-2 lg:col-span-3' : ''} ${section.color}`}
              >
                <div className='flex items-start gap-4'>
                  <div className='p-2 rounded-lg bg-white'>{section.icon}</div>

                  <div className='flex-1'>
                    <h2 className='text-lg font-semibold mb-2'>{section.title}</h2>
                    <p className='text-sm text-gray-600 mb-2'>{section.description}</p>

                    {section.number_of_students !== undefined && (
                      <div className="text-sm font-medium mt-2">
                        Jami talabalar: {section.number_of_students} ta
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAvailable === 'studentfinence' && <StudentFinence />}
      {isAvailable === 'teacherfinence' && <TeacherFinence />}
      {isAvailable === 'monthlyfinence' && <MonthlyFinence />}
      {isAvailable === 'yearlyfinence' && <YearlyFinence />}
      {isAvailable === 'employerfinance' && <EmployerFinance />}
      {isAvailable === 'profitfinence' && <BenefitsFinence />}
      {isAvailable === 'cashjournal' && <CashJournal />}
      {isAvailable === 'expensereport' && <ExpenseReport />}
      {isAvailable === 'debtorsreport' && <MonthlyPaymentControl />}
    </div>
  )
}

export default Finence