'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { marked } from 'marked'

const faqs = [
  {
    question: 'How do I create an account?',
    answer: 'To create an account, click on the "Sign Up" button in the top right corner. You can sign up using your email address or through social media accounts like Google or Facebook.'
  },
  {
    question: 'How can I watch movies on MovieWorld?',
    answer: 'You can watch movies by browsing our collection and clicking on any movie you\'re interested in. Some movies are available for free, while others may require a subscription or one-time purchase.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and various other payment methods depending on your region.'
  },
  {
    question: 'Can I download movies to watch offline?',
    answer: 'Yes, subscribers can download movies for offline viewing. Look for the download icon on the movie details page. Downloads are available for 48 hours after you start watching.'
  },
  {
    question: 'How do I cancel my subscription?',
    answer: 'You can cancel your subscription at any time by going to your account settings and selecting "Subscription". Click on "Cancel Subscription" and follow the prompts.'
  },
  {
    question: 'What video quality is available?',
    answer: 'We offer various video qualities including 4K Ultra HD, Full HD (1080p), HD (720p), and SD (480p). The available quality depends on your internet connection and subscription plan.'
  },
  {
    question: 'How do I report a problem?',
    answer: 'You can report any issues by clicking the "Help" button in the bottom right corner or by visiting our Contact page. Our support team typically responds within 24 hours.'
  },
  {
    question: 'Are there parental controls available?',
    answer: 'Yes, we offer comprehensive parental controls. You can set up age restrictions, content filters, and viewing time limits through your account settings.'
  },
  {
    question: 'Is MovieWorld available internationally?',
    answer: 'MovieWorld is available in many countries, but the content library may vary based on regional licensing agreements.'
  },
  {
    question: 'How often is new content added?',
    answer: 'We regularly update our library with new movies and shows. Check the \'New Releases\' section for the latest additions.'
  },
  {
    question: 'Can I request movies or shows?',
    answer: 'While we can\'t guarantee all requests, we welcome suggestions! You can submit your requests through the Contact Us page.'
  },
  {
    question: 'What devices can I use to watch MovieWorld?',
    answer: 'You can watch MovieWorld on your web browser, smartphone, tablet, smart TV, and various streaming devices.'
  },
]

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Chatbox state
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    const newMessage: { role: "user", content: string } = { role: 'user', content: inputMessage }
    setMessages(prev => [...prev, newMessage])
    setInputMessage('')
    setIsLoadingChat(true)

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer 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",
          "HTTP-Referer": "https://next-js-firm.vercel.app",
          "X-Title": "Firm",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "deepseek/deepseek-r1-0528:free",
          "messages": [
            // Include previous messages for context
            ...messages,
            { "role": "user", "content": inputMessage }
          ]
        })
      });

      const data = await response.json()
      const assistantMessage: { role: "assistant", content: string } = { role: 'assistant', content: data.choices[0].message.content }
      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error("Error fetching from OpenRouter API:", error)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am unable to connect to the AI at the moment.' }])
    } finally {
      setIsLoadingChat(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white pt-20">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
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
        <div className="space-y-3">
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
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-700/50 transition-colors"
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
                    className="px-4 pb-3"
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
          className="mt-8 text-center"
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

      {/* AI Chatbox Section - Moved outside the main content wrapper */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mt-12 w-full bg-gray-800/50 rounded-2xl p-2 sm:p-4 md:p-6 backdrop-blur-sm shadow-xl chatbox-container-shadow"
      >
        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text glowing-text-chatbox">
          Chat with AI Assistant
        </h2>
        <div className="h-[500px] overflow-y-auto space-y-3 p-3 bg-gray-900/80 rounded-lg border border-gray-700 custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
          {/* Chat messages */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="text-xl mb-4">👋 Welcome to MovieWorld AI Assistant!</p>
              <p className="text-center italic">Ask me anything about movies, our services, or how to get started.</p>
            </div>
          )}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white chat-bubble-user-shadow'
                    : 'bg-gradient-to-r from-gray-700 to-gray-600 text-gray-100 chat-bubble-ai-shadow'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="ai-response-content" dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }} />
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {isLoadingChat && (
            <div className="flex justify-start">
              <div className="bg-gray-700 p-4 rounded-2xl">
                <div className="dot-flashing"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="mt-6 flex flex-col sm:flex-row gap-0.5 sm:gap-1 md:gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isLoadingChat ? "AI is typing..." : "Ask me anything about movies..."}
            className="flex-grow min-w-0 px-2 py-2 rounded-xl bg-gray-700/80 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            disabled={isLoadingChat}
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold px-2 py-2 rounded-xl transition-all input-button-shadow flex-shrink-0"
            disabled={isLoadingChat}
          >
            {isLoadingChat ? 'Sending...' : 'Send'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
} 