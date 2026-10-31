import { Outlet } from 'react-router-dom'

import Sidebar from '../componenets/navigation/Sidebar'

function HospitalLayout() {
  return (
    <div className="bl-dashboard">
      <Sidebar />
      <Outlet />
    </div>
  )
}

export default HospitalLayout
