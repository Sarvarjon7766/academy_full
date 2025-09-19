import axios from 'axios'
import { useState } from 'react'
import { FaIdCard, FaLock, FaPhone, FaUser, FaUserPlus } from 'react-icons/fa'
import { RiShieldKeyholeFill } from 'react-icons/ri'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const Registrator = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        login: '',
        password: '',
        phone: '',
        role: 2,
        isActive: true
    })

    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const validateForm = () => {
        const newErrors = {}

        if (!formData.fullName.trim()) newErrors.fullName = 'Toʻliq ism kiritilishi shart'
        if (!formData.login.trim()) newErrors.login = 'Login kiritilishi shart'
        if (!formData.password) newErrors.password = 'Parol kiritilishi shart'
        if (!formData.phone.trim()) newErrors.phone = 'Telefon raqam kiritilishi shart'

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            toast.error('Iltimos, barcha majburiy maydonlarni toʻldiring')
            return
        }

        setIsSubmitting(true)

        try {
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/register/create`,
                formData,
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            )

            toast.success('Registrator muvaffaqiyatli qoʻshildi!')

            // Reset form
            setFormData({
                fullName: '',
                login: '',
                password: '',
                phone: '',
                role: 2,
                isActive: true
            })

        } catch (error) {
            console.error('Xatolik:', error)
            if (error.response?.data?.message) {
                toast.error(error.response.data.message)
            } else {
                toast.error('Xatolik yuz berdi. Iltimos, qaytadan urinib koʻring.')
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-6">
            <div className="w-full">

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                        {/* 2x2 Grid Layout for larger screens */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {/* Full Name */}
                            <div className="space-y-2">
                                <label className="flex items-center text-sm md:text-base font-medium text-gray-700" htmlFor="fullName">
                                    <FaUser className="mr-2 text-blue-600 text-sm md:text-base" />
                                    Toʻliq ism *
                                </label>
                                <div className="relative">
                                    <input
                                        id="fullName"
                                        name="fullName"
                                        type="text"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 md:py-2.5 pl-11 pr-4 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${errors.fullName
                                            ? 'border-red-500 focus:ring-red-200'
                                            : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
                                            }`}
                                        placeholder="Ism familiya"
                                    />
                                    <FaIdCard className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                                </div>
                                {errors.fullName && (
                                    <p className="mt-1 text-xs text-red-600 flex items-center">
                                        <span className="w-1 h-1 bg-red-600 rounded-full mr-1"></span>
                                        {errors.fullName}
                                    </p>
                                )}
                            </div>

                            {/* Login */}
                            <div className="space-y-2">
                                <label className="flex items-center text-sm md:text-base font-medium text-gray-700" htmlFor="login">
                                    <FaUser className="mr-2 text-blue-600 text-sm md:text-base" />
                                    Login *
                                </label>
                                <div className="relative">
                                    <input
                                        id="login"
                                        name="login"
                                        type="text"
                                        value={formData.login}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 md:py-2.5 pl-11 pr-4 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${errors.login
                                            ? 'border-red-500 focus:ring-red-200'
                                            : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
                                            }`}
                                        placeholder="Foydalanuvchi nomi"
                                    />
                                    <FaUser className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                                </div>
                                {errors.login && (
                                    <p className="mt-1 text-xs text-red-600 flex items-center">
                                        <span className="w-1 h-1 bg-red-600 rounded-full mr-1"></span>
                                        {errors.login}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="flex items-center text-sm md:text-base font-medium text-gray-700" htmlFor="password">
                                    <FaLock className="mr-2 text-blue-600 text-sm md:text-base" />
                                    Parol *
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 md:py-2.5 pl-11 pr-4 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${errors.password
                                            ? 'border-red-500 focus:ring-red-200'
                                            : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
                                            }`}
                                        placeholder="Kuchli parol yarating"
                                    />
                                    <RiShieldKeyholeFill className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-xs text-red-600 flex items-center">
                                        <span className="w-1 h-1 bg-red-600 rounded-full mr-1"></span>
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <label className="flex items-center text-sm md:text-base font-medium text-gray-700" htmlFor="phone">
                                    <FaPhone className="mr-2 text-blue-600 text-sm md:text-base" />
                                    Telefon raqam *
                                </label>
                                <div className="relative">
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 md:py-2.5 pl-11 pr-4 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${errors.phone
                                            ? 'border-red-500 focus:ring-red-200'
                                            : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
                                            }`}
                                        placeholder="+998 XX XXX XX XX"
                                    />
                                    <FaPhone className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                                </div>
                                {errors.phone && (
                                    <p className="mt-1 text-xs text-red-600 flex items-center">
                                        <span className="w-1 h-1 bg-red-600 rounded-full mr-1"></span>
                                        {errors.phone}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 md:pt-6 border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full md:w-auto md:px-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                                    }`}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Joʻnatilmoqda...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center">
                                        <FaUserPlus className="mr-2 text-lg" />
                                        Registrator qoʻshish
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                pauseOnFocusLoss
                draggable
                pauseOnHover
                toastClassName="shadow-lg"
            />
        </div>
    )
}

export default Registrator