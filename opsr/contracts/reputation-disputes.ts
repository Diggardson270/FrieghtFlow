// CT-14: Dispute history tracking in the Reputation contract
// Adds dispute counters and factors them into the reputation score

export type Address = string;

export interface ReputationData {
  wallet: Address;
  score: number;
  totalRatings: number;
  ratingSum: number;
  disputesRaised: number;
  disputesResolvedAgainst: number;
}

export interface DisputeHistory {
  disputesRaised: number;
  disputesResolvedAgainst: number;
}

const DISPUTE_PENALTY = 20;

export class ReputationContract {
  private shipmentContract: Address;
  private records: Map<Address, ReputationData> = new Map();

  constructor(shipmentContract: Address) {
    this.shipmentContract = shipmentContract;
  }

  recordDispute(caller: Address, wallet: Address, resolvedAgainst: boolean): void {
    if (caller !== this.shipmentContract) throw new Error("Unauthorized");
    const rep = this.#getOrCreate(wallet);
    rep.disputesRaised += 1;
    if (resolvedAgainst) {
      rep.disputesResolvedAgainst += 1;
      rep.score = Math.max(0, rep.score - DISPUTE_PENALTY);
    }
  }

  submitRating(wallet: Address, rating: number): void {
    if (rating < 1 || rating > 5) throw new Error("Rating must be 1-5");
    const rep = this.#getOrCreate(wallet);
    rep.ratingSum += rating;
    rep.totalRatings += 1;
    const base = rep.totalRatings > 0 ? (rep.ratingSum / rep.totalRatings) * 20 : 0;
    rep.score = Math.max(
      0,
      Math.round(base - rep.disputesResolvedAgainst * DISPUTE_PENALTY)
    );
  }

  getReputation(wallet: Address): ReputationData {
    return this.#getOrCreate(wallet);
  }

  getDisputeHistory(wallet: Address): DisputeHistory {
    const rep = this.#getOrCreate(wallet);
    return {
      disputesRaised: rep.disputesRaised,
      disputesResolvedAgainst: rep.disputesResolvedAgainst,
    };
  }

  #getOrCreate(wallet: Address): ReputationData {
    if (!this.records.has(wallet)) {
      this.records.set(wallet, {
        wallet,
        score: 100,
        totalRatings: 0,
        ratingSum: 0,
        disputesRaised: 0,
        disputesResolvedAgainst: 0,
      });
    }
    return this.records.get(wallet)!;
  }
}
