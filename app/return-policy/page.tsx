export default function ReturnPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fdf7f8', fontFamily: "'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 36, textDecoration: 'none' }}>
          <span style={{ color: '#c4607a', fontSize: 20 }}>♥</span>
          <span style={{ fontFamily: "'Great Vibes',cursive", fontSize: 26, color: '#c4607a' }}>InviteGlow</span>
        </a>

        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Return &amp; Refund Policy</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 32 }}>Last updated: [Insert Date]</p>

        <div style={{ fontSize: 15, lineHeight: 1.8, color: '#334155' }}>
          <p>InviteGlow (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) provides digital wedding invitation services, including invitation design templates, guest management tools, and related features, delivered entirely online at inviteglow.com. As our products are digital services rather than physical goods, this policy explains how returns, cancellations, and refunds work for purchases made through our platform.</p>

          <h2 style={sectionTitle}>1. Nature of Our Service</h2>
          <p>InviteGlow does not sell or ship physical products. All purchases relate to digital access &mdash; creating, customizing, and publishing a digital wedding invitation, along with associated guest management and planning tools. Because the service is intangible and access is typically granted immediately after payment, our refund policy reflects the nature of digital goods.</p>

          <h2 style={sectionTitle}>2. Before Publishing</h2>
          <p>If a customer has purchased a package but has <strong>not yet published</strong> their invitation (i.e. the invitation link has not been shared publicly and the couple has not requested it be made shareable), the customer may request a full refund within <strong>7 days</strong> of purchase by contacting our support team.</p>

          <h2 style={sectionTitle}>3. After Publishing</h2>
          <p>Once an invitation has been <strong>published and made shareable</strong> with guests, the core service (creating and hosting a live, shareable invitation) has been delivered. Refunds are not available after publishing, except in cases where InviteGlow is at fault, such as:</p>
          <ul style={list}>
            <li>The invitation could not be published due to a technical fault on our end that we are unable to resolve within a reasonable time.</li>
            <li>A duplicate or accidental payment was made for the same invitation.</li>
          </ul>

          <h2 style={sectionTitle}>4. Custom Design Requests</h2>
          <p>For custom-designed invitations built by our design team, refunds are assessed on a case-by-case basis depending on how much design work has already been completed and delivered. Please contact us before requesting a custom design if you are unsure about this policy.</p>

          <h2 style={sectionTitle}>5. How to Request a Refund</h2>
          <p>To request a refund, please contact us at <strong>[Insert Support Email]</strong> or via WhatsApp at <strong>[Insert WhatsApp Number]</strong> with your order details (name, email used at signup, and invitation link if applicable). We aim to respond to all refund requests within 2&ndash;3 business days.</p>

          <h2 style={sectionTitle}>6. Approved Refunds</h2>
          <p>Approved refunds will be issued to the original payment method used at checkout. Please allow up to <strong>7&ndash;14 business days</strong> for the refund to reflect, depending on your bank or card issuer.</p>

          <h2 style={sectionTitle}>7. Changes to This Policy</h2>
          <p>We may update this Return &amp; Refund Policy from time to time. Any changes will be posted on this page with an updated &ldquo;Last updated&rdquo; date.</p>

          <h2 style={sectionTitle}>8. Contact Us</h2>
          <p>If you have any questions about this policy, please reach out to us at <strong>[Insert Support Email]</strong>.</p>
        </div>
      </div>
    </div>
  )
}

const sectionTitle: React.CSSProperties = { fontSize: 19, fontWeight: 700, color: '#0f172a', marginTop: 28, marginBottom: 8 }
const list: React.CSSProperties = { paddingLeft: 20, margin: '8px 0' }
