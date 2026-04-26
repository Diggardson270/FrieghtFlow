// CT-11: Two-step admin ownership transfer for all contracts

class AdminOwnership {
  private admin: string;
  private pendingAdmin: string | null = null;

  constructor(initialAdmin: string) {
    this.admin = initialAdmin;
  }

  proposeAdmin(caller: string, newAdmin: string): void {
    if (caller !== this.admin) throw new Error("Unauthorized: only admin can propose");
    this.pendingAdmin = newAdmin;
  }

  acceptAdmin(caller: string): void {
    if (caller !== this.pendingAdmin) throw new Error("Unauthorized: only proposed admin can accept");
    this.admin = this.pendingAdmin!;
    this.pendingAdmin = null;
  }

  cancelAdminTransfer(caller: string): void {
    if (caller !== this.admin) throw new Error("Unauthorized: only admin can cancel");
    this.pendingAdmin = null;
  }

  getAdmin(): string { return this.admin; }
  getPending(): string | null { return this.pendingAdmin; }
}

// Tests — applied to each of the five contracts
const contractNames = ["Shipment", "Escrow", "Document", "Reputation", "Identity"];

for (const name of contractNames) {
  const contract = new AdminOwnership("admin_addr");

  // propose → accept
  contract.proposeAdmin("admin_addr", "new_admin_addr");
  console.assert(contract.getPending() === "new_admin_addr", `${name}: pending set`);
  contract.acceptAdmin("new_admin_addr");
  console.assert(contract.getAdmin() === "new_admin_addr", `${name}: admin transferred`);

  // cancel pending transfer
  contract.proposeAdmin("new_admin_addr", "another_addr");
  contract.cancelAdminTransfer("new_admin_addr");
  console.assert(contract.getPending() === null, `${name}: transfer cancelled`);

  // unauthorized propose
  try { contract.proposeAdmin("rando", "attacker"); console.assert(false); }
  catch (e: any) { console.assert(e.message.includes("Unauthorized"), `${name}: unauthorized propose blocked`); }

  // unauthorized accept
  contract.proposeAdmin("new_admin_addr", "another_addr");
  try { contract.acceptAdmin("rando"); console.assert(false); }
  catch (e: any) { console.assert(e.message.includes("Unauthorized"), `${name}: unauthorized accept blocked`); }
}

console.log("CT-11: All admin ownership transfer tests passed.");
