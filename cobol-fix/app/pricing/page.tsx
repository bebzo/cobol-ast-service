'use client';
import Link from 'next/link';

export default function PricingPage() {
  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      period: '',
      description: 'Perfect for evaluation and small projects',
      features: [
        'Up to 1,000 lines of COBOL/month',
        'Basic Python conversion',
        'Community support',
        'Standard security scan',
      ],
      cta: 'Start Free',
      highlighted: false,
    },
    {
      name: 'Professional',
      price: '$299',
      period: '/month',
      description: 'For development teams and enterprises',
      features: [
        'Up to 50,000 lines of COBOL/month',
        'Advanced Python with type hints',
        'Full test suite generation',
        'Priority email support',
        'Advanced security analysis (CVE/CVSS)',
        'Configuration extraction',
        'API access',
      ],
      cta: 'Start 14-day Trial',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large-scale migration projects',
      features: [
        'Unlimited COBOL processing',
        'Dedicated migration architect',
        'Custom integrations',
        'On-premise deployment option',
        'SLA guarantee (99.9%)',
        '24/7 phone support',
        'Training & workshops',
        'Source code escrow',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="border-b border-slate-700">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-400">CodeSwitch</Link>
          <div className="flex gap-6">
            <Link href="/docs" className="hover:text-blue-400">Documentation</Link>
            <Link href="/pricing" className="text-blue-400">Pricing</Link>
            <Link href="/" className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500">Try Demo</Link>
          </div>
        </nav>
      </header>

      {/* Pricing Section */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-slate-400">Start free, scale as you modernize</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 ${
                plan.highlighted
                  ? 'bg-gradient-to-b from-blue-600 to-blue-800 ring-2 ring-blue-400 scale-105'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            >
              {plan.highlighted && (
                <div className="text-center mb-4">
                  <span className="bg-blue-400 text-blue-900 text-sm font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-slate-400">{plan.period}</span>
              </div>
              <p className="text-slate-300 mb-6">{plan.description}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-lg font-semibold ${
                  plan.highlighted
                    ? 'bg-white text-blue-600 hover:bg-slate-100'
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              { q: 'How is COBOL line count calculated?', a: 'We count actual source lines excluding comments and blank lines. Each analysis shows the exact count.' },
              { q: 'Can I upgrade or downgrade anytime?', a: 'Yes, you can change your plan at any time. Changes take effect on your next billing cycle.' },
              { q: 'Is my code stored on your servers?', a: 'No. Code is processed in memory and immediately discarded. We never store your source code.' },
              { q: 'Do you offer volume discounts?', a: 'Yes, Enterprise plans include custom pricing based on your migration volume and timeline.' },
            ].map((faq, i) => (
              <div key={i} className="bg-slate-800 rounded-xl p-6">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-slate-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hackathon Badge - Discreet */}
        <div className="mt-24 text-center">
          <p className="text-slate-500 text-sm">
            Built with Google Gemini 2.0 | <span className="text-blue-400">Gemini API Developer Competition 2024</span>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center text-slate-400 text-sm">
          <p>&copy; 2024 CodeSwitch. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/legal/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-white">Terms</Link>
            <a href="mailto:contact@codeswitch.io" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
