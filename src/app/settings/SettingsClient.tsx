'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  UserIcon,
  CalendarIcon,
  ClockIcon,
  Cog6ToothIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import useAuthStore from '@/store/useAuthStore'
import useAuthHydrated from '@/store/useAuthHydrated'
import Link from 'next/link'

export default function SettingsClient() {
  const { user, isAuthenticated } = useAuthStore()
  const hydrated = useAuthHydrated()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
          <p className="text-gray-400 mb-6">You need to be logged in to view settings.</p>
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
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <section className="pt-6 sm:pt-10 lg:pt-14 xl:pt-16 pb-6 sm:pb-10 lg:pb-12 px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Header with back button */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3 mb-6 sm:mb-8"
            >
              <Link
                href="/profile"
                className="p-2 rounded-lg bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-300" />
              </Link>
              <div className="flex items-center gap-2">
                <Cog6ToothIcon className="w-6 h-6 sm:w-7 sm:h-7 text-red-500" />
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Settings</h1>
              </div>
            </motion.div>

            {/* Account Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
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
                    <p className="text-gray-400 text-xs sm:text-sm mb-1">Active For</p>
                    <div className="flex items-center gap-2 text-white text-sm sm:text-base">
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      <span>{accountAge}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-800/50 rounded-lg sm:rounded-xl border border-gray-700/50">
                  <div className="mb-2 sm:mb-0 min-w-0 flex-1">
                    <p className="text-gray-400 text-xs sm:text-sm mb-1">Member Since</p>
                    <div className="flex items-center gap-2 text-white text-sm sm:text-base">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-800/50 rounded-lg sm:rounded-xl border border-gray-700/50">
                  <div className="mb-2 sm:mb-0 min-w-0 flex-1">
                    <p className="text-gray-400 text-xs sm:text-sm mb-1">Last Updated</p>
                    <p className="text-white text-sm sm:text-base">{formatDate(user.updatedAt)}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-800/50 rounded-lg sm:rounded-xl border border-gray-700/50">
                  <div className="mb-2 sm:mb-0 min-w-0 flex-1">
                    <p className="text-gray-400 text-xs sm:text-sm mb-1">Web Version (Hash)</p>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-mono text-sm sm:text-base">
                        #{process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'dev'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 sm:mt-0 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white font-medium text-xs sm:text-sm transition-colors"
                  >
                    Check for Updates
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  )
}
