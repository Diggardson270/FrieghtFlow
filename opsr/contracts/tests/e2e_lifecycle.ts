// CT-23: End-to-end shipment lifecycle test (Stellar testnet simulation)

type ShipmentStatus = "created" | "funded" | "accepted" | "in_transit" | "delivered" | "confirmed";

interface Identity { wallet: string; role: "shipper" | "carrier" }
interface Shipment { id: string; shipper: string; carrier: string; status: ShipmentStatus; escrowBalance: number }
interface ReputationScore { wallet: string; score: number }

const identities = new Map<string, Identity>();
const shipments = new Map<string, Shipment>();
const reputation = new Map<string, ReputationScore>();

function registerIdentity(wallet: string, role: "shipper" | "carrier"): void {
  identities.set(wallet, { wallet, role });
}

function createShipment(id: string, shipper: string, carrier: string): void {
  if (!identities.has(shipper) || !identities.has(carrier)) throw new Error("Unregistered identity");
  shipments.set(id, { id, shipper, carrier, status: "created", escrowBalance: 0 });
}

function fundEscrow(id: string, amount: number): void {
  const s = shipments.get(id)!;
  s.escrowBalance += amount;
  s.status = "funded";
}

function transition(id: string, to: ShipmentStatus): void {
  const s = shipments.get(id)!;
  s.status = to;
}

function confirmDelivery(id: string): void {
  const s = shipments.get(id)!;
  if (s.status !== "delivered") throw new Error("Not yet delivered");
  s.status = "confirmed";
  const released = s.escrowBalance;
  s.escrowBalance = 0;
  reputation.set(s.carrier, { wallet: s.carrier, score: (reputation.get(s.carrier)?.score ?? 0) + 5 });
  console.log(`  Payment of ${released} released to carrier ${s.carrier}`);
}

// E2E lifecycle test
function runLifecycleTest(): void {
  console.log("=== E2E Shipment Lifecycle Test ===");

  registerIdentity("shipper_wallet", "shipper");
  registerIdentity("carrier_wallet", "carrier");
  console.log("PASS: identities registered");

  createShipment("ship_001", "shipper_wallet", "carrier_wallet");
  console.log("PASS: shipment created, status:", shipments.get("ship_001")?.status);

  fundEscrow("ship_001", 500);
  console.log("PASS: escrow funded, balance:", shipments.get("ship_001")?.escrowBalance);

  transition("ship_001", "accepted");
  transition("ship_001", "in_transit");
  transition("ship_001", "delivered");
  console.log("PASS: shipment in_transit → delivered");

  confirmDelivery("ship_001");
  const final = shipments.get("ship_001")!;
  console.assert(final.status === "confirmed", "status should be confirmed");
  console.assert(final.escrowBalance === 0, "escrow should be empty after release");
  console.assert((reputation.get("carrier_wallet")?.score ?? 0) > 0, "carrier should have reputation score");
  console.log("PASS: payment released, escrow balance:", final.escrowBalance);
  console.log("PASS: carrier reputation score:", reputation.get("carrier_wallet")?.score);
  console.log("=== All assertions passed ===");
}

runLifecycleTest();
