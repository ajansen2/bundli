/**
 * Onboarding Email Sequence
 *
 * Triggered by cron, sends timed emails based on when the merchant installed.
 * Sequence:
 *   Day 0 (immediate): Welcome to Bundli
 *   Day 1: Create your first bundle
 *   Day 3: Set up multi-packs
 *   Day 5: Check your bundle analytics
 *   Day 6: Trial ending tomorrow — upgrade to keep Pro features
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Bundli <hello@send.argora.ai>';

function dashboardUrl(shopDomain: string): string {
  const shopName = shopDomain.replace('.myshopify.com', '');
  return `https://admin.shopify.com/store/${shopName}/apps/bundli`;
}

function settingsUrl(shopDomain: string): string {
  const shopName = shopDomain.replace('.myshopify.com', '');
  return `https://admin.shopify.com/store/${shopName}/apps/bundli/settings`;
}

function wrapEmail(body: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:28px;font-weight:bold;background:linear-gradient(to right,#059669,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Bundli</div>
    </div>
    <div style="background:white;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
      ${body}
    </div>
    <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:12px;">
      <p>Bundli — Product Bundle Manager for Shopify</p>
      <p>You're receiving this because you installed Bundli. <a href="https://www.argora.ai" style="color:#94a3b8;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;
}

function ctaButton(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;padding:14px 32px;background:linear-gradient(to right,#059669,#3b82f6);color:white;font-weight:bold;font-size:16px;text-decoration:none;border-radius:12px;margin-top:8px;">${text}</a>`;
}

// --- Email Templates ---

export function welcomeEmail(storeName: string, shopDomain: string): { subject: string; html: string } {
  return {
    subject: `Welcome to Bundli, ${storeName}!`,
    html: wrapEmail(`
      <h1 style="color:#1e293b;font-size:28px;margin:0 0 8px;">Welcome to Bundli!</h1>
      <p style="color:#64748b;font-size:16px;margin:0 0 24px;">Your 7-day Pro trial has started. Here's how to get the most out of it.</p>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <h3 style="color:#059669;font-size:14px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">Quick Start Checklist</h3>
        <div style="color:#1e293b;font-size:15px;line-height:2;">
          1. Create your first product bundle<br>
          2. Set bundle pricing and discounts<br>
          3. Inventory syncs automatically<br>
          4. Track bundle performance
        </div>
      </div>

      <p style="color:#64748b;font-size:14px;">Your dashboard is ready — start creating bundles to increase your average order value.</p>

      <div style="text-align:center;margin-top:24px;">
        ${ctaButton('Open Your Dashboard', dashboardUrl(shopDomain))}
      </div>
    `),
  };
}

export function createBundleEmail(storeName: string, shopDomain: string): { subject: string; html: string } {
  return {
    subject: `${storeName} — create your first bundle in 2 minutes`,
    html: wrapEmail(`
      <h1 style="color:#1e293b;font-size:24px;margin:0 0 8px;">Create Your First Bundle</h1>
      <p style="color:#64748b;font-size:16px;margin:0 0 24px;">Select 2+ products, set quantities, and Bundli creates a bundle listing with automatic inventory deduction. Takes 2 minutes.</p>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <h3 style="color:#059669;font-size:14px;margin:0 0 12px;">How it works:</h3>
        <div style="color:#1e293b;font-size:15px;line-height:2;">
          1. Pick products from your catalog<br>
          2. Set quantities for each item<br>
          3. Choose a discount (% or fixed)<br>
          4. Bundli creates the listing &amp; syncs inventory
        </div>
      </div>

      <p style="color:#64748b;font-size:14px;">Stores that create their first bundle within 24 hours see 18% higher AOV in the first week.</p>

      <div style="text-align:center;margin-top:24px;">
        ${ctaButton('Create a Bundle', dashboardUrl(shopDomain))}
      </div>
    `),
  };
}

export function multiPackEmail(storeName: string, shopDomain: string): { subject: string; html: string } {
  return {
    subject: `The #1 way to increase AOV — multi-packs`,
    html: wrapEmail(`
      <h1 style="color:#1e293b;font-size:24px;margin:0 0 8px;">Set Up Multi-Packs</h1>
      <p style="color:#64748b;font-size:16px;margin:0 0 24px;">Sell 4-packs, 6-packs, or 12-packs with automatic price calculations. The #1 way to increase AOV.</p>

      <div style="display:flex;gap:12px;margin-bottom:24px;">
        <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:24px;margin-bottom:4px;">4-Pack</div>
          <div style="color:#059669;font-size:14px;font-weight:600;">10% off</div>
        </div>
        <div style="flex:1;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:24px;margin-bottom:4px;">6-Pack</div>
          <div style="color:#3b82f6;font-size:14px;font-weight:600;">15% off</div>
        </div>
        <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:24px;margin-bottom:4px;">12-Pack</div>
          <div style="color:#059669;font-size:14px;font-weight:600;">20% off</div>
        </div>
      </div>

      <p style="color:#64748b;font-size:14px;">Customers love buying in bulk when there's a clear savings incentive. Bundli handles the math and inventory for you.</p>

      <div style="text-align:center;margin-top:24px;">
        ${ctaButton('Create Multi-Pack', dashboardUrl(shopDomain))}
      </div>
    `),
  };
}

export function analyticsEmail(storeName: string, shopDomain: string): { subject: string; html: string } {
  return {
    subject: `Your bundle analytics are ready`,
    html: wrapEmail(`
      <h1 style="color:#1e293b;font-size:24px;margin:0 0 8px;">Check Your Bundle Analytics</h1>
      <p style="color:#64748b;font-size:16px;margin:0 0 24px;">See which bundles sell best, revenue per bundle, and conversion rates.</p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <h3 style="color:#1e293b;font-size:16px;margin:0 0 12px;">What you can track:</h3>
        <div style="color:#475569;font-size:15px;line-height:2;">
          &#10003; Revenue per bundle<br>
          &#10003; Units sold per bundle<br>
          &#10003; Conversion rate (views to purchases)<br>
          &#10003; Top performing bundles<br>
          &#10003; Inventory impact
        </div>
      </div>

      <p style="color:#64748b;font-size:14px;">Use analytics to double down on your best bundles and retire underperformers.</p>

      <div style="text-align:center;margin-top:24px;">
        ${ctaButton('View Analytics', dashboardUrl(shopDomain))}
      </div>
    `),
  };
}

export function trialEndingEmail(storeName: string, shopDomain: string): { subject: string; html: string } {
  return {
    subject: `Your Bundli Pro trial ends tomorrow`,
    html: wrapEmail(`
      <h1 style="color:#1e293b;font-size:24px;margin:0 0 8px;">Your Trial Ends Tomorrow</h1>
      <p style="color:#64748b;font-size:16px;margin:0 0 24px;">Your 7-day Pro trial is almost over. Subscribe to keep all your Pro features.</p>

      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;margin-bottom:24px;">
        <h3 style="color:#dc2626;font-size:14px;margin:0 0 12px;">What you'll lose without Pro:</h3>
        <div style="color:#475569;font-size:15px;line-height:2;">
          &#10007; Unlimited bundles<br>
          &#10007; Multi-pack pricing<br>
          &#10007; Automatic inventory sync<br>
          &#10007; Bundle analytics
        </div>
      </div>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
        <p style="color:#1e293b;font-size:20px;font-weight:700;margin:0;">$19.99/mo</p>
        <p style="color:#64748b;font-size:14px;margin:8px 0 0 0;">Cancel anytime. Billed through Shopify.</p>
      </div>

      <div style="text-align:center;margin-top:24px;">
        ${ctaButton('Upgrade to Pro', settingsUrl(shopDomain))}
      </div>
    `),
  };
}

// --- Send function ---

export async function sendOnboardingEmail(
  to: string,
  email: { subject: string; html: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: email.subject,
      html: email.html,
    });

    if (error) {
      console.error('Onboarding email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Onboarding email failed:', err);
    return { success: false, error: err?.message || 'Unknown error' };
  }
}
