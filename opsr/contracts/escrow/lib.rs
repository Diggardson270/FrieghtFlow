#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env};

#[contracttype]
pub struct TreasuryStats {
    pub total_funded: i128,
    pub total_released: i128,
    pub total_refunded: i128,
    pub total_fees_collected: i128,
}

const FUNDED: &str = "FUNDED";
const RELEASED: &str = "RELEASED";
const REFUNDED: &str = "REFUNDED";
const FEES: &str = "FEES";

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    pub fn fund(env: Env, token: Address, from: Address, amount: i128) {
        from.require_auth();
        token::Client::new(&env, &token).transfer(&from, &env.current_contract_address(), &amount);
        let v: i128 = env.storage().instance().get(&FUNDED).unwrap_or(0);
        env.storage().instance().set(&FUNDED, &(v + amount));
    }

    pub fn release(env: Env, token: Address, to: Address, amount: i128, fee: i128) {
        let net = amount - fee;
        token::Client::new(&env, &token).transfer(&env.current_contract_address(), &to, &net);
        let r: i128 = env.storage().instance().get(&RELEASED).unwrap_or(0);
        env.storage().instance().set(&RELEASED, &(r + net));
        let f: i128 = env.storage().instance().get(&FEES).unwrap_or(0);
        env.storage().instance().set(&FEES, &(f + fee));
    }

    pub fn refund(env: Env, token: Address, to: Address, amount: i128) {
        token::Client::new(&env, &token).transfer(&env.current_contract_address(), &to, &amount);
        let v: i128 = env.storage().instance().get(&REFUNDED).unwrap_or(0);
        env.storage().instance().set(&REFUNDED, &(v + amount));
    }

    pub fn get_treasury_stats(env: Env) -> TreasuryStats {
        TreasuryStats {
            total_funded: env.storage().instance().get(&FUNDED).unwrap_or(0),
            total_released: env.storage().instance().get(&RELEASED).unwrap_or(0),
            total_refunded: env.storage().instance().get(&REFUNDED).unwrap_or(0),
            total_fees_collected: env.storage().instance().get(&FEES).unwrap_or(0),
        }
    }

    pub fn get_current_balance(env: Env, token: Address) -> i128 {
        token::Client::new(&env, &token).balance(&env.current_contract_address())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::{token::StellarAssetClient, Env};

    #[test]
    fn test_lifecycle_counters() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, EscrowContract);
        let client = EscrowContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let token_id = env.register_stellar_asset_contract(admin.clone());
        let asset = StellarAssetClient::new(&env, &token_id);
        asset.mint(&user, &1000);

        client.fund(&token_id, &user, &1000);
        client.release(&token_id, &user, &800, &50);
        client.refund(&token_id, &user, &150);

        let stats = client.get_treasury_stats();
        assert_eq!(stats.total_funded, 1000);
        assert_eq!(stats.total_released, 750);
        assert_eq!(stats.total_refunded, 150);
        assert_eq!(stats.total_fees_collected, 50);
    }
}
