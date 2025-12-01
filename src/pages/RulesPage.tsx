import { Link } from 'react-router-dom'

const RulesPage = () => {
  return (
    <section className="panel rules-panel fade-in">
      <header className="rules-panel__header">
        <p className="eyebrow">TEE-DS 2026</p>
        <h1>TEE-DS 2026 T-Shirt Contest &mdash; Official Rules &amp; Eligibility</h1>
        <p className="rules-panel__intro">
          Everything you need to know about how to enter, what to submit, and how the TEE-DS showcase crowns its champions.
        </p>
        <div className="rules-meta">
          <div>
            <p className="rules-meta__label">Event title</p>
            <p className="rules-meta__value">TEE-DS: The Design School T-Shirt Contest 2026</p>
          </div>
          <div>
            <p className="rules-meta__label">Hosts</p>
            <p className="rules-meta__value">The Design School, There Space</p>
          </div>
          <div>
            <p className="rules-meta__label">Live date</p>
            <p className="rules-meta__value">January 24, 2026 &middot; 3:30&ndash;6:30 PM MST</p>
          </div>
          <div>
            <p className="rules-meta__label">Location</p>
            <p className="rules-meta__value">The Design School at ASU, North &mdash; Red Square</p>
          </div>
        </div>
      </header>

      <section className="rule-section">
        <h2>1. Eligibility</h2>
        <p>Open to all students enrolled in disciplines within The Design School (TDS).</p>
        <p>Students may participate as either Online or In-Person depending on their program modality.</p>
      </section>

      <section className="rule-section">
        <h2>2. Entry Limits</h2>
        <p>Each student may submit a maximum of two entries total.</p>
        <ul>
          <li>ONE submission per modality only.</li>
          <li>Online students may submit one Online entry.</li>
          <li>In-Person students may submit one In-Person entry.</li>
          <li>Students cannot submit across modalities (e.g., in-person students cannot submit an online design and vice versa).</li>
        </ul>
      </section>

      <section className="rule-section">
        <h2>3. Submission Requirements</h2>
        <p>All submitted designs must:</p>
        <ul>
          <li>Be original work created entirely by the student.</li>
          <li>Contain no AI-generated imagery or AI-assisted artwork.</li>
          <li>
            Not include offensive imagery, hate speech, explicit content, discriminatory symbols, or anything that violates ASU community standards.
          </li>
          <li>Follow the approved submission format listed on the contest submission page (PDF, PNG, template file, etc.).</li>
          <li>Be uploaded through the designated contest portal/form.</li>
        </ul>
      </section>

      <section className="rule-section">
        <h2>4. Deadline</h2>
        <p>All entries must be submitted by January 16, 2026 at 11:59 PM (Arizona Time).</p>
        <p>Late submissions will not be accepted.</p>
      </section>

      <section className="rule-section">
        <h2>5. Judging &amp; Voting</h2>
        <h3>Voting Structure</h3>
        <ul>
          <li>Voting is open to all TDS students across modalities.</li>
          <li>Each student receives two total votes: one vote for an In-Person entry and one vote for an Online entry.</li>
          <li>Students cannot cast both votes in the same category.</li>
        </ul>
        <h3>Winner Determination</h3>
        <ul>
          <li>Grand Prize Winner &mdash; the top-voted design across all entries.</li>
          <li>1st Place In-Person Winner.</li>
          <li>1st Place Online Winner.</li>
          <li>2nd Place &mdash; next highest vote count after category winners.</li>
          <li>3rd Place &mdash; following 2nd place in vote totals.</li>
          <li>Faculty Favorite &mdash; selected independently by TDS faculty.</li>
        </ul>
      </section>

      <section className="rule-section">
        <h2>6. Prizes</h2>
        <h3>Grand Prize Winner receives:</h3>
        <ul>
          <li>Bragging rights as the first-ever TEE-DS Champion.</li>
          <li>$100 Blick Gift Card.</li>
          <li>TDS Swag Package + Generous Devils Swag Package.</li>
          <li>One-month membership to ThereSpace.</li>
          <li>Recognition across TDS promotion and future contest marketing.</li>
          <li>The 2026 TDS shirt produced and sold with their design.</li>
        </ul>
        <p>Additional awards: 2nd place (two winners), 3rd place (one winner), Faculty Choice (one winner). Other honorees receive certificates, social recognition, and potential printed promotion on TDS channels.</p>
      </section>

      <section className="rule-section">
        <h2>7. Rights &amp; Usage</h2>
        <ul>
          <li>Students retain full ownership of their artwork.</li>
          <li>Winners grant TDS a non-exclusive, royalty-free license to reproduce, print, display, and promote their work for TDS and TEE-DS contest purposes.</li>
          <li>ASU may make minor production adjustments (e.g., sizing, color separation).</li>
        </ul>
      </section>

      <section className="rule-section">
        <h2>8. Disqualification</h2>
        <p>Entries may be removed if they:</p>
        <ul>
          <li>Contain any form of plagiarism.</li>
          <li>Include AI-generated content.</li>
          <li>Violate ASU&apos;s student code of conduct.</li>
          <li>Are submitted after the deadline.</li>
          <li>Break submission formatting rules.</li>
          <li>Are submitted to the incorrect modality category.</li>
        </ul>
      </section>

      <section className="rule-section">
        <h2>9. Anti-AI Policy</h2>
        <p>All submissions must be 100% original work created by the student.</p>
        <p>Use of AI-generated imagery, AI-assisted artwork, templates, stock graphics, or previously published designs is not permitted.</p>
        <p>Students may use digital tools (Illustrator, Photoshop, Procreate, etc.), but every illustration, lettering choice, composition, and design decision must be created by the student&apos;s own hand and mind.</p>
        <p>By entering, you affirm that:</p>
        <ul>
          <li>Your artwork is self-created and unique.</li>
          <li>No part of the imagery, lettering, textures, or concepts were generated, altered, or enhanced by AI image tools.</li>
          <li>You hold full rights to the work and it does not infringe on any copyright, trademark, or previously existing design.</li>
        </ul>
        <p>Violation of this policy may result in disqualification from the contest.</p>
      </section>

      <div className="rules-panel__cta">
        <p className="rules-panel__tagline">TEE-DS 2026 &mdash; Wear your discipline. Design for life.</p>
        <Link to="/vote" className="glow-button">
          Return to Voting
        </Link>
      </div>
    </section>
  )
}

export default RulesPage
