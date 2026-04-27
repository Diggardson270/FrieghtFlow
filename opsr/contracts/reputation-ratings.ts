// CT-24: Carrier rating aggregation view function for Reputation contract

interface RatingBreakdown {
  one_star: number;
  two_star: number;
  three_star: number;
  four_star: number;
  five_star: number;
  average: number; // fixed-point x10, e.g. 43 = 4.3 stars
}

const ratings = new Map<string, number[]>(); // wallet -> list of star ratings (1-5)

export function submitRating(wallet: string, stars: number): void {
  if (stars < 1 || stars > 5 || !Number.isInteger(stars)) throw new Error("Rating must be integer 1-5");
  const existing = ratings.get(wallet) ?? [];
  existing.push(stars);
  ratings.set(wallet, existing);
}

export function getRatingBreakdown(wallet: string): RatingBreakdown {
  const list = ratings.get(wallet) ?? [];
  const breakdown: RatingBreakdown = { one_star: 0, two_star: 0, three_star: 0, four_star: 0, five_star: 0, average: 0 };
  if (list.length === 0) return breakdown;

  for (const r of list) {
    if (r === 1) breakdown.one_star++;
    else if (r === 2) breakdown.two_star++;
    else if (r === 3) breakdown.three_star++;
    else if (r === 4) breakdown.four_star++;
    else if (r === 5) breakdown.five_star++;
  }

  const sum = list.reduce((a, b) => a + b, 0);
  breakdown.average = Math.round((sum / list.length) * 10); // fixed-point x10
  return breakdown;
}

// Unit tests
if (require.main === module) {
  submitRating("carrier_a", 5);
  submitRating("carrier_a", 4);
  submitRating("carrier_a", 4);
  submitRating("carrier_a", 3);
  submitRating("carrier_a", 2);

  const bd = getRatingBreakdown("carrier_a");
  console.log("Breakdown:", bd);
  console.assert(bd.five_star === 1, "five_star should be 1");
  console.assert(bd.four_star === 2, "four_star should be 2");
  console.assert(bd.three_star === 1, "three_star should be 1");
  console.assert(bd.two_star === 1, "two_star should be 1");
  console.assert(bd.average === 36, `average should be 36 (3.6), got ${bd.average}`);
  console.log("PASS: breakdown correct, average:", bd.average, "(= " + bd.average / 10 + " stars)");

  const empty = getRatingBreakdown("unknown_carrier");
  console.assert(empty.average === 0, "empty carrier average should be 0");
  console.log("PASS: empty carrier returns zero breakdown");

  try {
    submitRating("carrier_b", 6);
    console.error("FAIL: should reject rating > 5");
  } catch (e: any) {
    console.log("PASS: invalid rating rejected:", e.message);
  }
}
