/**
 * MAIR-703: a content address entered in the course form is only rendered as a link when it is an `https:` address
 * or a path of this site. `javascript:`, `data:`, `http:`… are never followed; the destination domain is shown.
 */
export interface SafeLink {
  href: string;
  /** Domain the link leads to; undefined for a path of this site. */
  host?: string;
}

export const safeContentLink = (href?: string): SafeLink | undefined => {
  const value = href?.trim();
  if (!value) return undefined;
  // Browsers drop tabs and line breaks from URLs: « /\n/evil.test » would leave the site.
  if (/[\u0000-\u001f\u007f]/.test(value)) return undefined;
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return { href: value };
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname ? { href: url.href, host: url.hostname } : undefined;
  } catch {
    return undefined;
  }
};
