import { Song, Artist, Album, Playlist, User } from '../types';

const API_BASE = 'http://localhost:8085/api/v1';

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async register(username: string, email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  async getMe(token: string): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to get user profile');
    return res.json();
  },

  // Songs
  async getSongs(search = '', genre = ''): Promise<Song[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (genre) params.append('genre', genre);
    const res = await fetch(`${API_BASE}/songs?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch songs');
    const data = await res.json();
    return data || [];
  },

  async getArtists(): Promise<Artist[]> {
    const res = await fetch(`${API_BASE}/artists`);
    if (!res.ok) throw new Error('Failed to fetch artists');
    return (await res.json()) || [];
  },

  async getAlbums(): Promise<Album[]> {
    const res = await fetch(`${API_BASE}/albums`);
    if (!res.ok) throw new Error('Failed to fetch albums');
    return (await res.json()) || [];
  },

  // Favorites
  async getFavorites(token: string): Promise<Song[]> {
    const res = await fetch(`${API_BASE}/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch favorites');
    return (await res.json()) || [];
  },

  async toggleFavorite(token: string, songId: number, isFav: boolean): Promise<void> {
    const method = isFav ? 'DELETE' : 'POST';
    await fetch(`${API_BASE}/favorites/${songId}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Playlists
  async getPlaylists(token: string): Promise<Playlist[]> {
    const res = await fetch(`${API_BASE}/playlists`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch playlists');
    return (await res.json()) || [];
  },

  async createPlaylist(token: string, title: string, description: string): Promise<Playlist> {
    const res = await fetch(`${API_BASE}/playlists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, description }),
    });
    if (!res.ok) throw new Error('Failed to create playlist');
    return res.json();
  },

  getStreamUrl(songId: number): string {
    return `${API_BASE}/songs/${songId}/stream`;
  }
};
