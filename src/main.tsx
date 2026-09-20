import { StrictMode, useState, useEffect, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './i18n/LanguageContext'
import ErrorBoundary from './components/ErrorBoundary.tsx'

const AdminHub = lazy(() => import('./pages/AdminHub.tsx'))
const AdminLogin = lazy(() => import('./pages/AdminLogin.tsx'))

const ADMIN_AUTH_KEY = 'ntf_admin_auth'

function isAdminRoute(hash: string): boolean {
  return (
    hash.startsWith('#/admin') ||
    hash === '#/admin-prada-calc' ||
    hash === '#/admin-calc' ||
    hash === '#/admin-data'
  )
}

function Root() {
  const [hash, setHash] = useState(() => window.location.hash)
  const [isAdminAuth, setIsAdminAuth] = useState(
    () => sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true'
  )

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // ─── Admin Route Handling ─────────────────────────────────────────────────
  if (isAdminRoute(hash)) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#121c21] flex items-center justify-center text-white text-sm font-bold gap-3">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            กำลังโหลดระบบแอดมิน...
          </div>
        }
      >
        {!isAdminAuth ? (
          <AdminLogin
            onLoginSuccess={() => {
              sessionStorage.setItem(ADMIN_AUTH_KEY, 'true')
              setIsAdminAuth(true)
            }}
          />
        ) : (
          <AdminHub
            initialTab={hash.includes('calc') ? 'calc' : 'data'}
            onLogout={() => {
              sessionStorage.removeItem(ADMIN_AUTH_KEY)
              setIsAdminAuth(false)
            }}
          />
        )}
      </Suspense>
    )
  }

  // ─── Public Fan Portal Route (Open Access for All Users) ──────────────────
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
