import React, { createContext, useState, useContext, ReactNode } from 'react';

// 定义语言类型
type Language = 'zh' | 'en';

// 定义上下文类型
interface LanguageContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: string) => string;
}

// 创建上下文
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 翻译文本
const translations: Record<Language, Record<string, string>> = {
    zh: {
        // 通用
        'logo': '动态NFT去中心化交易平台',
        'mint_test_token': '铸造测试代币',
        'select_token': '选择代币',
        'loading': '加载中...',
        'please_select_token': '请选择代币',
        'transaction_success': '交易成功',
        'transaction_failed': '交易失败',
        'view_on_explorer': '在浏览器中查看',
        'please_connect_wallet': '请连接钱包',
        'query_success': '查询成功',
        'query_failed': '查询失败',
        'owner': '所有者',
        'reserve': '储备量',
        'pool_address': '池子地址',
        
        // 导航
        'trading': '交易',
        'liquidity_pool': '流动性池',
        'query': '查询',
        
        // 功能按钮
        'swap': '兑换',
        'create': '创建',
        'add': '添加',
        'remove': '移除',

        // Swap 相关
        'sell': '卖出',
        'buy': '买入',

        // CreatePool 相关
        'token1': '代币1',
        'token2': '代币2',
        'create_pool': '创建流动池',

        // AddLiquidity 相关
        'add_liquidity': '添加流动性',

        // RemoveLiquidity 相关
        'lp_token': 'LP 代币',
        'lp_token_balance': 'LP 代币余额',
        'remove_liquidity': '移除流动性',
        
        // 新增页面相关
        'liquidity_pool_management': '流动性池管理',
        'liquidity_pool_description': '在这里您可以管理您的流动性池，查看收益和进行相关操作。',
        'transaction_query': '交易查询',
        'enter_transaction_hash_or_address': '请输入交易哈希或地址',
        'search': '搜索',
        'transaction_hash': '交易哈希',
        'type': '类型',
        'status': '状态',
        'time': '时间',
        'no_data': '暂无数据',
        'coming_soon': '功能即将上线，敬请期待！',
        
        // Query页面相关
        'query_management': '查询管理',
        'nft_query': 'NFT查询',
        'pool_query': '池子查询',
        'query_nft': '查询NFT',
        'query_pool': '查询池子',
        'nft_information': 'NFT信息',
        'pool_information': '池子信息',
        'total_liquidity': '总流动性',
        'fee': '手续费',
        // 新增
        'swap_fee_bps': '交易手续费率',
        'nft_total_supply': 'NFT总供应量',
        'is_stable': '是否稳定币',
        'nft_mint_time': '铸造时间',
        'nft_fees': '可提取手续费',
        'nft_percentage': '百分比份额',
    },
    en: {
        // 通用
        'logo': 'DNFTSwap',
        'mint_test_token': 'Mint test token',
        'select_token': 'Select token',
        'loading': 'Loading...',
        'please_select_token': 'Please select token',
        'transaction_success': 'Transaction successful',
        'transaction_failed': 'Transaction failed',
        'view_on_explorer': 'View on explorer',
        'please_connect_wallet': 'Please connect wallet',
        'query_success': 'Query successful',
        'query_failed': 'Query failed',
        'owner': 'Owner',
        'reserve': 'Reserve',
        'pool_address': 'Pool Address',
        
        // 导航
        'trading': 'Trading',
        'liquidity_pool': 'Liquidity Pool',
        'query': 'Query',
        
        // 功能按钮
        'swap': 'Swap',
        'create': 'Create',
        'add': 'Add',
        'remove': 'Remove',

        // Swap 相关
        'sell': 'Sell',
        'buy': 'Buy',

        // CreatePool 相关
        'token1': 'Token1',
        'token2': 'Token2',
        'create_pool': 'Create pool',

        // AddLiquidity 相关
        'add_liquidity': 'Add liquidity',

        // RemoveLiquidity 相关
        'lp_token': 'LP Token',
        'lp_token_balance': 'LP Token Balance',
        'remove_liquidity': 'Remove liquidity',
        
        // 新增页面相关
        'liquidity_pool_management': 'Liquidity Pool Management',
        'liquidity_pool_description': 'Here you can manage your liquidity pools, view earnings and perform related operations.',
        'transaction_query': 'Transaction Query',
        'enter_transaction_hash_or_address': 'Enter transaction hash or address',
        'search': 'Search',
        'transaction_hash': 'Transaction Hash',
        'type': 'Type',
        'status': 'Status',
        'time': 'Time',
        'no_data': 'No data',
        'coming_soon': 'Feature coming soon, stay tuned!',
        
        // Query页面相关
        'query_management': 'Query Management',
        'nft_query': 'NFT Query',
        'pool_query': 'Pool Query',
        'query_nft': 'Query NFT',
        'query_pool': 'Query Pool',
        'nft_information': 'NFT Information',
        'pool_information': 'Pool Information',
        'total_liquidity': 'Total Liquidity',
        'fee': 'Fee',
        // 新增
        'swap_fee_bps': 'Swap Fee Rate',
        'nft_total_supply': 'NFT Total Supply',
        'is_stable': 'Is Stable',
        'nft_mint_time': 'Mint Time',
        'nft_fees': 'Fees',
        'nft_percentage': 'Percentage',
    }
};

// 提供者组件
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('zh');

    // 翻译函数
    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

// 自定义钩子，方便使用上下文
export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};