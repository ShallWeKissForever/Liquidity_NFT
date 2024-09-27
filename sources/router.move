/// This module provides an interface for liquidity_pool that supports both coins and native fungible assets.
///
/// A liquidity pool has two tokens and thus can have 3 different combinations: 2 native fungible assets, 1 coin and
/// 1 native fungible asset, or 2 coins. Each combination has separate functions for swap, add and remove liquidity.
/// The coins provided by the users are wrapped and coins are returned to users by unwrapping internal fungible asset
/// with coin_wrapper.
module LiquidityNFT::router {
    use aptos_framework::fungible_asset::{Self, FungibleAsset, Metadata};
    use aptos_framework::object::{Self, Object};
    use aptos_framework::primary_fungible_store;
    use aptos_std::math128;

    use LiquidityNFT::liquidity_pool::{Self, LiquidityPool};

    /// Output is less than the desired minimum amount.
    const EINSUFFICIENT_OUTPUT_AMOUNT: u64 = 1;
    /// The liquidity pool is misconfigured and has 0 amount of one asset but non-zero amount of the other.
    const EINFINITY_POOL: u64 = 2;
    /// One or both tokens passed are not valid native fungible assets.
    const ENOT_NATIVE_FUNGIBLE_ASSETS: u64 = 3;

    /////////////////////////////////////////////////// PROTOCOL ///////////////////////////////////////////////////////
    public entry fun create_pool(
        token_1: Object<Metadata>,
        token_2: Object<Metadata>,
        is_stable: bool,
    ) {
        liquidity_pool::create(token_1, token_2, is_stable);
    }

    /////////////////////////////////////////////////// USERS /////////////////////////////////////////////////////////

    #[view]
    /// Return the expected amount out for a given amount in of tokens to swap via the given liquidity pool.
    public fun get_amount_out(
        amount_in: u64,
        from_token: Object<Metadata>,
        to_token: Object<Metadata>,
    ): (u64, u64) {
        let (found, pool) = liquidity_pool::liquidity_pool_address_safe(from_token, to_token, true);
        if (!found) {
            pool = liquidity_pool::liquidity_pool_address(to_token, from_token, false);
        };
        let pool = object::address_to_object<LiquidityPool>(pool);
        liquidity_pool::get_amount_out(pool, from_token, amount_in)
    }

    /// Swap an amount of fungible assets for another fungible asset. User can specifies the minimum amount they
    /// expect to receive. If the actual amount received is less than the minimum amount, the transaction will fail.
    public entry fun swap_entry(
        user: &signer,
        amount_in: u64,
        amount_out_min: u64,
        from_token: Object<Metadata>,
        to_token: Object<Metadata>,
        is_stable: bool,
        recipient: address,
    ) {
        let in = primary_fungible_store::withdraw(user, from_token, amount_in);
        let out = swap(in, amount_out_min, to_token, is_stable);
        primary_fungible_store::deposit(recipient, out);
    }

    /// Similar to swap_entry but returns the fungible asset received for composability with other modules.
    public fun swap(
        in: FungibleAsset,
        amount_out_min: u64,
        to_token: Object<Metadata>,
        is_stable: bool,
    ): FungibleAsset {
        let from_token = fungible_asset::asset_metadata(&in);
        let pool = liquidity_pool::liquidity_pool(from_token, to_token, is_stable);
        let out = liquidity_pool::swap(pool, in);
        assert!(fungible_asset::amount(&out) >= amount_out_min, EINSUFFICIENT_OUTPUT_AMOUNT);
        out
    }

    /////////////////////////////////////////////////// LPs ///////////////////////////////////////////////////////////

    #[view]
    /// Returns the optimal amounts of tokens to provide as liquidity given the desired amount of each token to add.
    /// The returned values are the amounts of token 1, token 2, and LP tokens received.
    public fun optimal_liquidity_amounts(
        token_1: Object<Metadata>,
        token_2: Object<Metadata>,
        is_stable: bool,
        amount_1_desired: u64,
        amount_2_desired: u64,
        amount_1_min: u64,
        amount_2_min: u64,
    ): (u64, u64, u64) {
        let pool = liquidity_pool::liquidity_pool(token_1, token_2, is_stable);
        let (reserves_1, reserves_2) = liquidity_pool::pool_reserves(pool);
        // Reverse the reserve numbers if token 1 and token 2 don't match the pool's token order.
        if (!liquidity_pool::is_sorted(token_1, token_2)) {
            (reserves_1, reserves_2) = (reserves_2, reserves_1);
        };
        let amount_1_desired = (amount_1_desired as u128);
        let amount_2_desired = (amount_2_desired as u128);
        let amount_1_min = (amount_1_min as u128);
        let amount_2_min = (amount_2_min as u128);
        let reserves_1 = (reserves_1 as u128);
        let reserves_2 = (reserves_2 as u128);
        let lp_token_total_supply = liquidity_pool::lp_token_supply(pool);
        let (amount_1, amount_2) = (amount_1_desired, amount_2_desired);
        let liquidity = if (lp_token_total_supply == 0) {
            math128::sqrt(amount_1 * amount_2) - (liquidity_pool::min_liquidity() as u128)
        } else if (reserves_1 > 0 && reserves_2 > 0) {
            let amount_2_optimal = math128::mul_div(amount_1_desired, reserves_2, reserves_1);
            if (amount_2 <= amount_2_desired) {
                assert!(amount_2_optimal >= amount_2_min, EINSUFFICIENT_OUTPUT_AMOUNT);
                amount_2 = amount_2_optimal;
            } else {
                amount_1 = math128::mul_div(amount_2_desired, reserves_1, reserves_2);
                assert!(amount_1 <= amount_1_desired && amount_1 >= amount_1_min, EINSUFFICIENT_OUTPUT_AMOUNT);
            };
            math128::min(
                amount_1 * lp_token_total_supply / reserves_1,
                amount_2 * lp_token_total_supply / reserves_2,
            )
        } else {
            abort EINFINITY_POOL
        };
        ((amount_1 as u64), (amount_2 as u64), (liquidity as u64))
    }

    /// Add liquidity to a pool. The user specifies the desired amount of each token to add and this will add the
    /// optimal amounts. If no optimal amounts can be found, this will fail.
    public entry fun add_liquidity_entry(
        lp: &signer,
        token_1: Object<Metadata>,
        token_2: Object<Metadata>,
        is_stable: bool,
        amount_1_desired: u64,
        amount_2_desired: u64,
        amount_1_min: u64,
        amount_2_min: u64,
    ) {
        let (optimal_amount_1, optimal_amount_2, _) = optimal_liquidity_amounts(
            token_1,
            token_2,
            is_stable,
            amount_1_desired,
            amount_2_desired,
            amount_1_min,
            amount_2_min,
        );
        let optimal_1 = primary_fungible_store::withdraw(lp, token_1, optimal_amount_1);
        let optimal_2 = primary_fungible_store::withdraw(lp, token_2, optimal_amount_2);
        add_liquidity(lp, optimal_1, optimal_2, is_stable);
    }

    /// Add two tokens as liquidity to a pool. The user should have computed the amounts to add themselves as this would
    /// not optimize the amounts.
    public inline fun add_liquidity(
        lp: &signer,
        token_1: FungibleAsset,
        token_2: FungibleAsset,
        is_stable: bool,
    ) {
        liquidity_pool::mint(lp, token_1, token_2, is_stable);
    }

    /// Remove an amount of liquidity from a pool. The user can specify the min amounts of each token they expect to
    /// receive to avoid slippage.
    public entry fun remove_liquidity_entry(
        lp: &signer,
        token_1: Object<Metadata>,
        token_2: Object<Metadata>,
        is_stable: bool,
        liquidity: u64,
        amount_1_min: u64,
        amount_2_min: u64,
        recipient: address,
    ) {
        let (amount_1, amount_2) = remove_liquidity(
            lp,
            token_1,
            token_2,
            is_stable,
            liquidity,
            amount_1_min,
            amount_2_min,
        );
        primary_fungible_store::deposit(recipient, amount_1);
        primary_fungible_store::deposit(recipient, amount_2);
    }

    /// Similiar to `remove_liquidity_entry` but returns the received fungible assets instead of depositing them.
    public fun remove_liquidity(
        lp: &signer,
        token_1: Object<Metadata>,
        token_2: Object<Metadata>,
        is_stable: bool,
        liquidity: u64,
        amount_1_min: u64,
        amount_2_min: u64,
    ): (FungibleAsset, FungibleAsset) {
        remove_liquidity_internal(lp, token_1, token_2, is_stable, liquidity, amount_1_min, amount_2_min)
    }

    inline fun remove_liquidity_internal(
        lp: &signer,
        token_1: Object<Metadata>,
        token_2: Object<Metadata>,
        is_stable: bool,
        liquidity: u64,
        amount_1_min: u64,
        amount_2_min: u64,
    ): (FungibleAsset, FungibleAsset) {
        let (redeemed_1, redeemed_2) = liquidity_pool::burn(lp, token_1, token_2, is_stable, liquidity);
        let amount_1 = fungible_asset::amount(&redeemed_1);
        let amount_2 = fungible_asset::amount(&redeemed_2);
        assert!(amount_1 >= amount_1_min && amount_2 >= amount_2_min, EINSUFFICIENT_OUTPUT_AMOUNT);
        (redeemed_1, redeemed_2)
    }

    public entry fun lp_nft_update(lp: &signer, token_address: address, pool: Object<LiquidityPool>) {
        liquidity_pool::lp_nft_request_for_update_uri(lp, &token_address, pool);
    }
}