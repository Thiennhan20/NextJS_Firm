'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { CalendarIcon, UserIcon, TagIcon } from '@heroicons/react/24/solid'

// Mock data - replace with actual API call
const newsArticles = [
  {
    id: 1,
    title: 'Oppenheimer Sweeps the Oscars with 7 Wins',
    category: 'Awards',
    author: 'John Smith',
    date: 'March 10, 2024',
    image: `https://picsum.photos/800/450?random=${Math.random()}`,
    excerpt: 'Christopher Nolan\'s epic biopic dominated the 96th Academy Awards, taking home Best Picture, Best Director, and more.',
    content: 'In a historic night for cinema, Oppenheimer emerged as the big winner at the 96th Academy Awards...'
  },
  {
    id: 2,
    title: 'Marvel Announces New Phase 6 Lineup',
    category: 'Industry News',
    author: 'Sarah Johnson',
    date: 'March 8, 2024',
    image: `https://picsum.photos/800/450?random=${Math.random()}`,
    excerpt: 'The Marvel Cinematic Universe expands with new heroes and storylines in the upcoming Phase 6.',
    content: 'Marvel Studios has revealed its ambitious plans for Phase 6 of the MCU...'
  },
  {
    id: 3,
    title: 'The Future of 3D Technology in Cinema',
    category: 'Technology',
    author: 'Michael Chen',
    date: 'March 5, 2024',
    image: `https://picsum.photos/800/450?random=${Math.random()}`,
    excerpt: 'How new 3D technologies are revolutionizing the movie-going experience.',
    content: 'The landscape of cinema is changing rapidly with the advent of new 3D technologies...'
  },
  {
    id: 4,
    title: 'Independent Film Festival Winners Announced',
    category: 'Festivals',
    author: 'Emma Davis',
    date: 'March 3, 2024',
    image: `https://picsum.photos/800/450?random=${Math.random()}`,
    excerpt: 'Celebrating the best of independent cinema at this year\'s festival.',
    content: 'The annual Independent Film Festival has concluded with a celebration of emerging talent...'
  }
]

const categories = ['All', 'Awards', 'Industry News', 'Technology', 'Festivals']

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null)

  const filteredArticles = selectedCategory === 'All'
    ? newsArticles
    : newsArticles.filter(article => article.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Hero Section */}
      <div className="relative h-[40vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black" />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-center"
          >
            Movie News
          </motion.h1>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap justify-center gap-4">
          {categories.map((category) => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full transition-colors ${
                selectedCategory === category
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {category}
            </motion.button>
          ))}
        </div>
      </div>

      {/* News Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredArticles.map((article, index) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden cursor-pointer"
              onClick={() => setSelectedArticle(article.id)}
            >
              <div className="relative h-48">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{article.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <UserIcon className="h-4 w-4" />
                    <span>{article.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TagIcon className="h-4 w-4" />
                    <span>{article.category}</span>
                  </div>
                </div>
                <h2 className="text-xl font-semibold mb-2 hover:text-red-500 transition-colors">
                  {article.title}
                </h2>
                <p className="text-gray-300">
                  {article.excerpt}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      {/* Article Modal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: selectedArticle !== null ? 1 : 0 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 ${
          selectedArticle === null ? 'hidden' : ''
        }`}
        onClick={() => setSelectedArticle(null)}
      >
        {selectedArticle && (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="relative w-full max-w-4xl bg-gray-800 rounded-xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative h-64">
              <Image
                src={newsArticles.find(a => a.id === selectedArticle)?.image || ''}
                alt="Article"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-8">
              <h2 className="text-3xl font-bold mb-4">
                {newsArticles.find(a => a.id === selectedArticle)?.title}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{newsArticles.find(a => a.id === selectedArticle)?.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <UserIcon className="h-4 w-4" />
                  <span>{newsArticles.find(a => a.id === selectedArticle)?.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TagIcon className="h-4 w-4" />
                  <span>{newsArticles.find(a => a.id === selectedArticle)?.category}</span>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed">
                {newsArticles.find(a => a.id === selectedArticle)?.content}
              </p>
              <button
                className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/80 transition-colors"
                onClick={() => setSelectedArticle(null)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
} 