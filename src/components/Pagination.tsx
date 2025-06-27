'use client'

import { motion } from 'framer-motion'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  // Helper để tạo mảng các trang cần hiển thị
  function getPages(current: number, total: number) {
    const delta = 2; // số trang lân cận
    const range = [];
    const rangeWithDots = [];
    let l: number | undefined;

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (typeof l === 'number') {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l > 2) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  }

  const pages = getPages(page, totalPages);

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center space-x-2 mt-8 flex-wrap">
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
      {pages.map((p, idx) =>
        p === '...'
          ? <span key={idx} className="px-2 py-2 text-gray-400 select-none">...</span>
          : <motion.button
              key={p}
              onClick={() => onPageChange(Number(p))}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${page === p ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-red-600 hover:text-white'}`}
            >
              {p}
            </motion.button>
      )}

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