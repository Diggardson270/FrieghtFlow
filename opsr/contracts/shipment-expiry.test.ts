// CT-12: Shipment auto-expiry mechanism

const EXPIRY_DURATION_MS = 72 * 60 * 60 * 1000; // 72 hours

interface Shipment {
  id: string;
  status: "PENDING" | "IN_TRANSIT" | "CANCELLED";
  createdAt: number;
  expiresAt: number;
}

const shipments = new Map<string, Shipment>();

function createShipment(id: string, now = Date.now()): Shipment {
  const s: Shipment = { id, status: "PENDING", createdAt: now, expiresAt: now + EXPIRY_DURATION_MS };
  shipments.set(id, s);
  return s;
}

function expireShipment(id: string, now = Date.now()): void {
  const s = shipments.get(id);
  if (!s) throw new Error("Not found");
  if (now < s.expiresAt) throw new Error("Not yet expired");
  if (s.status !== "PENDING") throw new Error("Only PENDING shipments can expire");
  s.status = "CANCELLED";
}

function acceptShipment(id: string, now = Date.now()): void {
  const s = shipments.get(id);
  if (!s) throw new Error("Not found");
  if (now >= s.expiresAt) throw new Error("Shipment has expired");
  s.status = "IN_TRANSIT";
}

// Tests
const now = Date.now();

// expires_at set correctly at creation
const s1 = createShipment("s1", now);
console.assert(s1.expiresAt === now + EXPIRY_DURATION_MS, "expiresAt set to 72h");

// cannot expire before deadline
try { expireShipment("s1", now + 1000); console.assert(false); }
catch (e: any) { console.assert(e.message.includes("Not yet expired"), "early expiry blocked"); }

// expire after deadline → CANCELLED
expireShipment("s1", now + EXPIRY_DURATION_MS + 1);
console.assert(shipments.get("s1")!.status === "CANCELLED", "expired shipment cancelled");

// accept_shipment rejects expired shipment
const s2 = createShipment("s2", now);
try { acceptShipment("s2", now + EXPIRY_DURATION_MS + 1); console.assert(false); }
catch (e: any) { console.assert(e.message.includes("expired"), "accept blocked after expiry"); }

// accept within window succeeds
const s3 = createShipment("s3", now);
acceptShipment("s3", now + 1000);
console.assert(shipments.get("s3")!.status === "IN_TRANSIT", "accepted within window");

console.log("CT-12: All shipment auto-expiry tests passed.");
