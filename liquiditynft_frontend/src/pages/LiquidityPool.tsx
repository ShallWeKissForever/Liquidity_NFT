import { useState, useEffect, useRef } from 'react';
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { Row, Col, Button, Modal, List, message } from 'antd';
import { useWallet, InputTransactionData } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import { useLanguage } from '../context/LanguageContext';
import { useTokenContext } from '../context/TokenContext';
import { Pool, Token, defaultToken } from '../types/type';
import './css/Pages.css';

function LiquidityPool() {
    const { t } = useLanguage();
    const { account, signAndSubmitTransaction } = useWallet();

    // 使用共享的TokenContext
    const { 
        pools, 
        tokenList, 
        filteredTokenListForToken1, 
        fetchingTokenList,
        getFilteredTokenListForToken2,
        refreshTokenList
    } = useTokenContext();

    // 合约发布的账户地址
    const moduleAddress = "0x8e3f47d8f639212ee51a4131ecf1ee28a74e11223904241e682fd94806b4a1cb";

    // 设置 Aptos 与 testnet 网络交互
    const aptosConfig = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(aptosConfig);

    // 状态管理
    const [selectedToken1, setSelectedToken1] = useState<Token>(defaultToken);
    const [selectedToken2, setSelectedToken2] = useState<Token>(defaultToken);
    const [lpNftUri, setLpNftUri] = useState('');
    const [lpTokenBalance, setLpTokenBalance] = useState('');
    const [activeFeature, setActiveFeature] = useState('create'); // 'create', 'add', 'remove'

    // 在selectedToken2有值并连接了钱包时更新
    useEffect(() => {
        if (selectedToken2.uri !== '' && account !== null) {
            getLpNftUri();
        } else {
            setLpNftUri('');
        }
    }, [selectedToken2, account?.address]);

    // 在selectedToken2有值并连接了钱包时更新
    useEffect(() => {
        if (selectedToken2.uri !== '' && account !== null) {
            getLpTokenBalance();
        } else {
            setLpTokenBalance('');
        }
    }, [selectedToken2, account?.address]);

    // 在选择 token1 时重置 token2
    useEffect(() => {
        setSelectedToken2({
            name: 'Select token',
            symbol: '',
            uri: '',
            metadata: '',
            pairTokenMetadata: '',
        });
    }, [selectedToken1]);

    // 过滤出符合 token1 的 pairTokenMetadata 的 token2 列表
    const filteredTokenListForToken2 = getFilteredTokenListForToken2(selectedToken1.metadata);

    // 获取NFT Uri
    const getLpNftUri = async () => {
        try {
            const returnGetLpNftUri = await aptos.view({
                payload: {
                    function: `${moduleAddress}::liquidity_pool::get_nft_uri`,
                    typeArguments: [],
                    functionArguments: [account?.address?.toString(), selectedToken1.metadata, selectedToken2.metadata, false],
                },
            });
            setLpNftUri(`${returnGetLpNftUri[0]}`);
        } catch (error) {
            console.log(error);
        }
    };

    //获取Lp Token的余额
    const getLpTokenBalance = async () => {
        try {
            const returnGetLpTokenBalance = await aptos.view({
                payload: {
                    function: `${moduleAddress}::liquidity_pool::lp_token_balance`,
                    typeArguments: [],
                    functionArguments: [account?.address?.toString(), selectedToken1.metadata, selectedToken2.metadata, false],
                },
            });
            setLpTokenBalance(`${returnGetLpTokenBalance[0]}`);
        } catch (error) {
            console.log(error);
        }
    }

    // 在提交时补零
    const formatTokenAmount = (value: string) => {
        if (value === "" || value === "0") {
            return "0";
        }
        if (value === "1" || value === "1.") {
            return "1000000";
        }
        const parts = value.split(".");
        if (parts.length === 1) {
            return `${parts[0]}000000`;
        }
        const [integerPart, decimalPart] = parts;
        const paddedDecimal = decimalPart.padEnd(6, "0");
        return `${integerPart}${paddedDecimal}`;
    };

    // 选择代币的按钮组件
    const TokenSelector = ({
        selectedToken,
        setSelectedToken,
        tokenList,
    }: {
        selectedToken: { name: string; symbol: string; uri: string; metadata: string };
        setSelectedToken: (token: { name: string; symbol: string; uri: string; metadata: string; pairTokenMetadata: string }) => void;
        tokenList: { name: string; symbol: string; uri: string; metadata: string; pairTokenMetadata: string }[];
    }) => {
        const [isModalVisible, setIsModalVisible] = useState(false);

        const showModal = () => {
            setIsModalVisible(true);
        };

        const handleCancel = () => {
            setIsModalVisible(false);
        };

        const handleSelectToken = (token: { name: string; symbol: string; uri: string; metadata: string; pairTokenMetadata: string; }) => {
            setSelectedToken(token);
            setIsModalVisible(false);
        };

        return (
            <div className='token-selector-div'>
                <Button className='token-selector-button' type="primary" onClick={showModal} disabled={fetchingTokenList}>
                    {fetchingTokenList === false ? (
                        <>
                            {selectedToken.metadata !== '' ?
                                <img className='token-selector-button-token-img' src={selectedToken.uri} alt={selectedToken.symbol} /> :
                                ''
                            }
                            {selectedToken.metadata !== '' ?
                                <span className='token-selector-button-token-text'>{selectedToken.symbol}</span> :
                                <span>{t('select_token')}</span>
                            }
                        </>
                    ) : (
                        t('loading')
                    )}
                </Button>

                <Modal title={t('select_token')} open={isModalVisible} onCancel={handleCancel} footer={null}>
                    <List
                        dataSource={tokenList}
                        renderItem={token => (
                            <List.Item onClick={() => handleSelectToken(token)}>
                                <div className="token-selector-modal-row">
                                    <div className="token-selector-modal-image-column">
                                        <img className="token-selector-modal-token-img" src={token.uri} alt={token.symbol} />
                                    </div>
                                    <div className="token-selector-modal-info-column">
                                        <span className="token-selector-modal-token-name-symbol">{token.name} ({token.symbol})</span>
                                        <span className="token-selector-modal-token-metadata">{token.metadata}</span>
                                    </div>
                                </div>
                            </List.Item>
                        )}
                    />
                </Modal>
            </div>
        );
    };

    // 创建流动性池组件
    const CreatePool = () => {
        const token1Ref = useRef<HTMLInputElement>(null);
        const token2Ref = useRef<HTMLInputElement>(null);

        const handleCreatePool = async () => {
            const token1 = token1Ref.current ? token1Ref.current.value : "";
            const token2 = token2Ref.current ? token2Ref.current.value : "";

            const transactionCreatePool: InputTransactionData = {
                data: {
                    function: `${moduleAddress}::router::create_pool`,
                    functionArguments: [token1, token2, false]
                }
            };

            try {
                const responseCreatePool = await signAndSubmitTransaction(transactionCreatePool);
                await aptos.waitForTransaction({ transactionHash: responseCreatePool.hash });
                refreshTokenList();
                message.success({
                    content: (
                        <div>
                            {t('transaction_success')}
                            <br />
                            <a href={`https://explorer.aptoslabs.com/txn/${responseCreatePool.hash}?network=testnet`} target="_blank" rel="noopener noreferrer">
                                {t('view_on_explorer')}
                            </a>
                        </div>
                    ),
                    style: {
                        marginTop: '90vh',
                        marginLeft: '90%',
                    },
                    duration: 4,
                });
            } catch (error) {
                message.error({
                    content: t('transaction_failed'),
                    style: {
                        marginTop: '90vh',
                        marginLeft: '90%',
                    },
                    duration: 2,
                });
                console.log("error", error);
            }

            if (token1Ref.current) token1Ref.current.value = "";
            if (token2Ref.current) token2Ref.current.value = "";
        };

        return (
            <>
                <div className='box'>
                    <span className='box-span'>{t('token1')}</span>
                    <div className='box-row'>
                        <input
                            className='box-address-input'
                            ref={token1Ref}
                            placeholder='Object<Metadata>'
                        />
                    </div>
                </div>

                <div className='box'>
                    <span className='box-span'>{t('token2')}</span>
                    <div className='box-row'>
                        <input
                            className='box-address-input'
                            ref={token2Ref}
                            placeholder='Object<Metadata>'
                        />
                    </div>
                </div>

                {account === null ? (
                    <Row justify={'center'}>
                        <div className='wallet-button-div'>
                            <WalletSelector />
                        </div>
                    </Row>
                ) : (
                    <Row justify={'center'}>
                        <div className='submit-button-div'>
                            <Button className='submit-button' onClick={handleCreatePool}>
                                {t('create_pool')}
                            </Button>
                        </div>
                    </Row>
                )}
            </>
        );
    };

    // 添加流动性组件
    const AddLiquidity = () => {
        const [displayToken1Amount, setDisplayToken1Amount] = useState("");
        const [displayToken2Amount, setDisplayToken2Amount] = useState("");

        const token1AmountRef = useRef<HTMLInputElement>(null);
        const token2AmountRef = useRef<HTMLInputElement>(null);

        const handleTokenInput = (e: React.ChangeEvent<HTMLInputElement>, setDisplayAmount: (value: string) => void) => {
            const value = e.target.value;
            if (/^\d*\.?\d{0,6}$/.test(value)) {
                setDisplayAmount(value);
            }
        };

        const handleAddLiquidity = async () => {
            const token1Amount = token1AmountRef.current ? token1AmountRef.current.value : "";
            const token2Amount = token2AmountRef.current ? token2AmountRef.current.value : "";

            const formattedToken1Amount = formatTokenAmount(token1Amount);
            const formattedToken2Amount = formatTokenAmount(token2Amount);

            const transactionAddLiquidity: InputTransactionData = {
                data: {
                    function: `${moduleAddress}::router::add_liquidity_entry`,
                    functionArguments: [selectedToken1.metadata, selectedToken2.metadata, false, formattedToken1Amount, formattedToken2Amount, 1, 1]
                }
            };

            try {
                const responseAddLiquidity = await signAndSubmitTransaction(transactionAddLiquidity);
                await aptos.waitForTransaction({ transactionHash: responseAddLiquidity.hash });

                getLpTokenBalance();
                refreshTokenList();
                message.success({
                    content: (
                        <div>
                            {t('transaction_success')}
                            <br />
                            <a href={`https://explorer.aptoslabs.com/txn/${responseAddLiquidity.hash}?network=testnet`} target="_blank" rel="noopener noreferrer">
                                {t('view_on_explorer')}
                            </a>
                        </div>
                    ),
                    style: {
                        marginTop: '90vh',
                        marginLeft: '90%',
                    },
                    duration: 4,
                });
            } catch (error) {
                message.error({
                    content: t('transaction_failed'),
                    style: {
                        marginTop: '90vh',
                        marginLeft: '90%',
                    },
                    duration: 2,
                });
                console.log("error", error);
            }

            setDisplayToken1Amount("");
            setDisplayToken2Amount("");
        };

        return (
            <>
                <div className='box'>
                    <span className='box-span'>{t('token1')}</span>
                    <br />
                    <div className='box-row'>
                        <input
                            className='box-input'
                            ref={token1AmountRef}
                            value={displayToken1Amount}
                            onChange={(e) => handleTokenInput(e, setDisplayToken1Amount)}
                            placeholder='0'
                        />
                        <TokenSelector
                            selectedToken={selectedToken1}
                            setSelectedToken={setSelectedToken1}
                            tokenList={filteredTokenListForToken1}
                        />
                    </div>

                </div>

                <div className='box'>
                    <span className='box-span'>{t('token2')}</span>
                    <br />
                    <div className='box-row'>
                        <input
                            className='box-input'
                            ref={token2AmountRef}
                            value={displayToken2Amount}
                            onChange={(e) => handleTokenInput(e, setDisplayToken2Amount)}
                            placeholder='0'
                        />
                        <TokenSelector
                            selectedToken={selectedToken2}
                            setSelectedToken={setSelectedToken2}
                            tokenList={filteredTokenListForToken2}
                        />
                    </div>

                </div>

                {account === null ? (
                    <Row justify={'center'}>
                        <div className='wallet-button-div'>
                            <WalletSelector />
                        </div>
                    </Row>
                ) : (
                    <Row justify={'center'}>
                        <div className='submit-button-div'>
                            <Button className='submit-button' onClick={handleAddLiquidity}>
                                {t('add_liquidity')}
                            </Button>
                        </div>
                    </Row>
                )}
            </>
        );
    };

    // 移除流动性组件
    const RemoveLiquidity = () => {
        const [displayLpTokenAmount, setDisplayLpTokenAmount] = useState("");

        const lpTokenAmountRef = useRef<HTMLInputElement>(null);

        const handleTokenInput = (e: React.ChangeEvent<HTMLInputElement>, setDisplayAmount: (value: string) => void) => {
            const value = e.target.value;
            if (/^\d*\.?\d{0,6}$/.test(value)) {
                setDisplayAmount(value);
            }
        };

        const handleRemoveLiquidity = async () => {
            const lpTokenAmount = lpTokenAmountRef.current ? lpTokenAmountRef.current.value : "";
            const formattedLpTokenAmount = formatTokenAmount(lpTokenAmount);

            const transactionRemoveLiquidity: InputTransactionData = {
                data: {
                    function: `${moduleAddress}::router::remove_liquidity_entry`,
                    functionArguments: [selectedToken1.metadata, selectedToken2.metadata, false, formattedLpTokenAmount, 1, 1, account?.address]
                }
            };

            try {
                const responseRemoveLiquidity = await signAndSubmitTransaction(transactionRemoveLiquidity);
                await aptos.waitForTransaction({ transactionHash: responseRemoveLiquidity.hash });

                getLpTokenBalance();
                refreshTokenList();
                message.success({
                    content: (
                        <div>
                            {t('transaction_success')}
                            <br />
                            <a href={`https://explorer.aptoslabs.com/txn/${responseRemoveLiquidity.hash}?network=testnet`} target="_blank" rel="noopener noreferrer">
                                {t('view_on_explorer')}
                            </a>
                        </div>
                    ),
                    style: {
                        marginTop: '90vh',
                        marginLeft: '90%',
                    },
                    duration: 4,
                });
            } catch (error) {
                message.error({
                    content: t('transaction_failed'),
                    style: {
                        marginTop: '90vh',
                        marginLeft: '90%',
                    },
                    duration: 2,
                });
                console.log("error", error);
            }

            setDisplayLpTokenAmount("");
        };

        return (
            <>
                <div className='box'>
                    <span className='box-span'>LP {t('token')}</span>
                    <div className='box-row'>
                        <input
                            className='box-input'
                            ref={lpTokenAmountRef}
                            value={displayLpTokenAmount}
                            onChange={(e) => handleTokenInput(e, setDisplayLpTokenAmount)}
                            placeholder='0'
                        />
                        <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
                            <TokenSelector
                                selectedToken={selectedToken1}
                                setSelectedToken={setSelectedToken1}
                                tokenList={filteredTokenListForToken1}
                            />
                            <TokenSelector
                                selectedToken={selectedToken2}
                                setSelectedToken={setSelectedToken2}
                                tokenList={filteredTokenListForToken2}
                            />
                        </div>
                    </div>
                    <span className='box-span-lp-token-balance'>
                        {t('lp_token_balance')} : {lpTokenBalance ? (parseFloat(lpTokenBalance) / 1_000_000).toString() : "0"}
                    </span>
                </div>

                {account === null ? (
                    <Row justify={'center'}>
                        <div className='wallet-button-div'>
                            <WalletSelector />
                        </div>
                    </Row>
                ) : (
                    <Row justify={'center'}>
                        <div className='submit-button-div'>
                            <Button className='submit-button' onClick={handleRemoveLiquidity}>
                                {t('remove_liquidity')}
                            </Button>
                        </div>
                    </Row>
                )}
            </>
        );
    };

    // 渲染当前选择的功能
    const renderFeature = () => {
        switch (activeFeature) {
            case 'create':
                return <CreatePool />;
            case 'add':
                return <AddLiquidity />;
            case 'remove':
                return <RemoveLiquidity />;
            default:
                return <CreatePool />;
        }
    };

    return (
        <div className="page-container">
            <Row justify="center">

                <Col span={20}>
                    <div className="page-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h2 style={{ color: '#72a1ff', textAlign: 'center', marginBottom: '30px' }}>
                            {t('liquidity_pool_management')}
                        </h2>
                        <div style={{ width: '100%', maxWidth: 420 }}>
                            <Row justify="center" style={{ marginBottom: '20px' }}>
                                <Col>
                                    <Button
                                        type={activeFeature === 'create' ? 'primary' : 'default'}
                                        onClick={() => setActiveFeature('create')}
                                        style={{ marginRight: '10px' }}
                                    >
                                        {t('create_pool')}
                                    </Button>
                                    <Button
                                        type={activeFeature === 'add' ? 'primary' : 'default'}
                                        onClick={() => setActiveFeature('add')}
                                        style={{ marginRight: '10px' }}
                                    >
                                        {t('add_liquidity')}
                                    </Button>
                                    <Button
                                        type={activeFeature === 'remove' ? 'primary' : 'default'}
                                        onClick={() => setActiveFeature('remove')}
                                    >
                                        {t('remove_liquidity')}
                                    </Button>
                                </Col>
                            </Row>
                            <div>
                                {renderFeature()}
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );
}

export default LiquidityPool;