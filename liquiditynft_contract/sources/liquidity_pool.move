module contract::liquidity_pool {
    use aptos_framework::event;
    use aptos_framework::fungible_asset::{
        Self, FungibleAsset, FungibleStore, Metadata,
        BurnRef, MintRef, TransferRef,
    };
    use aptos_framework::object::{Self, ConstructorRef, Object, generate_signer};
    use aptos_framework::primary_fungible_store;
    use aptos_std::comparator;
    use aptos_std::math128;
    use aptos_std::math64;
    use aptos_std::smart_table::{Self, SmartTable};
    use aptos_std::smart_vector::{Self, SmartVector};
    use aptos_token_objects::collection;

    use std::bcs;
    use std::option;
    use std::signer;
    use std::signer::address_of;
    use std::string::{Self, String, append};
    use std::vector;
    use aptos_std::string_utils;
    use aptos_framework::account::{create_resource_account, SignerCapability, create_signer_with_capability};
    use aptos_framework::timestamp;
    use aptos_token_objects::collection::MutatorRef;
    use aptos_token_objects::token;
    use aptos_token_objects::token::Token;

    friend contract::router;

    const FEE_SCALE: u64 = 10000;
    const LP_TOKEN_DECIMALS: u8 = 6;
    const MINIMUM_LIQUIDITY: u64 = 1000;
    const MAX_SWAP_FEES_BPS: u64 = 25; // 0.25%

    const COAL: vector<u8> = b"https://s21.ax1x.com/2024/09/26/pAlVc7Q.png";
    const IRON: vector<u8> = b"https://s21.ax1x.com/2024/09/26/pAlAaHH.png";
    const GOLD: vector<u8> = b"https://s21.ax1x.com/2024/09/26/pAlAUDe.png";
    const EMERALD: vector<u8> = b"https://s21.ax1x.com/2024/09/26/pAlANuD.png";
    const DIAMOND: vector<u8> = b"https://s21.ax1x.com/2024/09/26/pAlA141.png";
    const BLOCK_OF_COAL: vector<u8> = b"https://s21.ax1x.com/2024/09/26/pAlV2kj.png";
    const BLOCK_OF_IRON: vector<u8> = b"https://s21.ax1x.com/2024/09/26/pAlA89x.png";
    const BLOCK_OF_GOLD: vector<u8> = b"https://s21.ax1x.com/2024/09/26/pAlAYjO.png";
    const BLOCK_OF_EMERALD: vector<u8> = b"https://s21.ax1x.com/2024/09/26/pAlAG36.png";
    const BLOCK_OF_DIAMOND: vector<u8> = b"https://s21.ax1x.com/2024/09/26/pAlAJgK.png";

    /// Amount of tokens provided must be greater than zero.
    const EZERO_AMOUNT: u64 = 1;
    /// The amount of liquidity provided is so small that corresponding LP token amount is rounded to zero.
    const EINSUFFICIENT_LIQUIDITY_MINTED: u64 = 2;
    /// Amount of LP tokens redeemed is too small, so amounts of tokens received back are rounded to zero.
    const EINSUFFICIENT_LIQUIDITY_REDEEMED: u64 = 3;
    /// The specified amount of output tokens is incorrect and does not maintain the pool's invariant.
    const EINCORRECT_SWAP_AMOUNT: u64 = 4;
    /// The caller is not the owner of the LP token store.
    const ENOT_STORE_OWNER: u64 = 5;
    /// Claler is not authorized to perform the operation.
    const ENOT_AUTHORIZED: u64 = 6;
    /// All swaps are currently paused.
    const ESWAPS_ARE_PAUSED: u64 = 7;
    /// Swap leaves pool in a worse state than before.
    const EK_BEFORE_SWAP_GREATER_THAN_EK_AFTER_SWAP: u64 = 8;

    struct LPTokenRefs has store {
        burn_ref: BurnRef,
        mint_ref: MintRef,
        transfer_ref: TransferRef,
    }

    /// Stored in the protocol's account for configuring liquidity pools.
    struct LiquidityPoolConfigs has key {
        all_pools: SmartVector<Object<LiquidityPool>>,
        is_paused: bool,
        fee_manager: address,
        pauser: address,
        pending_fee_manager: address,
        pending_pauser: address,
        stable_fee_bps: u64,
        volatile_fee_bps: u64,
    }

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct LiquidityPool has key {
        token_name_1:String,
        token_name_2:String,
        token_symbol_1:String,
        token_symbol_2:String,
        token_uri_1:String,
        token_uri_2:String,
        token_store_1: Object<FungibleStore>,
        token_store_2: Object<FungibleStore>,
        fees_store_1: Object<FungibleStore>,
        fees_store_2: Object<FungibleStore>,
        lp_token_refs: LPTokenRefs,
        swap_fee_bps: u64,
        nft_total_supply: u64,
        is_stable: bool,
    }

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct FeesAccounting has key {
        total_fees_1: u128,
        total_fees_2: u128,
        total_fees_at_last_claim_1: SmartTable<address, u128>,
        total_fees_at_last_claim_2: SmartTable<address, u128>,
        claimable_1: SmartTable<address, u128>,
        claimable_2: SmartTable<address, u128>,
    }

    struct ResourceAccountCap has key {
        signer_cap: SignerCapability,
    }

    struct CollectionRef has key, store {
        mutator_ref: MutatorRef,
    }

    struct NFTRefs has key {
        mutator_ref:token::MutatorRef,
        burn_ref: token::BurnRef,
    }

    struct NFTProperties has key {
        mint_time: u256,
        hold_time: u256,
        fees: u256,
        lp_token_percentage: u256,
    }
    struct MintedAddressStore has key {
        minted: SmartTable<address,address>,
    }

    #[event]
    /// Event emitted when a pool is created.
    struct CreatePool has drop, store {
        pool: Object<LiquidityPool>,
        token_1: Object<Metadata>,
        token_2: Object<Metadata>,
        is_stable: bool,
    }

    #[event]
    /// Event emitted when a swap happens.
    struct Swap has drop, store {
        pool: address,
        from_token: Object<Metadata>,
        amount_in: u64,
    }

    #[event]
    struct MintEvent has drop, store {
        owner: address,
        token_id: address,
    }

    #[event]
    struct BurnEvent has drop, store {
        owner: address,
        token_id: address,
    }

    #[event]
    struct UpdateEvent has drop, store {
        owner: address,
        token_id: address,
        time_stamp: u256,
        fees: u256,
        lp_token_percentage: u256,
    }

    public entry fun initialize(deployer: &signer) acquires ResourceAccountCap {

        let ( resource_account_signer, resource_account_signer_cap ) =  create_resource_account(
            deployer, b"LiquidityNFT");

        move_to(deployer, ResourceAccountCap{
            signer_cap: resource_account_signer_cap,
        });

        move_to(&resource_account_signer, LiquidityPoolConfigs {
            all_pools: smart_vector::new(),
            is_paused: false,
            fee_manager: @deployer,
            pauser: @deployer,
            pending_fee_manager: @0x0,
            pending_pauser: @0x0,
            stable_fee_bps: 10, // 0.1%
            volatile_fee_bps: 20, // 0.2%
        });

        let collection_cref = collection::create_unlimited_collection(
            &get_signer(),
            string::utf8(b"LP's NFT"),
            string::utf8(b"LiquidityNFT"),
            option::none(),
            string::utf8(b"")
        );

        let mutator_ref = collection::generate_mutator_ref(&collection_cref);

        move_to(&get_signer(), CollectionRef {
            mutator_ref,
        });

        let minted = smart_table::new<address, address>();

        move_to(&get_signer(), MintedAddressStore {
            minted,
        });
    }

    #[view]
    public fun is_initialized(): bool acquires ResourceAccountCap {
        exists<LiquidityPoolConfigs>(address_of(&get_signer()))
    }

    #[view]
    public fun total_number_of_pools(): u64 acquires LiquidityPoolConfigs, ResourceAccountCap {
        smart_vector::length(&safe_liquidity_pool_configs().all_pools)
    }

    #[view]
    public fun all_pools(): vector<Object<LiquidityPool>> acquires LiquidityPoolConfigs, ResourceAccountCap {
        let all_pools = &safe_liquidity_pool_configs().all_pools;
        let results = vector[];
        let len = smart_vector::length(all_pools);
        let i = 0;
        while (i < len) {
            vector::push_back(&mut results, *smart_vector::borrow(all_pools, i));
            i = i + 1;
        };
        results
    }

    #[view]
    public fun liquidity_pool(
        token_1: Object<Metadata>,
        token_2: Object<Metadata>,
        is_stable: bool,
    ): Object<LiquidityPool> acquires ResourceAccountCap {
        object::address_to_object(liquidity_pool_address(token_1, token_2, is_stable))
    }

    #[view]
    public fun liquidity_pool_address_safe(
        token_1: Object<Metadata>,
        token_2: Object<Metadata>,
        is_stable: bool,
    ): (bool, address) acquires ResourceAccountCap {
        let pool_address = liquidity_pool_address(token_1, token_2, is_stable);
        (exists<LiquidityPool>(pool_address), pool_address)
    }

    #[view]
    public fun liquidity_pool_address(
        token_1: Object<Metadata>,
        token_2: Object<Metadata>,
        is_stable: bool,
    ): address acquires ResourceAccountCap {
        if (!is_sorted(token_1, token_2)) {
            return liquidity_pool_address(token_2, token_1, is_stable)
        };
        object::create_object_address(&address_of(&get_signer()), get_pool_seeds(token_1, token_2, is_stable))
    }

    #[view]
    public fun lp_token_supply<T: key>(pool: Object<T>): u128 {
        option::destroy_some(fungible_asset::supply(pool))
    }

    #[view]
    public fun pool_reserves<T: key>(pool: Object<T>): (u64, u64) acquires LiquidityPool {
        let pool_data = liquidity_pool_data(&pool);
        (
            fungible_asset::balance(pool_data.token_store_1),
            fungible_asset::balance(pool_data.token_store_2),
        )
    }

    #[view]
    public fun supported_inner_assets(pool: Object<LiquidityPool>): vector<Object<Metadata>> acquires LiquidityPool {
        let pool_data = liquidity_pool_data(&pool);
        vector[
            fungible_asset::store_metadata(pool_data.token_store_1),
            fungible_asset::store_metadata(pool_data.token_store_2),
        ]
    }

    #[view]
    public fun is_sorted(token_1: Object<Metadata>, token_2: Object<Metadata>): bool {
        let token_1_addr = object::object_address(&token_1);
        let token_2_addr = object::object_address(&token_2);
        comparator::is_smaller_than(&comparator::compare(&token_1_addr, &token_2_addr))
    }

    #[view]
    public fun is_stable(pool: Object<LiquidityPool>): bool acquires LiquidityPool {
        liquidity_pool_data(&pool).is_stable
    }

    #[view]
    public fun swap_fee_bps(pool: Object<LiquidityPool>): u64 acquires LiquidityPool {
        liquidity_pool_data(&pool).swap_fee_bps
    }

    #[view]
    public fun min_liquidity(): u64 {
        MINIMUM_LIQUIDITY
    }

    #[view]
    public fun claimable_fees(lp: address, pool: Object<LiquidityPool>): (u128, u128) acquires FeesAccounting {
        let fees_accounting = safe_fees_accounting(&pool);
        (
            *smart_table::borrow_with_default(&fees_accounting.claimable_1, lp, &0),
            *smart_table::borrow_with_default(&fees_accounting.claimable_2, lp, &0),
        )
    }

    /// Creates a new liquidity pool.
    public fun create(
        token_1: Object<Metadata>,
        token_2: Object<Metadata>,
        is_stable: bool,
    ): Object<LiquidityPool> acquires LiquidityPoolConfigs, ResourceAccountCap {
        if (!is_sorted(token_1, token_2)) {
            return create(token_2, token_1, is_stable)
        };
        let configs = unchecked_mut_liquidity_pool_configs();

        // The liquidity pool will serve 3 separate roles:
        // 1. Represent the liquidity pool that LPs and users interact with to add/remove liquidity and swap tokens.
        // 2. Represent the metadata of the LP token.
        // 3. Store the min liquidity that will be locked into the pool when initial liquidity is added.
        let pool_constructor_ref = create_lp_token(token_1, token_2, is_stable);
        let pool_signer = &object::generate_signer(pool_constructor_ref);
        let lp_token = object::object_from_constructor_ref<Metadata>(pool_constructor_ref);
        fungible_asset::create_store(pool_constructor_ref, lp_token);
        move_to(pool_signer, LiquidityPool {
            token_name_1: fungible_asset::name(token_1),
            token_name_2: fungible_asset::name(token_2),
            token_symbol_1: fungible_asset::symbol(token_1),
            token_symbol_2: fungible_asset::symbol(token_2),
            token_uri_1: fungible_asset::icon_uri(token_1),
            token_uri_2: fungible_asset::icon_uri(token_2),
            token_store_1: create_token_store(pool_signer, token_1),
            token_store_2: create_token_store(pool_signer, token_2),
            fees_store_1: create_token_store(pool_signer, token_1),
            fees_store_2: create_token_store(pool_signer, token_2),
            lp_token_refs: create_lp_token_refs(pool_constructor_ref),
            swap_fee_bps: if (is_stable) { configs.stable_fee_bps } else { configs.volatile_fee_bps },
            nft_total_supply: 0,
            is_stable,
        });
        move_to(pool_signer, FeesAccounting {
            total_fees_1: 0,
            total_fees_2: 0,
            total_fees_at_last_claim_1: smart_table::new(),
            total_fees_at_last_claim_2: smart_table::new(),
            claimable_1: smart_table::new(),
            claimable_2: smart_table::new(),
        });
        let pool = object::convert(lp_token);
        smart_vector::push_back(&mut configs.all_pools, pool);

        event::emit(CreatePool { pool, token_1, token_2, is_stable });
        pool
    }

    /////////////////////////////////////////////////// USERS /////////////////////////////////////////////////////////

    #[view]
    /// Return the amount of tokens received for a swap with the given amount in and the liquidity pool.
    public fun get_amount_out(
        pool: Object<LiquidityPool>,
        from: Object<Metadata>,
        amount_in: u64,
    ): (u64, u64) acquires LiquidityPool {
        let pool_data = liquidity_pool_data(&pool);
        let reserve_1 = (fungible_asset::balance(pool_data.token_store_1) as u256);
        let reserve_2 = (fungible_asset::balance(pool_data.token_store_2) as u256);
        let (reserve_in, reserve_out) = if (from == fungible_asset::store_metadata(pool_data.token_store_1)) {
            (reserve_1, reserve_2)
        } else {
            (reserve_2, reserve_1)
        };
        let fees_amount = math64::mul_div(amount_in, pool_data.swap_fee_bps, FEE_SCALE);
        let amount_in = ((amount_in - fees_amount) as u256);
        let amount_out = if (pool_data.is_stable) {
            let k = calculate_constant_k(pool_data);
            reserve_out - get_y(amount_in + reserve_in, k, reserve_out)
        } else {
            amount_in * reserve_out / (reserve_in + amount_in)
        };
        ((amount_out as u64), fees_amount)
    }

    /// Swaps `from` for the other token in the pool.
    /// This is friend-only as the returned fungible assets might be of an internal wrapper type. If this is not the
    /// case, this function can be made public.
    public(friend) fun swap(
        pool: Object<LiquidityPool>,
        from: FungibleAsset,
    ): FungibleAsset acquires FeesAccounting, LiquidityPool, LiquidityPoolConfigs, ResourceAccountCap {
        assert!(!safe_liquidity_pool_configs().is_paused, ESWAPS_ARE_PAUSED);
        // Calculate the amount of tokens to return to the user and the amount of fees to extract.
        let from_token = fungible_asset::metadata_from_asset(&from);
        let amount_in = fungible_asset::amount(&from);
        let (amount_out, fees_amount) = get_amount_out(pool, from_token, amount_in);
        let fees = fungible_asset::extract(&mut from, fees_amount);

        // Deposits and withdraws.
        let pool_data = liquidity_pool_data(&pool);
        let k_before = calculate_constant_k(pool_data);
        let fees_accounting = unchecked_mut_fees_accounting(&pool);
        let store_1 = pool_data.token_store_1;
        let store_2 = pool_data.token_store_2;
        let swap_signer = &get_signer();
        let fees_amount = (fees_amount as u128);
        let out = if (from_token == fungible_asset::store_metadata(pool_data.token_store_1)) {
            // User's swapping token 1 for token 2.
            fungible_asset::deposit(store_1, from);
            fungible_asset::deposit(pool_data.fees_store_1, fees);
            fees_accounting.total_fees_1 = fees_accounting.total_fees_1 + fees_amount;
            fungible_asset::withdraw(swap_signer, store_2, amount_out)
        } else {
            // User's swapping token 2 for token 1.
            fungible_asset::deposit(store_2, from);
            fungible_asset::deposit(pool_data.fees_store_2, fees);
            fees_accounting.total_fees_2 = fees_accounting.total_fees_2 + fees_amount;
            fungible_asset::withdraw(swap_signer, store_1, amount_out)
        };

        let k_after = calculate_constant_k(pool_data);
        assert!(k_before <= k_after, EK_BEFORE_SWAP_GREATER_THAN_EK_AFTER_SWAP);

        event::emit(Swap { pool: object::object_address(&pool), from_token, amount_in }, );
        out
    }

    //////////////////////////////////////// Liquidity Providers (LPs) ///////////////////////////////////////////////

    /// Mint LP tokens for the given liquidity. Note that the LP would receive a smaller amount of LP tokens if the
    /// amounts of liquidity provided are not optimal (do not conform with the constant formula of the pool). Users
    /// should compute the optimal amounts before calling this function.
    public fun mint(
        lp: &signer,
        fungible_asset_1: FungibleAsset,
        fungible_asset_2: FungibleAsset,
        is_stable: bool,
    ) acquires FeesAccounting, LiquidityPool, ResourceAccountCap, MintedAddressStore, NFTProperties, NFTRefs {
        let token_1 = fungible_asset::metadata_from_asset(&fungible_asset_1);
        let token_2 = fungible_asset::metadata_from_asset(&fungible_asset_2);
        let token_1_copy = *&token_1;
        let token_2_copy = *&token_2;
        if (!is_sorted(token_1, token_2)) {
            return mint(lp, fungible_asset_2, fungible_asset_1, is_stable)
        };
        // The LP store needs to exist before we can mint LP tokens.
        let pool = liquidity_pool(token_1, token_2, is_stable);
        let lp_store = ensure_lp_token_store(signer::address_of(lp), pool);
        let amount_1 = fungible_asset::amount(&fungible_asset_1);
        let amount_2 = fungible_asset::amount(&fungible_asset_2);
        assert!(amount_1 > 0 && amount_2 > 0, EZERO_AMOUNT);
        let pool_data = liquidity_pool_data(&pool);
        let store_1 = pool_data.token_store_1;
        let store_2 = pool_data.token_store_2;

        // Before depositing the added liquidity, compute the amount of LP tokens the LP will receive.
        let reserve_1 = fungible_asset::balance(store_1);
        let reserve_2 = fungible_asset::balance(store_2);
        let lp_token_supply = option::destroy_some(fungible_asset::supply(pool));
        let mint_ref = &pool_data.lp_token_refs.mint_ref;
        let liquidity_token_amount = if (lp_token_supply == 0) {
            let total_liquidity = (math128::sqrt((amount_1 as u128) * (amount_2 as u128)) as u64);
            // Permanently lock the first MINIMUM_LIQUIDITY tokens.
            fungible_asset::mint_to(mint_ref, pool, MINIMUM_LIQUIDITY);
            total_liquidity - MINIMUM_LIQUIDITY
        } else {
            // Only the smaller amount between the token 1 or token 2 is considered. Users should make sure to either
            // use the router module or calculate the optimal amounts to provide before calling this function.
            let token_1_liquidity = math64::mul_div(amount_1, (lp_token_supply as u64), reserve_1);
            let token_2_liquidity = math64::mul_div(amount_2, (lp_token_supply as u64), reserve_2);
            math64::min(token_1_liquidity, token_2_liquidity)
        };
        assert!(liquidity_token_amount > 0, EINSUFFICIENT_LIQUIDITY_MINTED);

        // Deposit the received liquidity into the pool.
        fungible_asset::deposit(store_1, fungible_asset_1);
        fungible_asset::deposit(store_2, fungible_asset_2);

        // We need to update the amount of rewards claimable by this LP token store if they already have a previous
        // balance. This ensures that their update balance would not lead to earning a larger portion of the fees
        // retroactively.
        update_claimable_fees(signer::address_of(lp), pool);

        // Mint the corresponding amount of LP tokens to the LP.
        let lp_tokens = fungible_asset::mint(mint_ref, liquidity_token_amount);
        fungible_asset::deposit_with_ref(&pool_data.lp_token_refs.transfer_ref, lp_store, lp_tokens);


        let (claimable_fees, lp_token_percentage) = lp_nft_get_fees_and_plt(lp, pool);

        let  isMinted = &mut borrow_global_mut<MintedAddressStore>(address_of(&get_signer())).minted;
        if (*smart_table::borrow_mut_with_default( isMinted, address_of(lp), @0x0) == @0x0) {

            lp_nft_mint(
                lp,
                token_1_copy,
                token_2_copy,
                is_stable,
                (claimable_fees as u256),
                lp_token_percentage
            );

            lp_nft_update_properties(lp, (claimable_fees as u256), lp_token_percentage);

        } else {

            lp_nft_update_properties(lp, (claimable_fees as u256), lp_token_percentage);

        };
    }

    /// Transfer a given amount of LP tokens from the sender to the receiver. This must be called for all transfers as
    /// fungible_asset::transfer or primary_fungible_store::transfer would not work for LP tokens.
    public entry fun transfer(
        from: &signer,
        lp_token: Object<LiquidityPool>,
        to: address,
        amount: u64,
    ) acquires FeesAccounting, LiquidityPool {
        assert!(amount > 0, EZERO_AMOUNT);
        let from_address = signer::address_of(from);
        let from_store = ensure_lp_token_store(from_address, lp_token);
        let to_store = ensure_lp_token_store(to, lp_token);

        // Update the claimable amounts for both the sender and receiver before transferring.
        update_claimable_fees(from_address, lp_token);
        update_claimable_fees(to, lp_token);

        let transfer_ref = &liquidity_pool_data(&lp_token).lp_token_refs.transfer_ref;
        fungible_asset::transfer_with_ref(transfer_ref, from_store, to_store, amount);
    }

    /// Burn the given amount of LP tokens and receive the underlying liquidity.
    /// This is friend-only as the returned fungible assets might be of an internal wrapper type. If this is not the
    /// case, this function can be made public.
    public(friend) fun burn(
        lp: &signer,
        token_1: Object<Metadata>,
        token_2: Object<Metadata>,
        is_stable: bool,
        amount: u64,
    ): (FungibleAsset, FungibleAsset) acquires FeesAccounting, LiquidityPool, ResourceAccountCap, NFTRefs, NFTProperties, MintedAddressStore {
        assert!(amount > 0, EZERO_AMOUNT);
        let lp_address = signer::address_of(lp);
        let pool = liquidity_pool(token_1, token_2, is_stable);
        let store = ensure_lp_token_store(lp_address, pool);

        // We need to update the amount of rewards claimable by this LP token store if they already have a previous
        // balance. This ensures that they can get the unclaimed fees they're entitled to before burning.
        update_claimable_fees(lp_address, pool);

        // Burn the provided LP tokens.
        let lp_token_supply = option::destroy_some(fungible_asset::supply(pool));
        let pool_data = liquidity_pool_data(&pool);
        fungible_asset::burn_from(&pool_data.lp_token_refs.burn_ref, store, amount);

        // Calculate the amounts of tokens redeemed from the pool.
        let store_1 = pool_data.token_store_1;
        let store_2 = pool_data.token_store_2;
        let reserve_1 = fungible_asset::balance(store_1);
        let reserve_2 = fungible_asset::balance(store_2);
        let amount_to_redeem_1 = (math128::mul_div(
            (amount as u128),
            (reserve_1 as u128),
            lp_token_supply
        ) as u64);
        let amount_to_redeem_2 = (math128::mul_div(
            (amount as u128),
            (reserve_2 as u128),
            lp_token_supply
        ) as u64);
        assert!(amount_to_redeem_1 > 0 && amount_to_redeem_2 > 0, EINSUFFICIENT_LIQUIDITY_REDEEMED);

        let lp_balance = (primary_fungible_store::balance(address_of(lp), pool) as u128);
        if (lp_balance == 0) {

            lp_nft_burn(lp);

        } else {

            let (claimable_fees, lp_token_percentage) = lp_nft_get_fees_and_plt(lp, pool);

            lp_nft_update_properties(lp, (claimable_fees as u256), lp_token_percentage);

        };



        // Withdraw and return the redeemed tokens.
        let swap_signer = &get_signer();
        let redeemed_1 = fungible_asset::withdraw(swap_signer, store_1, amount_to_redeem_1);
        let redeemed_2 = fungible_asset::withdraw(swap_signer, store_2, amount_to_redeem_2);
        if (is_sorted(token_1, token_2)) {
            (redeemed_1, redeemed_2)
        } else {
            (redeemed_2, redeemed_1)
        }

    }

    /// Calculate and update the latest amount of fees claimable by the given LP.
    public entry fun update_claimable_fees(lp: address, pool: Object<LiquidityPool>) acquires FeesAccounting {
        let fees_accounting = unchecked_mut_fees_accounting(&pool);
        let current_total_fees_1 = fees_accounting.total_fees_1;
        let current_total_fees_2 = fees_accounting.total_fees_2;
        let lp_balance = (primary_fungible_store::balance(lp, pool) as u128);
        let lp_token_total_supply = lp_token_supply(pool);
        // Calculate and update the amount of fees this LP token store is entitled to, taking into account the last
        // time they claimed.
        if (lp_balance > 0) {
            let last_total_fees_1 = *smart_table::borrow(&fees_accounting.total_fees_at_last_claim_1, lp);
            let last_total_fees_2 = *smart_table::borrow(&fees_accounting.total_fees_at_last_claim_2, lp);
            let delta_1 = current_total_fees_1 - last_total_fees_1;
            let delta_2 = current_total_fees_2 - last_total_fees_2;
            let claimable_1 = math128::mul_div(delta_1, lp_balance, lp_token_total_supply);
            let claimable_2 = math128::mul_div(delta_2, lp_balance, lp_token_total_supply);
            if (claimable_1 > 0) {
                let old_claimable_1 = smart_table::borrow_mut_with_default(&mut fees_accounting.claimable_1, lp, 0);
                *old_claimable_1 = *old_claimable_1 + claimable_1;
            };
            if (claimable_2 > 0) {
                let old_claimable_2 = smart_table::borrow_mut_with_default(&mut fees_accounting.claimable_2, lp, 0);
                *old_claimable_2 = *old_claimable_2 + claimable_2;
            };
        };

        smart_table::upsert(&mut fees_accounting.total_fees_at_last_claim_1, lp, current_total_fees_1);
        smart_table::upsert(&mut fees_accounting.total_fees_at_last_claim_2, lp, current_total_fees_2);
    }

    /// Claim the fees that the given LP is entitled to.
    /// This is friend-only as the returned fungible assets might be of an internal wrapper type. If this is not the
    /// case, this function can be made public.
    public(friend) fun claim_fees(
        lp: &signer,
        pool: Object<LiquidityPool>,
    ): (FungibleAsset, FungibleAsset) acquires FeesAccounting, LiquidityPool, ResourceAccountCap {
        let lp_address = signer::address_of(lp);
        update_claimable_fees(lp_address, pool);

        let pool_data = liquidity_pool_data(&pool);
        let fees_accounting = unchecked_mut_fees_accounting(&pool);
        let claimable_1 = if (smart_table::contains(&fees_accounting.claimable_1, lp_address)) {
            smart_table::remove(&mut fees_accounting.claimable_1, lp_address)
        } else {
            0
        };
        let claimable_2 = if (smart_table::contains(&fees_accounting.claimable_2, lp_address)) {
            smart_table::remove(&mut fees_accounting.claimable_2, lp_address)
        } else {
            0
        };
        let swap_signer = &get_signer();
        let fees_1 = if (claimable_1 > 0) {
            fungible_asset::withdraw(swap_signer, pool_data.fees_store_1, (claimable_1 as u64))
        } else {
            fungible_asset::zero(fungible_asset::store_metadata(pool_data.fees_store_1))
        };
        let fees_2 = if (claimable_2 > 0) {
            fungible_asset::withdraw(swap_signer, pool_data.fees_store_2, (claimable_2 as u64))
        } else {
            fungible_asset::zero(fungible_asset::store_metadata(pool_data.fees_store_2))
        };
        (fees_1, fees_2)
    }

    /////////////////////////////////////////////////// OPERATIONS /////////////////////////////////////////////////////

    public entry fun set_pauser(pauser: &signer, new_pauser: address) acquires LiquidityPoolConfigs, ResourceAccountCap {
        let pool_configs = pauser_only_mut_liquidity_pool_configs(pauser);
        pool_configs.pending_pauser = new_pauser;
    }

    public entry fun accept_pauser(new_pauser: &signer) acquires LiquidityPoolConfigs, ResourceAccountCap {
        let pool_configs = unchecked_mut_liquidity_pool_configs();
        assert!(signer::address_of(new_pauser) == pool_configs.pending_pauser, ENOT_AUTHORIZED);
        pool_configs.pauser = pool_configs.pending_pauser;
        pool_configs.pending_pauser = @0x0;
    }

    public entry fun set_pause(pauser: &signer, is_paused: bool) acquires LiquidityPoolConfigs, ResourceAccountCap {
        let pool_configs = pauser_only_mut_liquidity_pool_configs(pauser);
        pool_configs.is_paused = is_paused;
    }

    public entry fun set_fee_manager(fee_manager: &signer, new_fee_manager: address) acquires LiquidityPoolConfigs, ResourceAccountCap {
        let pool_configs = fee_manager_only_mut_liquidity_pool_configs(fee_manager);
        pool_configs.pending_fee_manager = new_fee_manager;
    }

    public entry fun accept_fee_manager(new_fee_manager: &signer) acquires LiquidityPoolConfigs, ResourceAccountCap {
        let pool_configs = unchecked_mut_liquidity_pool_configs();
        assert!(signer::address_of(new_fee_manager) == pool_configs.pending_fee_manager, ENOT_AUTHORIZED);
        pool_configs.fee_manager = pool_configs.pending_fee_manager;
        pool_configs.pending_fee_manager = @0x0;
    }

    public entry fun set_stable_fee(fee_manager: &signer, new_fee_bps: u64) acquires LiquidityPoolConfigs, ResourceAccountCap {
        let pool_configs = fee_manager_only_mut_liquidity_pool_configs(fee_manager);
        pool_configs.stable_fee_bps = new_fee_bps;
    }

    public entry fun set_volatile_fee(fee_manager: &signer, new_fee_bps: u64) acquires LiquidityPoolConfigs, ResourceAccountCap {
        let pool_configs = fee_manager_only_mut_liquidity_pool_configs(fee_manager);
        pool_configs.volatile_fee_bps = new_fee_bps;
    }

    inline fun create_lp_token(
        token_1: Object<Metadata>,
        token_2: Object<Metadata>,
        is_stable: bool,
    ): &ConstructorRef {
        let token_name = lp_token_name(token_1, token_2);
        let seeds = get_pool_seeds(token_1, token_2, is_stable);
        let lp_token_constructor_ref = &object::create_named_object(&get_signer(), seeds);
        // We don't enable automatic primary store creation because we need LPs to call into this module for transfers
        // so the fees accounting can be updated correctly.
        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            lp_token_constructor_ref,
            option::none(),
            token_name,
            string::utf8(b"LP"),
            LP_TOKEN_DECIMALS,
            string::utf8(b""),
            string::utf8(b"")
        );
        lp_token_constructor_ref
    }

    fun create_lp_token_refs(constructor_ref: &ConstructorRef): LPTokenRefs {
        LPTokenRefs {
            burn_ref: fungible_asset::generate_burn_ref(constructor_ref),
            mint_ref: fungible_asset::generate_mint_ref(constructor_ref),
            transfer_ref: fungible_asset::generate_transfer_ref(constructor_ref),
        }
    }

    fun ensure_lp_token_store<T: key>(lp: address, pool: Object<T>): Object<FungibleStore> acquires LiquidityPool {
        primary_fungible_store::ensure_primary_store_exists(lp, pool);
        let store = primary_fungible_store::primary_store(lp, pool);
        if (!fungible_asset::is_frozen(store)) {
            // LPs must call transfer here to transfer the LP tokens so claimable fees can be updated correctly.
            let transfer_ref = &liquidity_pool_data(&pool).lp_token_refs.transfer_ref;
            fungible_asset::set_frozen_flag(transfer_ref, store, true);
        };
        store
    }

    inline fun get_pool_seeds(token_1: Object<Metadata>, token_2: Object<Metadata>, is_stable: bool): vector<u8> {
        let seeds = vector[];
        vector::append(&mut seeds, bcs::to_bytes(&object::object_address(&token_1)));
        vector::append(&mut seeds, bcs::to_bytes(&object::object_address(&token_2)));
        vector::append(&mut seeds, bcs::to_bytes(&is_stable));
        seeds
    }

    inline fun create_token_store(pool_signer: &signer, token: Object<Metadata>): Object<FungibleStore> {
        let constructor_ref = &object::create_object_from_object(pool_signer);
        fungible_asset::create_store(constructor_ref, token)
    }

    inline fun lp_token_name(token_1: Object<Metadata>, token_2: Object<Metadata>): String {
        let token_symbol = string::utf8(b"LP-");
        string::append(&mut token_symbol, fungible_asset::symbol(token_1));
        string::append_utf8(&mut token_symbol, b"-");
        string::append(&mut token_symbol, fungible_asset::symbol(token_2));
        token_symbol
    }

    inline fun calculate_constant_k(pool: &LiquidityPool): u256 {
        let r1 = (fungible_asset::balance(pool.token_store_1) as u256);
        let r2 = (fungible_asset::balance(pool.token_store_2) as u256);
        if (pool.is_stable) {
            // k = x^3 * y + y^3 * x. This is a modified constant for stable pairs.
            r1 * r1 * r1 * r2 + r2 * r2 * r2 * r1
        } else {
            // k = x * y. This is standard constant product for volatile asset pairs.
            r1 * r2
        }
    }

    inline fun safe_fees_accounting<T: key>(pool: &Object<T>): &FeesAccounting acquires FeesAccounting {
        borrow_global<FeesAccounting>(object::object_address(pool))
    }

    inline fun liquidity_pool_data<T: key>(pool: &Object<T>): &LiquidityPool acquires LiquidityPool {
        borrow_global<LiquidityPool>(object::object_address(pool))
    }

    inline fun liquidity_pool_data_mut<T: key>(pool: &Object<T>): &mut LiquidityPool acquires LiquidityPool {
        borrow_global_mut<LiquidityPool>(object::object_address(pool))
    }

    inline fun safe_liquidity_pool_configs(): &LiquidityPoolConfigs acquires LiquidityPoolConfigs {
        borrow_global<LiquidityPoolConfigs>(address_of(&get_signer()))
    }

    inline fun pauser_only_mut_liquidity_pool_configs(
        pauser: &signer,
    ): &mut LiquidityPoolConfigs acquires LiquidityPoolConfigs {
        let pool_configs = unchecked_mut_liquidity_pool_configs();
        assert!(signer::address_of(pauser) == pool_configs.pauser, ENOT_AUTHORIZED);
        pool_configs
    }

    inline fun fee_manager_only_mut_liquidity_pool_configs(
        fee_manager: &signer,
    ): &mut LiquidityPoolConfigs acquires LiquidityPoolConfigs {
        let pool_configs = unchecked_mut_liquidity_pool_configs();
        assert!(signer::address_of(fee_manager) == pool_configs.fee_manager, ENOT_AUTHORIZED);
        pool_configs
    }

    inline fun unchecked_mut_liquidity_pool_data<T: key>(pool: &Object<T>): &mut LiquidityPool acquires LiquidityPool {
        borrow_global_mut<LiquidityPool>(object::object_address(pool))
    }

    inline fun unchecked_mut_fees_accounting<T: key>(pool: &Object<T>): &mut FeesAccounting acquires FeesAccounting {
        borrow_global_mut<FeesAccounting>(object::object_address(pool))
    }

    inline fun unchecked_mut_liquidity_pool_configs(): &mut LiquidityPoolConfigs acquires LiquidityPoolConfigs {
        borrow_global_mut<LiquidityPoolConfigs>(address_of(&get_signer()))
    }

    inline fun f(x0: u256, y: u256): u256 {
        x0 * (y * y * y) + (x0 * x0 * x0) * y
    }

    inline fun d(x0: u256, y: u256): u256 {
        3 * x0 * (y * y) + (x0 * x0 * x0)
    }

    fun get_y(x0: u256, xy: u256, y: u256): u256 {
        let i = 0;
        while (i < 255) {
            let y_prev = y;
            let k = f(x0, y);
            if (k < xy) {
                let dy = (xy - k) / d(x0, y);
                y = y + dy;
            } else {
                let dy = (k - xy) / d(x0, y);
                y = y - dy;
            };
            if (y > y_prev) {
                if (y - y_prev <= 1) {
                    return y
                }
            } else {
                if (y_prev - y <= 1) {
                    return y
                }
            };
            i = i + 1;
        };
        y
    }

    fun get_signer(): signer acquires ResourceAccountCap {
        let signer_cap = &borrow_global<ResourceAccountCap>(@deployer).signer_cap;
        create_signer_with_capability(signer_cap)
    }

    //////////////////////////////////////// NFT ///////////////////////////////////////////////

    public(friend) fun lp_nft_mint(
        lp: &signer,
        token_1: Object<Metadata>,
        token_2: Object<Metadata>,
        is_stable: bool, fees: u256,
        lp_token_percentage: u256
    ) acquires ResourceAccountCap, MintedAddressStore, LiquidityPool {

        let pool = liquidity_pool(token_1, token_2, is_stable);
        let pool_data = liquidity_pool_data_mut(&pool);
        let name = string::utf8(b"LP NFT");
        pool_data.nft_total_supply = pool_data.nft_total_supply + 1;
        append( &mut name , string_utils::to_string(&pool_data.nft_total_supply));

        let nft_cref = token::create_named_token(
            &get_signer(),
            string::utf8(b"LiquidityNFT"),
            string::utf8(b"LP NFT"),
            name,
            option::none(),
            string::utf8(COAL),
        );

        let mutator_ref = token::generate_mutator_ref(&nft_cref);
        let burn_ref = token::generate_burn_ref(&nft_cref);
        let token_signer = generate_signer(&nft_cref);
        let token_address = address_of(&token_signer);

        let  isMinted = &mut borrow_global_mut<MintedAddressStore>(address_of(&get_signer())).minted;

        smart_table::upsert(isMinted, address_of(lp), token_address);

        move_to(&token_signer, NFTRefs {
            mutator_ref,
            burn_ref,
        });

        move_to(&token_signer, NFTProperties {
            mint_time: (timestamp::now_seconds() as u256),
            hold_time: 0,
            fees,
            lp_token_percentage,
        });

        event::emit(
            MintEvent {
                owner: signer::address_of(lp),
                token_id: object::address_from_constructor_ref(&nft_cref),
            }
        );

        object::transfer(
            &get_signer(),
            object::object_from_constructor_ref<Token>(&nft_cref),
            signer::address_of(lp),
        );

    }

    fun lp_nft_update_properties(
        lp: &signer,
        new_fees: u256,
        new_ltp: u256
    ) acquires NFTProperties, MintedAddressStore, ResourceAccountCap, NFTRefs {

        let table = &borrow_global<MintedAddressStore>( address_of(&get_signer() ) ).minted;
        let token_address = smart_table::borrow( table, address_of(lp) );
        let token_properties =  borrow_global_mut<NFTProperties>(*token_address);

        token_properties.hold_time = (timestamp::now_seconds() as u256) - token_properties.mint_time;
        token_properties.fees = new_fees;
        token_properties.lp_token_percentage = new_ltp;

        lp_nft_update_uri(token_address, new_fees, new_ltp);

        event::emit(
            UpdateEvent {
                owner: address_of(lp),
                token_id: *token_address,
                time_stamp: (timestamp::now_seconds() as u256),
                fees: new_fees,
                lp_token_percentage: new_ltp,
            }
        );
    }

    public(friend) fun lp_nft_burn(lp: &signer) acquires NFTRefs, NFTProperties, MintedAddressStore, ResourceAccountCap {

        let token_address = *smart_table::borrow(
            &borrow_global<MintedAddressStore>(address_of(&get_signer())).minted,
            address_of(lp)
        );

        let NFTRefs {
            mutator_ref: _,
            burn_ref,
        } = move_from<NFTRefs>(token_address);

        let NFTProperties {
            mint_time: _,
            hold_time: _,
            fees: _,
            lp_token_percentage: _,
        } = move_from<NFTProperties>(token_address);

        token::burn(burn_ref);

        let  isMinted = &mut borrow_global_mut<MintedAddressStore>(address_of(&get_signer())).minted;

        smart_table::remove(isMinted, address_of(lp));

        event::emit(
            BurnEvent {
                owner: address_of(lp),
                token_id: token_address,
            }
        );

    }

    fun lp_nft_update_uri(token_address: &address, fees: u256, ltp: u256) acquires NFTRefs {

        if (ltp >= 50) {

            if (fees >= 10000){
                token::set_uri(&borrow_global<NFTRefs>(*token_address).mutator_ref, string::utf8(BLOCK_OF_DIAMOND));
                return
            };

            token::set_uri(&borrow_global<NFTRefs>(*token_address).mutator_ref, string::utf8(DIAMOND));

        } else if (ltp >= 37) {

            if (fees >= 10000){
                token::set_uri(&borrow_global<NFTRefs>(*token_address).mutator_ref, string::utf8(BLOCK_OF_EMERALD));
                return
            };

            token::set_uri(&borrow_global<NFTRefs>(*token_address).mutator_ref, string::utf8(EMERALD));

        } else if (ltp >= 25) {

            if (fees >= 10000){
                token::set_uri(&borrow_global<NFTRefs>(*token_address).mutator_ref, string::utf8(BLOCK_OF_GOLD));
                return
            };

            token::set_uri(&borrow_global<NFTRefs>(*token_address).mutator_ref, string::utf8(GOLD));

        } else if (ltp >= 12) {

            if (fees >= 10000){
                token::set_uri(&borrow_global<NFTRefs>(*token_address).mutator_ref, string::utf8(BLOCK_OF_IRON));
                return
            };

            token::set_uri(&borrow_global<NFTRefs>(*token_address).mutator_ref, string::utf8(IRON));

        } else {

            if (fees >= 10000){
                token::set_uri(&borrow_global<NFTRefs>(*token_address).mutator_ref, string::utf8(BLOCK_OF_COAL));
                return
            };

            token::set_uri(&borrow_global<NFTRefs>(*token_address).mutator_ref, string::utf8(COAL));
        };

    }

    public(friend) fun lp_nft_request_for_update_uri(
        lp: &signer,
        token_address: &address,
        token_1: Object<Metadata>,
        token_2: Object<Metadata>,
        is_stable: bool
    ) acquires NFTRefs, FeesAccounting, ResourceAccountCap {

        let pool = liquidity_pool(token_1, token_2, is_stable);

        let (fees, ltp) = lp_nft_get_fees_and_plt(lp, pool);

        if (ltp >= 50) {

            if (fees >= 10000){
                token::set_uri(&borrow_global<NFTRefs>(*token_address).mutator_ref, string::utf8(BLOCK_OF_DIAMOND));
                return
            };

            token::set_uri(&borrow_global<NFTRefs>(*token_address).mutator_ref, string::utf8(DIAMOND));

        } else if (ltp >= 37) {

            if (fees >= 10000){
                token::set_uri(&borrow_global<NFTRefs>(*token_address).mutator_ref, string::utf8(BLOCK_OF_EMERALD));
                return
            };

            token::set_uri(&borrow_global<NFTRefs>(*token_address).mutator_ref, string::utf8(EMERALD));

        } else if (ltp >= 25) {

            if (fees >= 10000){
                token::set_uri(&borrow_global<NFTRefs>(*token_address).mutator_ref, string::utf8(BLOCK_OF_GOLD));
                return
            };

            token::set_uri(&borrow_global<NFTRefs>(*token_address).mutator_ref, string::utf8(GOLD));

        } else if (ltp >= 12) {

            if (fees >= 10000){
                token::set_uri(&borrow_global<NFTRefs>(*token_address).mutator_ref, string::utf8(BLOCK_OF_IRON));
                return
            };

            token::set_uri(&borrow_global<NFTRefs>(*token_address).mutator_ref, string::utf8(IRON));

        } else {

            if (fees >= 10000){
                token::set_uri(&borrow_global<NFTRefs>(*token_address).mutator_ref, string::utf8(BLOCK_OF_COAL));
                return
            };

            token::set_uri(&borrow_global<NFTRefs>(*token_address).mutator_ref, string::utf8(COAL));
        };

    }

    fun lp_nft_get_fees_and_plt(lp: &signer, pool: Object<LiquidityPool>): (u128, u256) acquires FeesAccounting {
        let claimable_fee1 = *smart_table::borrow_mut_with_default(
            &mut unchecked_mut_fees_accounting(&pool).claimable_1,
            address_of(lp),
            0
        );
        let claimable_fee2 = *smart_table::borrow_mut_with_default(
            &mut unchecked_mut_fees_accounting(&pool).claimable_2,
            address_of(lp),
            0
        );
        let claimable_fees = claimable_fee1 + claimable_fee2;

        let lp_balance = (primary_fungible_store::balance(address_of(lp), pool) as u128);
        let lp_token_total_supply = lp_token_supply(pool);
        let lp_token_percentage = (math128::mul_div(lp_balance, 100, lp_token_total_supply) as u256);
        ( claimable_fees, lp_token_percentage )
    }

}