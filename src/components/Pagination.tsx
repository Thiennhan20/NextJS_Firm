'use client'

import { motion } from 'framer-motion'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  if (totalPages <= 1) return null

  return (
    <div className="flex justify-center items-center space-x-2 mt-8">
      {/* Previous button */}
      <motion.button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="p-2 rounded-full bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
      </motion.button>

      {/* Page numbers */}
      {pages.map(p => (
        <motion.button
          key={p}
          onClick={() => onPageChange(p)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${page === p ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-red-600 hover:text-white'}`}
        >
          {p}
        </motion.button>
      ))}

      {/* Next button */}
      <motion.button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="p-2 rounded-full bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
      </motion.button>
    </div>
  )
} 