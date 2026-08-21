import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Link as WouterLink } from "wouter";

/**
 * Every route in this app is registered with wouter's own `base` (see
 * `App.tsx`, set from `import.meta.env.BASE_URL` -- `/zayaans-signature` on
 * the GitHub Pages build, `/` locally). wouter's `Link` and `navigate()`
 * already prepend that base automatically, so paths passed around the app
 * should stay un-prefixed ("/cart", not "/zayaans-signature/cart").
 *
 * `sitePath()` used to duplicate that prefixing itself (sniffing
 * `window.location.hostname` at runtime) and `SiteLink` rendered a plain
 * `<a href>` instead of wouter's `Link`. That had two effects in
 * production: every "internal" link on the site (every product card,
 * category link, nav item) triggered a full browser page reload instead of
 * a client-side route change, and any call site that combined `sitePath()`
 * with wouter's own `navigate`/`useLocation` (e.g. the Shop now button) had
 * the base prepended twice -- `/zayaans-signature/zayaans-signature/cart` --
 * which 404s. `sitePath()` is kept only for the couple of places that need
 * a real, resolvable absolute path outside of React Router (a hard
 * `window.location.assign`, or a shareable URL).
 */
export function sitePath(path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}${suffix}`;
}

export function SiteLink({
  href,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) {
  return (
    <WouterLink href={href} {...props}>
      {children}
    </WouterLink>
  );
}
