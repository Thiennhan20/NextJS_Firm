'use client';

import { useState, useEffect } from 'react';
import { Plus, Hash, Lock, Unlock, ArrowRight, Video } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Particle {
  x: number;
  y: number;
  size: number;
  duration: number;
}

export default function StreamingLobby() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxViewers, setMaxViewers] = useState(10);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 150 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 0.5,
      duration: Math.random() * 30 + 5,
    }));
    setParticles(newParticles);
  }, []);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const roomId = `room-${Date.now()}`;
      alert(`Room created successfully! Room ID: ${roomId}`);
      
      setShowCreateForm(false);
      setNewRoomName('');
      setIsPrivate(false);
      setMaxViewers(10);
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinById = () => {
    if (joinRoomId.trim()) {
      alert(`Joining room: ${joinRoomId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center px-4 py-6 relative overflow-hidden">
      {/* Background Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full ${
              i % 6 === 0 ? 'bg-yellow-400/50' :
              i % 6 === 1 ? 'bg-purple-400/45' :
              i % 6 === 2 ? 'bg-blue-400/40' :
              i % 6 === 3 ? 'bg-pink-400/35' :
              i % 6 === 4 ? 'bg-green-400/30' :
              'bg-orange-400/25'
            }`}
            animate={{
              x: [0, Math.random() * 60 - 30, 0],
              y: [0, Math.random() * -60 - 15, 0],
              scale: [1, Math.random() * 1.2 + 1.3, 1],
              opacity: [0.2, 0.9, 0.2],
            }}
            transition={{ 
              duration: p.duration, 
              repeat: Infinity, 
              repeatType: "reverse",
              ease: "easeInOut"
            }}
            style={{ 
              left: `${p.x}%`, 
              top: `${p.y}%`, 
              width: p.size, 
              height: p.size 
            }}
          />
        ))}
      </div>

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        {/* Compact Header */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Left - Live Stats */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <h3 className="text-sm font-semibold text-yellow-300">Live</h3>
            </div>
            <div className="flex justify-between text-xs">
              <div className="text-center">
                <div className="text-lg font-bold text-white">24</div>
                <div className="text-gray-400">Rooms</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">156</div>
                <div className="text-gray-400">Users</div>
              </div>
            </div>
          </div>

          {/* Right - Quick Access */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <h3 className="text-sm font-semibold text-purple-300">Activity</h3>
            </div>
            <div className="flex justify-between text-xs">
              <div className="text-center">
                <div className="text-lg font-bold text-white">12</div>
                <div className="text-gray-400">New</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">89</div>
                <div className="text-gray-400">Messages</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Always 2 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Join Room Column */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Hash className="h-4 w-4 text-yellow-400" />
              <h2 className="text-lg font-bold text-yellow-300">Join Room</h2>
            </div>
            
            <div className="space-y-3">
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="Enter room ID..."
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all duration-300"
              />
              
              <button
                onClick={handleJoinById}
                disabled={!joinRoomId.trim()}
                className="w-full px-3 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 text-sm"
              >
                <ArrowRight className="h-4 w-4" />
                Join
              </button>
            </div>
          </div>
          
          {/* Create Room Column */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="h-4 w-4 text-yellow-400" />
              <h2 className="text-lg font-bold text-yellow-300">Create Room</h2>
            </div>
            
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full px-3 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-all duration-300 flex items-center justify-center gap-2 text-sm"
              >
                <Plus className="h-4 w-4" />
                Create New Room
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Room name..."
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all duration-300"
                />
                
                <div className="flex gap-2">
                  <select
                    value={maxViewers}
                    onChange={(e) => setMaxViewers(Number(e.target.value))}
                    className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all duration-300"
                  >
                    <option value={5}>5 people</option>
                    <option value={10}>10 people</option>
                    <option value={15}>15 people</option>
                    <option value={20}>20 people</option>
                  </select>
                  
                  <div className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      id="isPrivate"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="w-3 h-3 text-yellow-500 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500/50"
                    />
                    <label htmlFor="isPrivate" className="text-xs text-gray-300 flex items-center gap-1">
                      {isPrivate ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                      Private
                    </label>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateRoom}
                    disabled={!newRoomName.trim() || loading}
                    className="flex-1 px-3 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-1 text-sm"
                  >
                    {loading ? (
                      <>
                        <div className="w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3" />
                        Create
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewRoomName('');
                      setIsPrivate(false);
                      setMaxViewers(10);
                    }}
                    className="px-3 py-2 bg-gray-700 text-gray-300 font-semibold rounded-lg hover:bg-gray-600 transition-all duration-300 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compact Go to Streaming Room Button */}
        <div className="mt-6 text-center">
          <Link href="/streaming-room">
            <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-lg hover:from-purple-400 hover:to-purple-500 transition-all duration-300 flex items-center gap-2 mx-auto text-sm">
              <Video className="h-4 w-4" />
              Go to Streaming Room
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}