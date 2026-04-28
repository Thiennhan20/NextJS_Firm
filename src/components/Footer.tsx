'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  HomeIcon,
  FilmIcon,
  PlayCircleIcon,
  NewspaperIcon,
  UserGroupIcon,
  QuestionMarkCircleIcon,
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'
import { FaFacebook, FaInstagram, FaYoutube } from 'react-icons/fa'
import Logo from '@/components/common/Logo'
import { useTranslations } from 'next-intl'

const footerNavItems = [
  { key: 'home', href: '/', icon: HomeIcon },
  { key: 'movies', href: '/movies', icon: FilmIcon },
  { key: 'tvShows', href: '/tvshows', icon: PlayCircleIcon },
  { key: 'news', href: '/news', icon: NewspaperIcon },
  { key: 'about', href: '/about', icon: UserGroupIcon },
  { key: 'faq', href: '/faq', icon: QuestionMarkCircleIcon },
  { key: 'contact', href: '/contact', icon: EnvelopeIcon },
]

const socialLinks = [
  { name: 'Facebook', href: 'https://www.facebook.com/ntnnhan203', icon: FaFacebook },
  { name: 'Instagram', href: 'https://www.instagram.com/t.nhan_03/', icon: FaInstagram },
  { name: 'YouTube', href: '#', icon: FaYoutube },
]

export default function Footer() {
  const t = useTranslations('Footer')
  const tNav = useTranslations('Navigation.items')

  return (
    <footer className="bg-gradient-to-b from-black to-gray-900 text-gray-300 py-12 md:py-16 sm:landscape:py-2 border-t border-gray-800 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500 opacity-10 rounded-full mix-blend-screen filter blur-xl animate-blob" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 opacity-10 rounded-full mix-blend-screen filter blur-xl animate-blob animation-delay-2000" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Logo variant="footer" />
            <p className="text-sm leading-relaxed">
              {t('description')}
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={link.name}
                  className={
                    `text-gray-400 cursor-pointer transition-colors ` +
                    (link.name === 'Facebook' ? 'hover:text-[#1877F3] focus:text-[#1877F3] active:text-blue-800 ' : '') +
                    (link.name === 'X' ? 'hover:text-black focus:text-black active:text-gray-800 ' : '') +
                    (link.name === 'Instagram' ? 'hover:text-[#E4405F] focus:text-[#E4405F] active:text-pink-700 ' : '') +
                    (link.name === 'YouTube' ? 'hover:text-[#FF0000] focus:text-[#FF0000] active:text-red-700 ' : '')
                  }
                >
                  <span className="inline-flex items-center justify-center rounded-full ring-2 ring-white bg-white p-1">
                    <link.icon className="h-6 w-6" />
                  </span>
                </motion.a>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">{t('quickLinks')}</h3>
            <ul className="space-y-2">
              {footerNavItems.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className="text-gray-400 hover:text-red-500 transition-colors">
                    {tNav(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">{t('contactUs')}</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <EnvelopeIcon className="h-5 w-5 text-red-500" />
                <p className="text-gray-400 hover:text-red-500 focus:text-red-500 active:text-red-600 cursor-pointer transition-colors">nhanntn2203@gmail.com</p>
              </div>
              <div className="flex items-center space-x-2">
                <PhoneIcon className="h-5 w-5 text-blue-500" />
                <p className="text-gray-400 hover:text-blue-500 focus:text-blue-500 active:text-blue-600 cursor-pointer transition-colors">+84 388 875 120</p>
              </div>
              <div className="flex items-start space-x-2">
                <MapPinIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <p className="text-gray-400">{t('address')}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">{t('newsletter')}</h3>
            <p className="text-sm text-gray-400">{t('newsletterDesc')}</p>
            <form className="flex flex-col gap-2">
              <input
                type="email"
                placeholder={t('emailPlaceholder')}
                className="px-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md transition-colors"
              >
                {t('subscribe')}
              </motion.button>
            </form>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} MovieWorld. By NTN
        </div>
      </div>
    </footer>
  )
} 