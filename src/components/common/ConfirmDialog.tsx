'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface ConfirmDialogProps {
  open: boolean
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title = 'Confirm',
  description = 'Are you sure?',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-4"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-md mx-auto rounded-2xl bg-gradient-to-b from-gray-900/95 to-gray-900/85 border border-gray-700/70 shadow-[0_10px_40px_rgba(0,0,0,0.6)] p-4 sm:p-5 text-white"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-red-500/15 border border-red-500/40">
                <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 truncate">{title}</h3>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{description}</p>
              </div>
            </div>
            <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row sm:justify-end gap-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg bg-gray-700/80 text-gray-200 hover:bg-gray-600 transition-colors text-sm w-full sm:w-auto"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white transition-colors text-sm shadow-lg w-full sm:w-auto"
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


