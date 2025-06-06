'use client'

import { motion } from 'framer-motion'

const news = [
  {
    id: 1,
    title: 'Marvel công bố trailer mới cho Avengers',
    image: 'https://picsum.photos/400/250',
    summary: 'Marvel vừa tung trailer mới cho bom tấn Avengers, hứa hẹn nhiều bất ngờ cho fan.',
    date: '2024-06-01',
  },
  {
    id: 2,
    title: 'Dune 2 phá kỷ lục phòng vé',
    image: 'https://picsum.photos/400/250',
    summary: 'Dune 2 tiếp tục dẫn đầu doanh thu phòng vé toàn cầu tuần qua.',
    date: '2024-05-28',
  },
  {
    id: 3,
    title: 'Barbie nhận đề cử Oscar',
    image: 'https://picsum.photos/400/250',
    summary: 'Bộ phim Barbie bất ngờ nhận nhiều đề cử tại Oscar 2024.',
    date: '2024-05-20',
  },
]

export default function MovieNews() {
  return (
    <section className="py-16 px-2 sm:px-4 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-pink-500 text-transparent bg-clip-text text-center">
          Movie News
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {news.map((item, idx) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.04, y: -6 }}
              className="bg-gray-800 rounded-xl overflow-hidden shadow-lg group cursor-pointer transition-all"
            >
              <div className="relative">
                <img src={item.image} alt={item.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute top-2 left-2 bg-black/70 text-xs text-white px-2 py-1 rounded-full">{item.date}</div>
              </div>
              <div className="p-4">
                <div className="font-semibold text-lg text-white mb-2 line-clamp-2">{item.title}</div>
                <div className="text-gray-400 text-sm line-clamp-3">{item.summary}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 