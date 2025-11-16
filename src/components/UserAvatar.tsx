'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { UserIcon } from '@heroicons/react/24/solid'

interface UserAvatarProps {
  name: string
  avatar?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showFallback?: boolean
  priority?: boolean // Preload image
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  name, 
  avatar, 
  size = 'md',
  className = '',
  showFallback = true,
  priority = false
}) => {
  const [avatarError, setAvatarError] = useState(false)

  // Get user initials for fallback
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
    if (avatar && isValidAvatarUrl(avatar)) {
      return avatar
    }
    return null
  }, [avatar])

  // Preload image if priority
  useEffect(() => {
    if (priority && avatarUrl && avatarUrl.startsWith('http')) {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = avatarUrl
      document.head.appendChild(link)
      
      return () => {
        document.head.removeChild(link)
      }
    }
  }, [priority, avatarUrl])

  const sizeClass = sizeClasses[size]

  if (avatarUrl && !avatarError) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden bg-gray-800 flex-shrink-0 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setAvatarError(true)}
          loading={priority ? 'eager' : 'lazy'}
        />
      </div>
    )
  }

  if (showFallback) {
    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-br from-purple-500 to-red-500 flex items-center justify-center font-bold text-white flex-shrink-0 ${className}`}>
        {getInitials(name)}
      </div>
    )
  }

  return (
    <div className={`${sizeClass} rounded-full bg-gray-700 flex items-center justify-center text-gray-400 flex-shrink-0 ${className}`}>
      <UserIcon className="w-1/2 h-1/2" />
    </div>
  )
}

export default UserAvatar
