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
import { useWatchlistStore } from '@/store/store';
import useAuthHydrated from '@/store/useAuthHydrated';
import Logo from '@/components/common/Logo';
import LanguageSelector from '@/components/common/LanguageSelector';
import dynamic from 'next/dynamic';
import UserAvatar from '@/components/UserAvatar';

// Lazy load heavy search component
const AutocompleteSearch = dynamic(() => import('@/components/common/AutocompleteSearch'), {
  loading: () => (
    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
  )
});

const mainNavItems = [
  { name: 'Home', href: '/', icon: HomeIcon, priority: 1 },
  { name: 'Movies', href: '/movies', icon: FilmIcon, priority: 2 },
  { name: 'TV Shows', href: '/tvshows', icon: PlayCircleIcon, priority: 3 },
]

const moreNavItems = [
  { name: 'News', href: '/news', icon: NewspaperIcon },
  { name: 'About', href: '/about', icon: UserGroupIcon },
  { name: 'FAQ', href: '/faq', icon: QuestionMarkCircleIcon },
  { name: 'Contact', href: '/contact', icon: EnvelopeIcon },
      { name: 'Streaming', href: '/streaming-lobby', icon: PlayCircleIcon },
]



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
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  
  // Adaptive navigation state - simplified
  const [adaptiveStep, setAdaptiveStep] = useState(0);
  const [visibleNavItems, setVisibleNavItems] = useState(mainNavItems);
  const [hiddenNavItems, setHiddenNavItems] = useState<typeof mainNavItems>([]);
  const [showSearchBar, setShowSearchBar] = useState(true);

  useEffect(() => {
    setNavDropdownOpen(isOpen || isMoreDropdownActive || isProfileDropdownActive);
  }, [isOpen, isMoreDropdownActive, isProfileDropdownActive, setNavDropdownOpen]);

  // Simplified adaptive navigation logic
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      // Adaptive steps based on width
      let step = 0;
      const visible = [...mainNavItems];
      const hidden: typeof mainNavItems = [];
      let searchBar = true;

      if (width < 1200) {
        // Step 1: Hide TV Shows
        step = 1;
        const tvIndex = visible.findIndex(item => item.name === 'TV Shows');
        if (tvIndex !== -1) {
          hidden.push(visible[tvIndex]);
          visible.splice(tvIndex, 1);
        }
      }

      if (width < 1050) {
        // Step 2: Search bar → icon
        step = 2;
        searchBar = false;
      }

      if (width < 900) {
        // Step 3: Hide Movies
        step = 3;
        const moviesIndex = visible.findIndex(item => item.name === 'Movies');
        if (moviesIndex !== -1) {
          hidden.push(visible[moviesIndex]);
          visible.splice(moviesIndex, 1);
        }
      }

      if (width < 700) {
        // Step 4: Mobile menu
        step = 4;
      }

      setAdaptiveStep(step);
      setVisibleNavItems(visible);
      setHiddenNavItems(hidden);
      setShowSearchBar(searchBar);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    let isScrolling = false;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Update scrolled state for background color
      setIsScrolled(currentScrollY > 20);

      // Hide header immediately when scrolling starts
      if (!isScrolling) {
        isScrolling = true;
        setIsHeaderVisible(false);
      }

      // Clear previous timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      // Show header after a brief pause (80ms - sweet spot for smooth feel)
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        setIsHeaderVisible(true);
      }, 80);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, []);


  const HEADER_HEIGHT = 64

  return (
    <>
      {/* Header with auto-hide on scroll */}
      <motion.nav
        initial={false}
        style={{ height: HEADER_HEIGHT }}
        animate={{ y: isHeaderVisible ? 0 : -HEADER_HEIGHT }}
        transition={{ 
          duration: 0.25, 
          ease: [0.4, 0, 0.2, 1], // Smooth easing curve
          type: "tween"
        }}
        className={`fixed w-full z-50 ${
          isScrolled ? 'bg-black/90 backdrop-blur-md' : 'bg-white shadow-lg'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
          {/* Enhanced Logo */}
          <Logo isScrolled={isScrolled} variant="header" />

          {/* Desktop Navigation - Adaptive (shows when step < 4) */}
          <div className={`${adaptiveStep < 4 ? 'flex' : 'hidden'} items-center space-x-4`}>
            {visibleNavItems.map((item) => {
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
            {/* More dropdown - includes hidden nav items + original more items */}
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isScrolled ? 'text-white hover:text-red-500' : 'text-gray-700 hover:text-red-500'
                  }`}
                >
                  <QueueListIcon className="h-5 w-5" />
                  <span>More</span>
                  {hiddenNavItems.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                      {hiddenNavItems.length}
                    </span>
                  )}
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
                  {/* Hidden nav items first */}
                  {hiddenNavItems.length > 0 && (
                    <div className="px-1 py-1">
                      {hiddenNavItems.map((item) => (
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
                  )}
                  {/* Original more items */}
                  <div className="px-1 py-1">
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

          {/* Search and Auth - Adaptive (shows when step < 4) */}
          <div className={`${adaptiveStep < 4 ? 'flex' : 'hidden'} items-center space-x-4`}>
            {/* Search - Full bar or Icon */}
            {showSearchBar ? (
              <div className="relative">
                <AutocompleteSearch />
              </div>
            ) : (
              <button
                onClick={() => setShowMobileSearch(true)}
                className={`p-2 rounded-full transition-colors ${
                  isScrolled ? 'text-white hover:text-red-500' : 'text-gray-700 hover:text-red-500'
                }`}
                aria-label="Open search"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            )}
            
            {/* Language Selector */}
            <LanguageSelector isScrolled={isScrolled} />

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
                      <UserAvatar 
                        name={user?.name || 'User'} 
                        avatar={user?.avatar}
                        size="sm"
                        priority={true}
                      />
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
                              onClick={async () => {
                                await logout();
                                toast.success('Logged out!');
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

          {/* Mobile search icon and menu button combined (shows when step >= 4) */}
          <div className={`${adaptiveStep >= 4 ? 'flex' : 'hidden'} items-center space-x-2`}>
            {/* Mobile Language Selector */}
            <LanguageSelector isScrolled={isScrolled} />
            
            <button
              onClick={() => {
                setShowMobileSearch(true);
              }}
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
                onSelectMovie={() => {
                  setShowMobileSearch(false);
                }}
                inputClassName="text-lg px-6 py-4 border-2 border-red-500 bg-gray-900 text-white placeholder-gray-300 focus:bg-gray-900 focus:ring-2 focus:ring-red-500 shadow-lg"
                showClose
                onClose={() => {
                  setShowMobileSearch(false);
                }}
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
          className={`${adaptiveStep >= 4 ? 'block' : 'hidden'} overflow-y-auto max-h-[calc(100vh-4rem)] bg-white`}
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
                  <UserAvatar 
                    name={user?.name || 'User'} 
                    avatar={user?.avatar}
                    size="sm"
                    priority={true}
                  />
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
                      onClick={async () => {
                        await logout();
                        toast.success('Logged out!');
                        setIsOpen(false);
                        setIsMobileUserDropdownOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 mt-2 text-red-600 hover:bg-gray-100 hover:text-red-700 border-t border-gray-200"
                    >
                      <div className="flex items-center space-x-2">
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
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
      </motion.nav>
    </>
  )
}