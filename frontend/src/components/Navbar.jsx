import axios from 'axios'
import { useCallback, useEffect, useState } from "react"
import { FaCircleUser } from 'react-icons/fa6'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate()
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [user, setUser] = useState({})
  const [isNavigate, setNavigate] = useState('')
  const token = localStorage.getItem('token')

  const fetchData = useCallback(async () => {
    if (!token) {
      navigate('/login')
      return
    }

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile/getOne`, { headers })

      if (res.status === 200) {
        const userData = res.data.user
        setUser(userData)

        if (userData.role == 1) {
          if (userData.isAdmin) {
            setNavigate('admin')
          } else {
            setNavigate('teacher')
          }
        } else {
          setNavigate('register')
        }

      } else if ([401, 403, 404].includes(res.status)) {
        navigate('/login')
      }

    } catch (error) {
      console.error('Xatolik yuz berdi:', error)
      navigate('/login')
    }
  }, [token, navigate])


  useEffect(() => {
    fetchData()
  }, [fetchData])

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen((prev) => !prev)
  }

  const ProfileHandler = () => {
    navigate(`/${isNavigate}/profile`)
    toggleProfileMenu()
  }

  const MessageHandler = () => {
    navigate(`/${isNavigate}/message`)
    toggleProfileMenu()
  }

  const logoutHandler = () => {
    navigate('/login')
  }

  return (
    <div className="bg-indigo-700 shadow-lg p-4 flex items-center justify-between relative">
      {/* Sidebar Toggle (for small screens) */}
      <button
        onClick={toggleSidebar}
        className="p-3 rounded-md bg-indigo-700 text-white md:hidden focus:outline-none"
      >
        ☰
      </button>
      <div className="flex items-center">
        <img
          src={logo}
          alt="Logo"
          className="h-14 w-auto object-contain filter invert brightness-0"
        />
      </div>

      <div className="flex items-center relative">
        <button
          onClick={toggleProfileMenu}
          className="p-3 rounded-md bg-blue-600 border-none text-white hover:bg-blue-700 flex items-center gap-3 transition-all duration-300"
        >
          <FaCircleUser className="w-7 h-7 text-white" />
          <span className="hidden sm:block text-sm">{user.fullName}</span>
        </button>

        {isProfileMenuOpen && (
          <div className="absolute top-16 right-0 bg-white shadow-lg rounded-md p-2 w-48 z-10 transition-all duration-300">
            <button
              onClick={ProfileHandler}
              className="w-full p-3 text-left bg-white hover:bg-blue-100 rounded-md border-none text-blue-600"
            >
              Profil
            </button>
            <button
              onClick={MessageHandler}
              className="w-full p-3 text-left bg-white hover:bg-blue-100 rounded-md border-none text-blue-600"
            >
              Xabarlar
            </button>
            <hr className="my-2" />
            <button
              onClick={logoutHandler}
              className="w-full p-3 text-left bg-white text-red-600 hover:bg-red-100 border-none rounded-md"
            >
              Chiqish
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Navbar
