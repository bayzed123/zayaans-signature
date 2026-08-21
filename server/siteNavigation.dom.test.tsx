/** @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router, useLocation } from "wouter";
import { SiteLink, sitePath } from "../client/src/components/SiteLink";

// Regression coverage for a real production bug: SiteLink used to render a
// plain <a href> built from a runtime hostname check, which (a) forced a
// full page reload on every "internal" click instead of a client-side route
// change, and (b) double-prefixed the GitHub Pages base path whenever a
// caller combined sitePath() with wouter's own navigate()/useLocation --
// e.g. the product page's "Shop now" button, which 404'd in production.

describe("SiteLink and wouter base handling", () => {
  it("renders a single, correctly-prefixed href under the GitHub Pages base -- not doubled", () => {
    render(
      <Router base="/zayaans-signature">
        <SiteLink href="/collection">Shop the collection</SiteLink>
      </Router>
    );
    const link = screen.getByRole("link", { name: "Shop the collection" }) as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/zayaans-signature/collection");
  });

  it("intercepts clicks for client-side routing instead of a full page reload", () => {
    render(
      <Router base="/zayaans-signature">
        <SiteLink href="/cart">Bag</SiteLink>
      </Router>
    );
    const link = screen.getByRole("link", { name: "Bag" });
    const event = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    link.dispatchEvent(event);
    // wouter's Link calls preventDefault() and handles navigation itself;
    // a plain <a> (the old implementation) never does, so the browser would
    // perform a full reload.
    expect(event.defaultPrevented).toBe(true);
  });

  it("wouter's own navigate() already applies the router base -- combining it with sitePath() would double it", () => {
    function ShopNowProbe() {
      const [location, navigate] = useLocation();
      return (
        <div>
          <p>current: {location}</p>
          <button onClick={() => navigate("/cart")}>Shop now</button>
        </div>
      );
    }
    render(
      <Router base="/zayaans-signature">
        <ShopNowProbe />
      </Router>
    );
    screen.getByText("Shop now").click();
    // navigate("/cart") inside this base should resolve to the un-prefixed
    // relative location "/cart", not "/zayaans-signature/cart" and
    // certainly not the doubled "/zayaans-signature/zayaans-signature/cart"
    // that navigate(sitePath("/cart")) used to produce.
    expect(screen.getByText("current: /cart")).toBeTruthy();
    expect(window.location.pathname).toBe("/zayaans-signature/cart");
  });

  it("sitePath() stays available for real absolute paths outside of React Router (e.g. window.location.assign)", () => {
    expect(sitePath("/track")).toBe(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/track`);
  });
});
