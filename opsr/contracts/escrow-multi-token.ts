// CT-13: Multi-token support for the Escrow contract
// Replaces single token_contract with a whitelist of accepted token addresses

export type Address = string;

export interface EscrowRecord {
  shipmentId: string;
  shipper: Address;
  carrier: Address;
  amount: bigint;
  token: Address;
  released: boolean;
  refunded: boolean;
}

export class MultiTokenEscrow {
  private admin: Address;
  private acceptedTokens: Set<Address> = new Set();
  private escrows: Map<string, EscrowRecord> = new Map();

  constructor(admin: Address, initialTokens: Address[]) {
    this.admin = admin;
    initialTokens.forEach((t) => this.acceptedTokens.add(t));
  }

  addToken(caller: Address, token: Address): void {
    if (caller !== this.admin) throw new Error("Unauthorized");
    this.acceptedTokens.add(token);
  }

  removeToken(caller: Address, token: Address): void {
    if (caller !== this.admin) throw new Error("Unauthorized");
    this.acceptedTokens.delete(token);
  }

  fundEscrow(
    shipmentId: string,
    shipper: Address,
    carrier: Address,
    amount: bigint,
    token: Address
  ): void {
    if (!this.acceptedTokens.has(token)) throw new Error("Token not accepted");
    if (this.escrows.has(shipmentId)) throw new Error("Escrow already exists");
    this.escrows.set(shipmentId, {
      shipmentId,
      shipper,
      carrier,
      amount,
      token,
      released: false,
      refunded: false,
    });
  }

  releasePayment(caller: Address, shipmentId: string): EscrowRecord {
    const escrow = this.#getEscrow(shipmentId);
    if (caller !== this.admin) throw new Error("Unauthorized");
    if (escrow.released || escrow.refunded) throw new Error("Already settled");
    escrow.released = true;
    return escrow; // caller transfers escrow.amount of escrow.token to escrow.carrier
  }

  refundPayment(caller: Address, shipmentId: string): EscrowRecord {
    const escrow = this.#getEscrow(shipmentId);
    if (caller !== this.admin) throw new Error("Unauthorized");
    if (escrow.released || escrow.refunded) throw new Error("Already settled");
    escrow.refunded = true;
    return escrow; // caller transfers escrow.amount of escrow.token to escrow.shipper
  }

  getAcceptedTokens(): Address[] {
    return [...this.acceptedTokens];
  }

  #getEscrow(shipmentId: string): EscrowRecord {
    const e = this.escrows.get(shipmentId);
    if (!e) throw new Error("Escrow not found");
    return e;
  }
}
