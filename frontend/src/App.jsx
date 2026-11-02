import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import './App.css'
import HospitalLayout from './layouts/HospitalLayout'
import AnalyticsDashboard from './pages/hospital/Analytics'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/hospital/analytics" replace />} />

        <Route element={<HospitalLayout />}>
          <Route path="/hospital/analytics" element={<AnalyticsDashboard />} />
          <Route path="/hospital/dashboard" element={<AnalyticsDashboard />} />
          <Route path="/hospital/requests" element={<AnalyticsDashboard />} />
          <Route path="/hospital/donors" element={<AnalyticsDashboard />} />
          <Route path="/hospital/stock" element={<AnalyticsDashboard />} />
          <Route path="/hospital/donations" element={<AnalyticsDashboard />} />
          <Route path="/hospital/settings" element={<AnalyticsDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App