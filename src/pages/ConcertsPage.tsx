import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Concert } from '../types'
import { useAuth } from '../contexts/AuthContext'

export default function ConcertsPage() {
  const [concerts, setConcerts] = useState<Concert[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchConcerts()
  }, [])

  async function fetchConcerts() {
    const { data } = await supabase
      .from('concerts')
      .select('*')
      .order('date', { ascending: false })
    if (data) setConcerts(data)
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">All Concerts</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + Add Concert
        </button>
      </div>

      {showForm && (
        <AddConcertForm
          onSuccess={() => { setShowForm(false); fetchConcerts() }}
          onCancel={() => setShowForm(false)}
          userId={user!.id}
        />
      )}

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : concerts.length === 0 ? (
        <p className="text-gray-400">No concerts yet. Add your first one!</p>
      ) : (
        <div className="grid gap-3">
          {concerts.map(concert => (
            <Link
              key={concert.id}
              to={`/concert/${concert.id}`}
              className="block bg-[#111] border border-amber-900/30 rounded-xl p-4 hover:border-amber-600/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-white text-lg">{concert.artist}</h2>
                  <p className="text-gray-400 text-sm">{concert.venue} · {concert.city}, {concert.country}</p>
                </div>
                <div className="text-right">
                  <p className="text-amber-400 font-medium">{new Date(concert.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${concert.status === 'attended' ? 'bg-green-900/50 text-green-400' : 'bg-amber-900/50 text-amber-400'}`}>
                    {concert.status === 'attended' ? 'Attended' : 'Planning'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function AddConcertForm({ onSuccess, onCancel, userId }: { onSuccess: () => void; onCancel: () => void; userId: string }) {
  const [form, setForm] = useState({
    artist: '', date: '', venue: '', city: '', country: '', status: 'planning' as 'planning' | 'attended', spotify_url: ''
  })
  const [users, setUsers] = useState<{ id: string; display_name: string }[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([userId])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('users').select('id, display_name').then(({ data }) => {
      if (data) setUsers(data)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase
      .from('concerts')
      .insert({ ...form, created_by: userId })
      .select()
      .single()

    if (!error && data) {
      const members = selectedMembers.map(uid => ({ concert_id: data.id, user_id: uid }))
      await supabase.from('concert_members').insert(members)
      await supabase.from('concert_notes').insert({ concert_id: data.id, text: '', updated_by: userId })
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#111] border border-amber-900/30 rounded-xl p-6 mb-6 space-y-4">
      <h2 className="font-semibold text-amber-400 text-lg">Add Concert</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(['artist', 'venue', 'city', 'country'] as const).map(field => (
          <div key={field}>
            <label className="block text-sm text-gray-400 mb-1 capitalize">{field}</label>
            <input
              type="text"
              value={form[field]}
              onChange={e => setForm({ ...form, [field]: e.target.value })}
              required={field !== 'venue'}
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        ))}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
            required
            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Status</label>
          <select
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value as 'planning' | 'attended' })}
            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
          >
            <option value="planning">Planning</option>
            <option value="attended">Attended</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Spotify playlist URL</label>
          <input
            type="url"
            value={form.spotify_url}
            onChange={e => setForm({ ...form, spotify_url: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-2">Who's going?</label>
        <div className="flex flex-wrap gap-2">
          {users.map(u => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelectedMembers(prev =>
                prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]
              )}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedMembers.includes(u.id)
                  ? 'bg-amber-500 text-black'
                  : 'bg-[#1a1a1a] border border-gray-700 text-gray-400'
              }`}
            >
              {u.display_name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
          {loading ? 'Saving...' : 'Save Concert'}
        </button>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-white px-4 py-2 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}
