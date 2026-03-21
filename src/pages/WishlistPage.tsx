import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Concert } from '../types'

export default function WishlistPage() {
  const [concerts, setConcerts] = useState<Concert[]>([])
  const [sortAsc, setSortAsc] = useState(true)

  useEffect(() => {
    supabase.from('concerts').select('*').eq('status', 'planning').then(({ data }) => {
      if (data) setConcerts(data)
    })
  }, [])

  const sorted = [...concerts].sort((a, b) => {
    const diff = new Date(a.date).getTime() - new Date(b.date).getTime()
    return sortAsc ? diff : -diff
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Want to See</h1>
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="text-sm text-gray-400 hover:text-amber-400 border border-gray-700 rounded-lg px-3 py-1"
        >
          Date {sortAsc ? '↑' : '↓'}
        </button>
      </div>
      {sorted.length === 0 ? (
        <p className="text-gray-400">No planned concerts. Add some!</p>
      ) : (
        <div className="grid gap-3">
          {sorted.map(concert => (
            <Link key={concert.id} to={`/concert/${concert.id}`}
              className="flex items-center justify-between bg-[#111] border border-amber-900/30 rounded-xl p-4 hover:border-amber-600/50 transition-colors">
              <div>
                <h2 className="font-semibold text-white">{concert.artist}</h2>
                <p className="text-gray-400 text-sm">{concert.venue} · {concert.city}, {concert.country}</p>
              </div>
              <div className="text-right">
                <p className="text-amber-400 font-medium">{new Date(concert.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {Math.ceil((new Date(concert.date).getTime() - Date.now()) / 86400000)} days away
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
