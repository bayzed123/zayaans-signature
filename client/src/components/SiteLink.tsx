import type { AnchorHTMLAttributes, ReactNode } from "react";

/** GitHub project sites need their repository path on every navigable URL. */
export function sitePath(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

export function SiteLink({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) {
  return <a href={sitePath(href)} {...props}>{children}</a>;
}
