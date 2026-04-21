// Shopify App Bridge utilities for embedded apps
// IMPORTANT: We use the CDN global (window.shopify) NOT npm imports
// This is required for Shopify's automated "Embedded app checks"

// TypeScript interfaces for Shopify App Bridge CDN global
interface AppBridgeApp {
  dispatch?: (action: {
    type: string;
    payload?: Record<string, unknown>;
  }) => void;
  idToken?: () => Promise<string>;
}

declare global {
  interface Window {
    shopify: {
      createApp(config: {
        apiKey: string;
        host: string;
        forceRedirect?: boolean;
      }): AppBridgeApp;
      sessionToken?: {
        getSessionToken(app: AppBridgeApp): Promise<string>;
      };
    };
    shopifyApp?: AppBridgeApp;
  }
}

let appBridge: AppBridgeApp | null = null;

export function initializeAppBridge() {
  const isEmbedded = window.self !== window.top;

  if (!isEmbedded) {
    return null;
  }

  if (window.shopifyApp && !appBridge) {
    appBridge = window.shopifyApp;
    console.log('Using existing App Bridge instance');
    return appBridge;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const host = urlParams.get('host');
  const shop = urlParams.get('shop');

  if (!host || !shop) {
    console.warn('Missing host or shop parameter - not embedded in Shopify');
    return null;
  }

  if (!appBridge) {
    try {
      if (!window.shopify?.createApp) {
        console.warn('Shopify App Bridge CDN not loaded');
        return null;
      }

      appBridge = window.shopify.createApp({
        apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '',
        host: host,
        forceRedirect: false,
      });

      console.log('App Bridge initialized');
    } catch (error) {
      console.error('Failed to initialize App Bridge:', error);
      return null;
    }
  }

  return appBridge;
}

export async function getShopifySessionToken(): Promise<string | null> {
  if (!appBridge) {
    initializeAppBridge();
  }

  if (!appBridge) {
    return null;
  }

  try {
    if (typeof appBridge.idToken === 'function') {
      return await appBridge.idToken();
    }

    if (window.shopify?.sessionToken?.getSessionToken) {
      return await window.shopify.sessionToken.getSessionToken(appBridge);
    }

    return null;
  } catch (error) {
    console.error('Failed to get session token:', error);
    return null;
  }
}

export function isEmbeddedInShopify(): boolean {
  return window.self !== window.top;
}

export function navigateInApp(path: string) {
  const isEmbedded = window.self !== window.top;

  if (!isEmbedded) {
    window.location.href = path;
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const shop = urlParams.get('shop');
  const host = urlParams.get('host');

  let fullPath = path;
  if (shop || host) {
    const params = new URLSearchParams();
    if (shop) params.set('shop', shop);
    if (host) params.set('host', host);
    fullPath = `${path}?${params.toString()}`;
  }

  if (!appBridge) {
    initializeAppBridge();
  }

  if (!appBridge) {
    window.location.href = fullPath;
    return;
  }

  try {
    if (appBridge.dispatch) {
      appBridge.dispatch({
        type: 'Redirect',
        payload: {
          path: fullPath,
          newContext: false,
        },
      });
    } else {
      window.location.href = fullPath;
    }
  } catch (error) {
    console.error('Failed to navigate with App Bridge:', error);
    window.location.href = fullPath;
  }
}

// Redirect to Shopify admin if app is opened standalone (not embedded)
export function redirectToShopifyAdmin(shop: string): boolean {
  const isEmbedded = window.self !== window.top;
  if (isEmbedded) return false;

  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '';
  const storeName = shop.replace('.myshopify.com', '');
  const adminUrl = `https://admin.shopify.com/store/${storeName}/apps/${apiKey}`;

  console.log('Redirecting to Shopify admin:', adminUrl);
  window.location.href = adminUrl;
  return true;
}

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getShopifySessionToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}

export function redirectToOAuth(url: string) {
  const isEmbedded = window.self !== window.top;

  if (!isEmbedded) {
    window.location.href = url;
    return;
  }

  // Method 1: window.open with _top target
  try {
    const opened = window.open(url, '_top');
    if (opened !== null) return;
  } catch (e) {
    console.log('window.open failed:', e);
  }

  // Method 2: parent.location
  try {
    if (window.parent && window.parent !== window) {
      window.parent.location.href = url;
      return;
    }
  } catch (e) {
    console.log('parent.location failed:', e);
  }

  // Method 3: top.location
  try {
    if (window.top && window.top !== window) {
      window.top.location.href = url;
      return;
    }
  } catch (e) {
    console.log('top.location failed:', e);
  }

  // Method 4: App Bridge dispatch
  if (!appBridge) {
    initializeAppBridge();
  }

  if (appBridge && appBridge.dispatch) {
    try {
      appBridge.dispatch({
        type: 'Redirect',
        payload: {
          url: url,
          newContext: true,
        },
      });
      return;
    } catch (e) {
      console.log('App Bridge dispatch failed:', e);
    }
  }

  // Fallback
  window.location.href = url;
}
