import { Routes, Route } from 'react-router-dom'

import MainLayout from '../components/layout/MainLayout'

import Home from '../pages/Home'
import Login from '../pages/Login'
import Signup from '../pages/Signup'
import ForgotPassword from '../pages/ForgotPassword'
import Dashboard from '../pages/Dashboard'
import Portfolio from '../pages/Portfolio'
import News from '../pages/News'
import Chatbot from '../pages/Chatbot'
import Trading from '../pages/Trading'
import Backtesting from '../pages/Backtesting'
import TradingBot from '../pages/TradingBot'
import Settings from '../pages/Settings'
import NotFound from '../pages/NotFound'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/news" element={<News />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/trading" element={<Trading />} />
        <Route path="/backtesting" element={<Backtesting />} />
        <Route path="/bot" element={<TradingBot />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
