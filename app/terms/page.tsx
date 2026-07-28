export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fdf7f8', fontFamily: "'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 36, textDecoration: 'none' }}>
          <span style={{ color: '#c4607a', fontSize: 20 }}>♥</span>
          <span style={{ fontFamily: "'Great Vibes',cursive", fontSize: 26, color: '#c4607a' }}>InviteGlow</span>
        </a>

        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Business Terms &amp; Conditions</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 32 }}>Last updated: [Insert Date]</p>

        <div style={{ fontSize: 15, lineHeight: 1.8, color: '#334155' }}>
          <p>These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your use of InviteGlow&rsquo;s website and services (inviteglow.com), including our digital wedding invitation platform, template library, guest management tools, and related features (collectively, the &ldquo;Service&rdquo;). By creating an account or using the Service, you agree to these Terms.</p>

          <h2 style={sectionTitle}>1. About InviteGlow</h2>
          <p>InviteGlow is a digital wedding invitation platform serving customers in Sri Lanka, allowing couples to create, customize, and share digital wedding invitations, manage their guest list and RSVPs, and access wedding planning tools.</p>

          <h2 style={sectionTitle}>2. Eligibility</h2>
          <p>You must be at least 18 years old to create an account and purchase our services. By using InviteGlow, you confirm that you meet this requirement.</p>

          <h2 style={sectionTitle}>3. Account Registration</h2>
          <p>To use certain features, you must create an account with accurate and complete information. You are responsible for maintaining the confidentiality of your account login details and for all activity that occurs under your account.</p>

          <h2 style={sectionTitle}>4. Our Services</h2>
          <p>InviteGlow provides:</p>
          <ul style={list}>
            <li>A library of customizable digital wedding invitation templates</li>
            <li>A self-service editor to personalize invitation content, photos, colors, and details</li>
            <li>Guest management tools (personalised guest links, RSVP collection, seating arrangement)</li>
            <li>Wedding planning tools (budget tracker, vendor list, task checklist)</li>
            <li>An optional guest wishes wall for photos, videos, and messages from guests</li>
            <li>Custom-designed invitations built by our design team, where purchased</li>
          </ul>

          <h2 style={sectionTitle}>5. Payments &amp; Pricing</h2>
          <p>Prices for our services are displayed on our website at the time of purchase. Payment is required before your invitation can be published and shared with guests. All payments are processed through our third-party payment gateway partner. By making a payment, you agree to their applicable terms as well.</p>

          <h2 style={sectionTitle}>6. Refunds</h2>
          <p>Refunds are handled in accordance with our <a href="/return-policy" style={{ color: '#c4607a' }}>Return &amp; Refund Policy</a>, available on our website.</p>

          <h2 style={sectionTitle}>7. Your Content</h2>
          <p>You retain ownership of the content you upload to InviteGlow (photos, videos, text, and other wedding details). By uploading content, you grant InviteGlow a limited license to store, display, and process that content solely for the purpose of providing the Service to you and your invited guests. You are responsible for ensuring you have the right to use and share any content you upload.</p>

          <h2 style={sectionTitle}>8. Acceptable Use</h2>
          <p>You agree not to use InviteGlow to:</p>
          <ul style={list}>
            <li>Upload unlawful, defamatory, obscene, or infringing content</li>
            <li>Attempt to interfere with the security or functioning of the platform</li>
            <li>Use the Service for any purpose other than planning and sharing genuine wedding-related invitations</li>
          </ul>
          <p>We reserve the right to suspend or terminate accounts that violate these Terms.</p>

          <h2 style={sectionTitle}>9. Service Availability</h2>
          <p>We aim to keep InviteGlow available and functioning at all times but do not guarantee uninterrupted access. We are not liable for temporary unavailability due to maintenance, technical issues, or circumstances beyond our reasonable control.</p>

          <h2 style={sectionTitle}>10. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, InviteGlow is not liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability for any claim relating to the Service is limited to the amount you paid for the relevant order.</p>

          <h2 style={sectionTitle}>11. Changes to the Service or Terms</h2>
          <p>We may update these Terms or modify our Service from time to time. Continued use of InviteGlow after changes are posted constitutes acceptance of the updated Terms.</p>

          <h2 style={sectionTitle}>12. Governing Law</h2>
          <p>These Terms are governed by the laws of Sri Lanka.</p>

          <h2 style={sectionTitle}>13. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at <strong>[Insert Support Email]</strong>.</p>
        </div>
      </div>
    </div>
  )
}

const sectionTitle: React.CSSProperties = { fontSize: 19, fontWeight: 700, color: '#0f172a', marginTop: 28, marginBottom: 8 }
const list: React.CSSProperties = { paddingLeft: 20, margin: '8px 0' }
