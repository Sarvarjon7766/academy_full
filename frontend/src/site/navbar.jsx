import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'

const Navbar = () => {
  const navigate = useNavigate()

  const loginHandler = () => {
    navigate('/login')
  }

  return (
    <nav className="bg-gradient-to-r from-blue-700 to-teal-400 text-white py-3 px-4 md:px-8 fixed top-0 left-0 w-full shadow-lg z-50 rounded-b-lg">
      <div className="container mx-auto flex items-center justify-between">

        {/* Logo + Button (kichik ekranlarda yonma-yon) */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <img
            src={logo}
            alt="Logo"
            className="h-10 w-auto object-contain filter invert brightness-0" // <-- kichiklashtirildi
          />
          <button
            onClick={loginHandler}
            className="ml-4 md:hidden text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded shadow-md"
          >
            Shaxsiy kabinet
          </button>
        </div>

        {/* O‘rtadagi manzil ma’lumotlari — faqat md va undan katta ekranlarda */}
        <div className="hidden md:flex flex-row items-center space-x-8 text-center md:text-left">
          <div>
            <p className="text-sm">Samarqand viloyati, Bulung'ur tumani</p>
            <p className="text-xs">Soxibkor QFY Gulzor mahallasi</p>
            <p className="text-xs">Birdamlik ko'chasi, 13-uy</p>
          </div>
          <div className="text-left">
            <p className="text-xs">Du-jum soat 22:00 gacha qo'ng'iroq qiling</p>
            <h2 className="text-sm font-semibold">+998(94) 538 37 14</h2>
          </div>
        </div>

        {/* O‘ng tomondagi button — faqat md va undan katta ekranlarda */}
        <div className="hidden md:block">
          <button
            onClick={loginHandler}
            className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow-md"
          >
            Shaxsiy kabinet
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
