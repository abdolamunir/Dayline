import React, { useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Chrome,
  Database,
  FolderKanban,
  LockKeyhole,
  Sparkles,
  Target,
} from 'lucide-react';
import { signInWithGoogle } from '../firebase';

const proofCards = [
  {
    name: 'Projects',
    text: 'Ship work without losing the notes, dates, files, and decisions around it.',
  },
  {
    name: 'Goals',
    text: 'Track planning, active, completed, and paused work in one focused view.',
  },
  {
    name: 'Dayline',
    text: 'Capture today, reference later, and keep your account data private.',
  },
];

export function LandingPage() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setError('');
    setIsSigningIn(true);

    try {
      await signInWithGoogle();
    } catch (nextError) {
      console.error(nextError);
      setError('Google sign in could not start. Check Firebase Auth settings and try again.');
      setIsSigningIn(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07070a] text-[#eeeaf2] selection:bg-[#c7a414]/40">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,rgba(20,185,175,0.16),transparent_34%,rgba(199,164,20,0.13)_56%,rgba(255,64,129,0.12)_82%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '76px 76px',
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 92%)',
        }}
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-center px-5 pt-7">
        <nav className="flex w-full max-w-[760px] items-center justify-between rounded-full border border-white/10 bg-white/[0.075] px-4 py-3 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl border border-white/20 bg-white text-[#111014] shadow-inner">
              <Sparkles className="size-4" />
            </div>
            <span className="text-lg font-black tracking-normal text-white">Dayline</span>
          </div>
          <div className="hidden items-center gap-8 text-sm font-bold text-[#a49aaa] sm:flex">
            <a href="#workspace" className="transition hover:text-white">Workspace</a>
            <a href="#privacy" className="transition hover:text-white">Private Sync</a>
            <button onClick={handleSignIn} className="transition hover:text-white">Sign In</button>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="mx-auto flex min-h-[calc(100vh-96px)] max-w-6xl flex-col items-center px-5 pb-20 pt-20 text-center md:pt-24">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#b9b0bd]">
            <LockKeyhole className="size-4 text-[#c7a414]" />
            Google account workspace
          </div>

          <h1 className="max-w-5xl text-[clamp(4rem,11vw,9.4rem)] font-black leading-[0.84] tracking-normal text-[#f5f2ed]">
            Everything you plan is in{' '}
            <span className="inline-flex rounded-[0.22em] bg-[#2f80ff] px-[0.14em] text-white shadow-[0_14px_42px_rgba(47,128,255,0.42)]">
              one
            </span>{' '}
            place.
          </h1>

          <p className="mt-8 max-w-3xl text-xl font-bold leading-8 text-[#8f8792] md:text-2xl">
            Dayline keeps projects, goals, notes, dates, and databases attached to the Google account you use to sign in.
          </p>

          <div className="mt-10 flex w-full max-w-xl flex-col items-center gap-3 sm:flex-row">
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#f3f0ea] px-6 text-base font-black text-[#141216] shadow-[0_18px_60px_rgba(243,240,234,0.18)] transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-wait disabled:opacity-70 sm:flex-1"
            >
              <Chrome className="size-5" />
              {isSigningIn ? 'Opening Google...' : 'Continue with Google'}
              <ArrowRight className="size-5 transition group-hover:translate-x-1" />
            </button>
            <div className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] px-5 text-sm font-black text-[#bdb5c1] sm:w-auto">
              <CheckCircle2 className="size-5 text-[#28d5bd]" />
              Private by account
            </div>
          </div>
          {error ? <p className="mt-4 text-sm font-bold text-[#ff5c93]">{error}</p> : null}

          <div id="workspace" className="mt-16 w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#050506] text-left shadow-[0_42px_120px_rgba(0,0,0,0.62)]">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.045] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-[#129ec9] text-base font-black text-white">US</span>
                <div>
                  <p className="text-sm font-black text-white">Your Dayline</p>
                  <p className="text-xs font-bold text-[#77707c]">Synced after Google sign in</p>
                </div>
              </div>
              <div className="hidden items-center gap-2 text-[#8f8792] sm:flex">
                <span className="h-2 w-2 rounded-full bg-[#28d5bd]" />
                <span className="text-xs font-black uppercase tracking-[0.18em]">Ready</span>
              </div>
            </div>

            <div className="grid gap-px bg-white/10 md:grid-cols-[1fr_1.25fr]">
              <div className="bg-[#08080b] p-6">
                <div className="mb-5 flex items-center gap-3 text-[#8f8792]">
                  <Target className="size-5 text-[#c7a414]" />
                  <span className="text-sm font-black uppercase tracking-[0.18em]">Active Goals</span>
                </div>
                <div className="space-y-3">
                  {['Master TypeScript', 'Travel to Japan', 'Build a Portfolio'].map((item, index) => (
                    <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3">
                      <span className={`size-3 rounded-sm border ${index === 0 ? 'border-[#28d5bd] bg-[#28d5bd]/60' : 'border-[#756d79]'}`} />
                      <span className="font-black text-[#ede9f1]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#08080b] p-6">
                <div className="mb-5 flex items-center gap-3 text-[#8f8792]">
                  <Database className="size-5 text-[#28d5bd]" />
                  <span className="text-sm font-black uppercase tracking-[0.18em]">Database View</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  {[
                    ['srv-web03', 'Online', '#018579'],
                    ['Design sprint', 'Active', '#c7a414'],
                    ['Launch notes', 'Paused', '#5b5970'],
                  ].map(([name, status, color]) => (
                    <div key={name} className="grid grid-cols-[1fr_auto] border-b border-white/10 bg-[#050506] px-4 py-3 last:border-b-0">
                      <span className="font-black text-[#ded9e3]">{name}</span>
                      <span className="rounded-md px-2 py-1 text-xs font-black text-white" style={{ backgroundColor: color }}>
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="privacy" className="mx-auto grid max-w-6xl gap-4 px-5 pb-24 md:grid-cols-3">
          {proofCards.map((card, index) => (
            <article key={card.name} className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
              <div className="mb-8 flex items-center justify-between">
                {index === 0 ? <FolderKanban className="size-6 text-[#c7a414]" /> : index === 1 ? <Target className="size-6 text-[#28d5bd]" /> : <CalendarDays className="size-6 text-[#ff5c93]" />}
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[#706978]">0{index + 1}</span>
              </div>
              <h2 className="text-2xl font-black text-white">{card.name}</h2>
              <p className="mt-3 text-sm font-bold leading-6 text-[#8f8792]">{card.text}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
