'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import type { AssistantAnswer } from '@/lib/types';

interface Msg {
  role: 'user' | 'assistant';
  text: string;
  items?: { label: string; value?: string }[];
}

export default function AssistantPage() {
  const { user } = useRequireAuth();
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', text: "Hi! I'm your society assistant. Ask me about dues, complaints, vendors or expenses." },
  ]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) api<string[]>('/api/assistant/suggestions').then(setSuggestions).catch(() => {});
  }, [user]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  const send = async (q: string) => {
    const query = q.trim();
    if (!query || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: query }]);
    setBusy(true);
    try {
      const res = await api<AssistantAnswer>('/api/assistant', { method: 'POST', body: { query } });
      setMessages((m) => [...m, { role: 'assistant', text: res.answer, items: res.items }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', text: `Sorry — ${(e as Error).message}` }]);
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col py-6" style={{ height: 'calc(100vh - 9rem)' }}>
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">🤖</span>
        <div>
          <h1 className="text-lg font-bold text-ink-900">Society Assistant</h1>
          <p className="text-xs text-ink-400">Chat with your society&apos;s data · <span className="text-brand-600">stub AI, swappable to Claude</span></p>
        </div>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-ink-100 bg-white p-4 shadow-soft">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-ink-50 text-ink-800'}`}>
              <p className="whitespace-pre-line">{m.text}</p>
              {m.items && m.items.length > 0 && (
                <div className="mt-2 space-y-1 rounded-lg bg-white/60 p-2">
                  {m.items.map((it, j) => (
                    <div key={j} className="flex justify-between gap-3 text-xs">
                      <span className="text-ink-600">{it.label}</span>
                      {it.value && <span className="font-semibold text-ink-900">{it.value}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && <div className="flex justify-start"><div className="rounded-2xl bg-ink-50 px-4 py-2.5 text-sm text-ink-400">Thinking…</div></div>}
        <div ref={endRef} />
      </div>

      {suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s) => <button key={s} onClick={() => send(s)} className="chip !text-xs">{s}</button>)}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-3 flex gap-2">
        <input className="input" placeholder="Ask about dues, complaints, vendors…" value={input} onChange={(e) => setInput(e.target.value)} />
        <button disabled={busy} className="btn-primary shrink-0">Send</button>
      </form>
    </div>
  );
}
