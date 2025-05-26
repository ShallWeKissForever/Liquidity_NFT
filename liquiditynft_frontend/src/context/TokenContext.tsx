import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { Pool, Token, defaultToken } from '../types/type';

// 创建Context接口
interface TokenContextType {
    pools: Pool[];
    tokenList: Token[];
    filteredTokenListForToken1: Token[];
    fetchingTokenList: boolean;
    getFilteredTokenListForToken2: (metadata: string) => Token[];
    refreshTokenList: () => Promise<void>;
}

// 创建默认值
const defaultContext: TokenContextType = {
    pools: [],
    tokenList: [],
    filteredTokenListForToken1: [],
    fetchingTokenList: false,
    getFilteredTokenListForToken2: () => [],
    refreshTokenList: async () => {}
};

// 创建Context
const TokenContext = createContext<TokenContextType>(defaultContext);

// 创建Provider组件
export const TokenProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // 合约发布的账户地址
    const moduleAddress = "0x8e3f47d8f639212ee51a4131ecf1ee28a74e11223904241e682fd94806b4a1cb";

    // 设置 Aptos 与 testnet 网络交互
    const aptosConfig = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(aptosConfig);

    // 状态管理
    const [pools, setPools] = useState<Pool[]>([]);
    const [tokenList, setTokenList] = useState<Token[]>([]);
    const [filteredTokenListForToken1, setFilteredTokenListForToken1] = useState<Token[]>([]);
    const [fetchingTokenList, setFetchingTokenList] = useState(false);

    // 在组件挂载时执行 getTokenList
    useEffect(() => {
        getTokenList();
    }, []);

    // 使用 useEffect 在 pools 更新时更新 tokenList
    useEffect(() => {
        const seenMetadata = new Set();
        const tokenList = pools.flatMap((pool) => [
            {
                name: pool.token_name_1,
                symbol: pool.token_symbol_1,
                uri: pool.token_uri_1,
                metadata: pool.token_metadata_1,
                pairTokenMetadata: pool.token_metadata_2
            },
            {
                name: pool.token_name_2,
                symbol: pool.token_symbol_2,
                uri: pool.token_uri_2,
                metadata: pool.token_metadata_2,
                pairTokenMetadata: pool.token_metadata_1
            },
        ]);

        const filteredTokenListForToken1 = tokenList.filter((token) => {
            if (!seenMetadata.has(token.metadata)) {
                seenMetadata.add(token.metadata);
                return true;
            }
            return false;
        });

        setTokenList(tokenList);
        setFilteredTokenListForToken1(filteredTokenListForToken1);
    }, [pools]);

    // 获取匹配Token2的列表
    const getFilteredTokenListForToken2 = (metadata: string) => {
        return tokenList.filter((token) => token.pairTokenMetadata === metadata);
    };

    // 从链上获取币对
    const getTokenList = async () => {
        if (fetchingTokenList) return;
        setFetchingTokenList(true);
        try {
            const returnGetPools: Array<Array<{ inner: string }>> = await aptos.view({
                payload: {
                    function: `${moduleAddress}::liquidity_pool::all_pools`,
                    typeArguments: [],
                    functionArguments: [],
                },
            });

            const metadataStrings = returnGetPools.flatMap(poolArray =>
                poolArray.map(pool => pool.inner)
            );

            const tempPools = [];

            for (const address of metadataStrings) {
                const returnGetPoolResource = await aptos.getAccountResource({
                    accountAddress: address,
                    resourceType: `${moduleAddress}::liquidity_pool::LiquidityPool`
                });

                const token1 = (returnGetPoolResource as any).token_1.inner;
                const token2 = (returnGetPoolResource as any).token_2.inner;

                const [returnGetToken1Name, returnGetToken2Name] = await Promise.all([
                    aptos.view({
                        payload: {
                            function: "0x1::fungible_asset::name",
                            typeArguments: ["0x1::fungible_asset::Metadata"],
                            functionArguments: [token1],
                        }
                    }),
                    aptos.view({
                        payload: {
                            function: "0x1::fungible_asset::name",
                            typeArguments: ["0x1::fungible_asset::Metadata"],
                            functionArguments: [token2],
                        }
                    })
                ]);

                const [returnGetToken1Symbol, returnGetToken2Symbol] = await Promise.all([
                    aptos.view({
                        payload: {
                            function: "0x1::fungible_asset::symbol",
                            typeArguments: ["0x1::fungible_asset::Metadata"],
                            functionArguments: [token1],
                        }
                    }),
                    aptos.view({
                        payload: {
                            function: "0x1::fungible_asset::symbol",
                            typeArguments: ["0x1::fungible_asset::Metadata"],
                            functionArguments: [token2],
                        }
                    })
                ]);

                const [returnGetToken1Uri, returnGetToken2Uri] = await Promise.all([
                    aptos.view({
                        payload: {
                            function: "0x1::fungible_asset::icon_uri",
                            typeArguments: ["0x1::fungible_asset::Metadata"],
                            functionArguments: [token1],
                        }
                    }),
                    aptos.view({
                        payload: {
                            function: "0x1::fungible_asset::icon_uri",
                            typeArguments: ["0x1::fungible_asset::Metadata"],
                            functionArguments: [token2],
                        }
                    })
                ]);

                const newPool: Pool = {
                    token_name_1: `${returnGetToken1Name[0]}`,
                    token_name_2: `${returnGetToken2Name[0]}`,
                    token_symbol_1: `${returnGetToken1Symbol[0]}`,
                    token_symbol_2: `${returnGetToken2Symbol[0]}`,
                    token_uri_1: `${returnGetToken1Uri[0]}`,
                    token_uri_2: `${returnGetToken2Uri[0]}`,
                    token_metadata_1: `${token1}`,
                    token_metadata_2: `${token2}`,
                };

                tempPools.push(newPool);
            }

            setPools(tempPools);
        } catch (error) {
            console.log(error);
        }
        setFetchingTokenList(false);
    };

    // 提供给context的值
    const value = {
        pools,
        tokenList,
        filteredTokenListForToken1,
        fetchingTokenList,
        getFilteredTokenListForToken2,
        refreshTokenList: getTokenList,
    };

    return <TokenContext.Provider value={value}>{children}</TokenContext.Provider>;
};

// 创建Hook方便使用
export const useTokenContext = () => useContext(TokenContext);

export default TokenContext; 