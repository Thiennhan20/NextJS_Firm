'use client';

import { useToaster, toast } from 'react-hot-toast';

export default function CustomToaster() {
  const { toasts, handlers } = useToaster();
  const { startPause, endPause } = handlers;

  return (
    <div
      className="fixed top-20 right-4 z-[9999] flex flex-col items-end gap-2"
      onMouseEnter={startPause}
      onMouseLeave={endPause}
    >
      {toasts
        .filter((t) => t.visible)
        .map((t) => (
          <div
            key={t.id}
            className="flex items-center bg-gray-800 text-white rounded-lg shadow-lg"
          >
            {/* Icon + Message */}
            <div className="flex items-center gap-2 pl-3 pr-3 py-2">
              {t.type === 'success' && (
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {t.type === 'error' && (
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {t.type !== 'success' && t.type !== 'error' && (
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <p className="text-sm whitespace-nowrap">
                {typeof t.message === 'function' ? t.message(t) : t.message}
              </p>
            </div>

            {/* Close button - cố định */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toast.dismiss(t.id);
              }}
              className="flex-shrink-0 px-2 py-2 border-l border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 rounded-r-lg transition-colors"
              aria-label="Đóng"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
    </div>
  );
}
