'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChatBubbleLeftIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { marked } from 'marked'

export default function FloatingChatbox() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>(() => {
    if (typeof window !== 'undefined') {
      const storedMessages = sessionStorage.getItem('chatMessages')
      return storedMessages ? JSON.parse(storedMessages) : []
    }
    return []
  })
  const [inputMessage, setInputMessage] = useState('')
  const [isLoadingChat, setIsLoadingChat] = useState(false)

  // Save messages to sessionStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('chatMessages', JSON.stringify(messages))
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    const newMessage: { role: "user", content: string } = { role: 'user', content: inputMessage }
    setMessages(prev => [...prev, newMessage])
    setInputMessage('')
    setIsLoadingChat(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [...messages, newMessage]
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("API Response (from /api/chat):", data)

      let assistantMessageContent = 'Sorry, I did not receive a valid response from the AI at the moment.'

      if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
        assistantMessageContent = data.choices[0].message.content
      } else {
        console.error("Unexpected API response structure:", data)
        if (data.error) {
          assistantMessageContent = `Error from AI: ${data.error}`
        } else if (data.message) {
          assistantMessageContent = `AI response message: ${data.message}`
        } else {
          assistantMessageContent = 'Sorry, I received an unexpected response from the AI.'
        }
      }

      const assistantMessage: { role: "assistant", content: string } = { 
        role: 'assistant', 
        content: assistantMessageContent 
      }
      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error("Error fetching from API:", error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I am unable to connect to the AI at the moment.' 
      }])
    } finally {
      setIsLoadingChat(false)
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-red-600 to-red-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300"
      >
        <ChatBubbleLeftIcon className="h-6 w-6" />
      </motion.button>

      {/* Chatbox Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800/95 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Chatbox Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
                  Chat with AI Assistant
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <p className="text-lg mb-3">👋 Welcome to MovieWorld AI Assistant!</p>
                    <p className="text-center italic text-sm">Ask me anything about movies, our services, or how to get started.</p>
                  </div>
                )}
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-red-600 to-red-500 text-white'
                          : 'bg-gradient-to-r from-gray-700 to-gray-600 text-gray-100'
                      } break-words`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="ai-response-content prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }} />
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                {isLoadingChat && (
                  <div className="flex justify-start">
                    <div className="bg-gray-700 p-3 rounded-2xl">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-700/50 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    type="submit"
                    disabled={isLoadingChat || !inputMessage.trim()}
                    className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-xl hover:from-red-500 hover:to-red-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 