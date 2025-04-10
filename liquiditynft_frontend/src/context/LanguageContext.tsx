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
        'logo': '动态NFT去中心化交易',
        'mint_test_token': '铸造测试代币',
        'select_token': '选择代币',
        'loading': '加载中...',
        'please_select_token': '请选择代币',
        'transaction_success': '交易成功',
        'transaction_failed': '交易失败',
        'view_on_explorer': '在浏览器中查看',
        
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
    }
};

// 提供者组件
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('en');

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