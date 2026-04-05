import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import './index.css'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Guests from './pages/Guests'
import Checkin from './pages/Checkin'

const Protected = ({ children }) => {
  const { token } = useAuth()
  return token ? children : <Navigate to="/" />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/guests" element={<Protected><Guests /></Protected>} />
          <Route path="/checkin" element={<Checkin />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
)