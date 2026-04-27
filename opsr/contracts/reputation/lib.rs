#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, vec, Address, Env, Vec};

#[contracttype]
#[derive(Clone)]
pub struct CarrierScore {
    pub wallet: Address,
    pub score: u32,
}

const INDEX: &str = "INDEX";

#[contract]
pub struct ReputationContract;

#[contractimpl]
impl ReputationContract {
    pub fn set_score(env: Env, wallet: Address, score: u32) {
        let mut index: Vec<CarrierScore> = env.storage().instance().get(&INDEX).unwrap_or(vec![&env]);

        // remove existing entry for this wallet
        let mut new_index: Vec<CarrierScore> = vec![&env];
        for i in 0..index.len() {
            let entry = index.get(i).unwrap();
            if entry.wallet != wallet {
                new_index.push_back(entry);
            }
        }

        // insert in sorted position (descending)
        let mut inserted = false;
        let mut sorted: Vec<CarrierScore> = vec![&env];
        for i in 0..new_index.len() {
            let entry = new_index.get(i).unwrap();
            if !inserted && score >= entry.score {
                sorted.push_back(CarrierScore { wallet: wallet.clone(), score });
                inserted = true;
            }
            sorted.push_back(entry);
        }
        if !inserted {
            sorted.push_back(CarrierScore { wallet, score });
        }

        env.storage().instance().set(&INDEX, &sorted);
    }

    pub fn get_top_carriers(env: Env, limit: u32) -> Vec<(Address, u32)> {
        let index: Vec<CarrierScore> = env.storage().instance().get(&INDEX).unwrap_or(vec![&env]);
        let mut result: Vec<(Address, u32)> = vec![&env];
        let count = index.len().min(limit);
        for i in 0..count {
            let entry = index.get(i).unwrap();
            result.push_back((entry.wallet, entry.score));
        }
        result
    }

    pub fn get_carrier_rank(env: Env, wallet: Address) -> u32 {
        let index: Vec<CarrierScore> = env.storage().instance().get(&INDEX).unwrap_or(vec![&env]);
        for i in 0..index.len() {
            if index.get(i).unwrap().wallet == wallet {
                return i + 1;
            }
        }
        0
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::Env;

    #[test]
    fn test_ranking_and_ties() {
        let env = Env::default();
        let id = env.register_contract(None, ReputationContract);
        let client = ReputationContractClient::new(&env, &id);

        let a = Address::generate(&env);
        let b = Address::generate(&env);
        let c = Address::generate(&env);

        client.set_score(&a, &80);
        client.set_score(&b, &95);
        client.set_score(&c, &80);

        let top = client.get_top_carriers(&3);
        assert_eq!(top.get(0).unwrap().1, 95); // b is first

        assert_eq!(client.get_carrier_rank(&b), 1);

        // update a's score to top
        client.set_score(&a, &100);
        assert_eq!(client.get_carrier_rank(&a), 1);
        assert_eq!(client.get_carrier_rank(&b), 2);
    }
}
