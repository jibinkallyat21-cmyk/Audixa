import { Navigate, Outlet } from 'react-router-dom'
import { getPortal, homeFor } from '../../utils/portalSession'

// Renders the nested routes only for the signed-in portal. Signed out → login;
// signed in to a different portal → that portal's home.
export default function RequirePortal({ portal }) {
  const current = getPortal()
  if (!current) return <Navigate to="/login" replace />
  if (current !== portal) return <Navigate to={homeFor(current)} replace />
  return <Outlet />
}
