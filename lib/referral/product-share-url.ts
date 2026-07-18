/** Append or replace `?ref=` on an internal storefront path. */
export function appendReferralQuery(href: string, referralCode: string): string {
  const code = referralCode.trim().toUpperCase();
  if (!code) return href;

  const hashIndex = href.indexOf("#");
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const pathAndQuery = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const [path, query = ""] = pathAndQuery.split("?", 2);
  const params = new URLSearchParams(query);
  params.set("ref", code);
  const qs = params.toString();
  return `${path}?${qs}${hash}`;
}

/** Public share URL: catalog or a specific product detail page. */
export function storefrontReferralShareUrl(
  siteBaseUrl: string,
  referralCode: string,
  productSlug?: string | null
): string {
  const base = siteBaseUrl.replace(/\/$/, "");
  const code = encodeURIComponent(referralCode.trim().toUpperCase());
  const slug = productSlug?.trim();
  if (slug) {
    return `${base}/products/${encodeURIComponent(slug)}?ref=${code}`;
  }
  return `${base}/products?ref=${code}`;
}

function referralCodeFromShareUrl(shareUrl: string): string | null {
  try {
    const url = new URL(shareUrl);
    const fromQuery = url.searchParams.get("ref")?.trim();
    if (fromQuery) return fromQuery.toUpperCase();

    const rMatch = url.pathname.match(/\/r\/([^/]+)/i);
    if (rMatch?.[1]) {
      return decodeURIComponent(rMatch[1]).trim().toUpperCase();
    }
  } catch {
    // fall through
  }
  return null;
}

/** Normalize legacy `/r/CODE` links to `/products/...?ref=CODE`. */
export function resolveStorefrontReferralShareUrl(
  shareUrl: string,
  productSlug?: string | null
): string {
  const slug = productSlug?.trim();
  const code = referralCodeFromShareUrl(shareUrl);
  if (!code) return shareUrl;

  try {
    const url = new URL(shareUrl);
    const pathSlug = url.pathname.match(/\/products\/([^/]+)/)?.[1];
    const resolvedSlug = slug || (pathSlug ? decodeURIComponent(pathSlug) : null);
    return storefrontReferralShareUrl(url.origin, code, resolvedSlug);
  } catch {
    return storefrontReferralShareUrl("", code, slug).replace(/^\/\//, "");
  }
}

/** @deprecated Use resolveStorefrontReferralShareUrl */
export function referralShareUrlWithProduct(
  baseShareUrl: string,
  productSlug?: string | null
): string {
  return resolveStorefrontReferralShareUrl(baseShareUrl, productSlug);
}

export function productReferralLandingPath(productSlug: string): string {
  return `/products/${encodeURIComponent(productSlug.trim())}`;
}
