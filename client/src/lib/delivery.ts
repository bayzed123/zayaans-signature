/**
 * Home courier delivery pricing. Mirrors the same two constants enforced
 * server-side in cloudflare/worker.ts (DELIVERY_ZONES) -- these values are
 * for showing the customer a live total before they submit; the Worker
 * computes the authoritative charge itself from the chosen zone, never from
 * a client-sent amount.
 */
export type DeliveryZone = "dhaka" | "outside_dhaka";

export const DELIVERY_RATES: Record<DeliveryZone, number> = {
  dhaka: 9000, // ৳90
  outside_dhaka: 15000, // ৳150
};

export const DELIVERY_ZONE_OPTIONS: Array<{ value: DeliveryZone; label: string; description: string }> = [
  { value: "dhaka", label: "Inside Dhaka", description: "৳90 delivery charge" },
  { value: "outside_dhaka", label: "Outside Dhaka", description: "৳150 delivery charge, anywhere else in Bangladesh" },
];
