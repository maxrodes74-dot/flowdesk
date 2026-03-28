'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Menu,
  X,
  Sparkles,
  Layout,
  CreditCard,
  Check,
  ArrowRight,
  Star,
  Clock,
  Zap,
  Shield,
  ChevronDown,
  Quote,
  Users,
  TrendingUp,
  FileText,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Intersection-observer hook for scroll-triggered entrance animations */
/* ------------------------------------------------------------------ */
function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}

/* ------------------------------------------------------------------ */
/*  Animated counter for social-proof numbers                          */
/* ------------------------------------------------------------------ */
function AnimatedNumber({
  target,
  prefix = '',
  suffix = '',
  duration = 1600,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [value, setValue] = useState(0);
  const { ref, inView } = useInView();

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ accordion item                                                 */
/* ------------------------------------------------------------------ */
function FAQItem({
  question,
  answer,
  defaultOpen = false,
}: {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors pr-4">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? 'max-h-96 pb-5' : 'max-h-0'
        }`}
      >
        <p className="text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Main landing page                                                  */
/* ================================================================== */
export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [email, setEmail] = useState('');
  const [demoInput, setDemoInput] = useState('');
  const [demoGenerating, setDemoGenerating] = useState(false);
  const [demoProposal, setDemoProposal] = useState<string | null>(null);
  const [demoEmail, setDemoEmail] = useState('');
  const [demoEmailSubmitted, setDemoEmailSubmitted] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  // Scroll-triggered section refs
  const features = useInView();
  const howItWorks = useInView();
  const demo = useInView();
  const testimonials = useInView();
  const pricing = useInView();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const handleDemoGenerate = async () => {
    if (!demoInput.trim()) return;

    setDemoGenerating(true);
    setDemoProposal(null);
    setDemoEmail('');
    setDemoEmailSubmitted(false);

    try {
      const response = await fetch('/api/generate-proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectBrief: demoInput,
          freelancerProfile: {
            name: 'Demo Freelancer',
            title: 'Web Developer & Designer',
            email: 'demo@scopepad.local',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDemoProposal(data.proposal || JSON.stringify(data, null, 2));
      } else {
        setDemoProposal('Error generating proposal. Please try again or sign up to use the full version.');
      }
    } catch (error) {
      console.error('Demo generation error:', error);
      setDemoProposal('Unable to generate proposal. Please sign up to try the full version.');
    } finally {
      setDemoGenerating(false);
    }
  };

  // Shared fade-in class helper
  const fadeIn = (visible: boolean, delay = 0) =>
    `transition-all duration-700 ${
      visible
        ? `opacity-100 translate-y-0`
        : 'opacity-0 translate-y-8'
    }` + (delay ? ` delay-[${delay}ms]` : '');

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navigation ──────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-200 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg'
            : 'bg-white/80 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              ScopePad
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-8">
              {['features', 'pricing', 'compare'].map((s) => (
                <button
                  key={s}
                  onClick={() => scrollToSection(s)}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors capitalize"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/login"
                className="px-4 py-2 text-gray-700 font-medium hover:text-blue-600 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
              >
                Get Started Free
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-700"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile nav */}
          {isMenuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-200">
              {['features', 'pricing', 'compare'].map((s) => (
                <button
                  key={s}
                  onClick={() => scrollToSection(s)}
                  className="block w-full text-left py-3 text-gray-700 font-medium hover:text-blue-600 capitalize"
                >
                  {s}
                </button>
              ))}
              <div className="flex gap-3 pt-4">
                <Link
                  href="/login"
                  className="flex-1 text-center px-4 py-2 text-gray-700 font-medium border border-gray-300 rounded-lg"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="flex-1 text-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg"
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-24 overflow-hidden">
        {/* Background gradient + subtle animated blob */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
        <div className="absolute top-20 -right-40 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-40 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            {/* Urgency badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-8 animate-fade-in">
              <Zap className="w-4 h-4" />
              Used by 2,000+ freelancers — free to start
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-[1.1] tracking-tight">
              Win more clients.
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Get paid faster.
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">
              AI writes your proposal in 90 seconds. Clients approve and pay through their own branded portal. You stop chasing invoices forever.
            </p>

            {/* Micro social proof */}
            <p className="text-sm text-gray-500 mb-10 flex items-center justify-center gap-1">
              <span className="flex -space-x-1.5">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-white inline-block"
                  />
                ))}
              </span>
              <span className="ml-2">
                &ldquo;Saved me 5+ hours a week&rdquo; — rated{' '}
                <strong className="text-gray-700">4.9/5</strong>
              </span>
            </p>

            {/* Hero CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="group px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all inline-flex items-center justify-center gap-2 text-lg"
              >
                Start Free — No Credit Card
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => scrollToSection('features')}
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-blue-600 hover:text-blue-600 transition-all text-lg"
              >
                See How It Works
              </button>
            </div>
          </div>

          {/* Hero trust strip */}
          <div className="mt-16 flex flex-wrap justify-center gap-x-10 gap-y-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-green-500" /> 256-bit encryption
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-green-500" /> Powered by Stripe
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-green-500" /> Setup in under 5 min
            </span>
          </div>
        </div>
      </section>

      {/* ── Social Proof Bar (animated counters) ─────────────── */}
      <section className="py-14 bg-white border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                <AnimatedNumber target={2000} suffix="+" />
              </p>
              <p className="text-gray-500 text-sm mt-1">Freelancers onboard</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                <AnimatedNumber target={15000} suffix="+" />
              </p>
              <p className="text-gray-500 text-sm mt-1">Proposals sent</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                $<AnimatedNumber target={4200000} />
              </p>
              <p className="text-gray-500 text-sm mt-1">Payments processed</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center gap-0.5 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-500 text-sm">4.9 average rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-white" ref={features.ref}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-700 ${features.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <p className="text-blue-600 font-semibold mb-3 uppercase tracking-wide text-sm">
              Everything you need
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Proposals, portals & payments — unified
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three powerful tools that work together so you never drop the ball with a client again.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Sparkles className="w-7 h-7 text-blue-600" />,
                title: 'AI Proposals',
                desc: 'Paste a 3-sentence brief and get a polished, professional proposal in seconds. Customize the tone, add your rates, and hit send.',
                stat: '90 sec average',
                color: 'blue',
              },
              {
                icon: <Layout className="w-7 h-7 text-indigo-600" />,
                title: 'Branded Client Portal',
                desc: 'Every client gets their own URL with proposals, milestones, invoices, and files — all in one place they can access 24/7.',
                stat: 'One link per client',
                color: 'indigo',
              },
              {
                icon: <CreditCard className="w-7 h-7 text-emerald-600" />,
                title: 'Smart Invoicing',
                desc: 'Generate invoices from approved proposals. Accept card payments via Stripe. Auto-reminders chase late payments so you don\'t have to.',
                stat: 'Get paid 2× faster',
                color: 'emerald',
              },
            ].map((f, i) => (
              <div
                key={f.title}
                className={`group p-8 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-xl transition-all duration-500 ${
                  features.inView
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: features.inView ? `${i * 150}ms` : '0ms' }}
              >
                <div
                  className={`w-14 h-14 bg-${f.color === 'blue' ? 'blue' : f.color === 'indigo' ? 'indigo' : 'emerald'}-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                >
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">{f.desc}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                  <Zap className="w-4 h-4" /> {f.stat}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50" ref={howItWorks.ref}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-700 ${howItWorks.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <p className="text-blue-600 font-semibold mb-3 uppercase tracking-wide text-sm">
              Simple 3-step workflow
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              From brief to paid in minutes
            </h2>
            <p className="text-xl text-gray-600">
              Send your first proposal before your coffee gets cold.
            </p>
          </div>

          {/* Horizontal connector line (desktop) */}
          <div className="relative">
            <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-0.5 bg-blue-200" />

            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  num: '1',
                  title: 'Describe your project',
                  desc: 'Paste a client brief, project scope, or just a few sentences. That\'s all the AI needs.',
                  icon: <FileText className="w-5 h-5" />,
                },
                {
                  num: '2',
                  title: 'AI writes your proposal',
                  desc: 'Review, adjust the tone, add your rates, and hit send — all in under 90 seconds.',
                  icon: <Sparkles className="w-5 h-5" />,
                },
                {
                  num: '3',
                  title: 'Client approves & pays',
                  desc: 'Your client reviews in their portal, approves the proposal, and pays. Invoice auto-generated.',
                  icon: <TrendingUp className="w-5 h-5" />,
                },
              ].map((step, i) => (
                <div
                  key={step.num}
                  className={`relative text-center transition-all duration-700 ${
                    howItWorks.inView
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: howItWorks.inView ? `${i * 200}ms` : '0ms' }}
                >
                  <div className="relative z-10 w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-bold">{step.num}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 max-w-xs mx-auto leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Inline CTA */}
          <div className="text-center mt-14">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all text-lg"
            >
              Try It Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────── */}
      <section className="py-24 bg-white" ref={testimonials.ref}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-700 ${testimonials.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <p className="text-blue-600 font-semibold mb-3 uppercase tracking-wide text-sm">
              Loved by freelancers
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Don&apos;t take our word for it
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  'I used to spend Sunday evenings writing proposals. Now I paste my notes and ScopePad has a polished draft in less than two minutes. Game changer.',
                name: 'Mia Chen',
                role: 'Brand Strategist',
                stars: 5,
              },
              {
                quote:
                  'My clients love their portal — they can see every invoice, every deliverable, without digging through email. I look 10× more professional.',
                name: 'Jordan Ellis',
                role: 'Web Developer',
                stars: 5,
              },
              {
                quote:
                  'Before ScopePad I had $8K in overdue invoices. Now I rarely wait past 3 days for payment. The auto-reminders are worth the price alone.',
                name: 'Priya Sharma',
                role: 'UX Designer',
                stars: 5,
              },
            ].map((t, i) => (
              <div
                key={t.name}
                className={`p-8 bg-gray-50 rounded-2xl border border-gray-100 transition-all duration-700 ${
                  testimonials.inView
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: testimonials.inView ? `${i * 150}ms` : '0ms' }}
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.stars)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-blue-200 mb-3" />
                <p className="text-gray-700 leading-relaxed mb-6">{t.quote}</p>
                <div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 bg-gray-50" ref={pricing.ref}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-700 ${pricing.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <p className="text-blue-600 font-semibold mb-3 uppercase tracking-wide text-sm">
              Transparent pricing
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Start free. Upgrade when you&apos;re ready.
            </h2>
            <p className="text-xl text-gray-600">
              No hidden fees. No surprises. Cancel anytime.
            </p>

            {/* Billing Toggle */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
                className="relative inline-flex items-center h-8 w-14 rounded-full bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                style={{
                  backgroundColor: billingPeriod === 'annual' ? '#2563eb' : '#d1d5db',
                }}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    billingPeriod === 'annual' ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${billingPeriod === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}>
                Annual
              </span>
              {billingPeriod === 'annual' && (
                <span className="inline-block ml-2 px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                  Save 20%
                </span>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free */}
            <div className="p-8 bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-shadow">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Free</h3>
              <p className="text-gray-500 text-sm mb-4">Everything to get started</p>
              <p className="mb-6">
                <span className="text-5xl font-extrabold text-gray-900">$0</span>
              </p>
              <Link
                href="/signup"
                className="w-full px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors inline-block text-center mb-8"
              >
                Start Free
              </Link>
              <ul className="space-y-3.5">
                {[
                  '3 active clients',
                  '5 AI proposals / month',
                  'Basic invoicing',
                  'ScopePad branding',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro — popular */}
            <div className="relative p-8 bg-white border-2 border-blue-600 rounded-2xl shadow-xl scale-[1.02]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-1.5 rounded-full text-sm font-bold shadow-md">
                  Most Popular
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Pro</h3>
              <p className="text-gray-500 text-sm mb-4">For growing freelancers</p>
              <p className="mb-6">
                <span className="text-5xl font-extrabold text-gray-900">
                  {billingPeriod === 'monthly' ? '$12' : '$115'}
                </span>
                <span className="text-gray-500">{billingPeriod === 'monthly' ? '/mo' : '/year'}</span>
              </p>
              <Link
                href={billingPeriod === 'monthly' ? '/signup?plan=pro' : '/signup?plan=pro&billing=annual'}
                className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md hover:shadow-lg transition-all inline-block text-center mb-8"
              >
                Start Free Trial
              </Link>
              <ul className="space-y-3.5">
                {[
                  'Unlimited clients',
                  'Unlimited AI proposals',
                  'Payment reminders',
                  'Custom branding',
                  'Contract templates',
                  'Time tracking',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro+ */}
            <div className="p-8 bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-shadow">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Pro+</h3>
              <p className="text-gray-500 text-sm mb-4">For serious freelance businesses</p>
              <p className="mb-6">
                <span className="text-5xl font-extrabold text-gray-900">
                  {billingPeriod === 'monthly' ? '$19' : '$182'}
                </span>
                <span className="text-gray-500">{billingPeriod === 'monthly' ? '/mo' : '/year'}</span>
              </p>
              <Link
                href={billingPeriod === 'monthly' ? '/signup?plan=pro-plus' : '/signup?plan=pro-plus&billing=annual'}
                className="w-full px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors inline-block text-center mb-8"
              >
                Start Free Trial
              </Link>
              <ul className="space-y-3.5">
                {[
                  'Everything in Pro',
                  'Smart automations',
                  'Revenue dashboard',
                  'Client testimonials',
                  'Priority support',
                  'API access',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Money-back guarantee */}
          <p className="text-center mt-10 text-gray-500 flex items-center justify-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            14-day money-back guarantee on all paid plans. No questions asked.
          </p>
        </div>
      </section>

      {/* ── Comparison ──────────────────────────────────────────── */}
      <section id="compare" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-blue-600 font-semibold mb-3 uppercase tracking-wide text-sm">
              Why ScopePad
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              ScopePad vs. the competition
            </h2>
            <p className="text-xl text-gray-600">See why freelancers are switching.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Feature</th>
                  <th className="px-6 py-4 text-center font-bold text-blue-600 bg-blue-50">
                    ScopePad
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-500">HoneyBook</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-500">Dubsado</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-500">Bonsai</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Starting price', fd: 'Free', hb: '$20/mo', du: '$15/mo', bo: '$19/mo', highlight: true },
                  { feature: 'AI Proposals', fd: true, hb: false, du: false, bo: false },
                  { feature: 'Client Portal', fd: true, hb: true, du: true, bo: true },
                  { feature: 'Setup time', fd: '5 min', hb: '30+ min', du: '20+ min', bo: '25+ min', highlight: true },
                  { feature: 'Payment processing', fd: true, hb: true, du: true, bo: true },
                  { feature: 'Auto-reminders', fd: true, hb: false, du: false, bo: true },
                ].map((row) => (
                  <tr key={row.feature} className="border-t border-gray-100 hover:bg-blue-50/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{row.feature}</td>
                    {['fd', 'hb', 'du', 'bo'].map((key) => {
                      const val = row[key as keyof typeof row];
                      const isScopePad = key === 'fd';
                      return (
                        <td
                          key={key}
                          className={`px-6 py-4 text-center ${isScopePad ? 'bg-blue-50/60 font-bold text-blue-600' : 'text-gray-600'}`}
                        >
                          {val === true ? (
                            <Check className={`w-6 h-6 mx-auto ${isScopePad ? 'text-blue-600' : 'text-green-500'}`} />
                          ) : val === false ? (
                            <span className="text-gray-300">—</span>
                          ) : (
                            <span className={isScopePad ? 'text-blue-600' : ''}>{val as string}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 p-5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-gray-700 text-sm">
              <strong>Note:</strong> HoneyBook raised their pricing by 89 % in 2024. We&apos;re committed to keeping ScopePad affordable for freelancers.
            </p>
          </div>
        </div>
      </section>

      {/* ── Live Demo ───────────────────────────────────────────── */}
      <section className="py-24 bg-white" ref={demo.ref}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-blue-600 font-semibold mb-3 uppercase tracking-wide text-sm">
              Try it now
            </p>
            <h2 className="text-4xl font-bold text-gray-900">
              Generate a proposal in 90 seconds
            </h2>
            <p className="text-xl text-gray-600 mt-4">
              No signup required. See how ScopePad turns brief notes into professional proposals.
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-gray-200 p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Form */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Your Project Brief
                </h3>
                <textarea
                  value={demoInput}
                  onChange={(e) => setDemoInput(e.target.value)}
                  placeholder="E.g., I need a WordPress site for my coffee shop with online ordering, menu, and gallery. Budget around $3,000."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 placeholder-gray-500"
                />
                <button
                  onClick={handleDemoGenerate}
                  disabled={demoGenerating || !demoInput.trim()}
                  className="mt-4 w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Sparkles size={18} />
                  Generate Proposal
                </button>
                <p className="text-xs text-gray-600 mt-3">
                  This is a demo. No email required.
                </p>
              </div>

              {/* Generated Proposal */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Generated Proposal
                </h3>
                <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 h-96 overflow-y-auto">
                  {demoGenerating ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-600">Generating proposal...</p>
                      </div>
                    </div>
                  ) : demoProposal ? (
                    <div>
                      {!demoEmailSubmitted ? (
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600">
                            Your proposal is ready! Enter your email to see the full proposal and download it as PDF.
                          </p>
                          <input
                            type="email"
                            value={demoEmail}
                            onChange={(e) => setDemoEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                          />
                          <button
                            onClick={() => {
                              if (demoEmail.trim()) {
                                setDemoEmailSubmitted(true);
                              }
                            }}
                            disabled={!demoEmail.trim()}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            Get Full Proposal
                          </button>
                        </div>
                      ) : (
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg mb-3">
                            AI-Generated Proposal
                          </h4>
                          <div className="space-y-3 text-sm whitespace-pre-wrap text-gray-700 font-mono text-xs max-h-72 overflow-y-auto">
                            {demoProposal}
                          </div>
                          <button className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                            Download as PDF
                          </button>
                        </div>
                      )}
                    </div>
                  ) : demoInput ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p>Click "Generate Proposal" to create your proposal...</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p>Enter your project brief to get started...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">
              Ready to save hours on proposals? Start with our free plan.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started Free
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-blue-600 font-semibold mb-3 uppercase tracking-wide text-sm">
              Questions?
            </p>
            <h2 className="text-4xl font-bold text-gray-900">
              Frequently asked questions
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 px-8">
            <FAQItem
              question="Is there really a free plan?"
              answer="Yes — completely free, forever. You get 3 active clients and 5 AI proposals per month. No credit card required to sign up."
              defaultOpen
            />
            <FAQItem
              question="How does the AI proposal generation work?"
              answer="Paste your project brief or client notes (even a few sentences work). Our AI analyzes the scope and generates a professional proposal with deliverables, timeline, and pricing sections. You review, customize anything, and send — typically under 90 seconds."
            />
            <FAQItem
              question="Can I use my own branding?"
              answer="On the Pro plan and above, you can add your logo, brand colors, and custom domain to the client portal. Your clients will see your brand, not ours."
            />
            <FAQItem
              question="What payment methods do you support?"
              answer="We integrate with Stripe, so your clients can pay with credit/debit cards. All payment processing is PCI-compliant and secured with 256-bit encryption."
            />
            <FAQItem
              question="Can I cancel anytime?"
              answer="Absolutely. No contracts, no cancellation fees. You can downgrade to the free plan at any time and keep all your data."
            />
            <FAQItem
              question="How is ScopePad different from HoneyBook or Bonsai?"
              answer="ScopePad is built specifically for speed: AI proposals in 90 seconds, 5-minute setup, and a streamlined client portal. We also offer a genuinely free tier — most competitors start at $15–20/month."
            />
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
            Stop chasing invoices.
            <br />
            Start closing clients.
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-xl mx-auto">
            Join 2,000+ freelancers saving 5+ hours a week with ScopePad. Set up in minutes, free forever.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email) {
                window.location.href = `/signup?email=${encodeURIComponent(email)}`;
              }
            }}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6"
          >
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-5 py-4 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 text-lg"
            />
            <button
              type="submit"
              className="group px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors whitespace-nowrap inline-flex items-center justify-center gap-2 text-lg shadow-lg"
            >
              Start Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="text-blue-200 text-sm flex items-center justify-center gap-1.5">
            <Shield className="w-4 h-4" /> No credit card required. Free plan available forever.
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-white font-bold text-lg mb-3">ScopePad</h3>
              <p className="text-sm leading-relaxed">
                AI-powered proposals and client portal for freelancers who value their time.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">
                    Features
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">
                    Pricing
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('compare')} className="hover:text-white transition-colors">
                    Compare
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <p className="text-sm text-center">&copy; 2026 ScopePad. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
