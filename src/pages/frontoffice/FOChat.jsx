import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, AtSign } from 'lucide-react'
import FrontOfficeLayout from '../../components/frontoffice/FrontOfficeLayout'
import PageTransition from '../../components/shared/PageTransition'
import { foUser } from '../../data/sampleData'

const TEAM_MEMBERS = [
  { id: 'layla', name: 'Layla Al-Khatib', role: 'FO Manager', initials: 'LK', color: '#E8323C' },
  { id: 'tariq', name: 'Tariq Al-Harbi', role: 'Audit Manager', initials: 'TH', color: '#2563EB' },
  { id: 'sara', name: 'Sara Abdulaziz', role: 'Back Office', initials: 'SA', color: '#059669' },
  { id: 'omar', name: 'Omar Faisal', role: 'Front Office', initials: 'OF', color: '#D97706' },
  { id: 'nora', name: 'Nora Hassan', role: 'Back Office', initials: 'NH', color: '#7C3AED' },
]

const INITIAL_MESSAGES = [
  { id: 'm1', senderId: 'tariq', text: 'Al-Bashir proposal needs to go out today — can someone confirm the CR number?', timestamp: '09:12', mentions: [] },
  { id: 'm2', senderId: 'layla', text: '@tariq CR number is 1010123456 — confirmed with the client yesterday.', timestamp: '09:15', mentions: ['tariq'] },
  { id: 'm3', senderId: 'sara', text: 'Riyadh Food Industries payment of SAR 24,000 has been received. Marking it cleared.', timestamp: '10:02', mentions: [] },
  { id: 'm4', senderId: 'omar', text: '@sara can you share the payment receipt when ready?', timestamp: '10:08', mentions: ['sara'] },
  { id: 'm5', senderId: 'sara', text: 'Sure, will upload to the file shortly.', timestamp: '10:10', mentions: [] },
]

const ME = foUser.id || 'layla'

function Avatar({ member, size = 8 }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full text-white text-xs font-bold`}
      style={{ width: size * 4, height: size * 4, backgroundColor: member.color }}
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
        part.startsWith('@') ? (
          <span key={i} className="rounded bg-brand/15 px-1 text-brand font-semibold">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

export default function FOChat() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [mentionQuery, setMentionQuery] = useState(null)
  const [mentionIdx, setMentionIdx] = useState(0)
  const [dmTarget, setDmTarget] = useState(null)
  const inputRef = useRef(null)
  const bottomRef = useRef(null)

  const me = TEAM_MEMBERS.find((m) => m.id === ME) || TEAM_MEMBERS[0]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const mentionMatches = mentionQuery !== null
    ? TEAM_MEMBERS.filter(
        (m) => m.id !== me.id && m.name.toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : []

  const handleInput = (e) => {
    const val = e.target.value
    setInput(val)

    const atIdx = val.lastIndexOf('@')
    if (atIdx !== -1 && atIdx === val.length - 1) {
      setMentionQuery('')
      setMentionIdx(0)
    } else if (atIdx !== -1) {
      const query = val.slice(atIdx + 1)
      if (!query.includes(' ')) {
        setMentionQuery(query)
        setMentionIdx(0)
      } else {
        setMentionQuery(null)
      }
    } else {
      setMentionQuery(null)
    }
  }

  const insertMention = (member) => {
    const atIdx = input.lastIndexOf('@')
    const before = input.slice(0, atIdx)
    setInput(`${before}@${member.name} `)
    setMentionQuery(null)
    setDmTarget(member)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (mentionMatches.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIdx((i) => (i + 1) % mentionMatches.length) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIdx((i) => (i - 1 + mentionMatches.length) % mentionMatches.length) }
      if (e.key === 'Enter' && mentionMatches[mentionIdx]) { e.preventDefault(); insertMention(mentionMatches[mentionIdx]); return }
      if (e.key === 'Escape') { setMentionQuery(null) }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const extractMentions = (text) => {
    const re = /@(\w+(?:\s\w+)?)/g
    const found = []
    let m
    while ((m = re.exec(text)) !== null) {
      const matched = TEAM_MEMBERS.find((tm) => tm.name.toLowerCase() === m[1].toLowerCase())
      if (matched) found.push(matched.id)
    }
    return found
  }

  const sendMessage = () => {
    const text = input.trim()
    if (!text) return
    const mentions = extractMentions(text)
    const isDm = mentions.length > 0

    const msg = {
      id: `m${Date.now()}`,
      senderId: me.id,
      text,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      mentions,
      dm: isDm ? mentions : null,
    }
    setMessages((prev) => [...prev, msg])
    setInput('')
    setMentionQuery(null)
    setDmTarget(null)
  }

  const getMember = (id) => TEAM_MEMBERS.find((m) => m.id === id)

  return (
    <FrontOfficeLayout title="Team Chat" fullHeight>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex min-h-0 flex-1">
          {/* ── Sidebar: team members ── */}
          <div className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Team Members</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {TEAM_MEMBERS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setInput((v) => `${v}@${m.name} `)
                    setDmTarget(m)
                    inputRef.current?.focus()
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50 transition-colors"
                >
                  <Avatar member={m} size={7} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-navy">{m.name}</p>
                    <p className="text-[10px] text-slate-400">{m.role}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="border-t border-slate-100 p-3">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Click a name or type @Name to send a direct message. Only the mentioned person will see DMs.
              </p>
            </div>
          </div>

          {/* ── Chat area ── */}
          <div className="flex min-w-0 flex-1 flex-col bg-slate-50">
            {/* Channel header */}
            <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-5 py-3">
              <span className="text-sm font-bold text-navy"># Team Channel</span>
              <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-semibold text-emerald">
                {TEAM_MEMBERS.length} members
              </span>
              <span className="ml-auto text-[11px] text-slate-400">Use @Name to send a direct message</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.map((msg) => {
                const sender = getMember(msg.senderId)
                const isMe = msg.senderId === me.id
                const isDm = msg.mentions?.length > 0
                const canSee = !isDm || isMe || msg.mentions.includes(me.id)
                if (!canSee) return null

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    {sender && <Avatar member={sender} size={8} />}
                    <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className="mb-1 flex items-center gap-2">
                        {!isMe && <span className="text-xs font-semibold text-slate-600">{sender?.name}</span>}
                        <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                        {isDm && (
                          <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[9px] font-bold text-brand">DM</span>
                        )}
                      </div>
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          isMe
                            ? 'rounded-tr-sm bg-navy text-white'
                            : isDm
                            ? 'rounded-tl-sm bg-brand/10 text-navy border border-brand/20'
                            : 'rounded-tl-sm bg-white text-navy shadow-sm border border-slate-100'
                        }`}
                      >
                        <MentionHighlight text={msg.text} />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="relative border-t border-slate-200 bg-white px-4 py-3">
              <AnimatePresence>
                {mentionMatches.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute bottom-full left-4 mb-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl z-10"
                  >
                    {mentionMatches.map((m, i) => (
                      <button
                        key={m.id}
                        onClick={() => insertMention(m)}
                        className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${i === mentionIdx ? 'bg-navy/5' : 'hover:bg-slate-50'}`}
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

              {dmTarget && (
                <div className="mb-2 flex items-center gap-1.5 text-xs text-brand">
                  <AtSign className="h-3 w-3" />
                  <span>Direct message to <strong>{dmTarget.name}</strong> — only they can see this</span>
                  <button onClick={() => { setDmTarget(null); setInput('') }} className="ml-auto text-slate-400 hover:text-slate-600">✕</button>
                </div>
              )}

              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Type a message... use @Name to mention someone"
                  className="flex-1 resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-navy"
                  style={{ minHeight: 44, maxHeight: 120 }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white hover:bg-[#D12C35] disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FrontOfficeLayout>
  )
}
