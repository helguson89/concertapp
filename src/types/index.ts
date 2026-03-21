export interface User {
  id: string
  display_name: string
  email: string
}

export interface Concert {
  id: string
  artist: string
  date: string
  venue: string
  city: string
  country: string
  status: 'planning' | 'attended'
  spotify_url?: string
  created_by: string
  created_at?: string
}

export interface ConcertMember {
  concert_id: string
  user_id: string
  users?: User
}

export interface Review {
  id: string
  concert_id: string
  user_id: string
  rating: number
  text: string
  created_at: string
  users?: User
}

export interface ChatMessage {
  id: string
  concert_id: string
  user_id: string
  text: string
  created_at: string
  users?: User
}

export interface SetlistSong {
  id: string
  concert_id: string
  position: number
  song_title: string
}

export interface ConcertNote {
  id: string
  concert_id: string
  text: string
  updated_at: string
  updated_by: string
  users?: User
}
