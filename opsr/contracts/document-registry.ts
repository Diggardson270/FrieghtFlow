// CT-22: IPFS CID format validation for Document Registry

const BASE32_PATTERN = /^b[a-z2-7]+=*$/i;
const BASE58BTC_PATTERN = /^z[1-9A-HJ-NP-Za-km-z]+$/;

export function validateCid(cid: string): boolean {
  if (!cid || typeof cid !== "string") return false;
  // CIDv0: exactly 46 chars starting with "Qm"
  if (cid.startsWith("Qm") && cid.length === 46) return true;
  // CIDv1: starts with 'b' (base32) or 'z' (base58btc)
  if (BASE32_PATTERN.test(cid) || BASE58BTC_PATTERN.test(cid)) return true;
  return false;
}

interface DocumentRecord {
  docId: string;
  cid: string;
  owner: string;
  registeredAt: number;
}

const registry = new Map<string, DocumentRecord>();

export function registerDocument(docId: string, cid: string, owner: string): void {
  if (!validateCid(cid)) throw new Error(`Invalid CID format: "${cid}"`);
  if (registry.has(docId)) throw new Error("Document already registered");
  registry.set(docId, { docId, cid, owner, registeredAt: Date.now() });
}

export function getDocument(docId: string): DocumentRecord | undefined {
  return registry.get(docId);
}

// Unit tests
if (require.main === module) {
  const cases: [string, boolean][] = [
    ["QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG", true],  // valid CIDv0
    ["bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi", true], // valid CIDv1 base32
    ["z4MXJ8wDJved3OEP3fk99thL6bkwUokvMbyngng96Xqn1Qm", true],  // valid CIDv1 base58btc
    ["QmShort", false],          // too short
    ["invalidcid", false],       // no valid prefix
    ["", false],                 // empty
    ["Qm" + "x".repeat(44), true], // valid CIDv0 length
  ];

  for (const [cid, expected] of cases) {
    const result = validateCid(cid);
    const pass = result === expected;
    console.log(`${pass ? "PASS" : "FAIL"}: validateCid("${cid.slice(0, 20)}...") = ${result}`);
  }

  registerDocument("doc1", "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG", "alice");
  console.log("PASS: document registered:", getDocument("doc1")?.docId);

  try {
    registerDocument("doc2", "notacid", "bob");
    console.error("FAIL: should reject invalid CID");
  } catch (e: any) {
    console.log("PASS: invalid CID rejected:", e.message);
  }
}
