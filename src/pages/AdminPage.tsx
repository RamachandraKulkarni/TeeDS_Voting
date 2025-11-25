import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { functionsBaseUrl } from '../api/supabaseClient'

ChartJS.register(CategoryScale, LinearScale, BarElement, Legend, Tooltip)

type AnalyticsResponse = {
  totals: Array<{ modality: string; designs: number; votes: number }>
  leaderboard: Array<{ design_id: string; filename: string; modality: string; total_votes: number }>
}

const AdminPage = () => {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [secretInput, setSecretInput] = useState('')
  const [adminSecret, setAdminSecret] = useState(() =>
    typeof window !== 'undefined' ? window.sessionStorage.getItem('teeds.adminSecret') ?? '' : '',
  )

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!adminSecret) return
      try {
        const response = await fetch(`${functionsBaseUrl}/admin-analytics`, {
          headers: {
            'X-Admin-Secret': adminSecret,
          },
        })

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid admin secret')
          }
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
  }, [adminSecret])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!secretInput.trim()) {
      setStatus('Enter the shared admin key to continue.')
      return
    }
    setStatus(null)
    setAdminSecret(secretInput.trim())
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('teeds.adminSecret', secretInput.trim())
    }
  }

  const handleReset = () => {
    setAnalytics(null)
    setAdminSecret('')
    setSecretInput('')
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('teeds.adminSecret')
    }
  }

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

  if (!adminSecret) {
    return (
      <section>
        <div className="card">
          <h2>Enter admin key</h2>
          <p>This dashboard is locked behind a shared passphrase. Ask the organizers for the key.</p>
          {status && <p className="notice error">{status}</p>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="password"
              placeholder="Admin secret"
              value={secretInput}
              onChange={(event) => setSecretInput(event.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit">Unlock</button>
          </form>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Admin key active</strong>
          <button type="button" onClick={handleReset} style={{ fontSize: '0.85rem' }}>
            Lock dashboard
          </button>
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
