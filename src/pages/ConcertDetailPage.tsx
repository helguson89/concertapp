import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Concert, Review, ChatMessage, SetlistSong, ConcertNote, User } from '../types'
import { useAuth } from '../contexts/AuthContext'

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={`text-xl ${star <= value ? 'text-amber-400' : 'text-gray-600'} ${onChange ? 'hover:text-amber-300 cursor-pointer' : 'cursor-default'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function ConcertDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [concert, setConcert] = useState<Concert | null>(null)
  const [members, setMembers] = useState<User[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [songs, setSongs] = useState<SetlistSong[]>([])
  const [note, setNote] = useState<ConcertNote | null>(null)
  const [noteText, setNoteText] = useState('')
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  const [newMessage, setNewMessage] = useState('')
  const [newSong, setNewSong] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [editingConcert, setEditingConcert] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Concert>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchAll(id)
      const cleanup = subscribeToChat(id)
      return cleanup
    }
  }, [id])

  async function fetchAll(concertId: string) {
    const [concertRes, membersRes, reviewsRes, messagesRes, songsRes, noteRes, allUsersRes] = await Promise.all([
      supabase.from('concerts').select('*').eq('id', concertId).single(),
      supabase.from('concert_members').select('user_id, users(id, display_name, email)').eq('concert_id', concertId),
      supabase.from('reviews').select('*, users(id, display_name, email)').eq('concert_id', concertId).order('created_at'),
      supabase.from('chat_messages').select('*, users(id, display_name, email)').eq('concert_id', concertId).order('created_at'),
      supabase.from('setlist_songs').select('*').eq('concert_id', concertId).order('position'),
      supabase.from('concert_notes').select('*').eq('concert_id', concertId).single(),
      supabase.from('users').select('*'),
    ])

    if (concertRes.data) {
      setConcert(concertRes.data)
      setSpotifyUrl(concertRes.data.spotify_url || '')
      setEditForm(concertRes.data)
    }
    if (membersRes.data) {
      const users = membersRes.data.map((m: unknown) => (m as { users: User }).users).filter(Boolean)
      setMembers(users)
      setSelectedMembers(membersRes.data.map((m: unknown) => (m as { user_id: string }).user_id))
    }
    if (reviewsRes.data) setReviews(reviewsRes.data as unknown as Review[])
    if (messagesRes.data) setMessages(messagesRes.data as unknown as ChatMessage[])
    if (songsRes.data) setSongs(songsRes.data)
    if (noteRes.data) { setNote(noteRes.data); setNoteText(noteRes.data.text || '') }
    if (allUsersRes.data) setAllUsers(allUsersRes.data)
    setLoading(false)
  }

  function subscribeToChat(concertId: string) {
    const sub = supabase
      .channel(`chat-${concertId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `concert_id=eq.${concertId}` },
        async (payload) => {
          const { data: userData } = await supabase.from('users').select('*').eq('id', payload.new.user_id).single()
          setMessages(prev => [...prev, { ...payload.new, users: userData } as unknown as ChatMessage])
        }
      )
      .subscribe()
    return () => { sub.unsubscribe() }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim()) return
    await supabase.from('chat_messages').insert({ concert_id: id, user_id: user!.id, text: newMessage })
    setNewMessage('')
  }

  async function addSong(e: React.FormEvent) {
    e.preventDefault()
    if (!newSong.trim()) return
    const position = songs.length + 1
    const { data } = await supabase.from('setlist_songs').insert({ concert_id: id, song_title: newSong, position }).select().single()
    if (data) setSongs([...songs, data])
    setNewSong('')
  }

  async function removeSong(songId: string) {
    await supabase.from('setlist_songs').delete().eq('id', songId)
    setSongs(songs.filter(s => s.id !== songId))
  }

  async function saveNote() {
    if (note) {
      await supabase.from('concert_notes').update({ text: noteText, updated_by: user!.id, updated_at: new Date().toISOString() }).eq('id', note.id)
    } else {
      await supabase.from('concert_notes').insert({ concert_id: id, text: noteText, updated_by: user!.id })
    }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    const existing = reviews.find(r => r.user_id === user!.id)
    if (existing) {
      const { data } = await supabase.from('reviews').update({ rating: reviewRating, text: reviewText }).eq('id', existing.id).select('*, users(id, display_name, email)').single()
      if (data) setReviews(reviews.map(r => r.id === existing.id ? data as unknown as Review : r))
    } else {
      const { data } = await supabase.from('reviews').insert({ concert_id: id, user_id: user!.id, rating: reviewRating, text: reviewText }).select('*, users(id, display_name, email)').single()
      if (data) setReviews([...reviews, data as unknown as Review])
    }
    setReviewText('')
  }

  async function saveSpotify() {
    await supabase.from('concerts').update({ spotify_url: spotifyUrl }).eq('id', id!)
    setConcert(prev => prev ? { ...prev, spotify_url: spotifyUrl } : prev)
  }

  async function saveConcertEdit() {
    const { data } = await supabase.from('concerts').update(editForm).eq('id', id!).select().single()
    if (data) {
      setConcert(data)
      await supabase.from('concert_members').delete().eq('concert_id', id!)
      await supabase.from('concert_members').insert(selectedMembers.map(uid => ({ concert_id: id!, user_id: uid })))
      const { data: updatedMembers } = await supabase.from('concert_members').select('user_id, users(id, display_name, email)').eq('concert_id', id!)
      if (updatedMembers) setMembers(updatedMembers.map((m: unknown) => (m as { users: User }).users).filter(Boolean))
    }
    setEditingConcert(false)
  }

  async function deleteConcert() {
    if (!confirm('Delete this concert?')) return
    await supabase.from('concerts').delete().eq('id', id!)
    navigate('/')
  }

  if (loading) return <div className="text-gray-400 text-center py-20">Loading...</div>
  if (!concert) return <div className="text-gray-400 text-center py-20">Concert not found</div>

  const myReview = reviews.find(r => r.user_id === user!.id)
  const avgRating = reviews.length > 0 ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-[#111] border border-amber-900/30 rounded-xl p-6">
        {editingConcert ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['artist', 'venue', 'city', 'country'] as const).map(field => (
                <div key={field}>
                  <label className="block text-sm text-gray-400 mb-1 capitalize">{field}</label>
                  <input type="text" value={(editForm as Record<string, string>)[field] || ''} onChange={e => setEditForm({ ...editForm, [field]: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
                </div>
              ))}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Date</label>
                <input type="date" value={editForm.date || ''} onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Status</label>
                <select value={editForm.status || 'planning'} onChange={e => setEditForm({ ...editForm, status: e.target.value as Concert['status'] })}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500">
                  <option value="planning">Planning</option>
                  <option value="attended">Attended</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Who's going?</label>
              <div className="flex flex-wrap gap-2">
                {allUsers.map(u => (
                  <button key={u.id} type="button"
                    onClick={() => setSelectedMembers(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id])}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedMembers.includes(u.id) ? 'bg-amber-500 text-black' : 'bg-[#1a1a1a] border border-gray-700 text-gray-400'}`}>
                    {u.display_name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={saveConcertEdit} className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg">Save</button>
              <button onClick={() => setEditingConcert(false)} className="text-gray-400 hover:text-white px-4 py-2">Cancel</button>
              <button onClick={deleteConcert} className="text-red-400 hover:text-red-300 px-4 py-2 ml-auto">Delete concert</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">{concert.artist}</h1>
                <p className="text-gray-400 mt-1">{concert.venue} · {concert.city}, {concert.country}</p>
                <p className="text-amber-400 font-medium mt-1">{new Date(concert.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-sm px-3 py-1 rounded-full ${concert.status === 'attended' ? 'bg-green-900/50 text-green-400' : 'bg-amber-900/50 text-amber-400'}`}>
                  {concert.status === 'attended' ? 'Attended' : 'Planning'}
                </span>
                {avgRating && <div className="text-center"><p className="text-2xl font-bold text-amber-400">{avgRating}</p><p className="text-xs text-gray-500">avg rating</p></div>}
                <button onClick={() => setEditingConcert(true)} className="text-sm text-gray-500 hover:text-amber-400">Edit</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {members.map(m => (
                <span key={m.id} className="text-xs bg-[#1a1a1a] border border-gray-700 rounded-full px-3 py-1 text-gray-300">{m.display_name}</span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Spotify */}
      <div className="bg-[#111] border border-amber-900/30 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-amber-400 mb-3">🎵 Spotify Playlist</h2>
        <div className="flex gap-2">
          <input type="url" value={spotifyUrl} onChange={e => setSpotifyUrl(e.target.value)} placeholder="https://open.spotify.com/playlist/..."
            className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
          <button onClick={saveSpotify} className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg">Save</button>
        </div>
        {spotifyUrl && (
          <a href={spotifyUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-green-400 hover:underline text-sm">
            Open in Spotify →
          </a>
        )}
      </div>

      {/* Notepad */}
      <div className="bg-[#111] border border-amber-900/30 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-amber-400 mb-3">📝 Shared Notepad</h2>
        <textarea
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          rows={4}
          placeholder="Shared notes for this concert..."
          className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 resize-none"
        />
        <button onClick={saveNote} className="mt-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg">Save note</button>
      </div>

      {/* Setlist */}
      <div className="bg-[#111] border border-amber-900/30 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-amber-400 mb-3">🎸 Setlist</h2>
        {songs.length > 0 ? (
          <ol className="space-y-1 mb-4">
            {songs.map((song, i) => (
              <li key={song.id} className="flex items-center gap-3 text-gray-300">
                <span className="text-gray-500 w-6 text-right text-sm">{i + 1}.</span>
                <span className="flex-1">{song.song_title}</span>
                <button onClick={() => removeSong(song.id)} className="text-gray-600 hover:text-red-400 text-sm">✕</button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-gray-500 text-sm mb-4">No songs added yet</p>
        )}
        <form onSubmit={addSong} className="flex gap-2">
          <input type="text" value={newSong} onChange={e => setNewSong(e.target.value)} placeholder="Add a song..."
            className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
          <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg">Add</button>
        </form>
      </div>

      {/* Reviews */}
      {concert.status === 'attended' && (
        <div className="bg-[#111] border border-amber-900/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-amber-400 mb-4">⭐ Reviews</h2>
          {reviews.map(r => (
            <div key={r.id} className="border-b border-gray-800 pb-4 mb-4 last:border-0 last:mb-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-white">{(r as unknown as { users?: { display_name: string } }).users?.display_name || 'Unknown'}</span>
                <StarRating value={r.rating} />
              </div>
              <p className="text-gray-300 text-sm">{r.text}</p>
              <p className="text-gray-600 text-xs mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
          ))}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <h3 className="text-sm font-medium text-gray-400 mb-3">{myReview ? 'Edit your review' : 'Write a review'}</h3>
            <form onSubmit={submitReview} className="space-y-3">
              <StarRating value={reviewRating} onChange={setReviewRating} />
              <textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                rows={3}
                placeholder="Your thoughts on the concert..."
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 resize-none"
              />
              <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg">
                {myReview ? 'Update review' : 'Submit review'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Chat */}
      <div className="bg-[#111] border border-amber-900/30 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-amber-400 mb-4">💬 Group Chat</h2>
        <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-sm">No messages yet</p>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.user_id === user!.id ? 'flex-row-reverse' : ''}`}>
                <div className={`max-w-xs ${msg.user_id === user!.id ? 'items-end' : 'items-start'} flex flex-col`}>
                  <span className="text-xs text-gray-500 mb-1">{(msg as unknown as { users?: { display_name: string } }).users?.display_name || 'Unknown'}</span>
                  <div className={`px-3 py-2 rounded-xl text-sm ${msg.user_id === user!.id ? 'bg-amber-600 text-white' : 'bg-[#1a1a1a] text-gray-200'}`}>
                    {msg.text}
                  </div>
                  <span className="text-xs text-gray-600 mt-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          )}
        </div>
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Write a message..."
            className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
          />
          <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg">Send</button>
        </form>
      </div>
    </div>
  )
}
