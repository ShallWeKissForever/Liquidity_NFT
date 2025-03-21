// Pool的结构体
export type Pool = {
    token_name_1: string,
    token_name_2: string,
    token_symbol_1: string,
    token_symbol_2: string,
    token_uri_1: string,
    token_uri_2: string,
    token_metadata_1: string,
    token_metadata_2: string,
};

// Token的类型定义
export type Token = {
    name: string;
    symbol: string;
    uri: string;
    metadata: string;
    pairTokenMetadata: string;
};

// 默认的Token值
export const defaultToken: Token = {
    name: "Select token",
    symbol: "",
    uri: "",
    metadata: "",
    pairTokenMetadata: "",
};