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

    const labels = analytics.totals.map((row) => row.modality)
    return {
      labels,
      datasets: [
        {
          label: 'Design submissions',
          data: analytics.totals.map((row) => row.designs),
          backgroundColor: '#6366f1',
        },
        {
          label: 'Votes cast',
          data: analytics.totals.map((row) => row.votes),
          backgroundColor: '#f97316',
        },
      ],
    }
  }, [analytics])

  if (!session) {
    return <p className="notice">Sign in to view the analytics dashboard.</p>
  }

  if (!isAllowed) {
    return (
      <section>
        <div className="card">
          <h2>Analytics overview</h2>
          <p className="notice error">Your account is not authorized to view analytics. Contact the organizers if this is unexpected.</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="card">
        <h2>Analytics overview</h2>
        <p>Live counts, aggregated per modality, powered by the Supabase admin edge function.</p>
        {status && <p className="notice error">{status}</p>}
        <div style={{ marginBottom: '0.75rem' }}>
          <strong>Signed in as {session.user.email}</strong>
        </div>
        {chartData ? <Bar data={chartData} /> : <p>Loading chart...</p>}
      </div>

      {analytics && (
        <div className="card">
          <h3>Leaderboard</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.5rem 0' }}>Design</th>
                <th style={{ textAlign: 'left' }}>Modality</th>
                <th style={{ textAlign: 'left' }}>Votes</th>
              </tr>
            </thead>
            <tbody>
              {analytics.leaderboard.map((row) => (
                <tr key={row.design_id}>
                  <td style={{ padding: '0.5rem 0' }}>{row.filename}</td>
                  <td>{row.modality}</td>
                  <td>{row.total_votes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default AdminPage
