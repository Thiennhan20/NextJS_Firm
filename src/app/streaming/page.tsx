'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share, Video, MessageCircle, User, Eye, Heart, Send, Smile, Image as LucideImage, Maximize2, Minimize2 } from 'lucide-react';
import Image from 'next/image';
import io, { Socket } from 'socket.io-client';
import imageCompression from 'browser-image-compression';
import useAuthStore from '@/store/useAuthStore';
import { useUIStore } from '@/store/store';
import axios from 'axios';
import RequireAdmin from '@/components/RequireAdmin';

// Network Information interface
interface NetworkInformation extends EventTarget {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  rtt: number;
  downlink: number;
  saveData: boolean;
}

// Extend Navigator interface
declare global {
  interface Navigator {
    connection?: NetworkInformation;
  }
}

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
  imageStatus?: 'loading' | 'success' | 'error';
  networkStatus?: 'good' | 'slow' | 'poor';
  progress?: number;
};

type Emoji = {
  emoji: string;
  name: string;
  category: string;
};

const emojiCategories = [
  { name: 'Faces', icon: '😀' },
  { name: 'Love', icon: '❤️' },
  { name: 'Animals', icon: '🐶' },
  { name: 'Food', icon: '🍕' },
  { name: 'Activities', icon: '⚽' },
  { name: 'Travel', icon: '✈️' },
  { name: 'Objects', icon: '💡' },
  { name: 'Symbols', icon: '✨' },
];

const quickEmojis: Emoji[] = [
  // Faces
  { emoji: '😀', name: 'smile', category: 'Faces' },
  { emoji: '😂', name: 'laugh', category: 'Faces' },
  { emoji: '😊', name: 'blush', category: 'Faces' },
  { emoji: '🥰', name: 'love', category: 'Faces' },
  { emoji: '😎', name: 'cool', category: 'Faces' },
  { emoji: '🤔', name: 'thinking', category: 'Faces' },
  { emoji: '😴', name: 'sleepy', category: 'Faces' },
  { emoji: '🤗', name: 'hug', category: 'Faces' },
  { emoji: '🤫', name: 'shush', category: 'Faces' },
  { emoji: '🤓', name: 'nerd', category: 'Faces' },
  { emoji: '😇', name: 'angel', category: 'Faces' },
  { emoji: '🤠', name: 'cowboy', category: 'Faces' },
  { emoji: '🥺', name: 'pleading', category: 'Faces' },
  { emoji: '😤', name: 'triumph', category: 'Faces' },
  { emoji: '🤪', name: 'zany', category: 'Faces' },
  { emoji: '😷', name: 'mask', category: 'Faces' },
  { emoji: '🤡', name: 'clown', category: 'Faces' },
  { emoji: '👻', name: 'ghost', category: 'Faces' },
  { emoji: '🤖', name: 'robot', category: 'Faces' },
  { emoji: '👽', name: 'alien', category: 'Faces' },
  { emoji: '🤩', name: 'star eyes', category: 'Faces' },
  { emoji: '🥳', name: 'party', category: 'Faces' },
  { emoji: '🤯', name: 'mind blown', category: 'Faces' },
  { emoji: '🤢', name: 'nauseated', category: 'Faces' },
  { emoji: '🤮', name: 'vomiting', category: 'Faces' },
  { emoji: '🤧', name: 'sneezing', category: 'Faces' },
  { emoji: '🤠', name: 'cowboy', category: 'Faces' },
  { emoji: '🤡', name: 'clown', category: 'Faces' },
  { emoji: '🤖', name: 'robot', category: 'Faces' },
  { emoji: '👽', name: 'alien', category: 'Faces' },
  
  // Love
  { emoji: '❤️', name: 'heart', category: 'Love' },
  { emoji: '💕', name: 'hearts', category: 'Love' },
  { emoji: '💖', name: 'sparkling heart', category: 'Love' },
  { emoji: '💝', name: 'heart with ribbon', category: 'Love' },
  { emoji: '💓', name: 'beating heart', category: 'Love' },
  { emoji: '💗', name: 'growing heart', category: 'Love' },
  { emoji: '💘', name: 'heart with arrow', category: 'Love' },
  { emoji: '💞', name: 'revolving hearts', category: 'Love' },
  { emoji: '💟', name: 'heart decoration', category: 'Love' },
  { emoji: '💌', name: 'love letter', category: 'Love' },
  { emoji: '💋', name: 'kiss mark', category: 'Love' },
  { emoji: '💘', name: 'heart with arrow', category: 'Love' },
  
  // Animals
  { emoji: '🐶', name: 'dog', category: 'Animals' },
  { emoji: '🐱', name: 'cat', category: 'Animals' },
  { emoji: '🐼', name: 'panda', category: 'Animals' },
  { emoji: '🦁', name: 'lion', category: 'Animals' },
  { emoji: '🐯', name: 'tiger', category: 'Animals' },
  { emoji: '🦊', name: 'fox', category: 'Animals' },
  { emoji: '🦒', name: 'giraffe', category: 'Animals' },
  { emoji: '🦁', name: 'lion', category: 'Animals' },
  { emoji: '🐨', name: 'koala', category: 'Animals' },
  { emoji: '🦘', name: 'kangaroo', category: 'Animals' },
  { emoji: '🦥', name: 'sloth', category: 'Animals' },
  { emoji: '🦦', name: 'otter', category: 'Animals' },
  { emoji: '🦨', name: 'skunk', category: 'Animals' },
  { emoji: '🦡', name: 'badger', category: 'Animals' },
  { emoji: '🦫', name: 'beaver', category: 'Animals' },
  { emoji: '🦦', name: 'otter', category: 'Animals' },
  
  // Food
  { emoji: '🍕', name: 'pizza', category: 'Food' },
  { emoji: '🍔', name: 'hamburger', category: 'Food' },
  { emoji: '🍟', name: 'fries', category: 'Food' },
  { emoji: '🍦', name: 'ice cream', category: 'Food' },
  { emoji: '🍩', name: 'doughnut', category: 'Food' },
  { emoji: '🍪', name: 'cookie', category: 'Food' },
  { emoji: '🍫', name: 'chocolate', category: 'Food' },
  { emoji: '🍷', name: 'wine', category: 'Food' },
  { emoji: '🍜', name: 'noodles', category: 'Food' },
  { emoji: '🍣', name: 'sushi', category: 'Food' },
  { emoji: '🍱', name: 'bento box', category: 'Food' },
  { emoji: '🍙', name: 'rice ball', category: 'Food' },
  { emoji: '🍘', name: 'rice cracker', category: 'Food' },
  { emoji: '🍡', name: 'dango', category: 'Food' },
  { emoji: '🍧', name: 'shaved ice', category: 'Food' },
  { emoji: '🍨', name: 'ice cream', category: 'Food' },
  
  // Activities
  { emoji: '⚽', name: 'soccer', category: 'Activities' },
  { emoji: '🎮', name: 'game', category: 'Activities' },
  { emoji: '🎲', name: 'dice', category: 'Activities' },
  { emoji: '🎯', name: 'target', category: 'Activities' },
  { emoji: '🎨', name: 'art', category: 'Activities' },
  { emoji: '🎭', name: 'theater', category: 'Activities' },
  { emoji: '🎪', name: 'circus', category: 'Activities' },
  { emoji: '🎬', name: 'movie', category: 'Activities' },
  { emoji: '🎤', name: 'microphone', category: 'Activities' },
  { emoji: '🎧', name: 'headphones', category: 'Activities' },
  { emoji: '🎼', name: 'musical score', category: 'Activities' },
  { emoji: '🎹', name: 'piano', category: 'Activities' },
  { emoji: '🎸', name: 'guitar', category: 'Activities' },
  { emoji: '🎺', name: 'trumpet', category: 'Activities' },
  { emoji: '🎻', name: 'violin', category: 'Activities' },
  { emoji: '🎷', name: 'saxophone', category: 'Activities' },
  
  // Travel
  { emoji: '✈️', name: 'airplane', category: 'Travel' },
  { emoji: '🚗', name: 'car', category: 'Travel' },
  { emoji: '🚂', name: 'train', category: 'Travel' },
  { emoji: '🚢', name: 'ship', category: 'Travel' },
  { emoji: '🗺️', name: 'map', category: 'Travel' },
  { emoji: '🗽', name: 'statue', category: 'Travel' },
  { emoji: '🗼', name: 'tower', category: 'Travel' },
  { emoji: '🏰', name: 'castle', category: 'Travel' },
  { emoji: '🏯', name: 'Japanese castle', category: 'Travel' },
  { emoji: '🏟️', name: 'stadium', category: 'Travel' },
  { emoji: '🎡', name: 'ferris wheel', category: 'Travel' },
  { emoji: '🎢', name: 'roller coaster', category: 'Travel' },
  { emoji: '🎠', name: 'carousel horse', category: 'Travel' },
  { emoji: '⛱️', name: 'umbrella on ground', category: 'Travel' },
  { emoji: '🏖️', name: 'beach with umbrella', category: 'Travel' },
  { emoji: '⛰️', name: 'mountain', category: 'Travel' },
  
  // Objects
  { emoji: '💡', name: 'light bulb', category: 'Objects' },
  { emoji: '📱', name: 'phone', category: 'Objects' },
  { emoji: '💻', name: 'laptop', category: 'Objects' },
  { emoji: '⌚', name: 'watch', category: 'Objects' },
  { emoji: '📷', name: 'camera', category: 'Objects' },
  { emoji: '🎥', name: 'movie camera', category: 'Objects' },
  { emoji: '🎧', name: 'headphones', category: 'Objects' },
  { emoji: '🎸', name: 'guitar', category: 'Objects' },
  { emoji: '📚', name: 'books', category: 'Objects' },
  { emoji: '📖', name: 'open book', category: 'Objects' },
  { emoji: '📝', name: 'memo', category: 'Objects' },
  { emoji: '✏️', name: 'pencil', category: 'Objects' },
  { emoji: '🖌️', name: 'paintbrush', category: 'Objects' },
  { emoji: '🎨', name: 'artist palette', category: 'Objects' },
  { emoji: '🎭', name: 'performing arts', category: 'Objects' },
  { emoji: '🎪', name: 'circus tent', category: 'Objects' },
  
  // Symbols
  { emoji: '✨', name: 'sparkles', category: 'Symbols' },
  { emoji: '💫', name: 'dizzy', category: 'Symbols' },
  { emoji: '⭐', name: 'star', category: 'Symbols' },
  { emoji: '🌟', name: 'glowing star', category: 'Symbols' },
  { emoji: '💯', name: 'hundred', category: 'Symbols' },
  { emoji: '🔥', name: 'fire', category: 'Symbols' },
  { emoji: '💪', name: 'strong', category: 'Symbols' },
  { emoji: '🙌', name: 'praise', category: 'Symbols' },
  { emoji: '👑', name: 'crown', category: 'Symbols' },
  { emoji: '💎', name: 'gem stone', category: 'Symbols' },
  { emoji: '🏆', name: 'trophy', category: 'Symbols' },
  { emoji: '🎖️', name: 'medal', category: 'Symbols' },
  { emoji: '🏅', name: 'sports medal', category: 'Symbols' },
  { emoji: '🎗️', name: 'reminder ribbon', category: 'Symbols' },
  { emoji: '🎯', name: 'direct hit', category: 'Symbols' },
  { emoji: '🎲', name: 'game die', category: 'Symbols' },
];

// Định nghĩa kiểu rõ ràng cho streamMovie nếu cần
interface StreamMovie {
  id: number;
  title: string;
  viewers?: number;
  likes?: number;
  description?: string;
  streamUrl?: string;
  poster?: string | null;
}

export default function StreamingPage() {
  const { user } = useAuthStore();
  const { isNavDropdownOpen } = useUIStore();
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const [streamMovie, setStreamMovie] = useState<StreamMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const savedMessages = sessionStorage.getItem('chatMessages');
      if (savedMessages) {
        const parsedMessages: Message[] = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        return parsedMessages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    }
    return [];
  });
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [username, setUsername] = useState(user?.name || `User${Math.floor(Math.random() * 1000)}`);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState('Faces');
  const [networkStatus, setNetworkStatus] = useState<'good' | 'slow' | 'poor'>('good');

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

  // Phát hiện chế độ landscape/portrait
  useEffect(() => {
    const checkOrientation = () => {
      const isLandscape = window.matchMedia('(orientation: landscape)').matches;
      const isMobile = window.innerWidth <= 768;
      setIsMobileLandscape(isMobile && isLandscape);
      setIsChatVisible(!(isMobile && isLandscape)); // Ẩn chat ở mobile landscape
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Xử lý chế độ fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle click outside để đóng emoji picker
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize Socket.IO
  useEffect(() => {
    const socketUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3001'
      : 'https://server-nextjs-firm.onrender.com/';

    socketRef.current = io(socketUrl, {
      transports: ['websocket'],
      withCredentials: true,
    });

    socketRef.current.on('connect', () => {
      socketRef.current?.emit('user_join', username);
    });

    socketRef.current.on('chat_message', (message) => {
      setChatMessages(prev => {
        // If it's our own image message being echoed back by the server
        if (message.type === 'image' && message.username === username) {
          // Try to find a pending loading image message sent by 'me' with the same image data
          const existingLoadingImageIndex = prev.findIndex(msg =>
            msg.sender === 'me' &&
            msg.type === 'image' &&
            msg.imageStatus === 'loading' &&
            msg.imageUrl === message.content // Match by image data (base64 string)
          );

          if (existingLoadingImageIndex !== -1) {
            // Update the existing loading message with the server's confirmed details
            return prev.map((msg, index) =>
              index === existingLoadingImageIndex
                ? {
                    ...msg,
                    id: message.id || msg.id, // Use server ID, fallback to client temp ID
                    imageStatus: 'success',
                    progress: 100,
                    timestamp: new Date(message.timestamp)
                  }
                : msg
            );
          }
        }
        
        // If not our own image update, or no matching loading message found, add as new
        const newMessage: Message = {
          id: message.id || Date.now().toString(),
          sender: message.type === 'system' ? 'system' : message.username === username ? 'me' : 'other',
          username: message.username || '',
          text: message.content,
          timestamp: new Date(message.timestamp),
          type: message.type === 'image' ? 'image' : message.type === 'system' ? 'system' : message.content.length <= 2 ? 'emoji' : 'message',
          avatar: message.username === username ? '👤' : ['🎬', '🍿', '🎭', '🎥', '🎪'][Math.floor(Math.random() * 5)],
          imageUrl: message.type === 'image' ? message.content : undefined,
        };
        return [...prev, newMessage];
      });
    });

    socketRef.current.on('user_join', (username: string) => {
      const systemJoinMessage: Message = {
        id: Date.now().toString(),
        sender: 'system',
        username: '', // System messages don't have a username display
        text: `${username} đã tham gia phòng chat`,
        timestamp: new Date(),
        type: 'system',
      };
      setChatMessages((prev) => [...prev, systemJoinMessage]);
    });

    socketRef.current.on('user_leave', (username: string) => {
      const systemLeaveMessage: Message = {
        id: Date.now().toString(),
        sender: 'system',
        username: '', // System messages don't have a username display
        text: `${username} đã rời phòng chat`,
        timestamp: new Date(),
        type: 'system',
      };
      setChatMessages((prev) => [...prev, systemLeaveMessage]);
    });

    socketRef.current.on('user_list', (users: string[]) => {
      setOnlineUsers(users.length);
    });

    socketRef.current.on('disconnect', () => {
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [username]);

  // Update username when user changes
  useEffect(() => {
    if (user?.name) {
      setUsername(user.name);
    }
  }, [user]);

  // Tự động cuộn khi có tin nhắn mới
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    }

    // Save messages to sessionStorage whenever they change
    sessionStorage.setItem('chatMessages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Simulate live stream stats
  useEffect(() => {
    const interval = setInterval(() => {
      setStreamMovie((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          id: prev.id,
          title: prev.title,
          viewers: Math.max(0, (prev.viewers ?? 0) + Math.floor(Math.random() * 10) - 5),
          likes: Math.max(0, (prev.likes ?? 0) + Math.floor(Math.random() * 2)),
          description: prev.description,
          streamUrl: prev.streamUrl,
        };
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Monitor network status
  useEffect(() => {
    const checkNetworkStatus = () => {
      if ('connection' in navigator && navigator.connection) {
        const connection = navigator.connection;
        if (connection.effectiveType === '4g') {
          setNetworkStatus('good');
        } else if (connection.effectiveType === '3g') {
          setNetworkStatus('slow');
        } else {
          setNetworkStatus('poor');
        }
      }
    };

    checkNetworkStatus();
    window.addEventListener('online', checkNetworkStatus);
    window.addEventListener('offline', () => setNetworkStatus('poor'));

    return () => {
      window.removeEventListener('online', checkNetworkStatus);
      window.removeEventListener('offline', () => setNetworkStatus('poor'));
    };
  }, []);

  // Add network status message
  useEffect(() => {
    if (networkStatus !== 'good') {
      const networkMessage: Message = {
        id: Date.now().toString(),
        sender: 'system',
        username: '',
        text: networkStatus === 'slow' 
          ? 'Mạng chậm, có thể ảnh hưởng đến việc gửi tin nhắn và hình ảnh' 
          : 'Kết nối mạng yếu, vui lòng kiểm tra lại kết nối',
        timestamp: new Date(),
        type: 'system',
        networkStatus: networkStatus
      };
      setChatMessages(prev => [...prev, networkMessage]);
    }
  }, [networkStatus]);

  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      try {
        // Lấy một phim popular làm demo stream
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&page=1`
        );
        const movie = response.data.results[0];
        setStreamMovie({
          id: movie.id,
          title: movie.title,
          description: movie.overview,
          streamUrl: `https://vidsrc.icu/embed/movie/${movie.id}`,
          viewers: Math.floor(Math.random() * 2000) + 100, // random viewers
          likes: Math.floor(Math.random() * 500) + 50, // random likes
          poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
        });
      } catch (error) {
        console.error(error);
        setStreamMovie(null);
      }
      setLoading(false);
    };
    fetchMovie();
  }, [API_KEY]);

  const handleSendMessage = () => {
    if (newMessage.trim() && socketRef.current) {
      socketRef.current.emit('chat_message', newMessage);
      setNewMessage('');
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && socketRef.current) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File quá lớn. Vui lòng chọn file nhỏ hơn 10MB.');
        return;
      }

      const tempMessageId = Date.now().toString(); // Generate unique ID for this message early

      // Add a placeholder message immediately
      setChatMessages(prev => [...prev, {
        id: tempMessageId,
        sender: 'me',
        username: username,
        text: 'Đang tải ảnh...',
        timestamp: new Date(),
        type: 'image',
        imageStatus: 'loading',
        avatar: '👤',
        progress: 0 // Initialize progress
      }]);

      try {
        const options = {
          maxSizeMB: 1,
          useWebWorker: true,
          onProgress: (progress: number) => {
            // Update the specific message's progress
            setChatMessages(prev => prev.map(msg =>
              msg.id === tempMessageId
                ? { ...msg, progress: progress }
                : msg
            ));
          }
        };

        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const imageData = e.target?.result as string;

          // Update the message to include imageUrl now that it's available
          setChatMessages(prev => prev.map(msg =>
            msg.id === tempMessageId
              ? { ...msg, imageUrl: imageData }
              : msg
          ));

          socketRef.current?.emit('image_message', imageData, (response: { success: boolean }) => {
            if (!response.success) { // Only handle explicit failure from server
              setChatMessages(prev => prev.map(msg =>
                msg.id === tempMessageId
                  ? { ...msg, imageStatus: 'error', text: 'Không thể tải ảnh lên (server rejected)', progress: 0 }
                  : msg
              ));
              console.error('Server rejected image upload for ID:', tempMessageId);
            }
            // DO NOT set to success here. Let the broadcast handle it.
          });
        };

        reader.onerror = () => {
          setChatMessages(prev => prev.map(msg =>
            msg.id === tempMessageId
              ? { ...msg, imageStatus: 'error', text: 'Lỗi khi đọc file ảnh', progress: 0 }
              : msg
          ));
        };

        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Lỗi khi nén hình ảnh:', error);
        setChatMessages(prev => prev.map(msg =>
          msg.id === tempMessageId
            ? { ...msg, imageStatus: 'error', text: 'Không thể nén hình ảnh', progress: 0 }
            : msg
        ));
      }
    }
  };

  const handleUsernameChange = () => {
    if (tempUsername.trim()) {
      setUsername(tempUsername.trim());
      socketRef.current?.emit('user_join', tempUsername.trim());
      setIsEditingUsername(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && videoContainerRef.current) {
      videoContainerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (date: Date) => {
    // Ensure date is a Date object, though it should be after parsing from sessionStorage
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { useGrouping: true }).format(num);
  };

  return (
    <RequireAdmin>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex flex-col">
        {/* Header Stats */}
        {!isFullscreen && !isNavDropdownOpen && (
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
                    <span className="text-sm">{formatNumber(streamMovie?.viewers ?? 0)} viewers</span>
                  </div>
                  <div className="flex items-center gap-2 text-pink-400">
                    <Heart className="h-4 w-4" />
                    <span className="text-sm">{formatNumber(streamMovie?.likes ?? 0)} likes</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{onlineUsers} online</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow flex flex-col py-6">
          {/* Title */}
          {!isFullscreen && (
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-xl sm:text-2xl md:text-4xl font-bold text-center bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent mb-6 drop-shadow-2xl"
            >
              {streamMovie?.title}
            </motion.h1>
          )}

          <div className={`flex-grow flex flex-col ${isMobileLandscape ? 'relative landscape:flex-row landscape:flex-grow landscape:max-h-[calc(100vh-6rem)]' : 'lg:flex-row'} gap-6`}>
            {/* Main Content */}
            <div className={`${isMobileLandscape || isFullscreen ? 'w-full h-full landscape:flex-grow' : 'lg:w-2/3'} flex flex-col gap-6`}>
              {/* Main Video */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                ref={videoContainerRef}
                className={`relative ${isMobileLandscape || isFullscreen ? 'h-full' : 'aspect-video'} w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-yellow-600/50 bg-gray-900 hover:border-yellow-500/70 transition-all duration-300`}
              >
                {loading ? (
                  <div className="flex-grow flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-gray-400">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <iframe
                    src={streamMovie?.streamUrl}
                    title={streamMovie?.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full"
                  />
                )}
                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                  LIVE
                </div>
                {/* Fullscreen Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleFullscreen}
                  className="absolute top-4 right-4 p-2 bg-gray-700/50 hover:bg-gray-600/50 text-yellow-400 rounded-xl transition-all duration-200 border border-yellow-500/20 hover:border-yellow-500/40 shadow-lg"
                >
                  {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </motion.button>
              </motion.div>

              {/* Camera & Screen Share */}
              {!isFullscreen && !isMobileLandscape && (
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
              )}
            </div>

            {/* Chat Sidebar */}
            {!isFullscreen && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className={isMobileLandscape ? `fixed inset-y-0 right-0 w-full h-full bg-gradient-to-b from-gray-900/95 to-black/95 backdrop-blur-xl rounded-l-none shadow-2xl transition-transform duration-300 transform landscape:w-full landscape:max-w-[80%] landscape:h-full landscape:inset-y-0 landscape:left-auto landscape:right-0 ${isChatVisible ? 'translate-x-0' : 'translate-x-full'}` : (isChatVisible ? 'lg:w-1/2 flex flex-col h-[calc(100vh-12rem)] lg:h-[calc(100vh-8rem)] bg-gradient-to-b from-gray-900/95 to-black/95 backdrop-blur-xl rounded-2xl border border-yellow-500/20 shadow-2xl' : 'hidden')}
              >
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-500/10 backdrop-blur-lg p-3 sm:p-4 rounded-t-2xl border-b border-yellow-500/30">
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-bold text-yellow-300 flex items-center gap-1 sm:gap-2">
                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    Live Chat
                  </h2>
                  <div className="flex items-center gap-2 sm:gap-3">
                    {isEditingUsername ? (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <input
                          type="text"
                          value={tempUsername}
                          onChange={(e) => setTempUsername(e.target.value)}
                          placeholder="New username"
                          className="px-2 py-1 bg-gray-800/80 rounded-md text-xs sm:text-sm text-white border border-yellow-500/30 focus:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/30"
                          onKeyDown={(e) => e.key === 'Enter' && handleUsernameChange()}
                        />
                        <button
                          onClick={handleUsernameChange}
                          className="px-2 py-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-md text-xs sm:text-sm font-medium hover:from-yellow-400 hover:to-yellow-500 transition-all duration-200 shadow-lg shadow-yellow-500/20"
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
                        className="text-xs sm:text-sm text-yellow-300 hover:text-yellow-200 transition-colors duration-200 flex items-center gap-1 sm:gap-2"
                      >
                        <User className="h-3 w-3 sm:h-4 sm:w-4" />
                        {username}
                      </button>
                    )}
                    <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-400">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
                      {chatMessages.length} messages
                    </div>
                  </div>
                </div>
              </div>
            
              {/* Chat Messages */}
              <div
                ref={chatContainerRef}
                className="flex-grow overflow-y-auto p-3 sm:p-4 space-y-1.5 sm:space-y-2 scrollbar-hide hover:scrollbar-default relative"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                <AnimatePresence>
                  {chatMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className={`flex items-start ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} ${msg.type === 'system' ? 'text-center' : ''} ${showEmojiPicker && msg.type === 'system' ? 'hidden' : ''}`}
                    >
                      {msg.type === 'system' ? (
                        <div className="relative w-full text-center text-white text-xs py-2">
                          <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-500" />
                          <span className="relative z-10 px-2 bg-gray-900 rounded-xl py-1">{msg.text}</span>
                        </div>
                      ) : (
                        <>
                          {msg.sender !== 'me' && (
                            <div className="flex-shrink-0">
                              <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-xs sm:text-sm shadow-lg shadow-yellow-500/20 ring-2 ring-yellow-500/20">
                                {msg.avatar}
                              </div>
                            </div>
                          )}
          
                          <div className={`max-w-[75%] ${msg.sender === 'me' ? 'order-2' : ''}`}>
                            {msg.sender !== 'me' && (
                              <div className="flex items-center gap-0.5 mb-0.5">
                                <span className={`text-xs font-semibold ${msg.isVip ? 'text-yellow-400' : 'text-gray-300'}`}>
                                  {msg.username}
                                  {msg.isVip && <span className="text-yellow-400 ml-0.5">⭐</span>}
                                </span>
                                <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                              </div>
                            )}
          
                            <div
                              className={`rounded-xl px-2 py-1.5 ${
                                msg.sender === 'me'
                                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-md shadow-yellow-500/20 ring-1 ring-yellow-500/30'
                                  : msg.type === 'emoji'
                                  ? 'bg-transparent text-xl sm:text-2xl'
                                  : 'bg-gradient-to-r from-gray-800/80 to-gray-700/80 text-white shadow-md backdrop-blur-sm ring-1 ring-gray-500/30'
                              } ${msg.type === 'emoji' ? 'text-center' : ''}`}
                            >
                              {msg.type === 'image' && (msg.imageUrl || msg.imageStatus === 'loading' || msg.imageStatus === 'error') ? (
                                <div className="relative">
                                  {msg.imageUrl && (
                                    <Image
                                      src={msg.imageUrl}
                                      alt="Shared image in chat"
                                      width={120}
                                      height={90}
                                      className="max-w-full h-auto rounded-lg object-contain shadow-md ring-1 ring-gray-500/30"
                                      sizes="(max-width: 768px) 100vw, 33vw"
                                    />
                                  )}
                                  {(msg.imageStatus === 'loading' && msg.progress !== undefined && msg.progress < 100) && (
                                    <div className="absolute inset-0 bg-gray-900/70 rounded-lg flex items-center justify-center">
                                      <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-xs text-gray-400">{Math.round(msg.progress || 0)}%</span>
                                      </div>
                                    </div>
                                  )}
                                  {msg.imageStatus === 'error' && (
                                    <div className="absolute inset-0 bg-red-900/70 rounded-lg flex items-center justify-center">
                                      <div className="flex flex-col items-center gap-1">
                                        <span className="text-red-500">⚠️</span>
                                        <span className="text-xs text-red-400">{msg.text || 'Lỗi tải ảnh'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {(!msg.imageUrl && msg.imageStatus === 'loading') && (
                                    <div className="w-[120px] h-[90px] bg-gray-700/50 rounded-lg flex items-center justify-center">
                                      <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-xs text-gray-400">{Math.round(msg.progress || 0)}%</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className={`${msg.type === 'emoji' ? 'text-base sm:text-xl' : 'text-xs'} break-words`}>
                                  {msg.text}
                                  {msg.networkStatus && (
                                    <span className={`ml-1 text-xs ${
                                      msg.networkStatus === 'slow' ? 'text-yellow-500' : 'text-red-500'
                                    }`}>
                                      {msg.networkStatus === 'slow' ? '⚠️' : '❌'}
                                    </span>
                                  )}
                                </p>
                              )}
                              {msg.sender === 'me' && (
                                <div className="text-right text-xs text-black/70 mt-0.5">{formatTime(msg.timestamp)}</div>
                              )}
                            </div>
                          </div>
          
                          {msg.sender === 'me' && (
                            <div className="flex-shrink-0 order-3">
                              <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs sm:text-sm shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/20">
                                {msg.avatar}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={chatEndRef} />
              </div>
            
              {/* Chat Input */}
              <div className="bg-gradient-to-r from-gray-900/95 to-black/95 backdrop-blur-lg p-3 sm:p-4 rounded-b-2xl border-t border-yellow-500/20">
                <div className="flex flex-col gap-2">
                  <textarea
                    rows={2}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full px-3 py-2 bg-gray-800/80 rounded-xl border border-yellow-500/20 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/40 text-white placeholder-gray-400 text-xs resize-none transition-all duration-300 backdrop-blur-sm shadow-md ring-1 ring-yellow-500/10 hover:border-yellow-500/40 hover:shadow-yellow-500/5 scrollbar-hide"
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
          
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="emoji-button p-1.5 bg-gray-700/50 hover:bg-gray-600/50 text-yellow-400 rounded-lg transition-all duration-200 flex items-center justify-center border border-yellow-500/20 hover:border-yellow-500/40 shadow-md ring-1 ring-yellow-500/10 hover:shadow-yellow-500/10"
                      >
                        <Smile className="h-3 w-3" />
                      </motion.button>
          
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 bg-gray-700/50 hover:bg-gray-600/50 text-yellow-400 rounded-lg transition-all duration-200 flex items-center justify-center border border-yellow-500/20 hover:border-yellow-500/40 shadow-md ring-1 ring-yellow-500/10 hover:shadow-yellow-500/10"
                      >
                        <LucideImage className="h-3 w-3" />
                      </motion.button>
                    </div>
          
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="px-2 py-1 bg-gradient-to-r from-yellow-500/90 to-yellow-600/90 hover:from-yellow-400/90 hover:to-yellow-500/90 disabled:from-gray-600/50 disabled:to-gray-700/50 disabled:cursor-not-allowed text-black/90 font-medium rounded-lg transition-all duration-300 shadow-md shadow-yellow-500/10 flex items-center gap-1 ring-1 ring-yellow-500/20 hover:shadow-yellow-500/20 disabled:shadow-none text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">Send</span>
                      <Send className="h-3 w-3" />
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
                      className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800/95 rounded-xl p-3 sm:p-4 border border-yellow-500/20 shadow-xl z-10 backdrop-blur-xl ring-1 ring-yellow-500/20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Emoji Categories */}
                      <div className="flex gap-1 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                        {emojiCategories.map((category) => (
                          <motion.button
                            key={category.name}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setSelectedEmojiCategory(category.name)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm transition-all duration-200 ${
                              selectedEmojiCategory === category.name
                                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-transparent'
                            }`}
                          >
                            <span>{category.icon}</span>
                            <span className="hidden sm:inline">{category.name}</span>
                          </motion.button>
                        ))}
                      </div>

                      {/* Emoji Grid */}
                      <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 sm:gap-2 max-h-[200px] overflow-y-auto scrollbar-hide hover:scrollbar-default pr-1">
                        {quickEmojis
                          .filter((emoji) => emoji.category === selectedEmojiCategory)
                          .map((emoji) => (
                            <motion.button
                              key={emoji.name}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEmojiClick(emoji.emoji)}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-700/80 hover:bg-gray-600/80 flex items-center justify-center text-lg transition-all duration-200 border border-yellow-500/20 hover:border-yellow-500/40 ring-1 ring-yellow-500/10 hover:shadow-md hover:shadow-yellow-500/10"
                              title={emoji.name}
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
            )}

            {/* Floating Chat Button for Mobile Landscape */}
            {isMobileLandscape && !isFullscreen && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsChatVisible(!isChatVisible)}
                className="fixed bottom-3 right-3 p-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-full shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all duration-200 z-50"
              >
                <MessageCircle className="h-5 w-5" />
              </motion.button>
            )}
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
    </RequireAdmin>
  );
}