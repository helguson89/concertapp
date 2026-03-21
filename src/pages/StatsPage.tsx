import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { supabase } from '../lib/supabase'
import { Concert } from '../types'

export default function StatsPage() {
  const [concerts, setConcerts] = useState<Concert[]>([])

  useEffect(() => {
    supabase.from('concerts').select('*').eq('status', 'attended').then(({ data }) => {
      if (data) setConcerts(data)
    })
  }, [])

  const attended = concerts
  const total = attended.length

  const byYear = attended.reduce((acc: Record<string, number>, c) => {
    const year = new Date(c.date).getFullYear().toString()
    acc[year] = (acc[year] || 0) + 1
    return acc
  }, {})
  const yearData = Object.entries(byYear).sort(([a], [b]) => a.localeCompare(b)).map(([year, count]) => ({ year, count }))

  const byArtist = attended.reduce((acc: Record<string, number>, c) => {
    acc[c.artist] = (acc[c.artist] || 0) + 1
    return acc
  }, {})
  const topArtists = Object.entries(byArtist).sort(([, a], [, b]) => b - a).slice(0, 10)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Stats</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111] border border-amber-900/30 rounded-xl p-6 text-center">
          <p className="text-5xl font-bold text-amber-400">{total}</p>
          <p className="text-gray-400 mt-1">Concerts attended</p>
        </div>
        <div className="bg-[#111] border border-amber-900/30 rounded-xl p-6 text-center">
          <p className="text-5xl font-bold text-amber-400">{Object.keys(byArtist).length}</p>
          <p className="text-gray-400 mt-1">Unique artists</p>
        </div>
        <div className="bg-[#111] border border-amber-900/30 rounded-xl p-6 text-center">
          <p className="text-5xl font-bold text-amber-400">{Object.keys(byYear).length}</p>
          <p className="text-gray-400 mt-1">Years active</p>
        </div>
      </div>

      {yearData.length > 0 && (
        <div className="bg-[#111] border border-amber-900/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-amber-400 mb-4">Concerts per Year</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={yearData}>
              <XAxis dataKey="year" stroke="#6b7280" />
              <YAxis stroke="#6b7280" allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #78350f', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {yearData.map((_, i) => <Cell key={i} fill="#f59e0b" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {topArtists.length > 0 && (
        <div className="bg-[#111] border border-amber-900/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-amber-400 mb-4">Most Seen Artists</h2>
          <div className="space-y-2">
            {topArtists.map(([artist, count], i) => (
              <div key={artist} className="flex items-center gap-3">
                <span className="text-gray-500 w-6 text-sm">{i + 1}.</span>
                <span className="flex-1 text-white">{artist}</span>
                <div className="flex items-center gap-2">
                  <div className="bg-amber-900/30 rounded-full h-2 w-32 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${(count / topArtists[0][1]) * 100}%` }}
                    />
                  </div>
                  <span className="text-amber-400 text-sm font-medium w-4">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
