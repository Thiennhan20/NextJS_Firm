'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic';
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
import { useTemporaryWatchlistStore } from '@/store/store'
import { LogOut } from 'lucide-react';
import { useUIStore } from '@/store/store';

const MotionNav = dynamic(() => import('framer-motion').then(mod => mod.motion.nav), { ssr: false });
const MotionSpan = dynamic(() => import('framer-motion').then(mod => mod.motion.span), { ssr: false });
const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });

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

const allNavItems = [...mainNavItems, ...moreNavItems]; // Combine all items for mobile menu

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { temporaryWatchlist } = useTemporaryWatchlistStore();
  const { setNavDropdownOpen } = useUIStore();

  const [isMoreDropdownActive, setIsMoreDropdownActive] = useState(false);
  const [isProfileDropdownActive, setIsProfileDropdownActive] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setNavDropdownOpen(isOpen || isMoreDropdownActive || isProfileDropdownActive);
  }, [isOpen, isMoreDropdownActive, isProfileDropdownActive, setNavDropdownOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search functionality
    console.log('Searching for:', searchQuery)
  }

  return (
    <MotionNav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/90 backdrop-blur-md shadow-lg' : 'bg-white shadow-lg'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="relative group">
            <MotionSpan 
              className={`text-2xl font-bold ${isScrolled ? 'text-red-600' : 'text-red-700'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              MovieWorld
            </MotionSpan>
            <MotionDiv
              className={`absolute -bottom-1 left-0 w-0 h-0.5 ${isScrolled ? 'bg-red-600' : 'bg-red-700'} group-hover:w-full transition-all duration-300`}
              initial={{ width: 0 }}
              whileHover={{ width: '100%' }}
            />
          </Link>

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
                  <MotionDiv
                    className="flex items-center space-x-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </MotionDiv>
                  {isActive && (
                    <MotionDiv
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
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 w-48 focus:w-64 ${
                  isScrolled ? 'bg-gray-900/50 backdrop-blur-sm text-white placeholder-gray-400' : 'bg-gray-200 text-gray-900 placeholder-gray-600'
                }`}
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
                <MagnifyingGlassIcon className={`h-5 w-5 ${isScrolled ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </form>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/watchlist"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isScrolled ? 'text-white hover:text-red-500' : 'text-gray-700 hover:text-red-500'
                  }`}
                >
                  <BookmarkIcon className="h-5 w-5" />
                  <span>Watchlist ({temporaryWatchlist.length})</span>
                </Link>
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
                  isScrolled ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-700 text-white hover:bg-red-800'
                }`}
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500 transition-colors duration-200 ${
                isScrolled ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
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
        <MotionDiv
          className={`lg:hidden overflow-y-auto max-h-[calc(100vh-4rem)] ${
            isScrolled ? 'bg-black/90 backdrop-blur-md' : 'bg-white'
          }`}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {allNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)} // Close menu on click
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive
                      ? 'bg-red-500 text-white'
                      : isScrolled
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                >
                  <MotionDiv
                    className="flex items-center space-x-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </MotionDiv>
                </Link>
              )
            })}
            {/* Mobile Search Input */}
            <form onSubmit={handleSearch} className="mt-4 px-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm phim..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-800/80 text-white placeholder-gray-400"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </form>

            {/* Mobile Watchlist, User/Login, Logout */}
            {isAuthenticated ? (
              <div className="px-3 mt-4 space-y-2">
                <Link
                  href="/watchlist"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <BookmarkIcon className="h-5 w-5" />
                  <span>Watchlist ({temporaryWatchlist.length})</span>
                </Link>
                <div className={`block px-3 py-2 rounded-md text-base font-medium ${isScrolled ? 'text-gray-300' : 'text-gray-700'}`}>
                  <MotionDiv
                    className="flex items-center space-x-2"
                  >
                    <UserIcon className="h-5 w-5" />
                    <span>{user?.name || 'User'}</span>
                  </MotionDiv>
                </div>
                <button
                  onClick={() => {
                    logout();
                    toast.success('Đã đăng xuất!');
                    setIsOpen(false); // Close mobile menu after logout
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isScrolled
                      ? 'text-red-400 hover:bg-gray-700 hover:text-white'
                      : 'text-red-600 hover:bg-gray-100 hover:text-red-700'
                  }`}
                >
                  <MotionDiv
                    className="flex items-center space-x-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Đăng xuất</span>
                  </MotionDiv>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)} // Close menu on click
                className={`block w-full text-center px-4 py-2 rounded-md text-base font-medium mt-4 ${
                  isScrolled ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-700 text-white hover:bg-red-800'
                }`}
              >
                Login
              </Link>
            )}
          </div>
        </MotionDiv>
      </Transition>
    </MotionNav>
  )
} 