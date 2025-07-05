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
import { useTemporaryWatchlistStore } from '@/store/store'
import { LogOut } from 'lucide-react';
import { useUIStore } from '@/store/store';
import AutocompleteSearch from '@/components/common/AutocompleteSearch';

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
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { temporaryWatchlist } = useTemporaryWatchlistStore();
  const { setNavDropdownOpen } = useUIStore();

  const [isMoreDropdownActive, setIsMoreDropdownActive] = useState(false);
  const [isProfileDropdownActive, setIsProfileDropdownActive] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
          {/* Logo */}
          <Link href="/" className="relative group">
            <motion.span 
              className={`text-2xl font-bold ${isScrolled ? 'text-red-600' : 'text-red-700'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              MovieWorld
            </motion.span>
            <motion.div
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
                      : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                >
                  <motion.div
                    className="flex items-center space-x-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </motion.div>
                </Link>
              )
            })}
            {/* Mobile Watchlist, User/Login, Logout */}
            {isAuthenticated ? (
              <div className="px-3 mt-4 space-y-2">
                <Link
                  href="/watchlist"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                >
                  <BookmarkIcon className="h-5 w-5" />
                  <span>Watchlist ({temporaryWatchlist.length})</span>
                </Link>
                <div className={`block px-3 py-2 rounded-md text-base font-medium text-gray-700`}>
                  <motion.div
                    className="flex items-center space-x-2"
                  >
                    <UserIcon className="h-5 w-5" />
                    <span>{user?.name || 'User'}</span>
                  </motion.div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    toast.success('Đã đăng xuất!');
                    setIsOpen(false); // Close mobile menu after logout
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    'text-red-600 hover:bg-gray-100 hover:text-red-700'
                  }`}
                >
                  <motion.div
                    className="flex items-center space-x-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Đăng xuất</span>
                  </motion.div>
                </button>
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