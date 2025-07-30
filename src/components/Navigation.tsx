'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  MagnifyingGlassIcon, 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  FilmIcon,
  TagIcon,
  NewspaperIcon,
  UserGroupIcon,
  QuestionMarkCircleIcon,
  EnvelopeIcon,
  BookmarkIcon,
  UserIcon,
  QueueListIcon,
  PlayCircleIcon
} from '@heroicons/react/24/outline'
import useAuthStore from '@/store/useAuthStore'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { toast } from 'react-hot-toast'
import { LogOut, Settings } from 'lucide-react';
import { useUIStore } from '@/store/store';
import AutocompleteSearch from '@/components/common/AutocompleteSearch';
import { useWatchlistStore } from '@/store/store';
import useAuthHydrated from '@/store/useAuthHydrated';

const mainNavItems = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Movies', href: '/movies', icon: FilmIcon },
  { name: 'Categories', href: '/categories', icon: TagIcon },
]

const moreNavItems = [
  { name: 'News', href: '/news', icon: NewspaperIcon },
  { name: 'About', href: '/about', icon: UserGroupIcon },
  { name: 'FAQ', href: '/faq', icon: QuestionMarkCircleIcon },
  { name: 'Contact', href: '/contact', icon: EnvelopeIcon },
  { name: 'Streaming', href: '/streaming', icon: PlayCircleIcon },
]

// Enhanced Logo Component
interface EnhancedLogoProps {
  isScrolled: boolean;
}

const EnhancedLogo: React.FC<EnhancedLogoProps> = ({ isScrolled }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href="/" className="relative group flex items-center gap-2 cursor-pointer">
      <motion.div
        className="relative flex items-center gap-3"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Glow Effect Background */}
        <motion.div
          className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: isScrolled 
              ? 'linear-gradient(135deg, #f59e0b, #ef4444, #ec4899)'
              : 'linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)'
          }}
          animate={{
            scale: isHovered ? 1.2 : 1,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Main Logo Container */}
        <motion.div
          className={`relative flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-sm border transition-all duration-500 ${
            isScrolled 
              ? 'bg-white/90 hover:bg-white border-gray-200 shadow-lg' 
              : 'bg-black/50 hover:bg-black/70 border-white/20 shadow-xl'
          }`}
          animate={{
            boxShadow: isHovered 
              ? isScrolled 
                ? '0 20px 40px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(249, 115, 22, 0.3)'
                : '0 20px 40px -12px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.3)'
              : isScrolled
                ? '0 8px 20px -3px rgba(0, 0, 0, 0.1)'
                : '0 15px 30px -4px rgba(0, 0, 0, 0.5)'
          }}
        >
                     {/* Logo Icon */}
           <motion.div 
             className="relative w-5 h-5 sm:w-6 sm:h-6"
            animate={{
              rotate: isHovered ? 360 : 0,
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            {/* Animated Ring Background */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 opacity-30"
              style={{
                borderColor: isScrolled ? '#f59e0b' : '#3b82f6'
              }}
              animate={{
                rotate: isHovered ? -360 : 0,
                scale: isHovered ? 1.3 : 1,
              }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />
            
            {/* Main Icon */}
            <motion.div
              className={`w-full h-full rounded-full flex items-center justify-center text-sm sm:text-base font-bold transition-all duration-300 ${
                isScrolled 
                  ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white' 
                  : 'bg-gradient-to-br from-blue-400 to-purple-500 text-white'
              }`}
              whileHover={{ 
                scale: 1.1,
                rotate: 5,
              }}
              animate={{
                background: isHovered 
                  ? isScrolled
                    ? 'linear-gradient(135deg, #f97316, #dc2626, #be185d)'
                    : 'linear-gradient(135deg, #2563eb, #7c3aed, #0891b2)'
                  : isScrolled
                    ? 'linear-gradient(135deg, #fb923c, #ef4444)'
                    : 'linear-gradient(135deg, #60a5fa, #a78bfa)'
              }}
            >
              NTN
            </motion.div>

            {/* Floating Particles */}
            {[...Array(2)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-1 h-1 rounded-full ${
                  isScrolled ? 'bg-orange-400' : 'bg-blue-400'
                }`}
                style={{
                  top: `${30 + i * 20}%`,
                  left: `${80 + i * 10}%`,
                }}
                animate={{
                  y: isHovered ? [-8, -15, -8] : [0, -3, 0],
                  opacity: isHovered ? [0.3, 1, 0.3] : [0.6, 0.3, 0.6],
                  scale: isHovered ? [1, 1.5, 1] : [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
          </motion.div>

          {/* Text Logo */}
          <motion.div className="flex flex-col">
                         <motion.span 
               className={`text-base sm:text-lg font-black tracking-wider leading-none ${
                 isScrolled ? 'text-gray-900' : 'text-white'
               }`}
              animate={{
                background: isHovered
                  ? isScrolled
                    ? 'linear-gradient(135deg, #f97316, #dc2626, #be185d)'
                    : 'linear-gradient(135deg, #2563eb, #7c3aed, #0891b2)'
                  : isScrolled
                    ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                    : 'linear-gradient(135deg,rgb(7, 83, 205), #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              whileHover={{
                scale: 1.02,
                letterSpacing: '0.15em',
              }}
              transition={{ duration: 0.3 }}
            >
              E&G
            </motion.span>
            
                         {/* Subtitle */}
             <motion.span 
               className={`text-[10px] tracking-widest opacity-70 ${
                 isScrolled ? 'text-gray-600' : 'text-gray-300'
               }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: isHovered ? 1 : 0.7, 
                y: isHovered ? 0 : 3 
              }}
              transition={{ duration: 0.3 }}
            >
              Funny
            </motion.span>
          </motion.div>

          {/* Shine Effect */}
          <motion.div
            className="absolute inset-0 rounded-xl opacity-0 pointer-events-none"
            style={{
              background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
            }}
            animate={{
              opacity: isHovered ? [0, 1, 0] : 0,
              x: isHovered ? [-80, 80] : 0,
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Floating Elements */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-1.5 h-1.5 rounded-full opacity-20 ${
              isScrolled ? 'bg-orange-400' : 'bg-blue-400'
            }`}
            style={{
              top: `${20 + (i % 2) * 60}%`,
              left: `${-15 + (i % 2) * 130}%`,
            }}
            animate={{
              y: isHovered ? [0, -20, 0] : [0, -8, 0],
              x: isHovered ? [0, Math.sin(i) * 15, 0] : [0, Math.sin(i) * 3, 0],
              opacity: isHovered ? [0.2, 0.6, 0.2] : [0.1, 0.3, 0.1],
              scale: isHovered ? [1, 1.5, 1] : [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>
    </Link>
  );
};

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { user, isAuthenticated, logout, isLoading } = useAuthStore()
  const { setNavDropdownOpen } = useUIStore();
  const { watchlist } = useWatchlistStore();
  const hydrated = useAuthHydrated();

  const [isMoreDropdownActive, setIsMoreDropdownActive] = useState(false);
  const [isProfileDropdownActive, setIsProfileDropdownActive] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileUserDropdownOpen, setIsMobileUserDropdownOpen] = useState(false);
  const [isMobileMoreDropdownOpen, setIsMobileMoreDropdownOpen] = useState(false);

  useEffect(() => {
    setNavDropdownOpen(isOpen || isMoreDropdownActive || isProfileDropdownActive);
  }, [isOpen, isMoreDropdownActive, isProfileDropdownActive, setNavDropdownOpen]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/90 backdrop-blur-md' : 'bg-white shadow-lg'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Enhanced Logo */}
          <EnhancedLogo isScrolled={isScrolled} />

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative px-4 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'text-red-500' 
                      : isScrolled 
                        ? 'text-white hover:text-red-500' 
                        : 'text-gray-700 hover:text-red-500'
                  }`}
                >
                  <motion.div
                    className="flex items-center space-x-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </motion.div>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </Link>
              )
            })}
            {/* More dropdown */}
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isScrolled ? 'text-white hover:text-red-500' : 'text-gray-700 hover:text-red-500'
                  }`}
                >
                  <QueueListIcon className="h-5 w-5" />
                  <span>More</span>
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
                beforeEnter={() => setIsMoreDropdownActive(true)}
                afterLeave={() => setIsMoreDropdownActive(false)}
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-gray-900 backdrop-blur-md divide-y divide-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-60">
                  <div className="px-1 py-1 ">
                    {moreNavItems.map((item) => (
                      <Menu.Item key={item.name}>
                        {({ active }) => (
                          <Link
                            href={item.href}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                              active ? 'bg-red-500 text-white' : 'text-gray-300'
                            }`}
                          >
                            <item.icon className="h-5 w-5" />
                            <span>{item.name}</span>
                          </Link>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>

          {/* Search and Auth */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            <div className="relative">
              <AutocompleteSearch />
            </div>

            {!hydrated || isLoading ? (
              <div className="flex items-center space-x-2 px-4 py-2">
                <div className="w-6 h-6 rounded-full bg-gray-300 animate-pulse" />
                <div className="w-20 h-4 bg-gray-300 rounded animate-pulse" />
              </div>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Menu as="div" className="relative inline-block text-left">
                  <div>
                    <Menu.Button
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        isScrolled ? 'text-white hover:text-red-500' : 'text-gray-700 hover:text-red-500'
                      }`}
                    >
                      <UserIcon className="h-5 w-5" />
                      <span>{user?.name || 'User'}</span>
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                    beforeEnter={() => setIsProfileDropdownActive(true)}
                    afterLeave={() => setIsProfileDropdownActive(false)}
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-gray-900 backdrop-blur-md divide-y divide-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-60">
                      <div className="px-1 py-1 ">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/profile"
                              className={`w-full flex items-center space-x-2 text-left px-4 py-2 text-gray-300 ${
                                active ? 'bg-gray-700 text-white' : 'hover:bg-gray-800 hover:text-white'
                              }`}
                            >
                              <UserIcon className="h-5 w-5" />
                              <span>Profile</span>
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/watchlist"
                              className={`w-full flex items-center space-x-2 text-left px-4 py-2 text-gray-300 ${
                                active ? 'bg-gray-700 text-white' : 'hover:bg-gray-800 hover:text-white'
                              }`}
                            >
                              <BookmarkIcon className="h-5 w-5" />
                              <span>Watchlist ({watchlist.length})</span>
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/settings"
                              className={`w-full flex items-center space-x-2 text-left px-4 py-2 text-gray-300 ${
                                active ? 'bg-gray-700 text-white' : 'hover:bg-gray-800 hover:text-white'
                              }`}
                            >
                              <Settings className="h-5 w-5" />
                              <span>Settings</span>
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => {
                                logout();
                                toast.success('Đã đăng xuất!');
                              }}
                              className={`w-full text-left px-4 py-2 text-gray-300 ${
                                active ? 'bg-red-500 text-white' : 'hover:bg-gray-800 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <LogOut className="h-5 w-5" />
                                <span>Logout</span>
                              </div>
                            </button>
                          )}
                        </Menu.Item>

                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            ) : (
              <Link
                href="/login"
                className={`relative px-4 py-2 rounded-lg transition-colors font-medium ${
                  isScrolled ? 'bg-red-700 text-white hover:bg-red-800' : 'bg-red-700 text-white hover:bg-red-800'
                }`}
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile search icon and menu button combined */}
          <div className="flex lg:hidden items-center space-x-0">
            <button
              onClick={() => setShowMobileSearch(true)}
              className="p-1 rounded-full bg-white shadow border border-red-200 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
              aria-label="Open search"
              style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }}
            >
              <MagnifyingGlassIcon className="h-3 w-3" />
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500 transition-colors duration-200 ${
                'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div className="fixed inset-0 z-[999] flex flex-col items-start justify-start bg-black/60 backdrop-blur-[4px] transition-all">
          <div className="w-full flex justify-center pt-4 animate-fadeInUp">
            <div className="w-full max-w-md mx-2 relative">
              <AutocompleteSearch
                menu
                onSelectMovie={() => setShowMobileSearch(false)}
                inputClassName="text-lg px-6 py-4 border-2 border-red-500 bg-gray-900 text-white placeholder-gray-300 focus:bg-gray-900 focus:ring-2 focus:ring-red-500 shadow-lg"
                showClose
                onClose={() => setShowMobileSearch(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu, show/hide based on menu state. */}
      <Transition
        show={isOpen}
        as={Fragment}
        enter="duration-300 ease-out"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="duration-200 ease-in"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
        beforeEnter={() => setIsOpen(true)}
        afterLeave={() => setIsOpen(false)}
      >
        <motion.div
          className={`lg:hidden overflow-y-auto max-h-[calc(100vh-4rem)] ${
            'bg-white'
          }`}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive
                      ? 'bg-red-500 text-white'
                      : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                >
                  <motion.div className="flex items-center space-x-2" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </motion.div>
                </Link>
              );
            })}
            {/* More dropdown for mobile */}
            <button
              className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-200 hover:text-gray-900 focus:outline-none"
              onClick={() => {
                setIsMobileMoreDropdownOpen((prev) => {
                  if (!prev) setIsMobileUserDropdownOpen(false);
                  return !prev;
                });
              }}
              aria-expanded={isMobileMoreDropdownOpen}
            >
              <QueueListIcon className="h-5 w-5" />
              <span>More</span>
              <svg className={`ml-auto h-4 w-4 transition-transform ${isMobileMoreDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isMobileMoreDropdownOpen && (
              <div className="pl-6 space-y-1 animate-fadeIn">
                {moreNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => { setIsOpen(false); setIsMobileMoreDropdownOpen(false); }}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                        isActive
                          ? 'bg-red-500 text-white'
                          : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
            {/* Mobile Watchlist, User/Login, Logout */}
            {!hydrated || isLoading ? (
              <div className="block w-full px-4 py-2 mt-4">
                <div className="w-6 h-6 rounded-full bg-gray-300 animate-pulse mb-2" />
                <div className="w-24 h-4 bg-gray-300 rounded animate-pulse" />
              </div>
            ) : isAuthenticated ? (
              <div className="px-3 mt-4 space-y-2">
                <button
                  className="block w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 mb-1 bg-gray-100 flex items-center space-x-2 focus:outline-none"
                  onClick={() => {
                    setIsMobileUserDropdownOpen((prev) => {
                      if (!prev) setIsMobileMoreDropdownOpen(false);
                      return !prev;
                    });
                  }}
                  aria-expanded={isMobileUserDropdownOpen}
                >
                  <UserIcon className="h-5 w-5" />
                  <span className="truncate">{user?.name || 'User'}</span>
                  <svg className={`ml-auto h-4 w-4 transition-transform ${isMobileUserDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {isMobileUserDropdownOpen && (
                  <div className="bg-gray-50 rounded-md divide-y divide-gray-200 shadow-sm animate-fadeIn">
                    <Link
                      href="/watchlist"
                      onClick={() => { setIsOpen(false); setIsMobileUserDropdownOpen(false); }}
                      className="flex items-center space-x-2 px-3 py-2 rounded-t-md text-base font-medium text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                    >
                      <BookmarkIcon className="h-5 w-5" />
                      <span>Watchlist ({watchlist.length})</span>
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => { setIsOpen(false); setIsMobileUserDropdownOpen(false); }}
                      className="flex items-center space-x-2 px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                    >
                      <UserIcon className="h-5 w-5" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => { setIsOpen(false); setIsMobileUserDropdownOpen(false); }}
                      className="flex items-center space-x-2 px-3 py-2 rounded-b-md text-base font-medium text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                    >
                      <Settings className="h-5 w-5" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        toast.success('Đã đăng xuất!');
                        setIsOpen(false);
                        setIsMobileUserDropdownOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 mt-2 text-red-600 hover:bg-gray-100 hover:text-red-700 border-t border-gray-200"
                    >
                      <div className="flex items-center space-x-2">
                        <LogOut className="h-5 w-5" />
                        <span>Đăng xuất</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)} // Close menu on click
                className={`block w-full text-center px-4 py-2 rounded-md text-base font-medium mt-4 ${
                  'bg-red-700 text-white hover:bg-red-800'
                }`}
              >
                Login
              </Link>
            )}
          </div>
        </motion.div>
      </Transition>
    </nav>
  )
}