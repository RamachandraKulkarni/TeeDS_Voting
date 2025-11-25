import { Navigate, Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import PrivateRoute from './components/PrivateRoute'
import AdminPage from './pages/AdminPage'
import AuthPage from './pages/AuthPage'
import ErrorNotAdmin from './pages/ErrorNotAdmin'
import UploadPage from './pages/UploadPage'
import VotePage from './pages/VotePage'
import { SessionProvider } from './session'

function App() {
	return (
		<SessionProvider>
			<div className="app-shell">
				<Header />
				<main className="app-main">
					<Routes>
						<Route path="/" element={<Navigate to="/vote" replace />} />
						<Route path="/auth" element={<AuthPage />} />
						<Route
							path="/upload"
							element={
								<PrivateRoute>
									<UploadPage />
								</PrivateRoute>
							}
						/>
						<Route path="/vote" element={<VotePage />} />
						<Route
							path="/admin"
							element={
								<PrivateRoute requireAdmin>
									<AdminPage />
								</PrivateRoute>
							}
						/>
						<Route path="/not-admin" element={<ErrorNotAdmin />} />
						<Route path="*" element={<Navigate to="/vote" replace />} />
					</Routes>
				</main>
			</div>
		</SessionProvider>
	)
}

export default App
