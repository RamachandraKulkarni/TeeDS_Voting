import { Link } from 'react-router-dom'

const TIMELINE_DETAILS = [
  {
    date: 'December 1',
    title: 'Contest officially begins',
    description: 'TEE-DS announcements drop to every TDS modality. Review the upload instructions, confirm your modality, and start sketching concepts.',
    bullets: [
      'Kickoff events and studio reminders highlight the Life-Centered Design theme.',
      'Decide whether you will submit to the Online or In-Person category (max one per modality).',
      'Use the day to align with teammates, gather inspiration, and plan your garment story.',
    ],
  },
  {
    date: 'December 2 – January 16',
    title: 'Upload window stays open',
    description: 'The submission portal accepts up to two entries (one per modality) through January 16.',
    bullets: [
      'Finalize artwork in PDF/PNG format using the provided template.',
      'You can update files any time before the deadline—just remember to replace older uploads.',
      'Double-check naming conventions, descriptions, and contact details before hitting submit.',
    ],
  },
  {
    date: 'January 16 · 11:59 PM AZ',
    title: 'Submissions close',
    description: 'The portal locks the moment the clock hits 11:59 PM Arizona time.',
    bullets: [
      'Late files, emails, or DMs cannot be accepted after the system closes.',
      'Confirm both modality entries (if applicable) are marked “Complete.”',
      'Share final reminders with classmates—this is the last call for uploads.',
    ],
  },
  {
    date: 'January 17 – 22',
    title: 'Student voting',
    description: 'All TDS students receive two ballots—one for Online, one for In-Person entries.',
    bullets: [
      'Encourage peers to browse the gallery and cast both votes.',
      'Voting tallies refresh daily so you can see momentum build.',
      'Faculty favorite judging also happens during this stretch.',
    ],
  },
  {
    date: 'January 24',
    title: 'TDS × ThereSpace LIVE',
    description: 'Winners are revealed during the live printing celebration at Red Square.',
    bullets: [
      'Grand Prize and modality champions are announced on stage.',
      'Live screen-printing showcases the winning tee immediately.',
      'Celebrate with the community, grab swag, and document the moment for future promotion.',
    ],
  },
]

const TimelinePage = () => {
  return (
    <section className="page-section timeline-page fade-in">
      <header className="timeline-page__header">
        <div>
          <p className="eyebrow">Important dates</p>
          <h1>TEE-DS 2026 timeline</h1>
        </div>
        <p className="timeline-page__summary">
          A narrative look at every milestone—from the December kickoff through the January 24 ThereSpace printing. Use it to
          plan studio time, rally collaborators, and keep your cohort informed.
        </p>
      </header>

      <div className="timeline-page__intro">
        <div className="timeline-callout">Contest starts December 1. Begin uploading December 2 – January 16.</div>
        <div className="timeline-callout">Voting happens January 17 – 22. Winners + live printing on January 24.</div>
      </div>

      <div className="timeline-milestones">
        {TIMELINE_DETAILS.map((milestone) => (
          <article key={milestone.date} className="timeline-card">
            <p className="timeline-card__date">{milestone.date}</p>
            <h2 className="timeline-card__title">{milestone.title}</h2>
            <p className="timeline-card__description">{milestone.description}</p>
            <ul className="timeline-card__list">
              {milestone.bullets.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="timeline-page__cta">
        <p className="rules-panel__intro">Need every rule, policy, and eligibility detail? Dive into the official handbook.</p>
        <Link to="/rules" className="ghost-button">
          View Official Rules
        </Link>
      </div>
    </section>
  )
}

export default TimelinePage
