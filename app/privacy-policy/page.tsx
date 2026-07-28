export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fdf7f8', fontFamily: "'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 36, textDecoration: 'none' }}>
          <span style={{ color: '#c4607a', fontSize: 20 }}>♥</span>
          <span style={{ fontFamily: "'Great Vibes',cursive", fontSize: 26, color: '#c4607a' }}>InviteGlow</span>
        </a>

        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 32 }}>Last updated: [Insert Date]</p>

        <div style={{ fontSize: 15, lineHeight: 1.8, color: '#334155' }}>
          <p>InviteGlow (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) respects your privacy and is committed to protecting the personal information of our customers and their invitation guests. This Privacy Policy explains what information we collect, how we use it, and the choices you have.</p>

          <h2 style={sectionTitle}>1. Information We Collect</h2>
          <p><strong>From customers (couples) who create an account:</strong></p>
          <ul style={list}>
            <li>Name and email address (used for account login and communication)</li>
            <li>Wedding details you choose to add (couple&rsquo;s names, wedding date, venue, photos, videos, guest list, RSVP settings, etc.)</li>
            <li>Payment-related information processed via our payment gateway (we do not store your full card details &mdash; these are handled securely by our payment processor)</li>
          </ul>
          <p><strong>From guests who visit a published invitation:</strong></p>
          <ul style={list}>
            <li>RSVP responses (name, attendance status, guest count, and any optional details such as dietary preferences)</li>
            <li>Wishes, messages, photos, or videos submitted through the guest wishes wall, if enabled by the couple</li>
            <li>Basic usage data such as page views, used only in aggregate to show the couple how many people have viewed their invitation</li>
          </ul>

          <h2 style={sectionTitle}>2. How We Use Your Information</h2>
          <p>We use the information collected to:</p>
          <ul style={list}>
            <li>Create and operate your InviteGlow account and invitation</li>
            <li>Display your invitation content to the guests you share it with</li>
            <li>Process payments for our services</li>
            <li>Provide customer support</li>
            <li>Improve our platform and troubleshoot technical issues</li>
            <li>Send you service-related communications (e.g. account verification, updates about your invitation)</li>
          </ul>
          <p>We do not sell personal information to third parties.</p>

          <h2 style={sectionTitle}>3. How We Store Your Information</h2>
          <p>Your data is stored using secure third-party infrastructure providers (including Supabase for our database and file storage, and Vercel for hosting). These providers maintain their own security standards, and we take reasonable technical and organizational measures to protect your data from unauthorized access, loss, or misuse.</p>

          <h2 style={sectionTitle}>4. Sharing of Information</h2>
          <p>We may share information with:</p>
          <ul style={list}>
            <li><strong>Service providers</strong> who help us operate InviteGlow (e.g. hosting, database, and payment processing providers), solely to the extent necessary to provide our services.</li>
            <li><strong>Legal authorities</strong>, if required to comply with applicable law, regulation, or legal process.</li>
          </ul>
          <p>We do not share your personal data with third parties for their own marketing purposes.</p>

          <h2 style={sectionTitle}>5. Guest-Submitted Content</h2>
          <p>Any photos, videos, or messages submitted by guests through a couple&rsquo;s invitation (e.g. the guest wishes wall) are visible to the couple, who can choose to approve or remove this content before it is shown publicly on their invitation.</p>

          <h2 style={sectionTitle}>6. Your Choices</h2>
          <p>You may:</p>
          <ul style={list}>
            <li>Update or correct your account and invitation details at any time through your InviteGlow dashboard</li>
            <li>Request deletion of your account and associated data by contacting us</li>
            <li>Request a copy of the personal data we hold about you</li>
          </ul>

          <h2 style={sectionTitle}>7. Cookies &amp; Similar Technologies</h2>
          <p>We may use cookies or similar technologies to keep you logged in and to understand how our platform is used. You can control cookie settings through your browser.</p>

          <h2 style={sectionTitle}>8. Children&rsquo;s Privacy</h2>
          <p>InviteGlow is intended for use by adults planning weddings and is not directed at children. We do not knowingly collect personal information from children.</p>

          <h2 style={sectionTitle}>9. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated &ldquo;Last updated&rdquo; date.</p>

          <h2 style={sectionTitle}>10. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy or how your information is handled, please contact us at <strong>[Insert Support Email]</strong>.</p>
        </div>
      </div>
    </div>
  )
}

const sectionTitle: React.CSSProperties = { fontSize: 19, fontWeight: 700, color: '#0f172a', marginTop: 28, marginBottom: 8 }
const list: React.CSSProperties = { paddingLeft: 20, margin: '8px 0' }
