import { ReactElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../session'

type PrivateRouteProps = {
  children: ReactElement
  requireAdmin?: boolean
}

const PrivateRoute = ({ children, requireAdmin = false }: PrivateRouteProps) => {
  const location = useLocation()
  const { session } = useSession()

  if (!session) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />
  }

  if (requireAdmin && !session.user.isAdmin) {
    return <Navigate to="/not-admin" replace />
  }

  return children
}

export default PrivateRoute
