import { useEffect, useMemo, useState } from 'react'

interface TimelineEvent {
  id: string
  date: string
  dateLabel: string
  title: string
  description: string
}

const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'start',
    date: '2025-12-01T00:00:00-07:00',
    dateLabel: 'Dec 1',
    title: 'Contest starts',
    description: 'Begin uploading Dec 2 – Jan 16',
  },
  {
    id: 'deadline',
    date: '2026-01-16T23:59:00-07:00',
    dateLabel: 'Jan 16 @ 11:59 PM',
    title: 'Submissions close',
    description: 'Portal locks at 11:59 PM AZ',
  },
  {
    id: 'voting',
    date: '2026-01-17T00:00:00-07:00',
    dateLabel: 'Jan 17 – 22',
    title: 'Voting window',
    description: 'Vote for In-Person & Online entries',
  },
  {
    id: 'printing',
    date: '2026-01-24T15:30:00-07:00',
    dateLabel: 'Jan 24',
    title: 'TDS × ThereSpace LIVE',
    description: 'Official printing celebration',
  },
]

const firstTimestamp = new Date(TIMELINE_EVENTS[0].date).getTime()
const lastTimestamp = new Date(TIMELINE_EVENTS[TIMELINE_EVENTS.length - 1].date).getTime()

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const getPercentForTime = (timestamp: number) =>
  clamp((timestamp - firstTimestamp) / (lastTimestamp - firstTimestamp), 0, 1) * 100

const getPercentForIndex = (index: number, total: number) =>
  total <= 1 ? 0 : (index / (total - 1)) * 100

const ContestTimeline = () => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60 * 1000)
    return () => window.clearInterval(interval)
  }, [])

  const progressPercent = useMemo(() => getPercentForTime(now), [now])

  return (
    <section className="panel contest-timeline">
      <header className="contest-timeline__header">
        <div>
          <p className="eyebrow">Important dates</p>
          <h2>Contest timeline</h2>
        </div>
        <p className="contest-timeline__summary">
          A single glance at what&apos;s happening now, what just wrapped, and what&apos;s next. The marker updates automatically
          so everyone stays in sync.
        </p>
      </header>

      <div className="timeline-track">
        <div className="timeline-track__line" aria-hidden="true" />
        <div className="timeline-track__progress" style={{ width: `${progressPercent}%` }} aria-hidden="true" />
        <div className="timeline-here" style={{ left: `${progressPercent}%` }}>
          <span className="timeline-here__icon" aria-hidden="true" />
          <span className="timeline-here__label">You&apos;re here</span>
        </div>
        {TIMELINE_EVENTS.map((event, index) => {
          const eventTimestamp = new Date(event.date).getTime()
          const position = getPercentForIndex(index, TIMELINE_EVENTS.length)
          const status = now >= eventTimestamp ? 'past' : 'upcoming'
          return (
            <div
              key={event.id}
              className={`timeline-node timeline-node--${status}`}
              style={{ left: `${position}%` }}
              aria-label={`${event.dateLabel}: ${event.title}`}
            >
              <p className="timeline-node__date">{event.dateLabel}</p>
              <span className="timeline-node__dot" aria-hidden="true" />
              <div className="timeline-node__info">
                <p className="timeline-node__title">{event.title}</p>
                <p className="timeline-node__description">{event.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default ContestTimeline
