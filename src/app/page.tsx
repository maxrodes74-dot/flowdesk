'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Menu,
  X,
  Check,
  ArrowRight,
  Zap,
  Shield,
  ChevronDown,
  FileText,
  Code2,
  Bot,
  Send,
  Lock,
  Webhook,
  Layers,
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
        <span className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors pr-4">
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
/*  Main landing page — ScopePad                                       */
/* ================================================================== */
export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const features = useInView();
  const howItWorks = useInView();
  const pricing = useInView();
  const faq = useInView();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const fadeIn = (visible: boolean) =>
    `transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`;

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navigation ─────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-200 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg'
            : 'bg-white/80 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-indigo-600">
              ScopePad
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Features</button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">How It Works</button>
              <button onClick={() => scrollToSection('pricing')} className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Pricing</button>
              <Link href="/developers" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Developers</Link>
              <Link href="/login" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Log in</Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Start free trial
              </Link>
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100 space-y-3">
              <button onClick={() => scrollToSection('features')} className="block w-full text-left py-2 text-gray-600">Features</button>
              <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left py-2 text-gray-600">How It Works</button>
              <button onClick={() => scrollToSection('pricing')} className="block w-full text-left py-2 text-gray-600">Pricing</button>
              <Link href="/login" className="block py-2 text-gray-600">Log in</Link>
              <Link href="/signup" className="block py-2 px-4 bg-indigo-600 text-white text-center rounded-lg font-medium">Start free trial</Link>
            </div>
          )}
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium mb-6">
            <Bot className="w-4 h-4" />
            Agent-native freelance platform
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
            AI that runs your<br />
            <span className="text-indigo-600">freelance paperwork</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Create proposals, SOWs, and invoices in seconds. Connect your AI agent to
            automate the entire client lifecycle — from discovery call to paid invoice.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-3.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-lg"
            >
              Start free trial <ArrowRight className="w-5 h-5" />
            </Link>
            <span className="text-sm text-gray-500">14-day Pro trial, no credit card required</span>
          </div>
        </div>

        {/* Agent workflow visualization */}
        <div className="max-w-3xl mx-auto mt-16">
          <div className="bg-gray-950 rounded-xl p-6 font-mono text-sm overflow-x-auto">
            <div className="text-gray-500 mb-2">{'// Your AI agent creates a proposal via MCP'}</div>
            <div className="text-green-400">{'> scopepad.create_document({'}</div>
            <div className="text-gray-300 pl-6">{'type: "proposal",'}</div>
            <div className="text-gray-300 pl-6">{'client: "Acme Corp",'}</div>
            <div className="text-gray-300 pl-6">{'title: "Website Redesign Proposal",'}</div>
            <div className="text-gray-300 pl-6">{'content: { overview: "...", deliverables: [...] }'}</div>
            <div className="text-green-400">{'}'}</div>
            <div className="text-gray-500 mt-3">{'// → Document created, PDF generated, ready to send'}</div>
            <div className="text-indigo-400 mt-1">{'✓ Document doc_7f3a created (v1, draft)'}</div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section id="features" className="py-20 bg-gray-50 px-4">
        <div ref={features.ref} className={`max-w-6xl mx-auto ${fadeIn(features.inView)}`}>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Built for AI agents. Loved by freelancers.</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The only freelance platform designed from the ground up to be operated by your AI on your behalf.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: FileText, title: 'Unified Document Engine', desc: 'Proposals, invoices, SOWs, contracts, PRDs, briefs — one system with full lineage tracking. Brief → SOW → Proposal → Invoice, automatically linked.' },
              { icon: Code2, title: 'REST API + MCP Server', desc: 'Every action your agent can do via the UI, it can do via API. First-class MCP server for Claude, Cursor, and any MCP-compatible tool.' },
              { icon: Shield, title: 'Agent Guardrails', desc: 'Configurable approval rules per action type. Auto-approve drafts, require human sign-off for sends and payments. You stay in control.' },
              { icon: Layers, title: 'Template Library', desc: 'Curated, high-quality templates with structured schemas. Your agent fills them intelligently using context from past documents.' },
              { icon: Send, title: 'Client Portal', desc: 'Clients view, approve, or decline documents with one click. Magic link access, no signup required. Invoice payment via Stripe.' },
              { icon: Webhook, title: 'Webhooks & Automations', desc: 'Real-time event notifications for agent workflows. Payment reminders, scope creep detection, and project wrap-up sequences.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-4">
        <div ref={howItWorks.ref} className={`max-w-4xl mx-auto ${fadeIn(howItWorks.inView)}`}>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Three steps to autopilot</h2>
          </div>

          <div className="space-y-12">
            {[
              { step: '1', title: 'Sign up & connect your agent', desc: 'Create your account, grab an API key, and configure the MCP server in Claude Desktop or Cursor. Takes under 2 minutes.' },
              { step: '2', title: 'Your agent does the work', desc: 'After a client call, tell your agent to draft a SOW. It pulls context from past documents, fills a template, and creates a professional PDF — all through the API.' },
              { step: '3', title: 'Review, send, get paid', desc: 'You review the draft (or auto-approve it). Your agent sends it to the client portal. Client approves, you invoice, they pay via Stripe. Done.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                  {step}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-600 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 bg-gray-50 px-4">
        <div ref={pricing.ref} className={`max-w-5xl mx-auto ${fadeIn(pricing.inView)}`}>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-gray-600">Start with a 14-day free trial. No credit card required.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Pro */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Pro</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-gray-900">$12</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-sm text-gray-500 mb-6">or $97/year (save 33%)</p>
              <ul className="space-y-3 mb-8">
                {[
                  'All 10 document types',
                  'Template library',
                  'PDF + DOCX export',
                  'REST API access',
                  '3 webhooks',
                  'Client portal (view, approve, pay)',
                  'Unlimited documents',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block w-full py-3 text-center bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                Start free trial
              </Link>
            </div>

            {/* Pro+ */}
            <div className="bg-white rounded-xl p-8 shadow-sm border-2 border-indigo-600 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Pro+</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-gray-900">$19</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-sm text-gray-500 mb-6">or $148/year (save 35%)</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Everything in Pro',
                  'MCP server access',
                  'Agent guardrails (approve/auto/block)',
                  'Conditional automations',
                  'All export formats (PDF, DOCX, PPTX, XLSX)',
                  'Unlimited webhooks',
                  'Priority support',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block w-full py-3 text-center bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-4">
        <div ref={faq.ref} className={`max-w-3xl mx-auto ${fadeIn(faq.inView)}`}>
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently asked questions</h2>
          <FAQItem
            question="What is an 'agent-native' platform?"
            answer="It means ScopePad is designed to be operated by AI agents, not just humans. Every feature — document creation, client management, invoicing — is accessible via REST API and MCP. Your AI agent can run your entire freelance workflow autonomously, with you approving only what matters."
            defaultOpen
          />
          <FAQItem
            question="Do I need to use an AI agent to use ScopePad?"
            answer="Not at all. ScopePad works great as a standalone freelance tool — you get a full dashboard for creating documents, managing clients, and sending invoices. The agent API is there when you're ready for it."
          />
          <FAQItem
            question="What's MCP?"
            answer="Model Context Protocol (MCP) is an open standard that lets AI tools like Claude Desktop, Cursor, and others connect to external services. With ScopePad's MCP server, you can tell Claude 'create a proposal for Acme Corp' and it happens directly in your ScopePad account."
          />
          <FAQItem
            question="How is ScopePad different from HoneyBook or Bonsai?"
            answer="No competitor offers agent API access. HoneyBook, Dubsado, and Bonsai are built for humans clicking buttons. ScopePad is the only platform where your AI can manage the entire client lifecycle — proposals, contracts, invoices, payments — programmatically."
          />
          <FAQItem
            question="Is my data safe with AI agents accessing it?"
            answer="Yes. Every API key has configurable guardrails: auto-approve reads and drafts, require human approval for sends and payments, block deletes entirely. You set the rules, the agent follows them. Full audit log of every action."
          />
          <FAQItem
            question="What happens after the 14-day trial?"
            answer="You choose Pro ($12/mo) or Pro+ ($19/mo), or your account pauses. No surprise charges. We'll remind you before the trial ends."
          />
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="py-20 bg-indigo-600 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Let your AI agent handle the busywork
          </h2>
          <p className="text-lg text-indigo-100 mb-8">
            14-day free trial. Set up in under 2 minutes. Cancel anytime.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors text-lg"
          >
            Start free trial <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="bg-gray-950 text-gray-400 py-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-3">ScopePad</h3>
            <p className="text-sm leading-relaxed">
              Your AI agent&apos;s operating system for freelance work.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button></li>
              <li><button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">Pricing</button></li>
              <li><Link href="/developers" className="hover:text-white transition-colors">API Docs</Link></li>
              <li><Link href="/developers" className="hover:text-white transition-colors">MCP Server</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors">FAQ</button></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Log in</Link></li>
              <li><Link href="/signup" className="hover:text-white transition-colors">Sign up</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-gray-800">
          <p className="text-sm text-center">&copy; 2026 ScopePad. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
