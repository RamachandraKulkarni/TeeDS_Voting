import { useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import InstructionsModal from './components/InstructionsModal'
import LoadingSplash from './components/LoadingSplash'
import PrivateRoute from './components/PrivateRoute'
import SiteFooter from './components/SiteFooter'
import { InfoModal, IntroInfoStage, type InfoVariant } from './components/InfoPages'
import AdminPage from './pages/AdminPage'
import AuthPage from './pages/AuthPage'
import ErrorNotAdmin from './pages/ErrorNotAdmin'
import UploadPage from './pages/UploadPage'
import VotePage from './pages/VotePage'
import RulesPage from './pages/RulesPage'
import TimelinePage from './pages/TimelinePage'
import { SessionProvider } from './session'

function App() {
	type ExperienceStage = 'splash' | 'contest' | 'howto' | 'app'
	const [stage, setStage] = useState<ExperienceStage>('splash')
	const [infoModal, setInfoModal] = useState<InfoVariant | null>(null)

	const gateScreen = useMemo(() => {
		switch (stage) {
			case 'splash':
				return <LoadingSplash onFinish={() => setStage('contest')} />
			case 'contest':
				return (
					<IntroInfoStage
						variant="contest"
						actionLabel="Next: How to enter"
						onAdvance={() => setStage('howto')}
					/>
				)
			case 'howto':
				return (
					<IntroInfoStage
						variant="howto"
						actionLabel="Enter the site"
						onAdvance={() => setStage('app')}
					/>
				)
			default:
				return null
		}
	}, [stage])

	return (
		<SessionProvider>
			{stage !== 'app' ? (
				gateScreen
			) : (
				<div className="app-shell">
					<InstructionsModal />
					<Header />
					<main className="app-main">
						<Routes>
							<Route path="/" element={<Navigate to="/vote" replace />} />
							<Route path="/auth" element={<AuthPage />} />
							<Route path="/timeline" element={<TimelinePage />} />
							<Route
								path="/upload"
								element={
									<PrivateRoute>
										<UploadPage />
									</PrivateRoute>
								}
							/>
							<Route path="/vote" element={<VotePage />} />
							<Route path="/rules" element={<RulesPage />} />
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
						<SiteFooter onOpen={(variant) => setInfoModal(variant)} />
						{infoModal && <InfoModal variant={infoModal} onClose={() => setInfoModal(null)} />}
					</div>
			)}
		</SessionProvider>
	)
}

export default App
