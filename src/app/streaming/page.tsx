'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share, Video, MessageCircle, User, Eye, Heart, Send, Smile, Image as LucideImage } from 'lucide-react';
import Image from 'next/image';
import io, { Socket } from 'socket.io-client';
import imageCompression from 'browser-image-compression'; // Thêm thư viện nén hình ảnh

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
  { emoji: '😍', name: 'love' },
  { emoji: '🤔', name: 'thinking' },
  { emoji: '😎', name: 'cool' },
  { emoji: '🤯', name: 'mind blown' },
  { emoji: '💪', name: 'strong' },
  { emoji: '🙌', name: 'praise' },
  { emoji: '🤩', name: 'star eyes' },
  { emoji: '🥳', name: 'party' },
  { emoji: '😊', name: 'blush' },
  { emoji: '🥰', name: 'love' },
  { emoji: '😴', name: 'sleepy' },
  { emoji: '🤗', name: 'hug' },
  { emoji: '🤫', name: 'shush' },
  { emoji: '🤓', name: 'nerd' },
  { emoji: '😇', name: 'angel' },
  { emoji: '🤠', name: 'cowboy' },
  { emoji: '🥺', name: 'pleading' },
  { emoji: '😤', name: 'triumph' },
  { emoji: '🤪', name: 'zany' },
  { emoji: '😷', name: 'mask' },
  { emoji: '🤡', name: 'clown' },
  { emoji: '👻', name: 'ghost' },
  { emoji: '🤖', name: 'robot' },
  { emoji: '👽', name: 'alien' },
  { emoji: '👾', name: 'game' },
  { emoji: '🎮', name: 'game' },
  { emoji: '🎲', name: 'dice' },
  { emoji: '🎯', name: 'target' },
  { emoji: '🎨', name: 'art' },
  { emoji: '🎭', name: 'theater' },
  { emoji: '🎪', name: 'circus' },
];

export default function StreamingPage() {
  const [activeStream, setActiveStream] = useState(mockStream);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [username, setUsername] = useState(`User${Math.floor(Math.random() * 1000)}`);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

  // Add username change handler
  const handleUsernameChange = () => {
    if (tempUsername.trim()) {
      setUsername(tempUsername.trim());
      socketRef.current?.emit('user_join', tempUsername.trim());
      setIsEditingUsername(false);
    }
  };

  // Handle click outside to close emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const emojiButton = document.querySelector('.emoji-button');
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        emojiButton &&
        !emojiButton.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socketUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3001'
      : 'https://server-nextjs-firm.onrender.com/';

    socketRef.current = io(socketUrl, {
      transports: ['websocket'],
      withCredentials: true,
    });

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
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
      if (isAtBottom) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
  }, [chatMessages]);

  // Simulate live stream stats
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
      if (chatContainerRef.current) {
        setTimeout(() => {
          chatContainerRef.current?.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }, 100);
      }
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
  };



  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && socketRef.current) {
      // Kiểm tra kích thước file
      if (file.size > 10 * 1024 * 1024) { // Giới hạn kích thước 10MB
        alert("File quá lớn. Vui lòng chọn file nhỏ hơn 10MB.");
        return;
      }
  
      try {
        // Nén hình ảnh
        const options = {
          maxSizeMB: 1, // Giới hạn kích thước nén (1MB)
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData = e.target?.result as string;
  
          // Thêm thời gian xử lý trước khi gửi hình ảnh
          setTimeout(() => {
            socketRef.current?.emit('image_message', imageData);
          }, 10000); // Thời gian xử lý 1 giây
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error("Lỗi khi nén hình ảnh:", error);
        alert("Không thể nén hình ảnh. Vui lòng thử lại.");
      }
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
      <div className="bg-black/50 backdrop-blur-sm border-b border-yellow-600/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-6">
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
            className="flex flex-col h-[calc(100vh-12rem)] lg:h-[calc(100vh-8rem)] bg-gradient-to-b from-gray-900/95 to-black/95 backdrop-blur-xl rounded-2xl border border-yellow-500/20 shadow-2xl"
          >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-500/10 backdrop-blur-lg p-4 rounded-t-2xl border-b border-yellow-500/30">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-yellow-300 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Live Chat
                </h2>
                <div className="flex items-center gap-3">
                  {isEditingUsername ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tempUsername}
                        onChange={(e) => setTempUsername(e.target.value)}
                        placeholder="New username"
                        className="px-3 py-1.5 bg-gray-800/80 rounded-lg text-sm text-white border border-yellow-500/30 focus:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/30"
                        onKeyDown={(e) => e.key === 'Enter' && handleUsernameChange()}
                      />
                      <button
                        onClick={handleUsernameChange}
                        className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-lg text-sm font-medium hover:from-yellow-400 hover:to-yellow-500 transition-all duration-200 shadow-lg shadow-yellow-500/20"
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
                      className="text-sm text-yellow-300 hover:text-yellow-200 transition-colors duration-200 flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
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
              className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-hide hover:scrollbar-default"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <AnimatePresence>
                {chatMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender !== 'me' && msg.sender !== 'system' && (
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-lg shadow-lg shadow-yellow-500/20 ring-2 ring-yellow-500/20">
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
                        className={`rounded-2xl px-4 py-2.5 ${
                          msg.sender === 'me'
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-lg shadow-yellow-500/20 ring-1 ring-yellow-500/30'
                            : msg.sender === 'system'
                            ? 'bg-gray-500/30 text-gray-300 text-center backdrop-blur-sm ring-1 ring-gray-500/30'
                            : msg.type === 'emoji'
                            ? 'bg-transparent text-3xl'
                            : 'bg-gradient-to-r from-gray-800/80 to-gray-700/80 text-white shadow-lg backdrop-blur-sm ring-1 ring-gray-500/30'
                        } ${msg.type === 'emoji' ? 'text-center' : ''}`}
                      >
                        {msg.type === 'image' ? (
                          <Image
                            src={msg.imageUrl || ''}
                            alt="Shared image in chat"
                            width={200}
                            height={150}
                            className="max-w-full rounded-lg object-contain shadow-lg ring-1 ring-gray-500/30"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        ) : (
                          <p className={`${msg.type === 'emoji' ? 'text-3xl' : 'text-sm'} break-words`}>{msg.text}</p>
                        )}
                        {msg.sender === 'me' && (
                          <div className="text-right text-xs text-black/70 mt-1">{formatTime(msg.timestamp)}</div>
                        )}
                      </div>
                    </div>

                    {msg.sender === 'me' && (
                      <div className="flex-shrink-0 order-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-lg shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/20">
                          {msg.avatar}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="bg-gradient-to-r from-gray-900/95 to-black/95 backdrop-blur-lg p-4 rounded-b-2xl border-t border-yellow-500/20">
              <div className="flex flex-col gap-3">
                {/* Input Area */}
                <textarea
                  rows={2}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full px-5 py-4 bg-gray-800/80 rounded-2xl border border-yellow-500/20 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/40 text-white placeholder-gray-400 text-sm resize-none transition-all duration-300 backdrop-blur-sm shadow-lg ring-1 ring-yellow-500/10 hover:border-yellow-500/40 hover:shadow-yellow-500/5 scrollbar-hide"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />

                {/* Controls Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="emoji-button p-2.5 bg-gray-700/50 hover:bg-gray-600/50 text-yellow-400 rounded-xl transition-all duration-200 flex items-center justify-center border border-yellow-500/20 hover:border-yellow-500/40 shadow-lg ring-1 ring-yellow-500/10 hover:shadow-yellow-500/10"
                    >
                      <Smile className="h-5 w-5" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 bg-gray-700/50 hover:bg-gray-600/50 text-yellow-400 rounded-xl transition-all duration-200 flex items-center justify-center border border-yellow-500/20 hover:border-yellow-500/40 shadow-lg ring-1 ring-yellow-500/10 hover:shadow-yellow-500/10"
                    >
                      <LucideImage className="h-5 w-5" />
                    </motion.button>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 sm:px-6 py-2 bg-gradient-to-r from-yellow-500/90 to-yellow-600/90 hover:from-yellow-400/90 hover:to-yellow-500/90 disabled:from-gray-600/50 disabled:to-gray-700/50 disabled:cursor-not-allowed text-black/90 font-medium rounded-lg transition-all duration-300 shadow-lg shadow-yellow-500/10 flex items-center gap-1.5 ring-1 ring-yellow-500/20 hover:shadow-yellow-500/20 disabled:shadow-none text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Send</span>
                    <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </motion.button>
                </div>
              </div>

              {/* Emoji Picker */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    ref={emojiPickerRef}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800/95 rounded-xl p-4 border border-yellow-500/20 shadow-xl z-10 backdrop-blur-xl ring-1 ring-yellow-500/20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="grid grid-cols-5 gap-2 max-h-[180px] overflow-y-auto scrollbar-hide hover:scrollbar-default pr-1">
                      {quickEmojis.map((emoji) => (
                        <motion.button
                          key={emoji.name}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEmojiClick(emoji.emoji)}
                          className="w-10 h-10 rounded-lg bg-gray-700/80 hover:bg-gray-600/80 flex items-center justify-center text-xl transition-all duration-200 border border-yellow-500/20 hover:border-yellow-500/40 ring-1 ring-yellow-500/10 hover:shadow-lg hover:shadow-yellow-500/10"
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
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-default::-webkit-scrollbar {
          display: block;
          width: 6px;
          height: 6px;
        }
        .scrollbar-default::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 10px;
        }
        .scrollbar-default::-webkit-scrollbar-thumb {
          background: #fbbf24;
          border-radius: 10px;
        }
        .scrollbar-default::-webkit-scrollbar-thumb:hover {
          background: #f59e0b;
        }
      `}</style>
    </div>
  );
}