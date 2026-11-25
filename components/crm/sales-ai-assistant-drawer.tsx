'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  Bot,
  X,
  Send,
  Settings,
  Copy,
  Check,
  MessageCircle,
  Mail,
  Sparkles,
  Database,
  FileText,
  ArrowLeft,
  Save,
  Loader2,
  Phone,
  Building2,
} from 'lucide-react'

export interface AssistantLeadContext {
  id: string
  full_name: string
  email: string | null
  phone_number: string | null
  company_name: string | null
  source: string
  stage: string
  estimated_value: number
  initial_note?: string | null
  next_followup_at?: string | null
  followup_title?: string | null
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

interface SalesAiAssistantDrawerProps {
  open: boolean
  onClose: () => void
  agentEmail: string
  orgId?: string
  isAdminView: boolean
  excludeEmails?: string[]
  initialMode: 'lead_draft' | 'pipeline_chat'
  lead: AssistantLeadContext | null
  onLogActivity?: (payload: {
    lead_id?: string | null
    lead_name?: string | null
    activity_type: string
    summary: string
  }) => void
}

const DEFAULT_SYSTEM_PROMPT =
  'You are a concise, high-trust B2B sales and client advisory assistant. Draft polite, clear, human-sounding messages tailored to the client profile and previous notes. Never sound robotic, keep messages brief and action-oriented, and always end with one clear next step.'

const DEFAULT_USER_PROMPT_TEMPLATE =
  'Using the client details and previous notes, draft a personalized {{channel}} message from my point of view based on this instruction: {{instruction}}'

export default function SalesAiAssistantDrawer({
  open,
  onClose,
  agentEmail,
  orgId,
  isAdminView,
  excludeEmails = [],
  initialMode,
  lead,
  onLogActivity,
}: SalesAiAssistantDrawerProps) {
  const [mode, setMode] = useState<'lead_draft' | 'pipeline_chat'>(initialMode)
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp')
  const [showSettings, setShowSettings] = useState(false)

  // Per-agent saved prompts
  const [assistantName, setAssistantName] = useState('Personal Sales AI')
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT)
  const [userPromptTemplate, setUserPromptTemplate] = useState(DEFAULT_USER_PROMPT_TEMPLATE)
  const [autoScanFollowups, setAutoScanFollowups] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Sync mode & reset thread when switching lead or opening
  useEffect(() => {
    if (!open) return
    setMode(lead && initialMode === 'lead_draft' ? 'lead_draft' : 'pipeline_chat')
    setShowSettings(false)
    setMessages([])
    setInputText('')
  }, [open, lead?.id, initialMode])

  // Load per-agent prompt settings
  useEffect(() => {
    if (!open || !agentEmail) return
    let active = true
    fetch(`/api/ai/settings?agentEmail=${encodeURIComponent(agentEmail)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active || !data?.settings) return
        setAssistantName(data.settings.assistant_name || 'Personal Sales AI')
        setSystemPrompt(data.settings.system_prompt || DEFAULT_SYSTEM_PROMPT)
        setUserPromptTemplate(data.settings.user_prompt_template || DEFAULT_USER_PROMPT_TEMPLATE)
        setAutoScanFollowups(data.settings.auto_scan_followups !== false)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [open, agentEmail])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, sending])

  if (!open) return null

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await fetch('/api/ai/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentEmail,
          orgId,
          assistant_name: assistantName,
          system_prompt: systemPrompt,
          user_prompt_template: userPromptTemplate,
          auto_scan_followups: autoScanFollowups,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not save prompt settings')
      toast.success('AI System & User Prompt settings saved!')
      setShowSettings(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save AI settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleSend = async (overrideText?: string) => {
    const promptText = (overrideText ?? inputText).trim()
    if (!promptText || sending) return

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: promptText,
      createdAt: new Date().toISOString(),
    }

    const nextHistory = [...messages, userMsg]
    setMessages(nextHistory)
    setInputText('')
    setSending(true)

    try {
      const res = await fetch('/api/ai/sales-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: mode === 'lead_draft' && lead ? 'lead_draft' : 'pipeline_chat',
          agentEmail,
          orgId,
          leadId: mode === 'lead_draft' && lead ? lead.id : null,
          channel,
          instruction: promptText,
          messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
          customSystemPrompt: systemPrompt,
          customUserPrompt: userPromptTemplate,
          scopeToAgentOnly: !isAdminView,
          excludeEmails,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'AI Assistant could not respond')
      }

      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'No reply returned.',
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err: any) {
      toast.error(err.message || 'AI Assistant error')
    } finally {
      setSending(false)
    }
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const buildWhatsAppSendUrl = (text: string) => {
    if (!lead?.phone_number) return '#'
    let clean = lead.phone_number.replace(/[^0-9]/g, '')
    if (clean.startsWith('0') && clean.length === 10) clean = '254' + clean.slice(1)
    return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`
  }

  const buildEmailSendUrl = (text: string) => {
    if (!lead?.email) return '#'
    const lines = text.split('\n')
    let subject = `Following up — ${lead.company_name || lead.full_name}`
    let body = text
    if (lines[0]?.toLowerCase().startsWith('subject:')) {
      subject = lines[0].replace(/^subject:\s*/i, '').trim()
      body = lines.slice(1).join('\n').trim()
    }
    const params = new URLSearchParams({
      view: 'cm',
      fs: '1',
      to: lead.email,
      su: subject,
      body,
    })
    return `https://mail.google.com/mail/?${params.toString()}`
  }

  const leadQuickPrompts = [
    'Draft a polite follow-up referencing our last note and ask for a 15-min call',
    'Remind them of the upcoming deadline and offer help with next steps',
    'Send a concise check-in summarizing value without sounding pushy',
  ]

  const pipelineQuickPrompts = [
    'Scan my leads and list all overdue or upcoming follow-ups in priority order',
    'Which top 5 highest-value deals should I focus on today?',
    'Summarize my pipeline by channel (Email, WhatsApp, Facebook, Events, Tenders)',
    'Draft a quick morning action plan based on my current lead notes',
  ]

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-slate-950/75 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-950 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{assistantName}</h3>
              <p className="text-[11px] text-slate-400 truncate">
                {showSettings
                  ? 'Customize System & User Prompt'
                  : mode === 'lead_draft' && lead
                  ? `Drafting for ${lead.full_name}`
                  : isAdminView
                  ? 'Reading Organization Pipeline Data'
                  : 'Reading Your Personal Pipeline Data'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowSettings((prev) => !prev)}
              title="AI Prompt Settings"
              className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                showSettings
                  ? 'bg-[#C9A66B] text-slate-950 border-[#C9A66B]'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Switcher Tabs (when not in settings) */}
        {!showSettings && (
          <div className="px-5 pt-3 pb-2 border-b border-slate-800/80 flex items-center justify-between gap-2 bg-slate-950">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              {lead && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('lead_draft')
                    setMessages([])
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    mode === 'lead_draft'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> Draft Message
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMode('pipeline_chat')
                  setMessages([])
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  mode === 'pipeline_chat'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Database className="w-3.5 h-3.5" /> Read My Data
              </button>
            </div>

            {mode === 'lead_draft' && lead && (
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setChannel('whatsapp')}
                  className={`px-2 py-1 rounded font-semibold cursor-pointer ${
                    channel === 'whatsapp'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('email')}
                  className={`px-2 py-1 rounded font-semibold cursor-pointer ${
                    channel === 'email'
                      ? 'bg-sky-500/20 text-sky-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Email
                </button>
              </div>
            )}
          </div>
        )}

        {/* SETTINGS VIEW */}
        {showSettings ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Chat
            </button>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Assistant Name
              </label>
              <input
                type="text"
                value={assistantName}
                onChange={(e) => setAssistantName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                System Prompt (AI Role, Tone & Rules)
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Controls how your personal AI sounds, signs off, and treats your clients.
              </p>
              <textarea
                rows={5}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                User Prompt Template
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Use <code className="text-cyan-400">{'{{channel}}'}</code> and{' '}
                <code className="text-cyan-400">{'{{instruction}}'}</code> placeholders.
              </p>
              <textarea
                rows={4}
                value={userPromptTemplate}
                onChange={(e) => setUserPromptTemplate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 leading-relaxed"
              />
            </div>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-white">Auto-Scan Upcoming Follow-Ups</div>
                <div className="text-[11px] text-slate-400">
                  Scan my individualized pipeline for overdue and due-today reminders.
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoScanFollowups}
                onChange={(e) => setAutoScanFollowups(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </label>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#C9A66B] hover:bg-[#C9A66B]/90 text-slate-950 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {savingSettings ? 'Saving Settings...' : 'Save Prompt Settings'}
            </button>
          </div>
        ) : (
          <>
            {/* Loaded Lead Context Pill */}
            {mode === 'lead_draft' && lead && (
              <div className="mx-5 mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white truncate">{lead.full_name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-semibold">
                    Notes & Context Loaded
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-400">
                  {lead.company_name && (
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-500" /> {lead.company_name}
                    </span>
                  )}
                  {lead.phone_number && (
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <Phone className="w-3 h-3" /> {lead.phone_number}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Chat Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.length === 0 ? (
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                    <div className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      {mode === 'lead_draft' && lead
                        ? `Ready to draft for ${lead.full_name}`
                        : 'Personal Pipeline Data Assistant'}
                    </div>
                    {mode === 'lead_draft' && lead
                      ? 'I already have this contact’s name, phone, company, stage, and previous notes loaded. Tell me your point of view below and I’ll draft the message.'
                      : 'Ask me anything about your lead list — overdue follow-ups, highest-value prospects, channel breakdowns, or today’s priority call list.'}
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Quick Instructions
                    </div>
                    {(mode === 'lead_draft' && lead ? leadQuickPrompts : pipelineQuickPrompts).map((qp) => (
                      <button
                        key={qp}
                        type="button"
                        onClick={() => handleSend(qp)}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
                      >
                        {qp}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[92%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-[#C9A66B] text-slate-950 font-medium'
                          : 'bg-slate-900 border border-slate-800 text-slate-100'
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* 1-Click Actions on AI Draft Replies */}
                    {msg.role === 'assistant' && (
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 cursor-pointer"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          {copiedId === msg.id ? 'Copied' : 'Copy'}
                        </button>

                        {mode === 'lead_draft' && lead?.phone_number && (
                          <a
                            href={buildWhatsAppSendUrl(msg.content)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() =>
                              onLogActivity?.({
                                lead_id: lead.id,
                                lead_name: lead.full_name,
                                activity_type: 'whatsapp_click',
                                summary: `Opened WhatsApp with AI-drafted message for ${lead.full_name}`,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[11px] text-emerald-300 font-semibold"
                          >
                            <MessageCircle className="w-3 h-3" /> Open in WhatsApp
                          </a>
                        )}

                        {mode === 'lead_draft' && lead?.email && (
                          <a
                            href={buildEmailSendUrl(msg.content)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() =>
                              onLogActivity?.({
                                lead_id: lead.id,
                                lead_name: lead.full_name,
                                activity_type: 'email_click',
                                summary: `Opened Email compose with AI-drafted message for ${lead.full_name}`,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-[11px] text-sky-300 font-semibold"
                          >
                            <Mail className="w-3 h-3" /> Open in Email
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}

              {sending && (
                <div className="flex items-center gap-2 text-xs text-cyan-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking with OpenAI...</span>
                </div>
              )}
            </div>

            {/* Chat Input Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="p-4 border-t border-slate-800 bg-slate-900/60"
            >
              <div className="flex items-end gap-2">
                <textarea
                  rows={2}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder={
                    mode === 'lead_draft' && lead
                      ? `Tell AI your angle for ${lead.full_name}...`
                      : 'Ask about your leads, overdue follow-ups, or deal values...'
                  }
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
                />
                <button
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="p-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors disabled:opacity-40 cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
