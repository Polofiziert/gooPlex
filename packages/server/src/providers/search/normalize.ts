import type { SourceType } from "@gooplex/shared";

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "ref_src",
]);

const ACADEMIC_HOSTS = [
  "arxiv.org",
  "biorxiv.org",
  "ssrn.com",
  "pubmed.ncbi.nlm.nih.gov",
  "ncbi.nlm.nih.gov",
  "doi.org",
  "acm.org",
  "ieee.org",
  "springer.com",
  "sciencedirect.com",
  "nature.com",
  "jstor.org",
  "semanticscholar.org",
  "researchgate.net",
];

const DOCS_HOSTS = [
  "pkg.go.dev",
  "crates.io",
  "docs.rs",
  "npmjs.com",
  "rust-lang.org",
  "python.org",
  "nodejs.org",
  "w3.org",
  "rfc-editor.org",
  "ietf.org",
  "man7.org",
];

const FORUM_HOSTS = [
  "reddit.com",
  "stackoverflow.com",
  "news.ycombinator.com",
  "quora.com",
  "discourse.org",
];

const NEWS_HOSTS = [
  "nytimes.com",
  "bbc.com",
  "bbc.co.uk",
  "reuters.com",
  "apnews.com",
  "theguardian.com",
  "bloomberg.com",
  "wsj.com",
  "washingtonpost.com",
  "cnn.com",
  "theverge.com",
  "arstechnica.com",
  "techcrunch.com",
  "wired.com",
  "ft.com",
];

const DOCS_PATH_RE =
  /\/(?:docs|documentation|reference|api|manual|guide|man)(?:\/|$)/;

/** Strip protocol, www, trailing slash, and common tracking params for dedupe keys. */
export function normalizeUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw.toLowerCase().replace(/\/+$/, "");
  }

  const host = url.hostname.replace(/^www\./i, "").toLowerCase();
  const path = url.pathname.replace(/\/+$/, "") || "/";

  const params = new URLSearchParams(url.search);
  for (const key of [...params.keys()]) {
    if (TRACKING_PARAMS.has(key.toLowerCase())) {
      params.delete(key);
    }
  }
  const query = params.toString();
  return query ? `${host}${path}?${query}` : `${host}${path}`;
}

function hostEndsWith(host: string, suffix: string): boolean {
  return host === suffix || host.endsWith(suffix);
}

/** First-match-wins sourceType table from contracts.md. */
export function classifySourceType(url: string): SourceType {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "other";
  }

  const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  const path = parsed.pathname.toLowerCase();

  // 1. .edu / .ac.<cc>
  if (hostEndsWith(host, ".edu") || /\.ac\.[a-z]{2}$/.test(host)) {
    return "academic";
  }

  // 2. arxiv / biorxiv / ssrn / pubmed / ncbi
  if (ACADEMIC_HOSTS.some((h) => host === h || hostEndsWith(host, h))) {
    return "academic";
  }

  // 3. doi.org / acm / ieee / springer / etc. (covered by ACADEMIC_HOSTS above)

  // 4. developer.* / docs.* / *.readthedocs.io / devdocs
  if (
    host.startsWith("developer.") ||
    host.startsWith("docs.") ||
    hostEndsWith(host, ".readthedocs.io") ||
    host === "devdocs.io"
  ) {
    return "docs";
  }

  // 5. path contains /docs|/documentation|/reference|/api|/manual|/guide|/man/
  if (DOCS_PATH_RE.test(path)) {
    return "docs";
  }

  // 6. *.github.io / pkg.go.dev / crates.io / docs.rs / npmjs / etc.
  if (
    hostEndsWith(host, ".github.io") ||
    DOCS_HOSTS.some((h) => host === h || hostEndsWith(host, h))
  ) {
    return "docs";
  }

  // 7. reddit / stackexchange / stackoverflow / HN / quora / discourse / forum|community
  if (
    FORUM_HOSTS.some((h) => host === h || hostEndsWith(host, h)) ||
    host.includes("stackexchange.com") ||
    host.includes("forum") ||
    host.includes("community")
  ) {
    return "forum";
  }

  // 8. github.com /issues|/discussions -> forum; else github.com -> docs
  if (host === "github.com") {
    if (path.includes("/issues") || path.includes("/discussions")) {
      return "forum";
    }
    return "docs";
  }

  // 9. curated news list
  if (NEWS_HOSTS.some((h) => host === h || hostEndsWith(host, h))) {
    return "news";
  }

  // 10–11. default -> other (medium/substack/wordpress/blogspot fall here)
  return "other";
}
