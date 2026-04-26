// CT-10: Integration tests for Escrow and Shipment contract interaction

type ShipmentStatus = "PENDING" | "IN_TRANSIT" | "DELIVERED" | "CONFIRMED" | "CANCELLED" | "DISPUTED";
type EscrowStatus = "FUNDED" | "RELEASED" | "REFUNDED" | "DISPUTED";

interface Shipment { id: string; status: ShipmentStatus; shipper: string; carrier?: string; }
interface Escrow { shipmentId: string; amount: number; status: EscrowStatus; }

const shipments = new Map<string, Shipment>();
const escrows = new Map<string, Escrow>();

const fundEscrow = (shipmentId: string, amount: number) => escrows.set(shipmentId, { shipmentId, amount, status: "FUNDED" });
const acceptShipment = (id: string, carrier: string) => { const s = shipments.get(id)!; s.status = "IN_TRANSIT"; s.carrier = carrier; };
const markDelivered = (id: string) => { shipments.get(id)!.status = "DELIVERED"; };
const confirmDelivery = (id: string) => { shipments.get(id)!.status = "CONFIRMED"; escrows.get(id)!.status = "RELEASED"; };
const cancelShipment = (id: string) => { shipments.get(id)!.status = "CANCELLED"; escrows.get(id)!.status = "REFUNDED"; };
const raiseDispute = (id: string) => { shipments.get(id)!.status = "DISPUTED"; escrows.get(id)!.status = "DISPUTED"; };
const resolveDispute = (id: string, outcome: "COMPLETED" | "CANCELLED") => {
  shipments.get(id)!.status = outcome === "COMPLETED" ? "CONFIRMED" : "CANCELLED";
  escrows.get(id)!.status = outcome === "COMPLETED" ? "RELEASED" : "REFUNDED";
};

// Test 1: full happy path
shipments.set("s1", { id: "s1", status: "PENDING", shipper: "alice" });
fundEscrow("s1", 500); acceptShipment("s1", "bob"); markDelivered("s1"); confirmDelivery("s1");
console.assert(shipments.get("s1")!.status === "CONFIRMED", "s1 confirmed");
console.assert(escrows.get("s1")!.status === "RELEASED", "s1 escrow released");

// Test 2: cancelled before delivery → refund
shipments.set("s2", { id: "s2", status: "PENDING", shipper: "alice" });
fundEscrow("s2", 300); cancelShipment("s2");
console.assert(shipments.get("s2")!.status === "CANCELLED", "s2 cancelled");
console.assert(escrows.get("s2")!.status === "REFUNDED", "s2 escrow refunded");

// Test 3: dispute resolved as COMPLETED → payment released
shipments.set("s3", { id: "s3", status: "IN_TRANSIT", shipper: "alice", carrier: "bob" });
fundEscrow("s3", 400); raiseDispute("s3"); resolveDispute("s3", "COMPLETED");
console.assert(escrows.get("s3")!.status === "RELEASED", "s3 dispute released");

// Test 4: dispute resolved as CANCELLED → refund
shipments.set("s4", { id: "s4", status: "IN_TRANSIT", shipper: "alice", carrier: "bob" });
fundEscrow("s4", 400); raiseDispute("s4"); resolveDispute("s4", "CANCELLED");
console.assert(escrows.get("s4")!.status === "REFUNDED", "s4 dispute refunded");

console.log("CT-10: All escrow-shipment integration tests passed.");
