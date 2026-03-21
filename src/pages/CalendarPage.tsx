import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Concert } from '../types'

export default function CalendarPage() {
  const [concerts, setConcerts] = useState<Concert[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    supabase.from('concerts').select('*').then(({ data }) => {
      if (data) setConcerts(data)
    })
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const concertsThisMonth = concerts.filter(c => {
    const d = new Date(c.date)
    return d.getFullYear() === year && d.getMonth() === month
  })

  function getConcertsOnDay(day: number) {
    return concertsThisMonth.filter(c => new Date(c.date).getDate() === day)
  }

  const days: (number | null)[] = []
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Calendar</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="text-gray-400 hover:text-amber-400 px-2 py-1">←</button>
          <span className="text-amber-400 font-medium w-40 text-center">{monthName}</span>
          <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="text-gray-400 hover:text-amber-400 px-2 py-1">→</button>
        </div>
      </div>
      <div className="bg-[#111] border border-amber-900/30 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-amber-900/30">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="text-center text-xs text-gray-500 py-2 font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayConcerts = day ? getConcertsOnDay(day) : []
            const today = new Date()
            const isToday = day && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
            return (
              <div key={i} className={`min-h-[80px] p-1 border-b border-r border-gray-800/50 ${!day ? 'bg-[#0d0d0d]' : ''}`}>
                {day && (
                  <>
                    <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-amber-500 text-black font-bold' : 'text-gray-400'}`}>
                      {day}
                    </span>
                    {dayConcerts.map(c => (
                      <Link key={c.id} to={`/concert/${c.id}`}
                        className="block text-xs bg-amber-900/40 hover:bg-amber-800/50 text-amber-300 rounded px-1 py-0.5 mb-0.5 truncate">
                        {c.artist}
                      </Link>
                    ))}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
