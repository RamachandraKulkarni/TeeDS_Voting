import { useEffect, useMemo, useState } from 'react'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { functionsBaseUrl, publicAnonKey } from '../api/supabaseClient'
import { useSession } from '../session'

ChartJS.register(CategoryScale, LinearScale, BarElement, Legend, Tooltip)

type AnalyticsResponse = {
  totals: Array<{ modality: string; designs: number; votes: number }>
  leaderboard: Array<{ design_id: string; filename: string; modality: string; total_votes: number }>
}

const ALLOWED_ADMINS = ['rkulka43@asu.edu', 'arobin13@asu.edu']

const formatModality = (value: string) => {
  if (value === 'online') return 'Online gallery'
  if (value === 'in-person') return 'In-person showcase'
  return value
}

const AdminPage = () => {
  const { session } = useSession()
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const adminEmail = session?.user.email?.toLowerCase() ?? ''
  const isAllowed = Boolean(adminEmail && ALLOWED_ADMINS.includes(adminEmail))

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!isAllowed) return
      try {
        const response = await fetch(`${functionsBaseUrl}/admin-analytics`, {
          headers: {
            apikey: publicAnonKey,
            Authorization: `Bearer ${publicAnonKey}`,
          },
        })

        if (!response.ok) {
          throw new Error('Unable to load analytics')
        }

        const payload = (await response.json()) as AnalyticsResponse
        setAnalytics(payload)
        setStatus(null)
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Analytics request failed')
      }
    }

    fetchAnalytics()
  }, [isAllowed])

  const chartData = useMemo(() => {
    if (!analytics) {
      return null
    }

    const labels = analytics.totals.map((row) => formatModality(row.modality))
    return {
      labels,
      datasets: [
        {
          label: 'Design submissions',
          data: analytics.totals.map((row) => row.designs),
          backgroundColor: '#38bdf8',
        },
        {
          label: 'Votes cast',
          data: analytics.totals.map((row) => row.votes),
          backgroundColor: '#f97316',
        },
      ],
    }
  }, [analytics])

  const leaderboardByModality = useMemo(() => {
    if (!analytics) return {}
    const grouped = analytics.leaderboard.reduce<Record<string, AnalyticsResponse['leaderboard']>>((acc, entry) => {
      acc[entry.modality] = acc[entry.modality] ?? []
      acc[entry.modality].push(entry)
      return acc
    }, {})

    Object.keys(grouped).forEach((key) => {
      grouped[key] = grouped[key]
        .slice()
        .sort((a, b) => b.total_votes - a.total_votes)
    })

    return grouped
  }, [analytics])

  if (!session) {
    return (
      <section className="panel fade-in">
        <h2>Analytics overview</h2>
        <p className="notice">Sign in to view the analytics dashboard.</p>
      </section>
    )
  }

  if (!isAllowed) {
    return (
      <section className="panel fade-in">
        <h2>Analytics overview</h2>
        <p className="notice error">Your account is not authorized to view analytics. Contact the organizers if this is unexpected.</p>
      </section>
    )
  }

  return (
    <section className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="panel">
        <p className="eyebrow">Control room</p>
        <h2 style={{ marginTop: 0 }}>Analytics overview</h2>
        <p className="header-summary">Live counts, aggregated per modality, powered by the Supabase admin edge function.</p>
        {status && <p className="notice error">{status}</p>}
        <div style={{ marginBottom: '1rem', color: 'var(--muted)' }}>Signed in as {session.user.email}</div>

        <div className="stat-grid">
          {analytics?.totals.map((row) => (
            <div key={row.modality} className="stat-card">
              <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>{formatModality(row.modality)}</p>
              <strong>{row.designs}</strong>
              <small style={{ color: 'var(--muted)' }}>{row.votes} votes</small>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          {chartData ? <Bar data={chartData} options={{ responsive: true, plugins: { legend: { labels: { color: '#f8fafc' } } }, scales: { x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.2)' } }, y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.15)' } } } }} /> : <p>Loading chart…</p>}
        </div>
      </div>

      {analytics && (
        <div className="panel">
          <p className="eyebrow">Leaderboard</p>
          <h3 style={{ marginTop: 0 }}>Top votes by modality</h3>
          <div className="leaderboard-grid">
            {Object.entries(leaderboardByModality).map(([modality, rows]) => (
              <div key={modality} className="leaderboard-card">
                <h4 style={{ marginTop: 0, marginBottom: '0.75rem' }}>{formatModality(modality)}</h4>
                <ol>
                  {rows.map((row, index) => (
                    <li key={row.design_id} className="leaderboard-row">
                      <span className="rank-pill">#{index + 1}</span>
                      <div style={{ flexGrow: 1 }}>
                        <strong style={{ display: 'block' }}>{row.filename}</strong>
                        <small style={{ color: 'var(--muted)' }}>{row.total_votes} votes</small>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminPage
