'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  BookmarkIcon,
  ClockIcon,
  StarIcon,
  FilmIcon,
  PlayCircleIcon,
  ChartBarIcon,
  SparklesIcon,
  TrashIcon,
  PhotoIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline'
import { 
  UserIcon as UserIconSolid,
  BookmarkIcon as BookmarkIconSolid
} from '@heroicons/react/24/solid'
import useAuthStore from '@/store/useAuthStore'
import { useWatchlistStore } from '@/store/store'
import useAuthHydrated from '@/store/useAuthHydrated'
import Link from 'next/link'
import api from '@/lib/axios'
import { toast } from 'react-hot-toast'
import imageCompression from 'browser-image-compression'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
  delay?: number
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="relative group"
    >
      <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 shadow-lg hover:shadow-2xl">
        <div className={`inline-flex p-1.5 sm:p-2 lg:p-3 rounded-md sm:rounded-lg lg:rounded-xl ${color} mb-2 sm:mb-3`}>
          {icon}
        </div>
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-0.5 sm:mb-1">{value}</h3>
        <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm font-medium truncate leading-tight">{label}</p>
        <div className={`absolute inset-0 rounded-lg sm:rounded-xl lg:rounded-2xl bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
      </div>
    </motion.div>
  )
}

export default function ProfilePage() {
  const { user, isAuthenticated, checkAuth } = useAuthStore()
  const { watchlist } = useWatchlistStore()
  const hydrated = useAuthHydrated()
  const [mounted, setMounted] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null)
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Reset avatar error when user changes
  useEffect(() => {
    setAvatarError(false)
    setPreviewAvatar(null)
  }, [user?.avatar])

  // Preload avatar for instant display
  useEffect(() => {
    if (user?.avatar && user.avatar.startsWith('data:image/')) {
      // Create image object to preload
      const img = new Image()
      img.src = user.avatar
    }
  }, [user?.avatar])

  // Calculate account age
  const accountAge = useMemo(() => {
    if (!user?.createdAt) return 'N/A'
    const created = new Date(user.createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 30) return `${diffDays} days`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`
    return `${Math.floor(diffDays / 365)} years`
  }, [user?.createdAt])

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // Get user initials for avatar
  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Check if avatar URL is valid
  const isValidAvatarUrl = (url: string | undefined): boolean => {
    if (!url || url.trim() === '') return false
    try {
      // Check if it's a data URL first
      if (url.startsWith('data:image/')) return true
      
      // Try to parse as URL
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  // Get avatar URL to display
  const avatarUrl = useMemo(() => {
    if (previewAvatar) return previewAvatar
    if (user?.avatar && isValidAvatarUrl(user.avatar)) {
      return user.avatar
    }
    return null
  }, [user?.avatar, previewAvatar])

  // Avatar data validation
  useEffect(() => {
    // Validation logic runs silently
  }, [user, avatarUrl])

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setIsUploading(true)
    setAvatarError(false)

    try {
      // Compress image - Server will optimize further with Sharp
      const options = {
        maxSizeMB: 0.5, // 500KB - server will optimize to ~100KB WebP
        maxWidthOrHeight: 400, // Server will resize to 300x300
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.85, // Higher quality, server will optimize
      }
      
      const compressedFile = await imageCompression(file, options)

      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string
          
          // Show preview immediately
          setPreviewAvatar(base64String)

          // Upload to server
          const response = await api.put('/auth/profile', {
            avatar: base64String,
          })

          // Update user in store
          if (response.data?.user) {
            await checkAuth() // Refresh user data
            toast.success('Avatar updated successfully!')
            setPreviewAvatar(null) // Clear preview after successful upload
          }
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } } }
          toast.error(err.response?.data?.message || 'Failed to upload avatar')
          setPreviewAvatar(null)
          setAvatarError(true)
        } finally {
          setIsUploading(false)
        }
      }
      reader.onerror = () => {
        toast.error('Failed to read image file')
        setIsUploading(false)
        setPreviewAvatar(null)
      }
      reader.readAsDataURL(compressedFile)
    } catch {
      toast.error('Failed to process image')
      setIsUploading(false)
      setPreviewAvatar(null)
    }
    
    // Reset file input
    if (event.target) {
      event.target.value = ''
    }
  }

  // Handle remove avatar
  const handleRemoveAvatar = async () => {
    if (!user?.avatar) {
      toast.error('No avatar to remove')
      return
    }

    // Check if user has custom avatar (not original)
    const hasCustomAvatar = user.avatar !== user.originalAvatar

    try {
      setIsUploading(true)
      setShowAvatarMenu(false)

      // Send empty string to remove/restore avatar
      const response = await api.put('/auth/profile', {
        avatar: '',
      })

      if (response.data?.user) {
        await checkAuth() // Refresh user data
        
        // Show different message based on whether we restored or removed
        if (hasCustomAvatar && user.originalAvatar) {
          toast.success('Avatar restored to original!')
        } else {
          toast.success('Avatar removed successfully!')
        }
        
        setPreviewAvatar(null)
        setAvatarError(false)
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to remove avatar')
    } finally {
      setIsUploading(false)
    }
  }

  // Handle change avatar (open file picker)
  const handleChangeAvatar = () => {
    setShowAvatarMenu(false)
    fileInputRef.current?.click()
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAvatarMenu(false)
      }
    }

    if (showAvatarMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAvatarMenu])

  // Toggle avatar menu
  const toggleAvatarMenu = () => {
    setShowAvatarMenu(!showAvatarMenu)
  }

  if (!mounted || !hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-white mb-4">Please Login</h1>
          <p className="text-gray-400 mb-6">You need to be logged in to view your profile.</p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Go to Login
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Hero Section - Responsive padding */}
        <section className="pt-6 sm:pt-10 lg:pt-14 xl:pt-16 pb-6 sm:pb-10 lg:pb-12 px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">

            {/* Profile Card - Compact on mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-5 lg:p-8 xl:p-10 border border-gray-700/50 shadow-2xl mb-4 sm:mb-6 lg:mb-10"
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-5 lg:gap-8">
                {/* Avatar - Compact on mobile */}
                <div className="relative flex-shrink-0">
                  {avatarUrl && !avatarError ? (
                    <div className="w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36 rounded-full overflow-hidden shadow-xl border-3 sm:border-4 border-gray-700 relative bg-gray-800">
                      {/* Avatar image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatarUrl}
                        alt={user.name}
                        className="w-full h-full object-cover"
                        onError={() => {
                          setAvatarError(true);
                        }}
                        onLoad={() => {
                          setAvatarError(false);
                        }}
                        loading="eager"
                      />
                      
                      {/* Upload progress */}
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                          <p className="text-white text-xs">Loading...</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36 rounded-full bg-gradient-to-br from-purple-500 to-red-500 flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl font-bold text-white shadow-xl relative overflow-hidden">
                      <span className="relative z-10">{getInitials(user.name)}</span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-purple-400 to-red-400 opacity-50"
                        animate={{
                          rotate: [0, 360],
                        }}
                        transition={{
                          duration: 20,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                          <p className="text-white text-xs">Uploading...</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Avatar Menu Button - Compact */}
                  <div className="relative z-50" ref={menuRef}>
                    <button
                      onClick={toggleAvatarMenu}
                      disabled={isUploading}
                      className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full border-2 sm:border-3 border-gray-900 flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed z-[60]"
                      title="Avatar options"
                    >
                      <EllipsisVerticalIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </button>

                    {/* Dropdown Menu - Responsive positioning */}
                    <AnimatePresence>
                      {showAvatarMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full right-0 mt-2 sm:top-1/2 sm:left-full sm:right-auto sm:-translate-y-1/2 sm:mt-0 sm:ml-3 bg-gray-800/98 backdrop-blur-md border border-gray-700 rounded-lg shadow-2xl z-[100] min-w-[180px] overflow-hidden"
                        >
                          <button
                            onClick={handleChangeAvatar}
                            disabled={isUploading}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-gray-700/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <PhotoIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                            <span className="text-sm font-medium">Change Avatar</span>
                          </button>
                          
                          {/* Chỉ hiển thị Remove/Restore nếu:
                              1. Có custom avatar (khác originalAvatar) → Restore
                              2. Có avatar nhưng không có originalAvatar → Remove
                              3. KHÔNG hiển thị nếu đang dùng originalAvatar */}
                          {user?.avatar && (
                            // Kiểm tra nếu có custom avatar hoặc có avatar mà không có original
                            (user.avatar !== user.originalAvatar || !user.originalAvatar) && (
                              <button
                                onClick={handleRemoveAvatar}
                                disabled={isUploading}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-gray-700/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-t border-gray-700"
                              >
                                <TrashIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
                                <span className="text-sm font-medium">
                                  {user.avatar !== user.originalAvatar && user.originalAvatar 
                                    ? 'Restore Original' 
                                    : 'Remove Avatar'}
                                </span>
                              </button>
                            )
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>

                {/* User Info - Compact on mobile */}
                <div className="flex-1 text-center sm:text-left w-full sm:w-auto">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3 break-words">
                    {user.name}
                  </h2>
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-gray-300">
                      <EnvelopeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-gray-400 flex-shrink-0" />
                      <span className="text-[11px] sm:text-xs lg:text-sm truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-gray-300">
                      <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-gray-400 flex-shrink-0" />
                      <span className="text-[11px] sm:text-xs lg:text-sm">Member since {formatDate(user.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-gray-300">
                      <ClockIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-gray-400 flex-shrink-0" />
                      <span className="text-[11px] sm:text-xs lg:text-sm">Active for {accountAge}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Statistics Grid - Compact 2x2 on mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-6 mb-4 sm:mb-6 lg:mb-12">
              <StatCard
                icon={<BookmarkIconSolid className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                label="Watchlist Items"
                value={watchlist.length}
                color="bg-gradient-to-br from-red-500 to-red-600"
                delay={0.3}
              />
              <StatCard
                icon={<UserIconSolid className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                label="Account Age"
                value={accountAge}
                color="bg-gradient-to-br from-purple-500 to-purple-600"
                delay={0.4}
              />
              <StatCard
                icon={<StarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                label="Member Status"
                value="Active"
                color="bg-gradient-to-br from-yellow-500 to-yellow-600"
                delay={0.5}
              />
              <StatCard
                icon={<SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                label="Profile Level"
                value="Member"
                color="bg-gradient-to-br from-blue-500 to-blue-600"
                delay={0.6}
              />
            </div>

            {/* Quick Actions - Responsive grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-700/50 shadow-2xl mb-6 sm:mb-8 lg:mb-12"
            >
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <ChartBarIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-red-500" />
                <span>Quick Actions</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <Link href="/watchlist">
                  <motion.div
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gray-800/50 hover:bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700/50 hover:border-red-500/50 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors flex-shrink-0">
                        <BookmarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-white mb-0.5 sm:mb-1 text-sm sm:text-base truncate">My Watchlist</h4>
                        <p className="text-xs sm:text-sm text-gray-400 truncate">{watchlist.length} items</p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
                <Link href="/movies">
                  <motion.div
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gray-800/50 hover:bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors flex-shrink-0">
                        <FilmIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-white mb-0.5 sm:mb-1 text-sm sm:text-base truncate">Browse Movies</h4>
                        <p className="text-xs sm:text-sm text-gray-400 truncate">Discover new content</p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
                <Link href="/tvshows">
                  <motion.div
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gray-800/50 hover:bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors flex-shrink-0">
                        <PlayCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-white mb-0.5 sm:mb-1 text-sm sm:text-base truncate">TV Shows</h4>
                        <p className="text-xs sm:text-sm text-gray-400 truncate">Explore series</p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </div>
            </motion.div>

            {/* Account Information - Responsive */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-700/50 shadow-2xl"
            >
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <UserIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-red-500" />
                <span>Account Information</span>
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-800/50 rounded-lg sm:rounded-xl border border-gray-700/50">
                  <div className="mb-2 sm:mb-0 min-w-0 flex-1">
                    <p className="text-gray-400 text-xs sm:text-sm mb-1">User ID</p>
                    <p className="text-white font-mono text-xs sm:text-sm break-all">{user.id}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-800/50 rounded-lg sm:rounded-xl border border-gray-700/50">
                  <div className="mb-2 sm:mb-0 min-w-0 flex-1">
                    <p className="text-gray-400 text-xs sm:text-sm mb-1">Email Address</p>
                    <p className="text-white text-sm sm:text-base break-all">{user.email}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-800/50 rounded-lg sm:rounded-xl border border-gray-700/50">
                  <div className="mb-2 sm:mb-0 min-w-0 flex-1">
                    <p className="text-gray-400 text-xs sm:text-sm mb-1">Account Created</p>
                    <p className="text-white text-sm sm:text-base">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-800/50 rounded-lg sm:rounded-xl border border-gray-700/50">
                  <div className="mb-2 sm:mb-0 min-w-0 flex-1">
                    <p className="text-gray-400 text-xs sm:text-sm mb-1">Last Updated</p>
                    <p className="text-white text-sm sm:text-base">{formatDate(user.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  )
} 
