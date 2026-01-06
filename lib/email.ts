import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Use Resend's default domain for testing, or your verified domain
const FROM_EMAIL = 'Bundli <onboarding@resend.dev>';

export interface BundleSoldEmailData {
  storeName: string;
  storeEmail: string;
  bundleName: string;
  bundlePrice: number;
  itemsSold: { title: string; quantity: number }[];
  orderNumber: string;
  customerName: string;
}

export interface LowInventoryEmailData {
  storeName: string;
  storeEmail: string;
  productTitle: string;
  currentStock: number;
  bundlesAffected: string[];
}

export interface WeeklySummaryEmailData {
  storeName: string;
  storeEmail: string;
  totalBundlesSold: number;
  totalRevenue: number;
  topBundle: { name: string; sold: number };
  periodStart: string;
  periodEnd: string;
}

export async function sendBundleSoldEmail(data: BundleSoldEmailData) {
  const itemsList = data.itemsSold
    .map(item => `  - ${item.title} x${item.quantity}`)
    .join('\n');

  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.storeEmail,
      subject: `Bundle Sold: ${data.bundleName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Bundle Sold!</h1>
          </div>

          <div style="padding: 30px; background: #f8fafc;">
            <p style="color: #334155; font-size: 16px;">
              Great news! A bundle was just purchased from <strong>${data.storeName}</strong>.
            </p>

            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <h2 style="color: #10b981; margin-top: 0; font-size: 18px;">${data.bundleName}</h2>
              <p style="color: #64748b; margin: 5px 0;">Order #${data.orderNumber}</p>
              <p style="color: #64748b; margin: 5px 0;">Customer: ${data.customerName}</p>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;">

              <p style="color: #334155; font-weight: 600; margin-bottom: 10px;">Items included:</p>
              <div style="color: #64748b; font-size: 14px; white-space: pre-line;">${itemsList}</div>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;">

              <p style="color: #334155; font-size: 20px; font-weight: 700; text-align: right;">
                $${data.bundlePrice.toFixed(2)}
              </p>
            </div>

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              Inventory has been automatically deducted for all bundle items.
            </p>
          </div>

          <div style="background: #1e293b; padding: 20px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Sent by Bundli - Smart Product Bundles for Shopify
            </p>
          </div>
        </div>
      `,
    });

    return { success: true, id: response.data?.id };
  } catch (error) {
    console.error('Failed to send bundle sold email:', error);
    return { success: false, error };
  }
}

export async function sendLowInventoryEmail(data: LowInventoryEmailData) {
  const bundlesList = data.bundlesAffected
    .map(b => `  - ${b}`)
    .join('\n');

  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.storeEmail,
      subject: `Low Inventory Alert: ${data.productTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Low Inventory Alert</h1>
          </div>

          <div style="padding: 30px; background: #f8fafc;">
            <p style="color: #334155; font-size: 16px;">
              A product in your bundles is running low on stock.
            </p>

            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #fbbf24;">
              <h2 style="color: #d97706; margin-top: 0; font-size: 18px;">${data.productTitle}</h2>
              <p style="color: #334155; font-size: 24px; font-weight: 700;">
                ${data.currentStock} remaining
              </p>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;">

              <p style="color: #334155; font-weight: 600; margin-bottom: 10px;">Bundles affected:</p>
              <div style="color: #64748b; font-size: 14px; white-space: pre-line;">${bundlesList}</div>
            </div>

            <p style="color: #64748b; font-size: 14px;">
              Consider restocking to avoid bundle availability issues.
            </p>
          </div>

          <div style="background: #1e293b; padding: 20px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Sent by Bundli - Smart Product Bundles for Shopify
            </p>
          </div>
        </div>
      `,
    });

    return { success: true, id: response.data?.id };
  } catch (error) {
    console.error('Failed to send low inventory email:', error);
    return { success: false, error };
  }
}

export async function sendWeeklySummaryEmail(data: WeeklySummaryEmailData) {
  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.storeEmail,
      subject: `Bundli Weekly Summary - ${data.totalBundlesSold} bundles sold`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Weekly Summary</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">${data.periodStart} - ${data.periodEnd}</p>
          </div>

          <div style="padding: 30px; background: #f8fafc;">
            <p style="color: #334155; font-size: 16px;">
              Here's how your bundles performed this week at <strong>${data.storeName}</strong>.
            </p>

            <div style="display: flex; gap: 15px; margin: 20px 0;">
              <div style="flex: 1; background: white; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 12px; margin: 0 0 5px 0;">Bundles Sold</p>
                <p style="color: #8b5cf6; font-size: 32px; font-weight: 700; margin: 0;">${data.totalBundlesSold}</p>
              </div>
              <div style="flex: 1; background: white; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 12px; margin: 0 0 5px 0;">Revenue</p>
                <p style="color: #10b981; font-size: 32px; font-weight: 700; margin: 0;">$${data.totalRevenue.toFixed(2)}</p>
              </div>
            </div>

            ${data.topBundle.sold > 0 ? `
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 12px; margin: 0 0 5px 0;">Top Performing Bundle</p>
              <p style="color: #334155; font-size: 18px; font-weight: 600; margin: 0;">${data.topBundle.name}</p>
              <p style="color: #10b981; font-size: 14px; margin: 5px 0 0 0;">${data.topBundle.sold} sold this week</p>
            </div>
            ` : ''}
          </div>

          <div style="background: #1e293b; padding: 20px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Sent by Bundli - Smart Product Bundles for Shopify
            </p>
          </div>
        </div>
      `,
    });

    return { success: true, id: response.data?.id };
  } catch (error) {
    console.error('Failed to send weekly summary email:', error);
    return { success: false, error };
  }
}
