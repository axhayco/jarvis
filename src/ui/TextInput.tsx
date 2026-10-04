import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'

interface TextInputProps {
  onQuery?: (query: string) => void
}

export function TextInput({ onQuery }: TextInputProps) {
  const [text, setText] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const phase = useStore((s) => s.phase)
  const isBusy = phase === 'thinking' || phase === 'tooling'

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || !onQuery) return

    onQuery(trimmed)
    setText('')
    if (inputRef.current) {
      inputRef.current.blur()
    }
  }

  // Keyboard shortcut '/' to quickly focus the text input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null
      const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')
      
      if (e.key === '/' && !isTyping) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (phase === 'offline' || phase === 'boot') return null

  return (
    <motion.div
      className={`hud-input-container ${isFocused ? 'focused' : ''} ${isBusy ? 'busy' : ''}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <form onSubmit={handleSubmit} className="hud-input-form">
        <div className="hud-input-prefix">
          <span className="hud-prompt-chevron">◈</span>
          <span className="hud-prompt-label">QUERY</span>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Ask JARVIS anything (or press '/' to focus)..."
          className="hud-input-field"
          autoComplete="off"
          spellCheck="false"
        />

        {text.trim() && (
          <button
            type="submit"
            className="hud-input-submit"
            aria-label="Send Query"
          >
            <span className="hud-submit-text">EXECUTE</span>
            <span className="hud-submit-arrow">↵</span>
          </button>
        )}
      </form>
    </motion.div>
  )
}
