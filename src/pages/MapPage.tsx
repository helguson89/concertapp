import { useEffect, useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { supabase } from '../lib/supabase'
import { Concert } from '../types'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Simple city coordinates lookup - you can extend this
const cityCoords: Record<string, [number, number]> = {
  'oslo': [10.75, 59.91],
  'bergen': [5.32, 60.39],
  'london': [-0.12, 51.51],
  'paris': [2.35, 48.85],
  'berlin': [13.41, 52.52],
  'amsterdam': [4.90, 52.37],
  'new york': [-74.01, 40.71],
  'los angeles': [-118.24, 34.05],
  'chicago': [-87.63, 41.88],
  'stockholm': [18.07, 59.33],
  'copenhagen': [12.57, 55.68],
  'madrid': [-3.70, 40.42],
  'barcelona': [2.17, 41.39],
  'rome': [12.49, 41.90],
  'milan': [9.19, 45.46],
  'tokyo': [139.69, 35.69],
  'sydney': [151.21, -33.87],
  'toronto': [-79.38, 43.65],
  'dublin': [-6.26, 53.33],
  'edinburgh': [-3.19, 55.95],
  'vienna': [16.37, 48.21],
  'prague': [14.42, 50.08],
  'warsaw': [21.01, 52.23],
  'brussels': [4.35, 50.85],
  'zurich': [8.54, 47.37],
  'helsinki': [24.93, 60.17],
  'gothenburg': [11.97, 57.71],
}

export default function MapPage() {
  const [concerts, setConcerts] = useState<Concert[]>([])

  useEffect(() => {
    supabase.from('concerts').select('*').eq('status', 'attended').then(({ data }) => {
      if (data) setConcerts(data)
    })
  }, [])

  const cityMap: Record<string, { concerts: Concert[]; coords: [number, number] }> = {}
  for (const c of concerts) {
    const key = c.city.toLowerCase()
    const coords = cityCoords[key]
    if (coords) {
      if (!cityMap[key]) cityMap[key] = { concerts: [], coords }
      cityMap[key].concerts.push(c)
    }
  }
  const markers = Object.values(cityMap)
  const unknownCities = [...new Set(concerts.filter(c => !cityCoords[c.city.toLowerCase()]).map(c => c.city))]

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Concert Map</h1>
      <div className="bg-[#111] border border-amber-900/30 rounded-xl overflow-hidden">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 140, center: [10, 20] }}
          style={{ width: '100%', height: 'auto' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1a1a1a"
                  stroke="#2a2a2a"
                  style={{ default: { outline: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }}
                />
              ))
            }
          </Geographies>
          {markers.map(({ concerts: cs, coords }, i) => (
            <Marker key={i} coordinates={coords}>
              <circle r={Math.min(4 + cs.length * 2, 12)} fill="#f59e0b" opacity={0.8} stroke="#fbbf24" strokeWidth={1} />
              <title>{cs[0].city}: {cs.map(c => c.artist).join(', ')}</title>
            </Marker>
          ))}
        </ComposableMap>
      </div>
      {markers.length === 0 && (
        <p className="text-center text-gray-500 mt-4">No attended concerts yet to show on the map.</p>
      )}
      {unknownCities.length > 0 && (
        <p className="text-gray-500 text-sm mt-2">Cities not mapped: {unknownCities.join(', ')}</p>
      )}
    </div>
  )
}
