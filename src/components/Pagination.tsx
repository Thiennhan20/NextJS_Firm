'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'

interface PaginationProps {
  currentPage: number
  loadedPages: number[] // các trang đã load
  onPageChange: (page: number) => void
}

function getPaginationDisplay(currentPage: number, loadedPages: number[], isMobile: boolean) {
  const maxLoaded = Math.max(...loadedPages)
  let pages: number[] = []

  if (isMobile) {
    // MOBILE: chỉ hiển thị 1, ..., currentPage, currentPage+1, ..., maxLoaded
    pages = [1]
    if (currentPage > 2) pages.push(currentPage - 1)
    pages.push(currentPage)
    if (currentPage + 1 <= maxLoaded) pages.push(currentPage + 1)
    if (maxLoaded > currentPage + 1) pages.push(maxLoaded)
  } else {
    // DESKTOP: logic cũ
    if (maxLoaded >= 5 && currentPage <= 3) {
      pages = [1, 2, 3, 4, 5]
      if (maxLoaded > 5) pages.push(maxLoaded)
    } else if (maxLoaded > 5 && currentPage > 3 && currentPage < maxLoaded - 2) {
      pages = [1, currentPage, currentPage + 1, currentPage + 2, maxLoaded]
    } else if (maxLoaded > 5 && currentPage >= maxLoaded - 2) {
      pages = [1, maxLoaded - 3, maxLoaded - 2, maxLoaded - 1, maxLoaded]
    } else {
      for (let i = 1; i <= maxLoaded; i++) pages.push(i)
    }
  }

  // Loại bỏ số ngoài phạm vi, trùng lặp, <=0
  pages = pages.filter((v, i, arr) => v > 0 && v <= maxLoaded + 2 && arr.indexOf(v) === i)
  pages.sort((a, b) => a - b)

  // Chèn dấu ... vào giữa các số không liên tục
  const result: (number | string)[] = []
  for (let i = 0; i < pages.length; i++) {
    result.push(pages[i])
    if (i < pages.length - 1 && pages[i + 1] - pages[i] > 1) {
      result.push('...')
    }
  }
  return result
}

export default function Pagination({ currentPage, loadedPages, onPageChange }: PaginationProps) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const pagesToShow = getPaginationDisplay(currentPage, loadedPages, isMobile)

  return (
    <div
      className={`flex justify-center items-center flex-nowrap mt-8 ${isMobile ? 'w-full max-w-full gap-1 px-1 overflow-x-auto whitespace-nowrap' : 'flex-wrap gap-2 sm:gap-2 md:gap-3 px-2'}`}
      style={isMobile ? { minHeight: 48 } : {}}
    >
      {/* Previous button */}
      <motion.button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`rounded-full bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed min-w-[36px] min-h-[36px] ${isMobile ? 'p-2 text-base' : 'p-2 sm:p-2 md:p-2'}`}
      >
        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
      </motion.button>

      {/* Page numbers */}
      {pagesToShow.map((p, idx) =>
        p === '...'
          ? <span key={"ellipsis-"+idx} className={`text-gray-400 select-none ${isMobile ? 'px-1 text-base' : 'px-2 py-2 text-base sm:text-base'}`}>...</span>
          : <motion.button
              key={p}
              onClick={() => onPageChange(Number(p))}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`rounded-full font-semibold transition-colors min-w-[36px] min-h-[36px] ${isMobile ? 'px-2 py-2 text-base' : 'px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base'} ${currentPage === p ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-red-600 hover:text-white'}`}
              style={{
                margin: isMobile ? '0 1px' : '0 2px',
                flex: '0 0 auto',
              }}
            >
              {p}
            </motion.button>
      )}

      {/* Next button */}
      <motion.button
        onClick={() => onPageChange(currentPage + 1)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`rounded-full bg-gray-800 text-white min-w-[36px] min-h-[36px] ${isMobile ? 'p-2 text-base' : 'p-2 sm:p-2 md:p-2'}`}
      >
        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
      </motion.button>
    </div>
  )
} 