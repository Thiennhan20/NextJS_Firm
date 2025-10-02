'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChatBubbleLeftRightIcon, 
  HeartIcon, 
  EllipsisHorizontalIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import useAuthStore from '@/store/useAuthStore'
import toast from 'react-hot-toast'
import api from '@/lib/axios'
import { useRouter } from 'next/navigation'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import Image from 'next/image'

interface Comment {
  _id: string
  movieId: number
  type: 'movie' | 'tvshow'
  userId: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  username: string
  avatar?: string
  content: string
  createdAt: string
  updatedAt: string
  likes: number
  isLiked: boolean
  replies?: Comment[]
  isReply?: boolean
  parentId?: string
}

interface CommentsProps {
  movieId: number
  type: 'movie' | 'tvshow'
  title: string
}

export default function Comments({ movieId, type, title }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [showReplies, setShowReplies] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionOpenId, setActionOpenId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  
  const { isAuthenticated, user, checkAuth } = useAuthStore()
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Check auth on component mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Close action menu when clicking outside or pressing Escape
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-comment-action]')) {
        setActionOpenId(null)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActionOpenId(null)
    }
    document.addEventListener('mousedown', onDocClick, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  // Fetch comments from server
  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true)
      try {
        const response = await api.get(`/comments/${movieId}/${type}?sortBy=${sortBy}`)
        if (response.data.success) {
          setComments(response.data.data)
        }
      } catch (error) {
        console.error('Error fetching comments:', error)
        toast.error('Failed to load comments')
      } finally {
        setIsLoading(false)
      }
    }

    fetchComments()
  }, [movieId, type, sortBy])

  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to comment')
      return
    }
    
    if (!newComment.trim()) {
      toast.error('Please enter a comment')
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await api.post('/comments', {
        movieId,
        type,
        content: newComment.trim()
      })
      
      if (response.data.success) {
        setComments(prev => [response.data.data, ...prev])
        setNewComment('')
        toast.success('Comment added successfully!')
      }
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string } } };
      console.error('Error submitting comment:', error)
      if (err.response?.status === 401) {
        toast.error('Please log in to comment')
      } else {
        toast.error(err.response?.data?.message || 'Failed to add comment')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!isAuthenticated) {
      toast.error('Please log in to reply')
      return
    }
    
    if (!replyText.trim()) {
      toast.error('Please enter a reply')
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await api.post('/comments', {
        movieId,
        type,
        content: replyText.trim(),
        parentId
      })
      
      if (response.data.success) {
        setComments(prev => 
          prev.map(comment => 
            comment._id === parentId 
              ? { ...comment, replies: [...(comment.replies || []), response.data.data] }
              : comment
          )
        )
        
        setReplyText('')
        setReplyingTo(null)
        toast.success('Reply added successfully!')
      }
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string } } };
      console.error('Error submitting reply:', error)
      if (err.response?.status === 401) {
        toast.error('Please log in to reply')
      } else {
        toast.error(err.response?.data?.message || 'Failed to add reply')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLike = async (commentId: string, isReply: boolean = false, parentId?: string) => {
    if (!isAuthenticated) {
      toast.error('Please log in to like comments')
      return
    }

    try {
      const response = await api.put(`/comments/${commentId}/like`)
      
      if (response.data.success) {
        const updatedComment = response.data.data
        
        if (isReply && parentId) {
          setComments(prev => 
            prev.map(comment => 
              comment._id === parentId 
                ? {
                    ...comment,
                    replies: comment.replies?.map(reply => 
                      reply._id === commentId 
                        ? { 
                            ...reply, 
                            isLiked: updatedComment.isLiked,
                            likes: updatedComment.likes
                          }
                        : reply
                    )
                  }
                : comment
            )
          )
        } else {
          setComments(prev => 
            prev.map(comment => 
              comment._id === commentId 
                ? { 
                    ...comment, 
                    isLiked: updatedComment.isLiked,
                    likes: updatedComment.likes
                  }
                : comment
            )
          )
        }
      }
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      console.error('Error liking comment:', error)
      if (err.response?.status === 401) {
        toast.error('Please log in to like comments')
      } else {
        toast.error('Failed to like comment')
      }
    }
  }

  const toggleReplies = (commentId: string) => {
    setShowReplies(prev => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const commentTime = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - commentTime.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return 'Just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} day${days > 1 ? 's' : ''} ago`
    } else {
      return commentTime.toLocaleDateString()
    }
  }

  // Actions: start editing
  const startEditing = (comment: Comment) => {
    setEditingId(comment._id)
    setEditText(comment.content)
    setActionOpenId(comment._id)
  }

  // Actions: submit edit
  const submitEdit = async () => {
    if (!editingId || !editText.trim()) return
    try {
      setIsSubmitting(true)
      const res = await api.put(`/comments/${editingId}`, { content: editText.trim() })
      if (res.data.success) {
        const updated = res.data.data as Comment
        setComments(prev => prev.map(c => c._id === editingId ? { ...c, content: updated.content, updatedAt: updated.updatedAt } : c))
        setEditingId(null)
        setEditText('')
        setActionOpenId(null)
        toast.success('Updated')
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Actions: delete
  const handleDelete = async (id: string) => {
    try {
      const res = await api.delete(`/comments/${id}`)
      if (res.data.success) {
        setComments(prev => prev.filter(c => c._id !== id))
        toast.success('Deleted')
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to delete')
    } finally {
      setActionOpenId(null)
      setConfirmDeleteId(null)
    }
  }

  // Actions: report (placeholder)
  const handleReport = () => {
    toast.success('Thanks for your report. We will review it.')
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-8 sm:py-12">
      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Delete comment"
        description="This action cannot be undone. Do you want to delete this comment?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <ChatBubbleLeftRightIcon className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Comments</h2>
          <span className="bg-gray-700 text-gray-300 px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm">
            {comments.length}
          </span>
        </div>

        {/* Comment Input */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex gap-3 sm:gap-4">
            <div className="flex-shrink-0">
              {isAuthenticated ? (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-600 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={isAuthenticated ? `Share your thoughts about ${title}...` : 'Please log in to comment'}
                disabled={false}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 sm:px-4 sm:py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed text-[16px] sm:text-base"
                rows={3}
              />
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-3 gap-2">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400">
                    {newComment.length}/500 characters
                  </span>
                  {!isAuthenticated && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-yellow-400 flex items-center gap-1">
                        <span>⚠️</span>
                        <span className="hidden sm:inline">Please log in to post comments</span>
                        <span className="sm:hidden">Login required</span>
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/login')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-medium rounded-lg shadow-lg transition-all duration-200"
                      >
                        <UserIcon className="h-3 w-3" />
                        Login
                      </motion.button>
                    </div>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: isAuthenticated ? 1.02 : 1 }}
                  whileTap={{ scale: isAuthenticated ? 0.98 : 1 }}
                  onClick={handleSubmitComment}
                  disabled={!isAuthenticated || !newComment.trim() || isSubmitting}
                  className="px-4 py-2 sm:px-6 sm:py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{isSubmitting ? 'Posting...' : 'Post Comment'}</span>
                  <span className="sm:hidden">{isSubmitting ? 'Posting...' : 'Post'}</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          <span className="text-gray-300 text-sm font-medium">Sort by:</span>
          <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-2 sm:pb-0">
            {[
              { value: 'newest', label: 'Newest' },
              { value: 'oldest', label: 'Oldest' },
              { value: 'popular', label: 'Most Liked' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value as 'newest' | 'oldest' | 'popular')}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  sortBy === option.value
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4 sm:space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8 sm:py-12">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-red-500 border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <AnimatePresence>
            {comments.map((comment, index) => (
            <motion.div
              key={comment._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 sm:p-6"
            >
              <div className="flex gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  {comment.avatar ? (
                    <Image
                      src={comment.avatar}
                      alt={comment.username}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                      unoptimized={comment.avatar.startsWith('http')} // Nếu avatar từ URL bên ngoài
                    />
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start sm:items-center justify-between gap-2 mb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                      <h4 className="font-semibold text-white truncate text-sm sm:text-base">{comment.username}</h4>
                      <span className="text-gray-400 text-xs sm:text-sm flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <div className="flex-shrink-0">
                      {isAuthenticated && user?.id && (user.id === (comment.userId?._id || comment.userId)) ? (
                        <div className="relative group" data-comment-action>
                          <button
                            className="p-1.5 rounded-md hover:bg-gray-700/60 transition-colors"
                            onClick={() => setActionOpenId(actionOpenId === comment._id ? null : comment._id)}
                            aria-label="Actions"
                          >
                            <EllipsisHorizontalIcon className="h-5 w-5 text-gray-300" />
                          </button>
                          {actionOpenId === comment._id && (
                            <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10" data-comment-action>
                              <button
                                className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 rounded-t-lg"
                                onClick={() => startEditing(comment)}
                              >
                                Edit
                              </button>
                              <button
                                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded-b-lg"
                                onClick={() => setConfirmDeleteId(comment._id)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          className="px-2 py-1 text-xs sm:text-sm text-gray-300 hover:text-white hover:bg-gray-700/60 rounded-md transition-colors"
                          onClick={() => handleReport()}
                        >
                          Report
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {editingId === comment._id ? (
                    <div className="space-y-2 mb-3 sm:mb-4">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-sm sm:text-base"
                        rows={3}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={submitEdit}
                          disabled={!editText.trim() || isSubmitting}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setEditText(''); setActionOpenId(null); }}
                          className="px-3 py-1.5 text-gray-300 hover:text-white text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-300 leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">{comment.content}</p>
                  )}
                  
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleLike(comment._id)}
                      className="flex items-center gap-1 sm:gap-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      {comment.isLiked ? (
                        <HeartSolidIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                      ) : (
                        <HeartIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                      <span className="text-xs sm:text-sm">{comment.likes}</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                      className="flex items-center gap-1 sm:gap-2 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-xs sm:text-sm">Reply</span>
                    </motion.button>
                    
                    {comment.replies && comment.replies.length > 0 && (
                      <button
                        onClick={() => toggleReplies(comment._id)}
                        className="flex items-center gap-1 sm:gap-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <span className="text-xs sm:text-sm">
                          {showReplies.has(comment._id) ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Reply Input */}
                  <AnimatePresence>
                    {replyingTo === comment._id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4"
                      >
                        <div className="flex gap-2 sm:gap-3">
                          <div className="flex-shrink-0">
                            {isAuthenticated ? (
                              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                                <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-600 flex items-center justify-center">
                                <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <textarea
                              ref={replyTextareaRef}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={isAuthenticated ? `Reply to ${comment.username}...` : 'Please log in to reply'}
                              disabled={!isAuthenticated}
                              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-[16px] sm:text-sm"
                              rows={2}
                            />
                            <div className="flex justify-end gap-1 sm:gap-2 mt-2">
                              <button
                                onClick={() => {
                                  setReplyingTo(null)
                                  setReplyText('')
                                }}
                                className="px-2 py-1 sm:px-3 sm:py-1 text-gray-400 hover:text-white transition-colors text-xs sm:text-sm"
                              >
                                Cancel
                              </button>
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleSubmitReply(comment._id)}
                                disabled={!isAuthenticated || !replyText.trim() || isSubmitting}
                                className="px-3 py-1 sm:px-4 sm:py-1 bg-red-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                              >
                                {isSubmitting ? 'Posting...' : 'Reply'}
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Replies */}
                  <AnimatePresence>
                    {showReplies.has(comment._id) && comment.replies && comment.replies.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-4"
                      >
                        {comment.replies.map((reply) => (
                          <div key={reply._id} className="flex gap-2 sm:gap-3 pl-2 sm:pl-4 border-l-2 border-gray-700">
                            <div className="flex-shrink-0">
                              {reply.avatar ? (
                                <Image
                                  src={reply.avatar}
                                  alt={reply.username}
                                  width={32}
                                  height={32}
                                  className="rounded-full object-cover"
                                  unoptimized={reply.avatar.startsWith('http')}
                                />
                              ) : (
                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                                  <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                <h5 className="font-medium text-white text-xs sm:text-sm truncate">{reply.username}</h5>
                                <span className="text-gray-400 text-xs flex items-center gap-1">
                                  <ClockIcon className="h-3 w-3" />
                                  {formatTimeAgo(reply.createdAt)}
                                </span>
                              </div>
                              
                              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-2">{reply.content}</p>
                              
                              <div className="flex items-center gap-2 sm:gap-3">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleLike(reply._id, true, comment._id)}
                                  className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  {reply.isLiked ? (
                                    <HeartSolidIcon className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                                  ) : (
                                    <HeartIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                                  )}
                                  <span className="text-xs">{reply.likes}</span>
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
            ))}
          </AnimatePresence>
        )}

        {!isLoading && comments.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <ChatBubbleLeftRightIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-400 mb-2">No comments yet</h3>
            <p className="text-gray-500 text-sm sm:text-base">Be the first to share your thoughts about this {type}!</p>
          </div>
        )}
      </div>
    </div>
  )
}
