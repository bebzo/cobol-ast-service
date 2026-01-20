'use client';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-slate-700">
        <nav className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/" className="text-2xl font-bold text-blue-400">CodeSwitch</Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 prose prose-invert prose-lg">
        <h1>Privacy Policy</h1>
        <p className="text-slate-400">Last updated: January 16, 2026</p>
        
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 my-6">
          <p className="text-sm text-blue-300 m-0">
            <strong>GDPR & RGPD Compliant:</strong> This policy is designed to comply with the EU General Data Protection Regulation (GDPR) and French RGPD requirements.
          </p>
        </div>

        <h2>1. Introduction</h2>
        <p>
          CodeSwitch (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. 
          This Privacy Policy explains how we collect, use, and safeguard your information when you use our 
          COBOL-to-Python migration service.
        </p>

        <h2>2. Information We Collect</h2>
        <h3>2.1 Information You Provide</h3>
        <ul>
          <li><strong>Account Information:</strong> Email address, name, company name when you register</li>
          <li><strong>Payment Information:</strong> Processed securely by Stripe; we do not store credit card details</li>
          <li><strong>Support Requests:</strong> Communications when you contact us</li>
        </ul>

        <h3>2.2 Information We Do NOT Collect</h3>
        <ul>
          <li><strong>Source Code:</strong> Your COBOL code is processed in-memory and immediately discarded. We do not store, log, or retain your source code.</li>
          <li><strong>Generated Output:</strong> Python translations are sent directly to your browser and not stored on our servers.</li>
        </ul>

        <h3>2.3 Automatically Collected Information</h3>
        <ul>
          <li>Usage analytics (pages visited, features used)</li>
          <li>Device information (browser type, OS)</li>
          <li>IP address (for security and rate limiting)</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>To provide and maintain our service</li>
          <li>To process payments and send invoices</li>
          <li>To respond to support requests</li>
          <li>To improve our service based on usage patterns</li>
          <li>To prevent fraud and abuse</li>
        </ul>

        <h2>3.1 Legal Basis for Processing (GDPR Art. 6)</h2>
        <p>We process your personal data based on the following legal grounds:</p>
        <ul>
          <li><strong>Contract Performance (Art. 6.1.b):</strong> Processing necessary to provide you with our services</li>
          <li><strong>Legitimate Interest (Art. 6.1.f):</strong> Improving our services, security measures, fraud prevention</li>
          <li><strong>Consent (Art. 6.1.a):</strong> Marketing communications (opt-in only)</li>
          <li><strong>Legal Obligation (Art. 6.1.c):</strong> Tax records, fraud prevention as required by law</li>
        </ul>

        <h2>4. Data Security</h2>
        <p>
          We implement industry-standard security measures including:
        </p>
        <ul>
          <li>TLS 1.3 encryption for all data in transit</li>
          <li>SOC 2 Type II compliant infrastructure</li>
          <li>Regular security audits and penetration testing</li>
          <li>No persistent storage of source code</li>
        </ul>

        <h2>5. Third-Party Services</h2>
        <p>We use the following third-party services:</p>
        <ul>
          <li><strong>Google Gemini API:</strong> For AI-powered code analysis (subject to Google&apos;s Privacy Policy)</li>
          <li><strong>Vercel:</strong> Hosting and edge deployment</li>
          <li><strong>Supabase:</strong> Authentication and database</li>
          <li><strong>Stripe:</strong> Payment processing</li>
        </ul>

        <h2>6. Your Rights (GDPR/RGPD)</h2>
        <p>Under the General Data Protection Regulation (GDPR) and French RGPD, you have the following rights:</p>
        <ul>
          <li><strong>Right of Access (Art. 15):</strong> Request a copy of your personal data</li>
          <li><strong>Right to Rectification (Art. 16):</strong> Correct inaccurate or incomplete data</li>
          <li><strong>Right to Erasure (Art. 17):</strong> Request deletion of your personal data ("right to be forgotten")</li>
          <li><strong>Right to Portability (Art. 20):</strong> Receive your data in a structured, machine-readable format</li>
          <li><strong>Right to Object (Art. 21):</strong> Object to processing of your personal data</li>
          <li><strong>Right to Restriction (Art. 18):</strong> Request limitation of processing</li>
          <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
        </ul>
        <p>
          To exercise these rights, contact our Data Protection Officer at: <a href="mailto:dpo@codeswitch.io" className="text-blue-400">dpo@codeswitch.io</a>
        </p>
        <p>
          We will respond to your request within 30 days. If you are unsatisfied with our response, you have the right to lodge a complaint with your local supervisory authority (CNIL in France).
        </p>

        <h2>7. Data Retention</h2>
        <p>
          Account information is retained while your account is active. Upon account deletion, 
          personal data is removed within 30 days, except as required by law.
        </p>

        <h2>8. International Transfers</h2>
        <p>
          Our services are hosted globally on edge networks. By using CodeSwitch, you consent to 
          your data being processed in data centers worldwide.
        </p>

        <h2>9. Children&apos;s Privacy</h2>
        <p>
          CodeSwitch is not intended for users under 18 years of age. We do not knowingly 
          collect data from minors.
        </p>

        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy periodically. We will notify you of significant 
          changes via email or prominent notice on our website.
        </p>

        <h2>11. Contact Us</h2>
        <p>
          For privacy-related inquiries, contact us at:<br />
          <a href="mailto:privacy@codeswitch.io" className="text-blue-400">privacy@codeswitch.io</a>
        </p>

        <div className="mt-12 pt-8 border-t border-slate-700">
          <Link href="/" className="text-blue-400 hover:underline">&larr; Back to CodeSwitch</Link>
        </div>
      </main>
    </div>
  );
}
