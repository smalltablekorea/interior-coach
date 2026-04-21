// =============================================================================
// OAuth Provider Configuration for Marketing Channels
// =============================================================================

export interface MarketingOAuthProvider {
  id: string;
  authUrl: string;
  tokenUrl: string;
  clientIdEnvKey: string;
  clientSecretEnvKey: string;
  scopes: Record<string, string[]>;
  extraAuthParams?: Record<string, string>;
  longLivedTokenUrl?: string;
  profileUrl?: string;
}

export const OAUTH_PROVIDERS: Record<string, MarketingOAuthProvider> = {
  meta: {
    id: "meta",
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    clientIdEnvKey: "META_APP_ID",
    clientSecretEnvKey: "META_APP_SECRET",
    scopes: {
      threads: [
        "threads_basic",
        "threads_content_publish",
        "threads_manage_insights",
      ],
      instagram: [
        "instagram_basic",
        "instagram_content_publish",
        "instagram_manage_insights",
        "pages_show_list",
      ],
      meta_ads: ["ads_read", "ads_management", "read_insights"],
    },
    longLivedTokenUrl:
      "https://graph.facebook.com/v19.0/oauth/access_token",
    profileUrl: "https://graph.facebook.com/v19.0/me",
  },
  google: {
    id: "google",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    clientIdEnvKey: "GOOGLE_CLIENT_ID",
    clientSecretEnvKey: "GOOGLE_CLIENT_SECRET",
    scopes: {
      youtube: [
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube.force-ssl",
        "https://www.googleapis.com/auth/yt-analytics.readonly",
      ],
    },
    extraAuthParams: {
      access_type: "offline",
      prompt: "consent",
    },
    profileUrl:
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
  },
  x: {
    id: "x",
    authUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    clientIdEnvKey: "X_CLIENT_ID",
    clientSecretEnvKey: "X_CLIENT_SECRET",
    scopes: {
      x: [
        "tweet.read",
        "tweet.write",
        "users.read",
        "offline.access",
      ],
    },
    extraAuthParams: {
      code_challenge_method: "S256",
    },
    profileUrl: "https://api.twitter.com/2/users/me",
  },
};

export const CHANNEL_TO_PROVIDER: Record<string, string> = {
  threads: "meta",
  instagram: "meta",
  meta_ads: "meta",
  youtube: "google",
  x: "x",
};
