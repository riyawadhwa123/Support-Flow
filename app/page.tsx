import Link from 'next/link';
import { ArrowRight, Bot, Headphones, Shield, Sparkles, Waves, Zap, PhoneCall, BarChart3, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';

const featureTiles = [
  {
    title: 'Voice-first by design',
    description: 'Natural, low-latency conversations powered by ElevenLabs and real-time streaming.',
    icon: Waves,
  },
  {
    title: 'Omnichannel routing',
    description: 'Handle phone, chat, and outbound sequences from one unified workspace.',
    icon: Globe,
  },
  {
    title: 'Enterprise grade',
    description: 'SSO-ready auth, audit-friendly logging, and rate-limited webhooks baked in.',
    icon: Shield,
  },
];

const highlights = [
  {
    title: 'Human-like AI agents',
    desc: 'Design agents with guardrails, memory, and tools that act inside your stack.',
    icon: Bot,
    accent: 'from-blue-500/20 via-cyan-500/20 to-transparent',
  },
  {
    title: 'Voice intelligence',
    desc: 'Understand intent, sentiment, and call outcomes with built-in analytics.',
    icon: Headphones,
    accent: 'from-indigo-500/20 via-purple-500/20 to-transparent',
  },
  {
    title: 'Automation that ships',
    desc: 'Trigger workflows, send outbound calls, and sync CRM notes automatically.',
    icon: Zap,
    accent: 'from-amber-500/20 via-orange-500/20 to-transparent',
  },
];

const stats = [
  { label: 'Faster handoffs', value: '3x', detail: 'less time to resolution' },
  { label: 'Calls answered', value: '24/7', detail: 'global availability' },
  { label: 'Agent cost', value: '-70%', detail: 'vs. traditional teams' },
];

const steps = [
  { title: 'Connect data', body: 'Plug in your knowledge base, docs, and CRM in minutes.' },
  { title: 'Compose the voice', body: 'Pick a voice, set intent guardrails, and test live.' },
  { title: 'Launch everywhere', body: 'Assign phone numbers, embed chat, and automate follow-ups.' },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06070b] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.14),transparent_23%),radial-gradient(circle_at_80%_0%,rgba(236,72,153,0.12),transparent_20%),radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.14),transparent_23%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#06070b] via-[#0b0d12]/60 to-[#06070b]" />
      <div className="relative isolate px-6 pb-24 pt-10 md:px-12 lg:px-16">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
              <Sparkles className="h-5 w-5 text-indigo-200" />
            </div>
            {/* <div>
              <p className="text-xs uppercase tracking-[0.28em] text-indigo-200/70">SupportFlow AI</p>
              <p className="text-sm text-slate-200/70">Conversational intelligence platform</p>
            </div> */}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="text-sm text-slate-200 hover:text-white transition-colors">
              Sign in
            </Link>
            <Button asChild className="bg-white text-slate-950 hover:bg-slate-100">
              <Link href="/login">
                Start now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-20 max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-indigo-100 shadow-lg shadow-indigo-500/20 backdrop-blur">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-100">
              <PhoneCall className="h-4 w-4" />
            </div>
            Voice-native agents that your customers actually want to call.
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
            Build AI agents that pick up, solve problems, and close the loop.
          </h1>
          <p className="mt-6 text-lg text-slate-200/80 md:text-xl">
            Launch production-ready voice experiences in minutes. SupportFlow AI gives you live call handling,
            guardrailed reasoning, and real-time analytics in one sleek workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild className="bg-indigo-500 hover:bg-indigo-400 text-white">
              <Link href="/login">
                Launch a demo agent
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white/20 bg-white/5 text-white hover:bg-white/10">
              <Link href="/login">Talk to us</Link>
            </Button>
          </div>
          <div className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-indigo-900/30 backdrop-blur md:grid-cols-3">
            {featureTiles.map((feature) => (
              <div key={feature.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                  <feature.icon className="h-5 w-5 text-indigo-200" />
                </div>
                <div className="text-left">
                  <p className="text-base font-semibold">{feature.title}</p>
                  <p className="mt-2 text-sm text-slate-200/80">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-20 grid max-w-6xl gap-6 md:grid-cols-[1.1fr,0.9fr]">
          <Card className="border-white/10 bg-white/5 text-white shadow-xl shadow-indigo-900/30 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Live agent console</CardTitle>
                <p className="mt-2 text-sm text-slate-200/70">
                  Monitor calls, swap voices, and update tools without redeploying.
                </p>
              </div>
              <div className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-100">
                Real-time
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <p className="text-3xl font-bold text-indigo-200">23</p>
                  <p className="text-xs text-slate-300/70">Active calls</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <p className="text-3xl font-bold text-emerald-200">98%</p>
                  <p className="text-xs text-slate-300/70">Intent match</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <p className="text-3xl font-bold text-amber-200">7s</p>
                  <p className="text-xs text-slate-300/70">Avg. response</p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20">
                      <Headphones className="h-5 w-5 text-indigo-100" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-100">Handling: Billing escalation</p>
                      <p className="text-xs text-emerald-200">Confidence 0.93 · Handoff disabled</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Live sentiment</p>
                    <p className="text-lg font-semibold text-emerald-200">Positive</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200/90">
                    <p className="text-xs text-slate-400">Guardrails</p>
                    <p className="mt-1">Escalate if auth fails twice.</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200/90">
                    <p className="text-xs text-slate-400">Tools</p>
                    <p className="mt-1">Payments, CRM notes, ticketing.</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200/90">
                    <p className="text-xs text-slate-400">Outcome</p>
                    <p className="mt-1">Issue solved · SMS recap sent.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 text-white shadow-lg shadow-indigo-900/30 backdrop-blur"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${item.accent}`} aria-hidden />
                <div className="relative flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                    <item.icon className="h-6 w-6 text-indigo-100" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{item.title}</p>
                    <p className="mt-2 text-sm text-slate-100/80">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-20 max-w-6xl">
          <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-indigo-900/30 backdrop-blur md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-indigo-200/80">How it works</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-white md:text-4xl">
                Go live in an afternoon.
              </h2>
              <p className="mt-2 text-slate-200/80">
                The fastest path from idea to production voice agent—no brittle scripts.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-left">
                  <p className="text-xs text-slate-400">{stat.label}</p>
                  <p className="text-2xl font-semibold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-300/70">{stat.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, idx) => (
              <Card key={step.title} className="border-white/10 bg-slate-900/70 text-white backdrop-blur">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-100">
                      {idx + 1}
                    </div>
                    <CardTitle className="text-lg font-semibold">{step.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-slate-200/80">{step.body}</CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-5xl rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-[1px] shadow-2xl shadow-indigo-900/40">
          <div className="rounded-3xl bg-slate-950/90 px-6 py-10 text-center backdrop-blur">
            <p className="text-sm uppercase tracking-[0.28em] text-indigo-100/90">Ready to launch?</p>
            <h3 className="mt-4 text-3xl font-semibold text-white md:text-4xl">
              Put a confident voice in front of every customer.
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-base text-indigo-100/80">
              Spin up an agent, connect your tools, and start taking calls today. SupportFlow AI keeps your brand human while automation handles the heavy lifting.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild className="bg-white text-slate-950 hover:bg-slate-100">
                <Link href="/login">
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-white/30 bg-white/5 text-white hover:bg-white/10">
                <Link href="/login">See the console</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

