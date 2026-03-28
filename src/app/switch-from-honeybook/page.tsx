import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Zap,
  TrendingUp,
  Shield,
  Clock,
  Sparkles,
  Users,
} from 'lucide-react';

export default function SwitchFromHoneyBookPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              FlowDesk
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-pink-50" />
        <div className="absolute top-20 -right-40 w-[600px] h-[600px] bg-red-100/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-40 w-[500px] h-[500px] bg-pink-100/30 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-semibold mb-8">
              <Zap className="w-4 h-4" />
              Switch & Save 89% on Proposals
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-[1.1] tracking-tight">
              Tired of HoneyBook's
              <br />
              <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                89% Price Hike?
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              FlowDesk does everything you love about HoneyBook—AI proposals, client portals, payment processing—at a fraction of the cost. And it's actually better.
            </p>

            {/* Hero CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/signup"
                className="group px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all inline-flex items-center justify-center gap-2 text-lg"
              >
                Start Your Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Subtext */}
            <p className="text-gray-500">No credit card required. Switch in under 5 minutes.</p>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-blue-600 font-semibold mb-3 uppercase tracking-wide text-sm">
              Side-by-side comparison
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              FlowDesk vs HoneyBook
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Feature</th>
                  <th className="text-center py-4 px-6 font-semibold text-blue-600">FlowDesk</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-500">HoneyBook</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 bg-white">
                  <td className="py-4 px-6 font-medium text-gray-900">Starting Price</td>
                  <td className="text-center py-4 px-6">
                    <span className="font-bold text-blue-600">Free</span>
                  </td>
                  <td className="text-center py-4 px-6">
                    <span className="text-gray-600">$99/month</span>
                  </td>
                </tr>

                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900">Pricing (Pro)</td>
                  <td className="text-center py-4 px-6">
                    <span className="font-bold text-blue-600">$29/month</span>
                  </td>
                  <td className="text-center py-4 px-6">
                    <span className="text-gray-600">$188/month (89% ↑)</span>
                  </td>
                </tr>

                <tr className="border-b border-gray-200 bg-white">
                  <td className="py-4 px-6 font-medium text-gray-900">AI-Generated Proposals</td>
                  <td className="text-center py-4 px-6">
                    <Check className="w-6 h-6 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-6">
                    <Check className="w-6 h-6 text-green-500 mx-auto" />
                  </td>
                </tr>

                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900">Setup Time</td>
                  <td className="text-center py-4 px-6">
                    <span className="font-bold text-blue-600">Under 5 min</span>
                  </td>
                  <td className="text-center py-4 px-6">
                    <span className="text-gray-600">30+ minutes</span>
                  </td>
                </tr>

                <tr className="border-b border-gray-200 bg-white">
                  <td className="py-4 px-6 font-medium text-gray-900">Client Portal</td>
                  <td className="text-center py-4 px-6">
                    <Check className="w-6 h-6 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-6">
                    <Check className="w-6 h-6 text-green-500 mx-auto" />
                  </td>
                </tr>

                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900">Payment Processing</td>
                  <td className="text-center py-4 px-6">
                    <span className="font-bold text-blue-600">Stripe</span>
                  </td>
                  <td className="text-center py-4 px-6">
                    <span className="text-gray-600">Stripe + PayPal</span>
                  </td>
                </tr>

                <tr className="border-b border-gray-200 bg-white">
                  <td className="py-4 px-6 font-medium text-gray-900">Invoice Reminders</td>
                  <td className="text-center py-4 px-6">
                    <Check className="w-6 h-6 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-6">
                    <Check className="w-6 h-6 text-green-500 mx-auto" />
                  </td>
                </tr>

                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900">AI-Native Features</td>
                  <td className="text-center py-4 px-6">
                    <span className="font-bold text-blue-600">10+ AI tools</span>
                  </td>
                  <td className="text-center py-4 px-6">
                    <span className="text-gray-600">Basic AI</span>
                  </td>
                </tr>

                <tr className="bg-white">
                  <td className="py-4 px-6 font-medium text-gray-900">Setup Complexity</td>
                  <td className="text-center py-4 px-6">
                    <span className="font-bold text-blue-600">Simple</span>
                  </td>
                  <td className="text-center py-4 px-6">
                    <span className="text-gray-600">Complex</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Migration Benefits */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-blue-600 font-semibold mb-3 uppercase tracking-wide text-sm">
              What you get
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              When you switch to FlowDesk
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              More than just cheaper pricing. Better tools. Better experience. Better results.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: <TrendingUp className="w-8 h-8 text-blue-600" />,
                title: 'Lower Price, More Features',
                desc: 'Save 89% compared to HoneyBook Pro. Get AI proposals, portals, payments, and automation—all built for modern freelancers.',
              },
              {
                icon: <Sparkles className="w-8 h-8 text-indigo-600" />,
                title: 'AI-Native from Day One',
                desc: 'FlowDesk is built for AI. Scope creep detection, smart follow-ups, auto-generated invoices, and more.',
              },
              {
                icon: <Clock className="w-8 h-8 text-emerald-600" />,
                title: 'Zero Setup, Instant Results',
                desc: 'We handle the complexity. Sign up, add your rates, and send your first AI proposal within minutes—not hours.',
              },
              {
                icon: <Shield className="w-8 h-8 text-cyan-600" />,
                title: 'Built for Freelancers',
                desc: 'Every feature is designed specifically for how you work. Not generic. Not bloated. Just what you need.',
              },
            ].map((benefit, i) => (
              <div
                key={i}
                className="p-8 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">{benefit.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Placeholder */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-blue-600 font-semibold mb-3 uppercase tracking-wide text-sm">
              Loved by freelancers
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              What users say about FlowDesk
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah M.',
                role: 'Graphic Designer',
                text: 'Switched from HoneyBook and never looked back. Saving hundreds every month and the proposals are actually better.',
                initials: 'SM',
              },
              {
                name: 'James T.',
                role: 'Web Developer',
                text: 'The AI features are unreal. Scope creep detection alone has saved me more than the entire annual cost.',
                initials: 'JT',
              },
              {
                name: 'Maria L.',
                role: 'Marketing Consultant',
                text: 'Setup took literally 3 minutes. No vendor lock-in feeling. FlowDesk just works.',
                initials: 'ML',
              },
            ].map((testimonial, i) => (
              <div
                key={i}
                className="p-8 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Ready to switch?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Save 89% and get better tools. No credit card required.
          </p>

          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all text-lg"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>

          <p className="text-blue-100 text-sm mt-6">
            ✓ Free forever plan • ✓ Setup in under 5 minutes • ✓ No credit card needed
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-gray-400 text-center text-sm">
        <p>&copy; 2026 FlowDesk. All rights reserved.</p>
      </footer>
    </div>
  );
}
