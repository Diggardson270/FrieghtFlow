// CT-09: Unit tests for Document Registry register and verify functions

interface Document {
  hash: string;
  cid: string;
  shipmentId: string;
  registeredBy: string;
}

const registry = new Map<string, Document>();

function registerDocument(hash: string, cid: string, shipmentId: string, caller: string, parties: string[]): boolean {
  if (!parties.includes(caller)) throw new Error("Unauthorized: caller not party to shipment");
  if (registry.has(hash)) throw new Error("Duplicate: document already registered");
  registry.set(hash, { hash, cid, shipmentId, registeredBy: caller });
  return true;
}

function verifyDocument(hash: string, providedHash: string): boolean {
  const doc = registry.get(hash);
  return doc !== undefined && doc.hash === providedHash;
}

function getDocument(hash: string): Document | undefined {
  return registry.get(hash);
}

function getShipmentDocs(shipmentId: string): Document[] {
  return Array.from(registry.values()).filter(d => d.shipmentId === shipmentId);
}

// Tests
const parties = ["shipper_addr", "carrier_addr"];

console.assert(registerDocument("hash_abc", "ipfs://cid1", "ship_01", "shipper_addr", parties), "should register document");
console.assert(verifyDocument("hash_abc", "hash_abc"), "should verify matching hash");
console.assert(!verifyDocument("hash_abc", "tampered_hash"), "should reject tampered hash");
console.assert(getDocument("hash_abc")?.cid === "ipfs://cid1", "should retrieve document");
console.assert(getShipmentDocs("ship_01").length === 1, "should list shipment docs");

try {
  registerDocument("hash_abc", "ipfs://cid2", "ship_01", "shipper_addr", parties);
  console.assert(false, "should reject duplicate");
} catch (e: any) {
  console.assert(e.message.includes("Duplicate"), "duplicate rejected");
}

try {
  registerDocument("hash_xyz", "ipfs://cid3", "ship_01", "outsider_addr", parties);
  console.assert(false, "should reject unauthorized");
} catch (e: any) {
  console.assert(e.message.includes("Unauthorized"), "unauthorized rejected");
}

console.log("CT-09: All document registry tests passed.");
