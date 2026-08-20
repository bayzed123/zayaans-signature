import type { AnchorHTMLAttributes, ReactNode } from "react";

/** GitHub project sites need their repository path on every navigable URL. */
export function sitePath(path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  const isGitHubProjectSite = typeof window !== "undefined" && window.location.hostname === "bayzed123.github.io";
  return isGitHubProjectSite ? `/zayaans-signature${suffix}` : suffix;
}

export function SiteLink({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) {
  return <a href={sitePath(href)} {...props}>{children}</a>;
}
