import { useEffect, useRef, useState } from 'react'

const TARGET_TEXT = 'Request access'
const CYCLES_PER_LETTER = 2
const SHUFFLE_TIME = 50
const CHARS = '!@#$%^&*():{};|,.<>/?'

const ErrorNotAdmin = () => (
  <section className="panel highlight fade-in" style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
    <p className="eyebrow">Encrypted zone</p>
    <h2 style={{ marginTop: 0 }}>Admin dashboard locked</h2>
    <p className="header-summary" style={{ margin: '0 auto 1.5rem' }}>
      Only the TEEDS analytics crew can decrypt this view. If you believe you should be on the list, tap the
      button below and we&apos;ll scramble a request.
    </p>
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <EncryptButton />
    </div>
  </section>
)

const EncryptButton = () => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [text, setText] = useState(TARGET_TEXT)

  const stopScramble = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setText(TARGET_TEXT)
  }

  const scramble = () => {
    let pos = 0
    stopScramble()

    intervalRef.current = setInterval(() => {
      const scrambled = TARGET_TEXT.split('')
        .map((char, index) => {
          if (pos / CYCLES_PER_LETTER > index) {
            return char
          }
          const randomIndex = Math.floor(Math.random() * CHARS.length)
          return CHARS[randomIndex]
        })
        .join('')

      setText(scrambled)
      pos += 1

      if (pos >= TARGET_TEXT.length * CYCLES_PER_LETTER) {
        stopScramble()
      }
    }, SHUFFLE_TIME)
  }

  useEffect(() => () => stopScramble(), [])

  return (
    <button type="button" onMouseEnter={scramble} onMouseLeave={stopScramble} className="scramble-button">
      <div className="scramble-button__content">
        <span className="scramble-button__icon" aria-hidden>
          🔐
        </span>
        <span>{text}</span>
      </div>
      <span className="scramble-button__glint" aria-hidden />
    </button>
  )
}

export default ErrorNotAdmin
