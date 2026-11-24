import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, Search, Heart, 
  Home, Compass, Library, PlusCircle, LogIn, LogOut, Music2,
  FileText, ArrowLeft
} from 'lucide-react';
import { api } from './services/api';
import { Song, Artist, Album, Playlist, User } from './types';

// Sample lyrics mapping for demo tracks
const SAMPLE_LYRICS: Record<string, string[]> = {
  'Electric Sunset': [
    '[00:05.00] Neon lights flashing through the midnight sky',
    '[00:12.00] Cruising down the digital boulevard',
    '[00:20.00] Electric sunset fading into purple haze',
    '[00:30.00] Feel the rhythm, feel every beat inside',
    '[00:45.00] Synthesizers echo in the night',
    '[01:00.00] We will never fade away',
    '[01:15.00] In this cybernetic dream',
  ],
  'Cybernetic Highway': [
    '[00:04.00] 100 miles an hour on a glass road',
    '[00:15.00] Binary stars shining overhead',
    '[00:25.00] No speed limits in cyberspace',
    '[00:40.00] Accelerate into the future',
    '[00:55.00] Just feel every beat of VYNZA',
  ],
  'Whispering Stars': [
    '[00:06.00] Soft whispers falling from the galaxy',
    '[00:18.00] Looking up into the endless dark',
    '[00:28.00] You hold my hand and count the falling stars',
    '[00:42.00] In this quiet dream, music is our guide',
  ],
  'Raindrops on Asphalt': [
    '[00:05.00] Lo-fi crackle on a rainy evening',
    '[00:15.00] A warm cup of coffee by the window',
    '[00:25.00] City lights reflect on wet pavement',
    '[00:38.00] Relax your mind, let the music flow',
  ]
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'library' | 'artist'>('home');
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [showLyricsModal, setShowLyricsModal] = useState(false);

  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('vynza_token'));

  // Player state
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Auth modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('listener@vynza.com');
  const [authPassword, setAuthPassword] = useState('User12345!');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    loadCatalog();
    if (token) {
      loadUserData(token);
    }
  }, [token]);

  const loadCatalog = async () => {
    try {
      const [s, a, al] = await Promise.all([
        api.getSongs(),
        api.getArtists(),
        api.getAlbums(),
      ]);
      setSongs(s);
      setArtists(a);
      setAlbums(al);
      if (s.length > 0 && !currentSong) {
        setCurrentSong(s[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadUserData = async (jwt: string) => {
    try {
      const [u, p, f] = await Promise.all([
        api.getMe(jwt),
        api.getPlaylists(jwt),
        api.getFavorites(jwt),
      ]);
      setUser(u);
      setPlaylists(p);
      setFavorites(f);
    } catch (e) {
      console.error(e);
      handleLogout();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await api.login(authEmail, authPassword);
      localStorage.setItem('vynza_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setShowAuthModal(false);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vynza_token');
    setToken(null);
    setUser(null);
    setFavorites([]);
    setPlaylists([]);
  };

  const handlePlaySong = (song: Song) => {
    if (currentSong?.id === song.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = api.getStreamUrl(song.id);
        audioRef.current.play();
      }
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentSong) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (!currentSong || songs.length === 0) return;
    const currentIndex = songs.findIndex((s) => s.id === currentSong.id);
    const nextSong = songs[(currentIndex + 1) % songs.length];
    handlePlaySong(nextSong);
  };

  const handlePrev = () => {
    if (!currentSong || songs.length === 0) return;
    const currentIndex = songs.findIndex((s) => s.id === currentSong.id);
    const prevSong = songs[(currentIndex - 1 + songs.length) % songs.length];
    handlePlaySong(prevSong);
  };

  const isFavorite = (songId: number) => {
    return favorites.some((f) => f.id === songId);
  };

  const toggleFav = async (song: Song) => {
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    const fav = isFavorite(song.id);
    try {
      await api.toggleFavorite(token, song.id, fav);
      if (fav) {
        setFavorites(favorites.filter((f) => f.id !== song.id));
      } else {
        setFavorites([...favorites, song]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenArtist = (artist: Artist) => {
    setSelectedArtist(artist);
    setActiveTab('artist');
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const filteredSongs = searchQuery
    ? songs.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.artist_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.genre.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : songs;

  const artistSongs = selectedArtist
    ? songs.filter((s) => s.artist_id === selectedArtist.id)
    : [];

  const currentLyrics = currentSong ? SAMPLE_LYRICS[currentSong.title] || [
    '[00:00.00] Enjoy the instrumental rhythms of VYNZA',
    '[00:20.00] Feel every beat flowing through your mind',
    '[00:40.00] High fidelity audio streaming'
  ] : [];

  return (
    <div className="flex h-screen bg-[#09090c] text-zinc-100 flex-col overflow-hidden font-sans">
      <audio
        ref={audioRef}
        src={currentSong ? api.getStreamUrl(currentSong.id) : ''}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
          }
        }}
        onEnded={handleNext}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-[#121217] flex flex-col justify-between border-r border-[#22222b] p-4">
          <div>
            <div className="flex items-center space-x-3 px-2 py-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-600/30">
                <Music2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-black tracking-wider text-white">VYNZA</span>
                <span className="block text-[10px] text-purple-400 font-semibold tracking-widest uppercase">Web Player</span>
              </div>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('home')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeTab === 'home'
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>

              <button
                onClick={() => setActiveTab('search')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeTab === 'search'
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Explore & Search</span>
              </button>

              <button
                onClick={() => {
                  if (!token) setShowAuthModal(true);
                  else setActiveTab('library');
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeTab === 'library'
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                }`}
              >
                <Library className="w-4 h-4" />
                <span>Your Library</span>
              </button>
            </nav>

            <div className="mt-8">
              <div className="flex items-center justify-between px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <span>Playlists</span>
                <PlusCircle className="w-4 h-4 cursor-pointer hover:text-white transition" />
              </div>
              <div className="mt-2 space-y-1 overflow-y-auto max-h-48 pr-1">
                {playlists.length > 0 ? (
                  playlists.map((pl) => (
                    <div
                      key={pl.id}
                      className="px-3 py-2 rounded text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/30 cursor-pointer truncate"
                    >
                      {pl.title}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-zinc-600">
                    {token ? 'No playlists created' : 'Sign in to create playlists'}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#22222b]">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt="avatar"
                    className="w-8 h-8 rounded-full border border-purple-500/40"
                  />
                  <div className="truncate">
                    <p className="text-xs font-bold text-white truncate">{user.username}</p>
                    <p className="text-[10px] text-zinc-400 capitalize">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800/60 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg text-xs font-bold shadow-lg shadow-purple-600/20 transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-gradient-to-b from-[#14141c] to-[#0a0a0d] p-8">
          <div className="flex items-center justify-between pb-6">
            <div className="relative w-96">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search tracks, artists, genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1b1b24] text-sm text-zinc-200 pl-10 pr-4 py-2 rounded-full border border-zinc-700/50 focus:border-purple-500 focus:outline-none transition"
              />
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowLyricsModal(true)}
                className="flex items-center space-x-1.5 text-xs font-medium text-purple-300 bg-purple-900/40 hover:bg-purple-800/50 border border-purple-700/40 px-3 py-1.5 rounded-full transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Lyrics View</span>
              </button>
            </div>
          </div>

          {/* Artist Page View */}
          {activeTab === 'artist' && selectedArtist ? (
            <div>
              <button
                onClick={() => setActiveTab('home')}
                className="flex items-center space-x-2 text-xs text-zinc-400 hover:text-white mb-6 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Overview</span>
              </button>

              <div className="flex items-center space-x-6 mb-8 p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 to-transparent border border-purple-800/30">
                <img
                  src={selectedArtist.image_url}
                  alt={selectedArtist.name}
                  className="w-32 h-32 rounded-full object-cover shadow-2xl border-2 border-purple-500"
                />
                <div>
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Verified Artist</span>
                  <h1 className="text-4xl font-extrabold text-white mt-1 mb-2">{selectedArtist.name}</h1>
                  <p className="text-sm text-zinc-300 max-w-xl">{selectedArtist.bio}</p>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-4">Top Discography Tracks</h3>
              <div className="bg-[#13131a] rounded-xl border border-[#21212b] overflow-hidden">
                <table className="w-full text-left text-sm text-zinc-400">
                  <tbody className="divide-y divide-[#1e1e28]">
                    {artistSongs.map((song, idx) => (
                      <tr
                        key={song.id}
                        onClick={() => handlePlaySong(song)}
                        className="hover:bg-[#1c1c27] transition group cursor-pointer"
                      >
                        <td className="py-3 px-4 w-12 text-center text-xs">{idx + 1}</td>
                        <td className="py-3 px-4 flex items-center space-x-3">
                          <img src={song.cover_url} alt="" className="w-10 h-10 rounded-md object-cover" />
                          <div>
                            <div className="text-white font-semibold">{song.title}</div>
                            <div className="text-xs text-zinc-500">{song.genre}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-right">{song.play_count.toLocaleString()} plays</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'home' ? (
            <>
              {/* Featured Banner */}
              <div className="relative rounded-2xl overflow-hidden p-8 mb-8 bg-gradient-to-r from-purple-900/60 via-indigo-900/40 to-black border border-purple-800/30">
                <div className="max-w-xl">
                  <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Featured Album</span>
                  <h1 className="text-3xl font-extrabold text-white mt-2 mb-3">Neon Horizon</h1>
                  <p className="text-zinc-300 text-sm mb-6 leading-relaxed">
                    Immerse yourself into high-octane synthwave aesthetics and electronic beats curated for the next generation of sound.
                  </p>
                  <button
                    onClick={() => songs[0] && handlePlaySong(songs[0])}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 font-semibold text-sm rounded-full flex items-center space-x-2 shadow-lg shadow-purple-600/40 transition"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Play Featured Track</span>
                  </button>
                </div>
              </div>

              {/* Songs List */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">
                  {searchQuery ? 'Search Results' : 'Trending Now'}
                </h2>
                <div className="bg-[#13131a] rounded-xl border border-[#21212b] overflow-hidden">
                  <table className="w-full text-left text-sm text-zinc-400">
                    <thead className="bg-[#181822] text-xs uppercase tracking-wider text-zinc-500 border-b border-[#21212b]">
                      <tr>
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4">Title</th>
                        <th className="py-3 px-4 hidden md:table-cell">Album</th>
                        <th className="py-3 px-4 hidden sm:table-cell">Genre</th>
                        <th className="py-3 px-4 text-right">Plays</th>
                        <th className="py-3 px-4 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e1e28]">
                      {filteredSongs.map((song, idx) => {
                        const isCurrent = currentSong?.id === song.id;
                        return (
                          <tr
                            key={song.id}
                            className={`hover:bg-[#1c1c27] transition group cursor-pointer ${
                              isCurrent ? 'bg-purple-900/10 text-purple-400 font-semibold' : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handlePlaySong(song)}
                                className="w-6 h-6 flex items-center justify-center rounded hover:text-white"
                              >
                                {isCurrent && isPlaying ? (
                                  <Pause className="w-4 h-4 text-purple-400 fill-purple-400" />
                                ) : (
                                  <span className="group-hover:hidden text-xs">{idx + 1}</span>
                                )}
                                {(!isCurrent || !isPlaying) && (
                                  <Play className="w-3.5 h-3.5 hidden group-hover:block text-purple-400 fill-purple-400" />
                                )}
                              </button>
                            </td>
                            <td className="py-3 px-4 flex items-center space-x-3">
                              <img src={song.cover_url} alt="" className="w-10 h-10 rounded-md object-cover" />
                              <div className="truncate">
                                <div className={`truncate ${isCurrent ? 'text-purple-400' : 'text-white'}`}>
                                  {song.title}
                                </div>
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const art = artists.find((a) => a.id === song.artist_id);
                                    if (art) handleOpenArtist(art);
                                  }}
                                  className="text-xs text-zinc-500 hover:text-purple-400 hover:underline cursor-pointer truncate"
                                >
                                  {song.artist_name}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell text-zinc-400 text-xs truncate">
                              {song.album_title || 'Single'}
                            </td>
                            <td className="py-3 px-4 hidden sm:table-cell">
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                                {song.genre}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right text-xs text-zinc-400 font-mono">
                              {song.play_count.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFav(song);
                                }}
                                className="p-1 hover:text-purple-400 transition"
                              >
                                <Heart
                                  className={`w-4 h-4 ${
                                    isFavorite(song.id) ? 'text-purple-500 fill-purple-500' : 'text-zinc-500'
                                  }`}
                                />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Popular Artists Clickable */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div>
                  <h3 className="text-lg font-bold mb-3 text-white">Popular Artists (Click to View)</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {artists.map((art) => (
                      <div
                        key={art.id}
                        onClick={() => handleOpenArtist(art)}
                        className="bg-[#14141c] hover:bg-[#1b1b26] p-3 rounded-xl border border-zinc-800/60 hover:border-purple-500/40 text-center cursor-pointer transition"
                      >
                        <img src={art.image_url} alt={art.name} className="w-16 h-16 rounded-full mx-auto object-cover mb-2 border border-purple-500/30" />
                        <h5 className="text-xs font-bold text-white truncate">{art.name}</h5>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-3 text-white">Top Albums</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {albums.map((alb) => (
                      <div key={alb.id} className="bg-[#14141c] p-3 rounded-xl border border-zinc-800/60 text-center">
                        <img src={alb.cover_url} alt={alb.title} className="w-16 h-16 rounded-lg mx-auto object-cover mb-2" />
                        <h5 className="text-xs font-bold text-white truncate">{alb.title}</h5>
                        <p className="text-[10px] text-zinc-500 truncate">{alb.artist_name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </main>
      </div>

      {/* Lyrics Modal */}
      {showLyricsModal && currentSong && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-[#14141e] border border-zinc-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setShowLyricsModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>
            <div className="flex items-center space-x-4 mb-6">
              <img src={currentSong.cover_url} alt="" className="w-14 h-14 rounded-xl object-cover shadow-lg" />
              <div>
                <h3 className="text-lg font-bold text-white">{currentSong.title}</h3>
                <p className="text-xs text-purple-400">{currentSong.artist_name}</p>
              </div>
            </div>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-2 text-center">
              {currentLyrics.map((line, idx) => (
                <p key={idx} className="text-base text-zinc-300 font-medium hover:text-purple-400 transition">
                  {line.replace(/\[\d{2}:\d{2}\.\d{2}\]/, '').trim()}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sticky Player Bar */}
      <footer className="h-22 bg-[#0e0e13] border-t border-[#1f1f2a] px-6 flex items-center justify-between z-40">
        <div className="flex items-center space-x-4 w-1/4 min-w-[200px]">
          {currentSong && (
            <>
              <img
                src={currentSong.cover_url}
                alt={currentSong.title}
                className="w-12 h-12 rounded-lg object-cover shadow-md shadow-black/60"
              />
              <div className="truncate">
                <h4 className="text-sm font-bold text-white truncate">{currentSong.title}</h4>
                <p className="text-xs text-zinc-400 truncate">{currentSong.artist_name}</p>
              </div>
              <button onClick={() => toggleFav(currentSong)} className="p-1 hover:text-purple-400 transition">
                <Heart
                  className={`w-4 h-4 ${
                    isFavorite(currentSong.id) ? 'text-purple-500 fill-purple-500' : 'text-zinc-600'
                  }`}
                />
              </button>
            </>
          )}
        </div>

        <div className="flex flex-col items-center w-2/4 max-w-xl">
          <div className="flex items-center space-x-6 mb-1">
            <button onClick={handlePrev} className="text-zinc-400 hover:text-white transition">
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center transition shadow-lg"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
            </button>
            <button onClick={handleNext} className="text-zinc-400 hover:text-white transition">
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full flex items-center space-x-3 text-[11px] text-zinc-500 font-mono">
            <span>{formatTime(currentTime)}</span>
            <div
              className="flex-1 h-1.5 bg-zinc-800 rounded-full cursor-pointer relative overflow-hidden group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                if (audioRef.current && duration) {
                  audioRef.current.currentTime = pos * duration;
                }
              }}
            >
              <div
                className="h-full bg-purple-500 rounded-full group-hover:bg-purple-400 transition-all"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 w-1/4">
          <button
            onClick={() => setShowLyricsModal(true)}
            title="Show Lyrics"
            className="p-1.5 text-zinc-400 hover:text-purple-400 hover:bg-zinc-800 rounded-lg transition"
          >
            <FileText className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-zinc-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setVolume(val);
                if (audioRef.current) audioRef.current.volume = val;
              }}
              className="w-20 h-1 bg-zinc-800 accent-purple-500 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#14141d] border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Sign in to VYNZA</h3>
            <p className="text-xs text-zinc-400 mb-4">Enter credentials to manage favorites and personalized library.</p>
            {authError && <div className="text-xs text-red-400 bg-red-950/40 p-2 rounded mb-3">{authError}</div>}
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Email</label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-[#1b1b26] border border-zinc-700/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Password</label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-[#1b1b26] border border-zinc-700/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="w-1/2 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-semibold shadow-lg shadow-purple-600/30"
                >
                  Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
