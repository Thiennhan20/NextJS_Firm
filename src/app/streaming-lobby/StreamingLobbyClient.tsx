'use client';

import { useState, useEffect, Suspense } from 'react';
import { Plus, Hash, ArrowRight, Radio, Copy, Check, LogIn, Film, Tv, Clock, Users, Trash2, RefreshCw, AlertTriangle, X } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import useAuthStore from '@/store/useAuthStore';
import api from '@/lib/axios';
import { useTranslations } from 'next-intl';

interface Particle {
  x: number;
  y: number;
  size: number;
  duration: number;
}

function StreamingLobbyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const t = useTranslations('StreamingLobby');

  // Pre-filled params from Stream button
  const streamUrlFromParams = searchParams.get('streamUrl') || '';
  const titleFromParams = searchParams.get('title') || '';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _movieIdFromParams = searchParams.get('movieId') || '';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _posterFromParams = searchParams.get('poster') || '';
  const typeFromParams = searchParams.get('type') || 'movie'; // 'movie' | 'tvshow'
  const seasonFromParams = searchParams.get('season') || '';
  const episodeFromParams = searchParams.get('episode') || '';

  // State
  const [joinRoomId, setJoinRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [copied, setCopied] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [deleteConfirmRoomId, setDeleteConfirmRoomId] = useState<string | null>(null);
  const [createdRoom, setCreatedRoom] = useState<{
    roomId: string;
    title: string;
    streamUrl: string;
    hostName: string;
    expiresAt: string;
  } | null>(null);

  // Has stream info from player
  const hasStreamInfo = !!streamUrlFromParams;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (user as any)?.id || (user as any)?._id || '';

  // Active rooms list
  interface ActiveRoom {
    room_id: string;
    title: string;
    host_id: string;
    host_name: string;
    host_avatar: string;
    status: string;
    member_count: number;
    max_users: number;
    created_at: number;
    ttl_seconds: number;
  }
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  const [maxRooms, setMaxRooms] = useState(30);

  useEffect(() => {
    const newParticles = Array.from({ length: 100 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 0.5,
      duration: Math.random() * 25 + 8,
    }));
    setParticles(newParticles);
  }, []);

  // Auth check helper — shows popup if not authenticated, returns false
  const requireAuth = (): boolean => {
    if (!isAuthenticated) {
      setShowAuthPopup(true);
      return false;
    }
    return true;
  };

  // Fetch active rooms (public API — no auth needed)
  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await api.get('/rooms/public');
      setActiveRooms(res.data.rooms || []);
      if (res.data.max_rooms) setMaxRooms(res.data.max_rooms);
    } catch {
      console.error('Failed to fetch rooms');
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleDeleteRoom = async () => {
    const roomId = deleteConfirmRoomId;
    if (!roomId) return;
    setDeleteConfirmRoomId(null);
    setDeletingRoomId(roomId);
    try {
      await api.delete(`/rooms/${roomId}`);
      setActiveRooms(prev => prev.filter(r => r.room_id !== roomId));
      if (createdRoom?.roomId === roomId) setCreatedRoom(null);
    } catch {
      setError('Failed to delete room. Please try again.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setDeletingRoomId(null);
    }
  };

  const formatTimeLeft = (ttlSeconds: number) => {
    const h = Math.floor(ttlSeconds / 3600);
    const m = Math.floor((ttlSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // Generate deterministic gradient color for host avatar based on host_id
  const getAvatarGradient = (id: string) => {
    const gradients = [
      'from-rose-500 to-pink-500',
      'from-violet-500 to-purple-500',
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500',
      'from-amber-500 to-orange-500',
      'from-red-500 to-rose-500',
      'from-indigo-500 to-blue-500',
      'from-fuchsia-500 to-pink-500',
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return gradients[Math.abs(hash) % gradients.length];
  };

  const handleCreateRoom = async () => {
    if (!requireAuth()) return;
    if (!streamUrlFromParams) return;

    setLoading(true);
    setError('');
    try {
      const response = await api.post('/rooms', {
        title: titleFromParams,
        stream_url: streamUrlFromParams,
      });

      const { room_id, expires_at } = response.data;

      setCreatedRoom({
        roomId: room_id,
        title: titleFromParams,
        streamUrl: streamUrlFromParams,
        hostName: user?.name || 'Host',
        expiresAt: new Date(expires_at).toISOString(),
      });
    } catch (err: unknown) {
      console.error('Error creating room:', err);
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr?.response?.data?.error || 'Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinById = () => {
    if (!requireAuth()) return;
    if (joinRoomId.trim()) {
      router.push(`/streaming-room?room=${joinRoomId.trim()}`);
    }
  };

  const handleGoToRoom = () => {
    if (createdRoom) {
      const params = new URLSearchParams({
        room: createdRoom.roomId,
        streamUrl: createdRoom.streamUrl,
        title: createdRoom.title,
      });
      router.push(`/streaming-room?${params.toString()}`);
    }
  };

  const handleCopyInvite = () => {
    if (createdRoom) {
      const inviteUrl = `${window.location.origin}/streaming-room?room=${createdRoom.roomId}`;
      navigator.clipboard.writeText(inviteUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex justify-center px-4 py-6 relative overflow-y-auto">
      {/* Background Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full ${
              i % 5 === 0 ? 'bg-yellow-400/40' :
              i % 5 === 1 ? 'bg-purple-400/35' :
              i % 5 === 2 ? 'bg-blue-400/30' :
              i % 5 === 3 ? 'bg-pink-400/25' :
              'bg-green-400/20'
            }`}
            animate={{
              x: [0, Math.random() * 50 - 25, 0],
              y: [0, Math.random() * -50 - 10, 0],
              scale: [1, Math.random() * 1.2 + 1.2, 1],
              opacity: [0.15, 0.7, 0.15],
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

      {/* Glow Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent mb-2">
            {t('title')}
          </h1>
          <p className="text-sm text-gray-400">{t('subtitle')}</p>
        </motion.div>

        {/* Room Created Card */}
        <AnimatePresence>
          {createdRoom && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="mb-6 bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-xl p-5 border border-yellow-500/30 shadow-2xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <h2 className="text-lg font-bold text-green-300">{t('roomCreatedSuccessfully')}</h2>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-5">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-gray-400 text-xs">{t('roomId')}</span>
                  <p className="text-yellow-300 font-mono font-bold text-base">{createdRoom.roomId}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-gray-400 text-xs">{t('host')}</span>
                  <p className="text-white font-semibold truncate">{createdRoom.hostName}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 col-span-2">
                  <span className="text-gray-400 text-xs">{t('movie')}</span>
                  <p className="text-white font-semibold truncate">{createdRoom.title}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-gray-400 text-xs">{t('status')}</span>
                  <p className="text-blue-300 font-semibold">{t('waiting')}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-gray-400 text-xs flex items-center gap-1"><Clock className="h-3 w-3" /> {t('expires')}</span>
                  <p className="text-gray-300 font-semibold">6 hours</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleGoToRoom}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-semibold rounded-lg hover:from-yellow-400 hover:to-amber-400 transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-lg shadow-yellow-500/20"
                >
                  <Radio className="h-4 w-4" />
                  {t('enterRoom')}
                </button>
                <button
                  onClick={handleCopyInvite}
                  className="px-4 py-2.5 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-all duration-300 flex items-center justify-center gap-2 text-sm border border-gray-600"
                >
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  {copied ? t('copied') : t('copyInvite')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Create Room */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-5 border border-gray-700/50 hover:border-yellow-500/30 transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/15 flex items-center justify-center">
                <Plus className="h-4 w-4 text-yellow-400" />
              </div>
              <h2 className="text-lg font-bold text-yellow-300">{t('createRoom')}</h2>
            </div>

            {hasStreamInfo ? (
              <div className="space-y-3">
                {/* Stream info preview */}
                <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    {typeFromParams === 'tvshow' ? (
                      <Tv className="h-4 w-4 text-blue-400" />
                    ) : (
                      <Film className="h-4 w-4 text-purple-400" />
                    )}
                    <span className="text-xs text-gray-400 uppercase tracking-wide">
                      {typeFromParams === 'tvshow' ? 'TV Show' : 'Movie'}
                    </span>
                  </div>
                  <p className="text-sm text-white font-medium truncate" title={titleFromParams}>
                    {titleFromParams}
                  </p>
                  {typeFromParams === 'tvshow' && seasonFromParams && episodeFromParams && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Season {seasonFromParams} • Episode {episodeFromParams}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                    <span className="text-xs text-green-400">{t('streamReady')}</span>
                  </div>
                </div>

                <button
                  onClick={handleCreateRoom}
                  disabled={loading || !!createdRoom || activeRooms.length >= maxRooms}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-semibold rounded-lg hover:from-yellow-400 hover:to-amber-400 disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-lg shadow-yellow-500/20 disabled:shadow-none"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/50 border-t-transparent rounded-full animate-spin" />
                      {t('creating')}
                    </>
                  ) : createdRoom ? (
                    <>
                      <Check className="h-4 w-4" />
                      {t('roomCreated')}
                    </>
                  ) : activeRooms.length >= maxRooms ? (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      {t('serverFullWait')}
                    </>
                  ) : (
                    <>
                      <Radio className="h-4 w-4" />
                      {t('createWatchParty')}
                    </>
                  )}
                </button>

                {activeRooms.length >= maxRooms && (
                  <p className="text-xs text-amber-400 bg-amber-900/20 border border-amber-500/20 rounded-lg px-3 py-2 flex items-center gap-1.5">
                    <Clock className="h-3 w-3 shrink-0" />
                    {t('serverFullCap', { current: activeRooms.length, max: maxRooms })}
                  </p>
                )}

                {/* Error message */}
                {error && (
                  <p className="text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-700/50 flex items-center justify-center">
                  <Film className="h-6 w-6 text-gray-500" />
                </div>
                <p className="text-sm text-gray-400 mb-1">{t('noStreamSelected')}</p>
                <p className="text-xs text-gray-500">
                  {t('goMovieOrTv')} <span className="text-yellow-400 font-medium">{t('streamBtn')}</span> {t('btnStr')}
                </p>
              </div>
            )}
          </motion.div>

          {/* Join Room */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-5 border border-gray-700/50 hover:border-yellow-500/30 transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <Hash className="h-4 w-4 text-purple-400" />
              </div>
              <h2 className="text-lg font-bold text-purple-300">{t('joinRoom')}</h2>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                placeholder={t('enterRoomIdPlaceholder')}
                className="w-full px-3.5 py-2.5 bg-gray-900/60 border border-gray-600/50 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all duration-300 font-mono"
                onKeyDown={(e) => e.key === 'Enter' && handleJoinById()}
              />

              <button
                onClick={handleJoinById}
                disabled={!joinRoomId.trim()}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-lg shadow-purple-500/10 disabled:shadow-none"
              >
                <ArrowRight className="h-4 w-4" />
                {t('joinRoom')}
              </button>

              <p className="text-xs text-gray-500 text-center">
                {t('askHostJoin')}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
              {t('maxPerRoom')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t('hourSessions')}
            </span>
            <span className="flex items-center gap-1">
              <Radio className="h-3 w-3" />
              {t('hlsStreaming')}
            </span>
          </div>
        </motion.div>

        {/* ─── Active Rooms List ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6 w-full"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="h-4 w-4 text-yellow-400" />
              {t('activeRooms')}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeRooms.length >= maxRooms
                  ? 'bg-red-500/20 text-red-400'
                  : activeRooms.length >= maxRooms * 0.8
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-yellow-500/20 text-yellow-400'
              }`}>{activeRooms.length}/{maxRooms}</span>
            </h2>
            <button
              onClick={fetchRooms}
              disabled={loadingRooms}
              className="p-1.5 text-gray-500 hover:text-yellow-400 transition-colors rounded-lg hover:bg-gray-800"
              title="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingRooms ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingRooms && activeRooms.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-500">{t('loadingRooms')}</p>
            </div>
          ) : activeRooms.length === 0 ? (
            <div className="text-center py-6 bg-gray-800/30 rounded-xl border border-gray-700/30">
              <Radio className="h-6 w-6 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">{t('noActiveRooms')}</p>
              <p className="text-xs text-gray-600 mt-0.5">{t('createRoomStart')}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto chat-scrollbar pr-1">
              {activeRooms.map((room) => (
                <motion.div
                  key={room.room_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gray-800/40 backdrop-blur-sm rounded-lg p-3 border border-gray-700/40 hover:border-yellow-500/20 transition-all group"
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Host Avatar */}
                    {room.host_avatar ? (
                      <Image
                        src={room.host_avatar}
                        alt={room.host_name}
                        width={36}
                        height={36}
                        unoptimized
                        className="w-9 h-9 rounded-full object-cover shrink-0 shadow-md border border-gray-600/50"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                      />
                    ) : null}
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarGradient(room.host_id)} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-md ${room.host_avatar ? 'hidden' : ''}`}>
                      {room.host_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>

                    <div className="min-w-0 flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-yellow-300">#{room.room_id}</span>
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
                          room.status === 'PLAYING' ? 'bg-green-500/20 text-green-400' :
                          room.status === 'PAUSED' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {room.status}
                        </span>
                      </div>
                      <p className="text-sm text-white font-medium truncate">{room.title || t('untitledRoom')}</p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                        <span>{t('host')}: <span className="text-gray-400">{room.host_name}</span></span>
                        <span className="flex items-center gap-0.5">
                          <Users className="h-3 w-3" />
                          {room.member_count}/{room.max_users}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {formatTimeLeft(room.ttl_seconds)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {userId === room.host_id && (
                        <button
                          onClick={() => setDeleteConfirmRoomId(room.room_id)}
                          disabled={deletingRoomId === room.room_id}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all text-xs"
                          title="Delete room"
                        >
                          <Trash2 className={`h-3.5 w-3.5 ${deletingRoomId === room.room_id ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (!requireAuth()) return;
                          router.push(`/streaming-room?room=${room.room_id}`);
                        }}
                        disabled={room.member_count >= room.max_users && userId !== room.host_id}
                        className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs font-semibold rounded-lg hover:from-yellow-400 hover:to-amber-400 disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400 transition-all shadow-sm"
                      >
                        {room.member_count >= room.max_users && userId !== room.host_id ? t('full') : t('join')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      {/* Auth Required Popup */}
      <AnimatePresence>
        {showAuthPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setShowAuthPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative bg-gray-800/95 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/60 shadow-2xl max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowAuthPopup(false)}
                className="absolute top-3 right-3 p-1 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-gray-700/50"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 flex items-center justify-center">
                <LogIn className="h-7 w-7 text-yellow-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{t('signInRequired')}</h3>
              <p className="text-sm text-gray-400 mb-5">
                {t('pleaseSignIn')}
              </p>
              <div className="flex gap-2.5 justify-center">
                <button
                  onClick={() => router.push('/login')}
                  className="px-5 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-semibold rounded-lg hover:from-yellow-400 hover:to-amber-400 transition-all text-sm shadow-lg shadow-yellow-500/20"
                >
                  {t('signIn')}
                </button>
                <button
                  onClick={() => setShowAuthPopup(false)}
                  className="px-5 py-2 bg-gray-700 text-gray-300 font-semibold rounded-lg hover:bg-gray-600 transition-all text-sm border border-gray-600"
                >
                  {t('cancel')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Room Confirm Popup */}
      <AnimatePresence>
        {deleteConfirmRoomId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setDeleteConfirmRoomId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative bg-gray-800/95 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/60 shadow-2xl max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setDeleteConfirmRoomId(null)}
                className="absolute top-3 right-3 p-1 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-gray-700/50"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30 flex items-center justify-center">
                <Trash2 className="h-7 w-7 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{t('deleteRoomQ')}</h3>
              <p className="text-sm text-gray-400 mb-2">
                {t('closeRoomDesc')}
              </p>
              <p className="text-xs font-mono text-yellow-300/70 mb-5">
                #{deleteConfirmRoomId}
              </p>
              <div className="flex gap-2.5 justify-center">
                <button
                  onClick={handleDeleteRoom}
                  className="px-5 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-lg hover:from-red-400 hover:to-rose-500 transition-all text-sm shadow-lg shadow-red-500/20"
                >
                  {t('delete')}
                </button>
                <button
                  onClick={() => setDeleteConfirmRoomId(null)}
                  className="px-5 py-2 bg-gray-700 text-gray-300 font-semibold rounded-lg hover:bg-gray-600 transition-all text-sm border border-gray-600"
                >
                  {t('cancel')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StreamingLobby() {
  const t = useTranslations('StreamingLobby');
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">{t('loading')}</span>
        </div>
      </div>
    }>
      <StreamingLobbyContent />
    </Suspense>
  );
}