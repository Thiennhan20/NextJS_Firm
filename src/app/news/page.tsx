'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

const newsItems = [
  {
    id: 1,
    title: 'Movie World Launches New 3D Experience Feature',
    date: 'October 26, 2023',
    summary: 'Discover how our new 3D experience is set to revolutionize movie discovery.',
    image: `https://picsum.photos/800/400?random=${Math.random()}`,
  },
  {
    id: 2,
    title: 'Top 10 Must-Watch Movies This Fall',
    date: 'October 20, 2023',
    summary: 'Our curated list of the best films to enjoy this autumn.',
    image: `https://picsum.photos/800/400?random=${Math.random()}`,
  },
  {
    id: 3,
    title: 'Interview with Director Jane Doe',
    date: 'October 15, 2023',
    summary: 'Exclusive interview discussing the making of her latest film.',
    image: `https://picsum.photos/800/400?random=${Math.random()}`,
  },
  {
    id: 4,
    title: 'Behind the Scenes: Creating the Movie World Platform',
    date: 'October 10, 2023',
    summary: 'A look into the development process and the team behind Movie World.',
    image: `https://picsum.photos/800/400?random=${Math.random()}`,
  },
]

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
            Latest Movie News
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Stay updated with the latest news, articles, and updates from the world of cinema and Movie World.
          </p>
        </motion.div>

        {/* News List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {newsItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden flex flex-col"
            >
              <div className="relative h-48 w-full">
                 <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                 />
              </div>
              <div className="p-6 flex flex-col justify-between flex-grow">
                 <div className="mb-4">
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-gray-400 text-sm mb-3">{item.date}</p>
                    <p className="text-gray-300">{item.summary}</p>
                 </div>
                 <a href={`/news/${item.id}`} className="text-red-500 hover:underline font-semibold self-start">
                    Read More
                 </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
} 