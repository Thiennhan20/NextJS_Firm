'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share, Video, MessageCircle, User, Eye, Heart, Send, Smile, Image as LucideImage } from 'lucide-react';
import Image from 'next/image';
import io, { Socket } from 'socket.io-client';

// Mock data (keep for non-chat parts)
const mockStream = {
  id: 'stream-1',
  title: 'Live Stream: The Future of Cinema',
  description: 'Join us for an exclusive live stream discussing the latest trends and innovations in the film industry.',
  streamUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  viewers: 1247,
  likes: 89,
};

type Message = {
  id: string;
  sender: 'me' | 'other' | 'system';
  username: string;
  text: string;
  timestamp: Date;
  type: 'message' | 'emoji' | 'gift' | 'image' | 'system';
  avatar?: string;
  isVip?: boolean;
  imageUrl?: string;
};

type Emoji = {
  emoji: string;
  name: string;
};

const quickEmojis: Emoji[] = [
  { emoji: '😀', name: 'smile' },
  { emoji: '😂', name: 'laugh' },
  { emoji: '❤️', name: 'heart' },
  { emoji: '👍', name: 'thumbs up' },
  { emoji: '🔥', name: 'fire' },
  { emoji: '👏', name: 'clap' },
  { emoji: '🎉', name: 'party' },
  { emoji: '💯', name: 'hundred' },
];

export default function StreamingPage() {
  const [activeStream, setActiveStream] = useState(mockStream);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [username, setUsername] = useState(`User${Math.floor(Math.random() * 1000)}`); // Temporary username
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');

  // Add username change handler
  const handleUsernameChange = () => {
    if (tempUsername.trim()) {
      setUsername(tempUsername.trim());
      setIsEditingUsername(false);
    }
  };

  // Initialize Socket.IO connection
  // Initialize Socket.IO connection
  useEffect(() => {
    // Use environment variable or fallback to localhost for development
    const socketUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3001' 
      : 'https://server-nextjs-firm.onrender.com/';

    socketRef.current = io(socketUrl, {
      transports: ['websocket'],
      withCredentials: true,
    });

    // Rest of the useEffect code remains unchanged
    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket server');
      socketRef.current?.emit('user_join', username);
    });

    socketRef.current.on('chat_message', (message) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        sender: message.type === 'system' ? 'system' : message.username === username ? 'me' : 'other',
        username: message.username || 'System',
        text: message.content,
        timestamp: new Date(message.timestamp),
        type: message.type === 'image' ? 'image' : message.type === 'system' ? 'system' : message.content.length <= 2 ? 'emoji' : 'message',
        avatar: message.username === username ? '👤' : ['🎬', '🍿', '🎭', '🎥', '🎪'][Math.floor(Math.random() * 5)],
        imageUrl: message.type === 'image' ? message.content : undefined,
      };
      setChatMessages((prev) => [...prev, newMessage]);
    });

    socketRef.current.on('user_list', (users: string[]) => {
      setOnlineUsers(users.length);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [username]);

  // Scroll to the latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Simulate live stream stats (keep as is)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStream((prev) => ({
        ...prev,
        viewers: prev.viewers + Math.floor(Math.random() * 10) - 5,
        likes: prev.likes + Math.floor(Math.random() * 2),
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = () => {
    if (newMessage.trim() && socketRef.current) {
      socketRef.current.emit('chat_message', newMessage);
      setNewMessage('');
    }
  };

  const handleEmojiClick = (emoji: string) => {
    if (socketRef.current) {
      socketRef.current.emit('chat_message', emoji);
      setShowEmojiPicker(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && socketRef.current) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        socketRef.current?.emit('image_message', imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex flex-col">
      {/* Header Stats */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-yellow-600/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-red-400">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold">LIVE</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Eye className="h-4 w-4" />
                <span className="text-sm">{activeStream.viewers.toLocaleString()} viewers</span>
              </div>
              <div className="flex items-center gap-2 text-pink-400">
                <Heart className="h-4 w-4" />
                <span className="text-sm">{activeStream.likes} likes</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <User className="h-4 w-4" />
              <span className="text-sm">{onlineUsers} online</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow flex flex-col py-6">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-2xl md:text-4xl font-bold text-center bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent mb-6 drop-shadow-2xl"
        >
          {activeStream.title}
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
          {/* Main Content */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Main Video */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-yellow-600/50 bg-gray-900 hover:border-yellow-500/70 transition-all duration-300"
            >
              <iframe
                src={activeStream.streamUrl}
                title={activeStream.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full"
              />
              <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                LIVE
              </div>
            </motion.div>

            {/* Camera & Screen Share */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-700/50 flex items-center justify-center group hover:border-yellow-600/50 transition-all duration-300 hover:shadow-yellow-600/20 hover:shadow-lg"
              >
                <Video className="h-12 w-12 text-gray-600 group-hover:text-yellow-500 transition-colors duration-300" />
                <span className="absolute bottom-4 text-gray-400 text-sm group-hover:text-yellow-300 transition-colors duration-300">Your Camera</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-700/50 flex items-center justify-center group hover:border-yellow-600/50 transition-all duration-300 hover:shadow-yellow-600/20 hover:shadow-lg"
              >
                <Share className="h-12 w-12 text-gray-600 group-hover:text-yellow-500 transition-colors duration-300" />
                <span className="absolute bottom-4 text-gray-400 text-sm group-hover:text-yellow-300 transition-colors duration-300">Screen Share</span>
              </motion.div>
            </div>
          </div>

          {/* Enhanced Chat Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col h-full max-h-[80vh]"
          >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-lg p-4 rounded-t-xl border-b border-yellow-600/30">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-yellow-300 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Live Chat
                </h2>
                <div className="flex items-center gap-2">
                  {isEditingUsername ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tempUsername}
                        onChange={(e) => setTempUsername(e.target.value)}
                        placeholder="New username"
                        className="px-2 py-1 bg-gray-800 rounded text-sm text-white"
                        onKeyDown={(e) => e.key === 'Enter' && handleUsernameChange()}
                      />
                      <button
                        onClick={handleUsernameChange}
                        className="px-2 py-1 bg-yellow-500 text-black rounded text-sm"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setTempUsername(username);
                        setIsEditingUsername(true);
                      }}
                      className="text-sm text-gray-400 hover:text-yellow-300"
                    >
                      {username}
                    </button>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    {chatMessages.length} messages
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div
              ref={chatContainerRef}
              className="flex-grow bg-gradient-to-b from-gray-900/70 to-gray-800/70 backdrop-blur-lg overflow-y-auto p-4 space-y-3 custom-scrollbar"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#fbbf24 #1f2937',
              }}
            >
              <AnimatePresence>
                {chatMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender !== 'me' && msg.sender !== 'system' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-sm">
                          {msg.avatar}
                        </div>
                      </div>
                    )}

                    <div className={`max-w-[80%] ${msg.sender === 'me' ? 'order-2' : ''}`}>
                      {msg.sender !== 'me' && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold ${msg.isVip ? 'text-yellow-400' : 'text-gray-300'}`}>
                            {msg.username}
                            {msg.isVip && <span className="text-yellow-400 ml-1">⭐</span>}
                          </span>
                          <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                        </div>
                      )}

                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          msg.sender === 'me'
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-lg'
                            : msg.sender === 'system'
                            ? 'bg-gray-500/50 text-gray-300 text-center'
                            : msg.type === 'emoji'
                            ? 'bg-transparent text-2xl'
                            : 'bg-gradient-to-r from-gray-700 to-gray-600 text-white shadow-lg'
                        } ${msg.type === 'emoji' ? 'text-center' : ''}`}
                      >
                        {msg.type === 'image' ? (
                          <Image
                            src={msg.imageUrl || ''}
                            alt="Shared image in chat"
                            width={200}
                            height={150}
                            className="max-w-full rounded-lg object-contain"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        ) : (
                          <p className={`${msg.type === 'emoji' ? 'text-2xl' : 'text-sm'} break-words`}>{msg.text}</p>
                        )}
                        {msg.sender === 'me' && (
                          <div className="text-right text-xs text-black/70 mt-1">{formatTime(msg.timestamp)}</div>
                        )}
                      </div>
                    </div>

                    {msg.sender === 'me' && (
                      <div className="flex-shrink-0 order-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-sm">
                          {msg.avatar}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            {/* Quick Emoji Reactions */}
            <div className="bg-gray-900/80 backdrop-blur-lg px-4 py-2 border-t border-gray-700/50">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {quickEmojis.map((emoji) => (
                  <motion.button
                    key={emoji.name}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEmojiClick(emoji.emoji)}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-lg transition-colors duration-200"
                  >
                    {emoji.emoji}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Chat Input */}
            <div className="bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-lg p-4 rounded-b-xl border-t border-yellow-600/30">
              <div className="flex gap-2">
                <div className="flex-grow relative">
                  <textarea
                    rows={1}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full px-4 py-3 bg-gray-800/80 rounded-xl border border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 text-white placeholder-gray-400 text-sm resize-none transition-all duration-200 backdrop-blur-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="px-3 py-3 bg-gray-700 hover:bg-gray-600 text-yellow-400 rounded-xl transition-colors duration-200 flex items-center justify-center"
                  >
                    <Smile className="h-4 w-4" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-3 bg-gray-700 hover:bg-gray-600 text-yellow-400 rounded-xl transition-colors duration-200 flex items-center justify-center"
                  >
                    <LucideImage className="h-4 w-4" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center"
                  >
                    <Send className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>

              {/* Emoji Picker */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 rounded-xl p-4 border border-gray-600 shadow-xl z-10"
                  >
                    <div className="grid grid-cols-8 gap-2">
                      {quickEmojis
                        .concat([
                          { emoji: '😎', name: 'cool' },
                          { emoji: '🤔', name: 'thinking' },
                          { emoji: '😍', name: 'love' },
                          { emoji: '🤯', name: 'mind blown' },
                          { emoji: '💪', name: 'strong' },
                          { emoji: '🙌', name: 'praise' },
                          { emoji: '🤩', name: 'star eyes' },
                          { emoji: '🥳', name: 'party' },
                        ])
                        .map((emoji) => (
                          <motion.button
                            key={emoji.name}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEmojiClick(emoji.emoji)}
                            className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-lg transition-colors duration-200"
                          >
                            {emoji.emoji}
                          </motion.button>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #fbbf24;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #f59e0b;
        }
      `}</style>
    </div>
  );
}