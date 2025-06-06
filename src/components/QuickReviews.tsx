'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
const reviews = [
  {
    id: 1,
    user: 'Minh T.',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    content: 'Phim rất hay, kỹ xảo đỉnh cao, cốt truyện cuốn hút!',
    movie: 'Dune 2',
    rating: 5,
  },
  {
    id: 2,
    user: 'Lan P.',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    content: 'Barbie vui nhộn, màu sắc rực rỡ, phù hợp gia đình.',
    movie: 'Barbie',
    rating: 4,
  },
  {
    id: 3,
    user: 'Hùng N.',
    avatar: 'https://randomuser.me/api/portraits/men/65.jpg',
    content: 'Oppenheimer sâu sắc, diễn xuất tuyệt vời.',
    movie: 'Oppenheimer',
    rating: 5,
  },
]

export default function QuickReviews() {
  return (
    <section className="py-16 px-2 sm:px-4 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-4xl font-bold mb-8 bg-gradient-to-r from-yellow-400 to-pink-500 text-transparent bg-clip-text text-center">
          Quick Reviews
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-gray-800 rounded-xl p-6 shadow-lg flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <Image 
                  src={item.avatar} 
                  alt={item.user} 
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full border-2 border-pink-400" 
                />
                <div>
                  <div className="font-semibold text-white">{item.user}</div>
                  <div className="text-xs text-gray-400">{item.movie}</div>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <span className="text-yellow-400">★</span>
                  <span className="text-white font-bold">{item.rating}</span>
                </div>
              </div>
              <div className="text-gray-200 text-base italic">“{item.content}”</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 