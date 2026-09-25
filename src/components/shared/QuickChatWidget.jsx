import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AtSign, MessageSquare, Minus, Send, X } from 'lucide-react'

const DEFAULT_MEMBERS = [
  { id: 'tariq', name: 'Tariq Al-Harbi', role: 'Audit Manager', initials: 'TH', color: '#2563EB' },
  { id: 'sara', name: 'Sara Abdulaziz', role: 'Back Office', initials: 'SA', color: '#059669' },
  { id: 'omar', name: 'Omar Faisal', role: 'Front Office', initials: 'OF', color: '#D97706' },
  { id: 'nora', name: 'Nora Hassan', role: 'Audit Lead', initials: 'NH', color: '#7C3AED' },
  { id: 'faisal', name: 'Faisal Al-Qahtani', role: 'Audit Lead', initials: 'FQ', color: '#0891B2' },
]

const DEFAULT_MESSAGES = [
  { id: 'm1', senderId: 'tariq', text: 'Team — Al-Bashir PBC list has been updated. Please review.', ts: '09:14' },
  { id: 'm2', senderId: 'sara', text: '@tariq Got it. Will review by EOD.', ts: '09:18', mentions: ['tariq'] },
  { id: 'm3', senderId: 'nora', text: 'Riyadh Foods queries sent to client — awaiting responses.', ts: '10:05' },
]

function Avatar({ member, size = 7 }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full text-white text-[10px] font-bold"
      style={{ width: size * 4, height: size * 4, background: member.color }}
    >
      {member.initials}
    </div>
  )
}

function MentionHighlight({ text }) {
  const parts = text.split(/(@\w+(?:\s\w+)?)/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('@')
          ? <span key={i} className="rounded bg-brand/15 px-1 text-brand font-semibold text-[11px]">{part}</span>
          : <span key={i}>{part}</span>
      )}
    </>
  )
}

export default function QuickChatWidget({ members = DEFAULT_MEMBERS, meId = 'tariq', label = 'Quick Chat' }) {
  const [open, setOpen] = useState(false)
  const [minimised, setMinimised] = useState(false)
  const [messages, setMessages] = useState(DEFAULT_MESSAGES)
  const [input, setInput] = useState('')
  const [mentionQuery, setMentionQuery] = useState(null)
  const [mentionIdx, setMentionIdx] = useState(0)
  const [unread, setUnread] = useState(2)
  const inputRef = useRef(null)
  const bottomRef = useRef(null)

  const me = members.find((m) => m.id === meId) || members[0]

  useEffect(() => {
    if (open && !minimised) {
      setUnread(0)
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [open, minimised, messages])

  const mentionMatches = mentionQuery !== null
    ? members.filter((m) => m.id !== me.id && m.name.toLowerCase().includes(mentionQuery.toLowerCase()))
    : []

  const handleInput = (e) => {
    const val = e.target.value
    setInput(val)
    const atIdx = val.lastIndexOf('@')
    if (atIdx !== -1) {
      const query = val.slice(atIdx + 1)
      if (!query.includes(' ')) { setMentionQuery(query); setMentionIdx(0) }
      else setMentionQuery(null)
    } else setMentionQuery(null)
  }

  const insertMention = (member) => {
    const atIdx = input.lastIndexOf('@')
    setInput(`${input.slice(0, atIdx)}@${member.name} `)
    setMentionQuery(null)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (mentionMatches.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIdx((i) => (i + 1) % mentionMatches.length) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIdx((i) => (i - 1 + mentionMatches.length) % mentionMatches.length) }
      if (e.key === 'Enter' && mentionMatches[mentionIdx]) { e.preventDefault(); insertMention(mentionMatches[mentionIdx]); return }
      if (e.key === 'Escape') setMentionQuery(null)
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const extractMentions = (text) => {
    const re = /@(\w+(?:\s\w+)?)/g
    const found = []; let m
    while ((m = re.exec(text)) !== null) {
      const matched = members.find((tm) => tm.name.toLowerCase() === m[1].toLowerCase())
      if (matched) found.push(matched.id)
    }
    return found
  }

  const send = () => {
    const text = input.trim()
    if (!text) return
    const mentions = extractMentions(text)
    setMessages((prev) => [...prev, {
      id: `m${Date.now()}`,
      senderId: me.id,
      text,
      ts: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      mentions,
    }])
    setInput('')
    setMentionQuery(null)
  }

  const getMember = (id) => members.find((m) => m.id === id)

  return (
    <div className="fixed bottom-6 right-6 z-[80] flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && !minimised && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-navy px-4 py-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-white/80" />
                <span className="text-sm font-semibold text-white">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setMinimised(true)} className="text-white/60 hover:text-white">
                  <Minus className="h-4 w-4" />
                </button>
                <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Members strip */}
            <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-100 px-4 py-2">
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setInput((v) => `${v}@${m.name} `); inputRef.current?.focus() }}
                  title={`@${m.name}`}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:border-navy hover:text-navy transition-colors"
                >
                  <Avatar member={m} size={5} />
                  <span className="max-w-[60px] truncate">{m.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex h-[240px] flex-col gap-3 overflow-y-auto p-4">
              {messages.map((msg) => {
                const sender = getMember(msg.senderId)
                const isMe = msg.senderId === me.id
                const isDm = msg.mentions?.length > 0
                const canSee = !isDm || isMe || msg.mentions?.includes(me.id)
                if (!canSee) return null
                return (
                  <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                    {sender && <Avatar member={sender} size={6} />}
                    <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && <span className="text-[10px] font-semibold text-slate-500 mb-0.5">{sender?.name.split(' ')[0]}</span>}
                      <div className={`rounded-xl px-3 py-1.5 text-xs leading-relaxed ${isMe ? 'rounded-tr-sm bg-navy text-white' : isDm ? 'rounded-tl-sm bg-brand/10 text-navy border border-brand/20' : 'rounded-tl-sm bg-slate-100 text-navy'}`}>
                        <MentionHighlight text={msg.text} />
                      </div>
                      <span className="mt-0.5 text-[9px] text-slate-400">{msg.ts}</span>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="relative border-t border-slate-100 px-3 py-2.5">
              <AnimatePresence>
                {mentionMatches.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute bottom-full left-3 mb-1.5 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl z-10"
                  >
                    {mentionMatches.map((m, i) => (
                      <button key={m.id} onClick={() => insertMention(m)}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors ${i === mentionIdx ? 'bg-navy/5' : 'hover:bg-slate-50'}`}
                      >
                        <Avatar member={m} size={6} />
                        <div>
                          <p className="font-semibold text-navy">{m.name}</p>
                          <p className="text-[10px] text-slate-400">{m.role}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex items-center gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Message... @Name to mention"
                  className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-navy"
                  style={{ minHeight: 36, maxHeight: 80 }}
                />
                <button onClick={send} disabled={!input.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-white hover:bg-[#D12C35] disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimised banner */}
      <AnimatePresence>
        {open && minimised && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={() => setMinimised(false)}
            className="flex items-center gap-2 rounded-2xl bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-xl"
          >
            <MessageSquare className="h-4 w-4" />
            {label}
          </motion.button>
        )}
      </AnimatePresence>

      {/* FAB */}
      {!open && (
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => { setOpen(true); setMinimised(false) }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-2xl shadow-brand/30 hover:bg-[#D12C35]"
        >
          <MessageSquare className="h-6 w-6" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </motion.button>
      )}
    </div>
  )
}
