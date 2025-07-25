'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import RequireAdmin from '@/components/RequireAdmin';

// FAQ data
const faqs = [
  {
    question: "What is MovieWorld?",
    answer: "MovieWorld is your ultimate destination for discovering, watching, and discussing movies. Our platform combines cutting-edge AI technology with a beautiful user interface to provide an immersive movie experience."
  },
  {
    question: "How do I get started?",
    answer: "Getting started is easy! Simply create an account, browse our extensive movie collection, and start watching. You can also use our AI assistant to get personalized movie recommendations."
  },
  {
    question: "Is MovieWorld free to use?",
    answer: "MovieWorld offers both free and premium subscription options. Free users can access basic features and a limited selection of movies, while premium subscribers enjoy unlimited access to our entire library and exclusive features."
  },
  {
    question: "Can I download movies to watch offline?",
    answer: "Yes! Premium subscribers can download movies to watch offline. Simply select the download option on any movie page, and it will be available in your offline library."
  },
  {
    question: "How does the AI recommendation system work?",
    answer: "Our AI system analyzes your viewing history, preferences, and ratings to suggest movies you'll love. The more you use MovieWorld, the better our recommendations become."
  }
]

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <RequireAdmin>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-red-500 to-purple-500 text-transparent bg-clip-text">
              Frequently Asked Questions
            </h1>
            <p className="text-gray-400 text-lg">
              Find answers to common questions about MovieWorld
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative mb-8"
          >
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl px-6 py-4 pl-12 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </motion.div>

          {/* FAQ List */}
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-700/50 transition-colors"
                >
                  <span className="font-medium">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-6 pb-4"
                    >
                      <p className="text-gray-400">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
            {filteredFaqs.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                No FAQs found matching your search.
              </div>
            )}
          </div>

          {/* Contact Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-12 text-center"
          >
            <p className="text-gray-400 mb-4">Still have questions?</p>
            <motion.a
              href="/contact"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block bg-red-500 hover:bg-red-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Contact Support
            </motion.a>
          </motion.div>
        </div>
      </div>
    </RequireAdmin>
  )
} 