import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import AuthPage from './pages/AuthPage'
import ConcertsPage from './pages/ConcertsPage'
import ConcertDetailPage from './pages/ConcertDetailPage'
import CalendarPage from './pages/CalendarPage'
import WishlistPage from './pages/WishlistPage'
import StatsPage from './pages/StatsPage'
import MapPage from './pages/MapPage'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <p className="text-amber-400 text-xl">Loading...</p>
    </div>
  )

  if (!user) return <AuthPage />

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ConcertsPage />} />
        <Route path="/concert/:id" element={<ConcertDetailPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  )
}
