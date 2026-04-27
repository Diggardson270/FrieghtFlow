// CT-21: Time-locked dispute resolution for Escrow contract

const LOCKUP_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days default

interface EscrowRecord {
  shipmentId: string;
  shipper: string;
  carrier: string;
  amount: number;
  status: "active" | "disputed" | "released" | "claimed";
  disputedAt?: number;
}

const escrows = new Map<string, EscrowRecord>();
let configuredLockupMs = LOCKUP_PERIOD_MS;

export function setLockupPeriod(days: number): void {
  configuredLockupMs = days * 24 * 60 * 60 * 1000;
}

export function raiseDispute(shipmentId: string): void {
  const record = escrows.get(shipmentId);
  if (!record || record.status !== "active") throw new Error("Escrow not active");
  record.status = "disputed";
  record.disputedAt = Date.now();
}

export function claimUnresolvedEscrow(shipmentId: string, caller: string): void {
  const record = escrows.get(shipmentId);
  if (!record) throw new Error("Escrow not found");
  if (record.status !== "disputed") throw new Error("Escrow is not in disputed state");
  if (!record.disputedAt) throw new Error("No dispute timestamp recorded");

  const elapsed = Date.now() - record.disputedAt;
  if (elapsed < configuredLockupMs) {
    throw new Error(`Lockup period not expired. Wait ${Math.ceil((configuredLockupMs - elapsed) / 86400000)} more day(s)`);
  }

  if (caller !== record.shipper && caller !== record.carrier) {
    throw new Error("Only shipper or carrier can claim unresolved escrow");
  }

  record.status = "claimed";
}

export function createEscrow(record: EscrowRecord): void {
  escrows.set(record.shipmentId, { ...record });
}

export function getEscrow(shipmentId: string): EscrowRecord | undefined {
  return escrows.get(shipmentId);
}

// Unit tests
if (require.main === module) {
  createEscrow({ shipmentId: "s1", shipper: "alice", carrier: "bob", amount: 100, status: "active" });
  raiseDispute("s1");

  try {
    claimUnresolvedEscrow("s1", "alice");
    console.error("FAIL: should reject claim before lockup expires");
  } catch (e: any) {
    console.log("PASS: claim rejected before lockup:", e.message);
  }

  const rec = getEscrow("s1")!;
  rec.disputedAt = Date.now() - configuredLockupMs - 1000;

  claimUnresolvedEscrow("s1", "alice");
  console.log("PASS: claim accepted after lockup expired, status:", getEscrow("s1")?.status);
}
