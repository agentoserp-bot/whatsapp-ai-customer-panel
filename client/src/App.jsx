import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Sidebar from './components/Layout/Sidebar'
import Header from './components/Layout/Header'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ForgotPassword from './pages/Auth/ForgotPassword'
import InitialSetup from './pages/Setup/InitialSetup'
import Dashboard from './pages/Dashboard'
import WhatsApp from './pages/WhatsApp'
import Training from './pages/Training'
import Conversations from './pages/Conversations'
import Settings from './pages/Settings'
import Profile from './pages/Profile'

function App() {
  const { user, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Debug logs
  console.log('🔍 App render - loading:', loading, 'user:', user?.email)

  // Fechar sidebar em dispositivos móveis ao redimensionar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (loading) {
    console.log('⏳ Mostrando loading spinner...')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log('🚪 Redirecionando para login...')
    return (
      <Routes>
        <Route path="/setup" element={<InitialSetup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  console.log('🏠 Renderizando aplicação principal...')
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="lg:pl-64">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="p-4 lg:p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/setup" element={<InitialSetup />} />
            <Route path="/whatsapp" element={<WhatsApp />} />
            <Route path="/training" element={<Training />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App