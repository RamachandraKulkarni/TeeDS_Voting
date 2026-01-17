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
import { functionsBaseUrl, publicAnonKey, getDesignPublicUrl } from '../api/supabaseClient'
import { useSession } from '../session'
import { getModalityLabel } from '../constants/modalities'

ChartJS.register(CategoryScale, LinearScale, BarElement, Legend, Tooltip)

type ContactMessage = {
  id: string
  sender_name: string
  sender_email: string
  topic: string | null
  message: string
  created_at: string | null
}

type AnalyticsResponse = {
  ok: boolean
  totals: Array<{ modality: string; designs: number; votes: number }>
  rsvpCounts?: { yes: number; no: number; total: number }
  leaderboard: Array<{
    design_id: string
    filename: string
    artwork_name: string | null
    student_name: string | null
    major: string | null
    year_level: string | null
    asurite: string | null
    modality: string
    storage_path?: string
    total_votes: number
  }>
  topDesign?: {
    design_id: string
    filename: string
    artwork_name: string | null
    student_name: string | null
    major: string | null
    year_level: string | null
    asurite: string | null
    modality: string
    storage_path?: string
    total_votes: number
  } | null
  designs?: Array<{
    id: string
    filename: string
    artwork_name: string | null
    student_name: string | null
    major: string | null
    year_level: string | null
    asurite: string | null
    modality: string
    storage_path: string
    submitter_id: string | null
    submitter: {
      id: string
      email: string | null
      full_name: string | null
      asu_id: string | null
      discipline: string | null
    } | null
  }>
  users: Array<{
    id: string
    email: string | null
    full_name: string | null
    asu_id: string | null
    discipline: string | null
    created_at: string | null
  }>
  contacts: ContactMessage[]
}

type AdminDesign = NonNullable<AnalyticsResponse['designs']>[number]

const ALLOWED_ADMINS = ['rkulka43@asu.edu', 'arobin13@asu.edu']

const AdminPage = () => {
  const { session } = useSession()
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [showUsersModal, setShowUsersModal] = useState(false)

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

    const labels = analytics.totals.map((row) => getModalityLabel(row.modality))
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

  const designsByModality = useMemo(() => {
    if (!analytics?.designs) return {} as Record<string, AdminDesign[]>
    return analytics.designs.reduce((acc, design) => {
      const bucket = acc[design.modality] ?? []
      bucket.push(design)
      acc[design.modality] = bucket
      return acc
    }, {} as Record<string, AdminDesign[]>)
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
        <div style={{ marginBottom: '1rem', color: 'var(--muted)' }}>
          Signed in as {session.user.fullName ?? session.user.email}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="ghost-button" type="button" onClick={() => setShowUsersModal(true)}>
            View signed-in users
          </button>
        </div>

        <div className="stat-grid">
          {analytics?.rsvpCounts && (
            <div className="stat-card">
              <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>Live event RSVP</p>
              <strong>{analytics.rsvpCounts.yes}</strong>
              <small style={{ color: 'var(--muted)' }}>{analytics.rsvpCounts.no} not attending</small>
            </div>
          )}
          {analytics?.totals.map((row) => (
            <div key={row.modality} className="stat-card">
              <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>{getModalityLabel(row.modality)}</p>
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
          <p className="eyebrow">Live leader</p>
          <h3 style={{ marginTop: 0 }}>Top voted design</h3>
          {analytics.topDesign ? (
            <div className="design-card" style={{ maxWidth: '420px' }}>
              <div className="design-media">
                <img
                  src={analytics.topDesign.storage_path ? getDesignPublicUrl(analytics.topDesign.storage_path) : ''}
                  alt={analytics.topDesign.artwork_name ?? analytics.topDesign.filename}
                />
              </div>
              <h4 style={{ margin: 0 }}>{analytics.topDesign.artwork_name ?? analytics.topDesign.filename}</h4>
              <p style={{ margin: 0, color: 'var(--muted)' }}>
                {getModalityLabel(analytics.topDesign.modality)} · {analytics.topDesign.total_votes} votes
              </p>
            </div>
          ) : (
            <p className="notice">No votes yet. Top design will appear after voting starts.</p>
          )}
        </div>
      )}

      {analytics && (
        <div className="panel">
          <p className="eyebrow">Leaderboard</p>
          <h3 style={{ marginTop: 0 }}>Top votes by modality</h3>
          <div className="leaderboard-grid">
            {Object.entries(leaderboardByModality).map(([modality, rows]) => (
              <div key={modality} className="leaderboard-card">
                <h4 style={{ marginTop: 0, marginBottom: '0.75rem' }}>{getModalityLabel(modality)}</h4>
                <ol>
                  {rows.map((row, index) => (
                    <li key={row.design_id} className="leaderboard-row">
                      <span className="rank-pill">#{index + 1}</span>
                      <div style={{ flexGrow: 1 }}>
                        <strong style={{ display: 'block' }}>{row.artwork_name ?? row.filename}</strong>
                        <small style={{ color: 'var(--muted)' }}>{row.student_name ?? 'Unknown student'}</small>
                        {(() => {
                          const line = [row.major, row.year_level, row.asurite].filter(Boolean).join(' · ')
                          if (!line) return null
                          return (
                            <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{line}</div>
                          )
                        })()}
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

      {analytics && (
        <div className="panel">
          <p className="eyebrow">Contact inbox</p>
          <h3 style={{ marginTop: 0 }}>Messages from the site</h3>
          <p className="header-summary" style={{ marginBottom: '1rem' }}>
            Captures inquiries submitted through the Contact Us form in the footer.
          </p>
          {analytics.contacts.length === 0 ? (
            <p className="notice">No messages yet.</p>
          ) : (
            <ul className="contact-list">
              {analytics.contacts.map((message) => (
                <li key={message.id} className="contact-card">
                  <div className="contact-card__header">
                    <div>
                      <strong>{message.sender_name}</strong>
                      <div style={{ color: 'var(--muted)' }}>{message.sender_email}</div>
                    </div>
                    <time dateTime={message.created_at ?? undefined}>
                      {message.created_at ? new Date(message.created_at).toLocaleString() : '—'}
                    </time>
                  </div>
                  {message.topic && (
                    <div className="contact-card__topic">{message.topic}</div>
                  )}
                  <p className="contact-card__body">{message.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {analytics && (
        <div className="panel">
          <p className="eyebrow">Design submissions</p>
          <h3 style={{ marginTop: 0 }}>Who submitted what</h3>
          <p className="header-summary" style={{ marginBottom: '1rem' }}>
            Visible only to admins. Shows the submitter details for each design.
          </p>
          {Object.keys(designsByModality).length === 0 ? (
            <p className="notice">No designs loaded yet.</p>
          ) : (
            (Object.entries(designsByModality) as Array<[string, AdminDesign[]]>).map(([modality, designs]) => (
              <div key={modality} style={{ marginBottom: '2rem' }}>
                <h4 style={{ margin: '0 0 0.75rem' }}>{getModalityLabel(modality)}</h4>
                <div className="design-grid">
                  {designs.map((design) => (
                    <div key={design.id} className="design-card">
                      <div className="design-media">
                        <img
                          src={getDesignPublicUrl(design.storage_path)}
                          alt={design.artwork_name ?? design.filename}
                        />
                      </div>
                      <h4 style={{ margin: 0 }}>{design.artwork_name ?? design.filename}</h4>
                      <p style={{ margin: 0, color: 'var(--muted)' }}>{getModalityLabel(design.modality)}</p>
                      <div style={{ marginTop: '0.35rem' }}>
                        <strong style={{ display: 'block' }}>{design.submitter?.full_name ?? 'Unknown submitter'}</strong>
                        <small style={{ color: 'var(--muted)' }}>{design.submitter?.email ?? 'No email on file'}</small>
                        {(() => {
                          const line = [design.submitter?.discipline, design.submitter?.asu_id].filter(Boolean).join(' · ')
                          if (!line) return null
                          return <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{line}</div>
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showUsersModal && analytics && (
        <div className="modal-overlay instructions-overlay" role="dialog" aria-modal="true">
          <div className="modal-content instructions-modal user-modal">
            <button className="ghost-button modal-close" type="button" onClick={() => setShowUsersModal(false)}>
              Close
            </button>
            <p className="eyebrow">Signed-in roster</p>
            <h3 style={{ marginTop: 0 }}>Registered users</h3>
            <p className="header-summary" style={{ marginBottom: '1rem' }}>
              Pulled from the Supabase <code>users</code> table. Sorted by newest.
            </p>
            {analytics.users.length === 0 ? (
              <p className="notice">No users have signed in yet.</p>
            ) : (
              <ul className="user-list">
                {analytics.users.map((user) => (
                  <li key={user.id}>
                    <div>
                      <strong>{user.full_name ?? 'Unknown student'}</strong>
                      <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{user.email ?? 'No email on file'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div>{user.asu_id ?? '—'}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{user.discipline ?? 'Discipline n/a'}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{user.created_at ? new Date(user.created_at).toLocaleString() : ''}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminPage
