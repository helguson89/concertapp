import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, displayName, signOut } = useAuth()
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Concerts' },
    { path: '/calendar', label: 'Calendar' },
    { path: '/wishlist', label: 'Wishlist' },
    { path: '/stats', label: 'Stats' },
    { path: '/map', label: 'Map' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-amber-900/30 bg-[#111] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-amber-400 tracking-tight">
            🎸 GigLog
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'text-amber-400'
                    : 'text-gray-400 hover:text-amber-300'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 hidden md:block">{displayName}</span>
            <button
              onClick={signOut}
              className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
        {/* Mobile nav */}
        <div className="md:hidden flex overflow-x-auto gap-4 px-4 pb-2 border-t border-amber-900/20">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium whitespace-nowrap py-1 transition-colors ${
                location.pathname === item.path
                  ? 'text-amber-400'
                  : 'text-gray-400'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
