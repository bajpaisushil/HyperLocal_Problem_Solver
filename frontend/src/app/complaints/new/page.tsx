'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { api } from '@/lib/api';
import { COMPLAINT_CATEGORIES } from '@/lib/constants';

export default function NewComplaintPage() {
  const { user } = useRequireAuth();
  const router = useRouter();
  const [form, setForm] = useState({ title: '', description: '', category: '', isCommonArea: false });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recogRef = useRef<any>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      setVoiceSupported(true);
      const r = new SR();
      r.continuous = true;
      r.interimResults = false;
      r.lang = 'en-IN';
      r.onresult = (e: any) => {
        let text = '';
        for (let i = e.resultIndex; i < e.results.length; i++) text += e.results[i][0].transcript;
        setForm((f) => ({ ...f, description: (f.description ? f.description + ' ' : '') + text.trim() }));
      };
      r.onend = () => setListening(false);
      r.onerror = () => setListening(false);
      recogRef.current = r;
    }
  }, []);

  const toggleVoice = () => {
    const r = recogRef.current;
    if (!r) return;
    if (listening) {
      r.stop();
      setListening(false);
    } else {
      try {
        r.start();
        setListening(true);
      } catch {
        /* already started */
      }
    }
  };

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sel = Array.from(e.target.files || []).slice(0, 5);
    setFiles(sel);
    setPreviews(sel.map((f) => URL.createObjectURL(f)));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      if (form.category) fd.append('category', form.category);
      fd.append('isCommonArea', String(form.isCommonArea));
      files.forEach((f) => fd.append('images', f));
      const res = await api<{ complaint: { _id: string }; duplicateWarning: unknown }>('/api/complaints', { method: 'POST', body: fd });
      router.push(`/complaints/${res.complaint._id}${res.duplicateWarning ? '?dup=1' : ''}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl py-6">
      <h1 className="text-2xl font-bold text-ink-900">Report a complaint</h1>
      <p className="mt-1 text-ink-500">AI auto-categorizes, scores severity and checks for duplicates.</p>

      <form onSubmit={submit} className="mt-6 grid gap-5">
        <div className="card p-6">
          <label className="label">Title</label>
          <input required className="input" placeholder="e.g. Water leakage in bathroom" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

          <div className="mt-4 flex items-center justify-between">
            <label className="label mb-0">Description</label>
            {voiceSupported && (
              <button type="button" onClick={toggleVoice} className={`btn !py-1 !px-2.5 text-xs ${listening ? 'bg-rose-600 text-white animate-pulse-ring' : 'btn-ghost'}`}>
                {listening ? '● Listening… tap to stop' : '🎤 Dictate'}
              </button>
            )}
          </div>
          <textarea required rows={4} className="input resize-none" placeholder="Describe the issue…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <label className="label mt-4">Category <span className="font-normal text-ink-400">(optional — AI decides if blank)</span></label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setForm({ ...form, category: '' })} className={`chip ${form.category === '' ? 'chip-active' : ''}`}>🧠 Let AI decide</button>
            {COMPLAINT_CATEGORIES.map((c) => (
              <button type="button" key={c.value} onClick={() => setForm({ ...form, category: c.value })} className={`chip ${form.category === c.value ? 'chip-active' : ''}`}>{c.icon} {c.label}</button>
            ))}
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={form.isCommonArea} onChange={(e) => setForm({ ...form, isCommonArea: e.target.checked })} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
            This is a common-area issue (lift, lobby, security, etc.) — residents can upvote it
          </label>
        </div>

        <div className="card p-6">
          <label className="label">Photos (up to 5)</label>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 bg-ink-50 py-8 text-center transition hover:border-brand-400">
            <span className="text-3xl">📷</span>
            <span className="mt-1 text-sm font-medium text-ink-600">Tap to add photos</span>
            <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={onFiles} />
          </label>
          {previews.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {previews.map((src, i) => <img key={i} src={src} alt="" className="h-20 w-20 rounded-lg object-cover" />)}
            </div>
          )}
        </div>

        {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        <button disabled={busy} className="btn-primary py-3.5 text-base">{busy ? 'Submitting…' : '🚀 Submit complaint'}</button>
      </form>
    </div>
  );
}
