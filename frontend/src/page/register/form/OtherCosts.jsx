// OtherCosts.jsx (tuzatilgan versiya)
import axios from "axios"
import { useEffect, useState } from "react"
import {
  FaBed, FaBus,
  FaCheck,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaShoppingCart
} from "react-icons/fa"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const OtherCosts = ({ studentId, onSuccess, handlerExit }) => {
  const [xizmatlar, setXizmatlar] = useState({ yotoqxona: [], mahsulot: [], transport: [] })
  const [yuklanmoqda, setYuklanmoqda] = useState(true)
  const [tanlanganXizmatlar, setTanlanganXizmatlar] = useState([])
  const [kelishilganNarx, setKelishilganNarx] = useState("")

  useEffect(() => {
    if (!studentId) return

    const xizmatlarniYuklash = async () => {
      try {
        setYuklanmoqda(true)
        const [yotoqxonaRes, mahsulotRes, transportRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/hostel/getAll`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/product/getAll`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/transport/getAll`),
        ])

        setXizmatlar({
          yotoqxona: yotoqxonaRes.data.hostels.map(item => ({
            ...item, tanlangan: false, turi: "yotoqxona",
            narx: item.hostelPrice, name: item.hostelName,
            description: item.description, icon: <FaBed className="text-blue-500 text-xl" />
          })),
          mahsulot: mahsulotRes.data.products.map(item => ({
            ...item, tanlangan: false, turi: "mahsulot",
            narx: item.productPrice, name: item.productName,
            description: item.description, icon: <FaShoppingCart className="text-green-500 text-xl" />
          })),
          transport: transportRes.data.transports.map(item => ({
            ...item, tanlangan: false, turi: "transport",
            narx: item.transportPrice, name: item.transportName,
            description: item.description, icon: <FaBus className="text-purple-500 text-xl" />
          })),
        })
      } catch (err) {
        toast.error("Xizmatlar ma'lumotlari yuklanmadi")
      } finally {
        setYuklanmoqda(false)
      }
    }

    xizmatlarniYuklash()
  }, [studentId])

  useEffect(() => {
    const barcha = [
      ...xizmatlar.yotoqxona,
      ...xizmatlar.mahsulot,
      ...xizmatlar.transport
    ].filter(item => item.tanlangan)
    setTanlanganXizmatlar(barcha)
  }, [xizmatlar])

  const tanlashniOzgarti = (turi, id) => {
    setXizmatlar(prev => {
      const yangilangan = prev[turi].map(item =>
        item._id === id ? { ...item, tanlangan: !item.tanlangan } : item
      )
      return { ...prev, [turi]: yangilangan }
    })
  }

  const royxatdanOtish = async () => {
    const tanlangan = {
      hostel: xizmatlar.yotoqxona.filter(x => x.tanlangan),
      mahsulot: xizmatlar.mahsulot.filter(x => x.tanlangan),
      transport: xizmatlar.transport.filter(x => x.tanlangan),
    }

    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/student/monthly-payment/${studentId}`,
        { userId: studentId, xizmatlar: tanlangan, kelishilganNarx: Number(kelishilganNarx) || 0 }
      )

      if (res.data.success) {
        toast.success("Xizmatlarga muvaffaqiyatli yozildingiz")

        // Talaba yotoqxona tanlaganligini tekshiramiz
        const hostelTanlangan = tanlangan.hostel.length > 0

        // Asosiy komponentga yotoqxona tanlanganligi haqida ma'lumot qaytaramiz
        onSuccess && onSuccess(hostelTanlangan)
      } else {
        toast.error(res.data.message || "Xatolik yuz berdi")
      }
    } catch {
      toast.error("Ro'yxatdan o'tishda xatolik yuz berdi")
    }
  }

  const barchaXizmatlar = [
    ...xizmatlar.yotoqxona,
    ...xizmatlar.mahsulot,
    ...xizmatlar.transport,
  ]

  const jamiNarx = tanlanganXizmatlar.reduce((sum, item) => sum + (item.narx || 0), 0)

  return (
    <div className="mx-auto p-4">
      <ToastContainer />
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-6 mb-6 shadow-lg">
        <h1 className="text-2xl font-bold flex items-center">
          <FaMoneyBillWave className="mr-3" />
          Qo'shimcha Xizmatlar
        </h1>
        <p className="mt-2">Kerakli xizmatlarni tanlang</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4">
        {yuklanmoqda ? (
          <div className="p-10 text-center">
            <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-indigo-600 rounded-full mx-auto mb-4"></div>
            <p>Xizmatlar yuklanmoqda...</p>
          </div>
        ) : barchaXizmatlar.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {barchaXizmatlar.map(xizmat => (
              <div
                key={xizmat._id}
                onClick={() => tanlashniOzgarti(xizmat.turi, xizmat._id)}
                className={`p-5 border rounded-xl cursor-pointer transition hover:shadow-md ${xizmat.tanlangan
                  ? "bg-indigo-50 border-indigo-400"
                  : "bg-white border-gray-200"
                  }`}
              >
                <div className="flex items-start">
                  <div className="mr-4">{xizmat.icon}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-gray-800">{xizmat.name}</h4>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                        {xizmat.narx.toLocaleString("uz-UZ")} so'm
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{xizmat.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">
            <FaExclamationTriangle className="text-3xl mx-auto mb-2" />
            Hech qanday xizmat topilmadi
          </div>
        )}
      </div>

      {/* Jami narx va kelishilgan summa */}
      <div className="mt-6 bg-white shadow p-4 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <p className="text-lg font-semibold text-gray-800">
            Jami: {jamiNarx.toLocaleString("uz-UZ")} so'm
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="number"
              placeholder="Kelishilgan summa"
              value={kelishilganNarx}
              onChange={e => setKelishilganNarx(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              onClick={royxatdanOtish}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md flex items-center justify-center"
            >
              <FaCheck className="mr-2" /> Saqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OtherCosts