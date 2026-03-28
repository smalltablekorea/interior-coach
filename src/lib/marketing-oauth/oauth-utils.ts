// =============================================================================
// OAuth Utility Functions
// =============================================================================

import crypto from "crypto";
import { OAUTH_PROVIDERS, CHANNEL_TO_PROVIDER } from "./providers";

// ── State Parameter (CSRF protection) ──

export function generateOAuthState(channel: string, userId: string): string {
  const stateData = {
    channel,
    userId,
    nonce: crypto.randomBytes(16).toString("hex"),
    ts: Date.now(),
  };
  return Buffer.from(JSON.stringify(stateData)).toString("base64url");
}

export function parseOAuthState(
  state: string
): { channel: string; userId: string; nonce: string; ts: number } | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(state, "base64url").toString()
    );
    // Reject states older than 10 minutes
    if (Date.now() - parsed.ts > 10 * 60 * 1000) return null;
    if (!parsed.userId) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ── Build Authorization URL ──

export function buildAuthorizationUrl(
  channel: string,
  redirectUri: string,
  userId: string
): string {
  const providerId = CHANNEL_TO_PROVIDER[channel];
  if (!providerId) throw new Error(`No OAuth provider for channel: ${channel}`);

  const provider = OAUTH_PROVIDERS[providerId];
  const clientId = process.env[provider.clientIdEnvKey];
  if (!clientId)
    throw new Error(`Missing env var: ${provider.clientIdEnvKey}`);

  const scopes = provider.scopes[channel];
  if (!scopes) throw new Error(`No scopes defined for channel: ${channel}`);

  const state = generateOAuthState(channel, userId);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
    ...(provider.extraAuthParams || {}),
  });

  // Google uses space-separated scopes, Meta uses comma-separated
  if (providerId === "google") {
    params.set("scope", scopes.join(" "));
  } else {
    params.set("scope", scopes.join(","));
  }

  return `${provider.authUrl}?${params.toString()}`;
}

// ── Exchange Code for Tokens ──

export async function exchangeCodeForTokens(
  providerId: string,
  code: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}> {
  const provider = OAUTH_PROVIDERS[providerId];
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);

  const clientId = process.env[provider.clientIdEnvKey]!;
  const clientSecret = process.env[provider.clientSecretEnvKey]!;

  if (!clientId || !clientSecret) {
    throw new Error(
      `Missing OAuth credentials for ${providerId}`
    );
  }

  const response = await fetch(provider.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Token exchange failed (${response.status}): ${errorBody}`
    );
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in || 3600,
  };
}

// ── Meta: Exchange for Long-Lived Token (60 days) ──

export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const provider = OAUTH_PROVIDERS.meta;
  const clientId = process.env[provider.clientIdEnvKey]!;
  const clientSecret = process.env[provider.clientSecretEnvKey]!;

  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: clientId,
    client_secret: clientSecret,
    fb_exchange_token: shortLivedToken,
  });

  const response = await fetch(
    `${provider.longLivedTokenUrl}?${params}`
  );
  if (!response.ok) {
    throw new Error("Meta long-lived token exchange failed");
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 5184000, // ~60 days
  };
}

// ── Refresh Access Token ──

export async function refreshAccessToken(
  channel: string,
  refreshToken: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}> {
  const providerId = CHANNEL_TO_PROVIDER[channel];
  const provider = OAUTH_PROVIDERS[providerId];
  const clientId = process.env[provider.clientIdEnvKey]!;
  const clientSecret = process.env[provider.clientSecretEnvKey]!;

  if (providerId === "meta") {
    // Meta: use long-lived token refresh
    const params = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: clientId,
      client_secret: clientSecret,
      fb_exchange_token: refreshToken,
    });
    const response = await fetch(`${provider.tokenUrl}?${params}`);
    if (!response.ok) throw new Error("Meta token refresh failed");
    const data = await response.json();
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in || 5184000,
    };
  }

  // Google: standard OAuth2 refresh
  const response = await fetch(provider.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) throw new Error("Google token refresh failed");
  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in || 3600,
  };
}
