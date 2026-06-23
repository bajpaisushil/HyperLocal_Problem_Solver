import Link from 'next/link';

const FEATURES = [
  { icon: '🧠', tag: 'AI triage', title: 'Smart complaint triage', desc: 'Every complaint is auto-categorized, severity-scored, summarized and deduped. Critical issues jump the queue automatically.' },
  { icon: '💬', tag: 'Local AI', title: 'Chat with your society data', desc: '“Show pending dues over ₹5,000.” “Which vendors cost us most?” Committee members just ask — the assistant answers.' },
  { icon: '🔧', tag: 'Marketplace', title: 'Verified vendor ecosystem', desc: 'Assign rated, verified vendors to complaints. Track SLA performance and spend per vendor — not just log problems.' },
  { icon: '💰', tag: 'Transparency', title: 'Open finances', desc: 'Live balance sheet, dues collection, spend-by-category and invoice OCR. Every resident sees where the money goes.' },
  { icon: '⏱️', tag: 'Accountability', title: 'SLA engine + trust-but-verify', desc: 'Per-category deadlines with public breach flags. Fixes need photo proof, and residents confirm before close.' },
  { icon: '📊', tag: 'Automation', title: 'One-click committee reports', desc: 'Auto-generated monthly reports and predictive ops (water-tanker forecasts, abnormal-consumption alerts).' },
];

const AUDIENCE = [
  '10–50 flat buildings still run on WhatsApp + Excel',
  'Self-managed RWAs with no full-time staff',
  'Independent apartment blocks & multi-property owners',
];

export default function Landing() {
  return (
    <div className="space-y-20">
      <section className="relative overflow-hidden rounded-3xl border border-ink-100 bg-white px-6 py-16 shadow-soft sm:px-12">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-100/60 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-amber-100/50 blur-3xl" />
        <div className="relative max-w-2xl animate-fade-in-up">
          <span className="badge bg-brand-50 text-brand-700">⚡ AI-powered society operations</span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-ink-900 sm:text-5xl">
            Run your society <span className="text-brand-600">on autopilot.</span>
          </h1>
          <p className="mt-4 text-lg text-ink-600">
            NagarFix turns complaints, vendors, dues and community life into one transparent,
            AI-driven platform — built for self-managed apartment communities, not 500-flat townships.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/register" className="btn-primary px-5 py-3 text-base">Start free</Link>
            <Link href="/login" className="btn-ghost px-5 py-3 text-base">Try the demo</Link>
          </div>
          <p className="mt-3 text-sm text-ink-400">Demo login: committee@demo.com / password123</p>
        </div>
      </section>

      <section>
        <div className="text-center">
          <span className="badge bg-amber-50 text-amber-800">What makes us different</span>
          <h2 className="mt-3 text-2xl font-bold text-ink-900">Most apps just collect complaints. We act on them.</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card group p-6 transition hover:shadow-lift">
              <div className="text-3xl">{f.icon}</div>
              <span className="badge mt-3 bg-ink-50 text-ink-500">{f.tag}</span>
              <h3 className="mt-2 text-lg font-bold text-ink-900">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-ink-900 px-6 py-12 sm:px-12">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Built for the underserved 80%</h2>
            <p className="mt-2 text-ink-300">Big society apps chase large townships. NagarFix is for the small communities everyone ignores.</p>
            <ul className="mt-5 space-y-2">
              {AUDIENCE.map((a) => (
                <li key={a} className="flex items-start gap-2 text-ink-200">
                  <span className="mt-1 text-brand-400">✓</span> {a}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center">
            <Link href="/register" className="btn-primary px-6 py-3 text-base">Onboard your society →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
