export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  avatar_url: string;
}

export interface Song {
  id: number;
  title: string;
  artist_id: number;
  artist_name?: string;
  album_id?: number;
  album_title?: string;
  duration: number;
  genre: string;
  audio_url: string;
  cover_url: string;
  play_count: number;
}

export interface Artist {
  id: number;
  name: string;
  bio: string;
  image_url: string;
}

export interface Album {
  id: number;
  title: string;
  artist_id: number;
  artist_name?: string;
  cover_url: string;
  release_date: string;
}

export interface Playlist {
  id: number;
  user_id: number;
  title: string;
  description: string;
  cover_url: string;
  song_count?: number;
  songs?: Song[];
}
