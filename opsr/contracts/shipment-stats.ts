// CT-16: On-chain shipment statistics per user and platform
// Tracks per-address counters updated atomically on each state transition

export type Address = string;

export interface UserStats {
  wallet: Address;
  totalCreated: number;
  totalAccepted: number;
  totalCompleted: number;
  totalCancelled: number;
  totalDisputed: number;
}

export interface PlatformStats {
  totalCreated: number;
  totalAccepted: number;
  totalCompleted: number;
  totalCancelled: number;
  totalDisputed: number;
}

type StatKey = keyof Omit<UserStats, "wallet">;

export class ShipmentStats {
  private userStats: Map<Address, UserStats> = new Map();
  private platform: PlatformStats = {
    totalCreated: 0,
    totalAccepted: 0,
    totalCompleted: 0,
    totalCancelled: 0,
    totalDisputed: 0,
  };

  recordCreated(wallet: Address): void {
    this.#increment(wallet, "totalCreated");
  }

  recordAccepted(wallet: Address): void {
    this.#increment(wallet, "totalAccepted");
  }

  recordCompleted(wallet: Address): void {
    this.#increment(wallet, "totalCompleted");
  }

  recordCancelled(wallet: Address): void {
    this.#increment(wallet, "totalCancelled");
  }

  recordDisputed(wallet: Address): void {
    this.#increment(wallet, "totalDisputed");
  }

  getUserStats(wallet: Address): UserStats {
    return this.#getOrCreate(wallet);
  }

  getPlatformStats(): PlatformStats {
    return { ...this.platform };
  }

  #increment(wallet: Address, key: StatKey): void {
    const stats = this.#getOrCreate(wallet);
    stats[key] += 1;
    this.platform[key] += 1;
  }

  #getOrCreate(wallet: Address): UserStats {
    if (!this.userStats.has(wallet)) {
      this.userStats.set(wallet, {
        wallet,
        totalCreated: 0,
        totalAccepted: 0,
        totalCompleted: 0,
        totalCancelled: 0,
        totalDisputed: 0,
      });
    }
    return this.userStats.get(wallet)!;
  }
}
