import { useLanguage } from '../context/LanguageContext';
import { Row, Col, Button, List, message, Modal } from 'antd';
import { useState, useEffect } from 'react';
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import { Token, defaultToken } from '../types/type';
import { useTokenContext } from '../context/TokenContext';
import './css/Pages.css';

function Query() {
    const { t } = useLanguage();
    const { account } = useWallet();
    const [activeFeature, setActiveFeature] = useState('nft'); // 'nft', 'pool'
    
    // 使用共享的TokenContext
    const { 
        filteredTokenListForToken1, 
        fetchingTokenList,
        getFilteredTokenListForToken2
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
    const [lpNftMintTime, setLpNftMintTime] = useState('');
    const [lpNftFees, setLpNftFees] = useState('');
    const [lpNftPercentage, setLpNftPercentage] = useState('');
    const [poolInfo, setPoolInfo] = useState<any>(null);

    // 在选择 token1 时重置 token2
    useEffect(() => {
        setSelectedToken2({
            name: 'Select token',
            symbol: '',
            uri: '',
            metadata: '',
            pairTokenMetadata: '',
        });
        setPoolInfo(null);
        setLpNftUri('');
    }, [selectedToken1]);

    // 过滤出符合 token1 的 pairTokenMetadata 的 token2 列表
    const filteredTokenListForToken2 = getFilteredTokenListForToken2(selectedToken1.metadata);

    // 获取NFT信息
    const getLpNftInfo = async () => {
        try {
            const returnGetLpNftInfo = await aptos.view({
                payload: {
                    function: `${moduleAddress}::liquidity_pool::get_nft_info`,
                    typeArguments: [],
                    functionArguments: [account?.address?.toString(), selectedToken1.metadata, selectedToken2.metadata, false],
                },
            });
            setLpNftUri(`${returnGetLpNftInfo[0]}`);
            setLpNftMintTime(`${returnGetLpNftInfo[1]}`);
            setLpNftFees(`${returnGetLpNftInfo[2]}`);
            setLpNftPercentage(`${returnGetLpNftInfo[3]}`);
                        
            message.success({
                content: t('query_success'),
                style: {
                    marginTop: '90vh',
                    marginLeft: '90%',
                },
                duration: 2,
            });
        } catch (error) {
            console.log(error);
            message.error({
                content: t('query_failed'),
                style: {
                    marginTop: '90vh',
                    marginLeft: '90%',
                },
                duration: 2,
            });
        }
    };

    // 获取流动性池信息
    const getPoolInfo = async () => {
        try {
            const returnGetPoolInfo = await aptos.view({
                payload: {
                    function: `${moduleAddress}::liquidity_pool::get_pool_info`,
                    typeArguments: [],
                    functionArguments: [selectedToken1.metadata, selectedToken2.metadata, false],
                },
            });
            
            // 更新池子信息状态
            setPoolInfo({
                token1Reserve: returnGetPoolInfo[0],
                token2Reserve: returnGetPoolInfo[1],
                swap_fee_bps: returnGetPoolInfo[2],
                nft_total_supply: returnGetPoolInfo[3],
                is_stable: returnGetPoolInfo[4],
            });
            
            message.success({
                content: t('query_success'),
                style: {
                    marginTop: '90vh',
                    marginLeft: '90%',
                },
                duration: 2,
            });
        } catch (error) {
            console.log(error);
            message.error({
                content: t('query_failed'),
                style: {
                    marginTop: '90vh',
                    marginLeft: '90%',
                },
                duration: 2,
            });
        }
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

                <Modal 
                    title={t('select_token')} 
                    open={isModalVisible} 
                    onCancel={handleCancel} 
                    footer={null}
                >
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

    // 工具函数：格式化秒为年月日时分秒
    function formatDuration(seconds: number) {
        const years = Math.floor(seconds / (365 * 24 * 3600));
        seconds %= 365 * 24 * 3600;
        const months = Math.floor(seconds / (30 * 24 * 3600));
        seconds %= 30 * 24 * 3600;
        const days = Math.floor(seconds / (24 * 3600));
        seconds %= 24 * 3600;
        const hours = Math.floor(seconds / 3600);
        seconds %= 3600;
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        let str = '';
        if (years) str += years + '年';
        if (months) str += months + '月';
        if (days) str += days + '天';
        if (hours) str += hours + '时';
        if (minutes) str += minutes + '分';
        str += seconds + '秒';
        return str;
    }

    // NFT查询组件
    const NftQuery = () => {
        const handleQuery = () => {
            if (selectedToken1.metadata === '' || selectedToken2.metadata === '') {
                message.error({
                    content: t('please_select_token'),
                    style: {
                        marginTop: '90vh',
                        marginLeft: '90%',
                    },
                    duration: 2,
                });
                return;
            }
            
            if (account === null) {
                message.error({
                    content: t('please_connect_wallet'),
                    style: {
                        marginTop: '90vh',
                        marginLeft: '90%',
                    },
                    duration: 2,
                });
                return;
            }
            
            getLpNftInfo();
        };

        return (
            <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ marginBottom: '10px',  marginTop: '10px', display: 'flex' }}>
                        <span style={{ marginRight: '10px', width: '60px' }}>{t('token1')}:</span>
                        <TokenSelector
                            selectedToken={selectedToken1}
                            setSelectedToken={setSelectedToken1}
                            tokenList={filteredTokenListForToken1}
                        />
                    </div>
                    <div style={{ display: 'flex', marginTop: '10px' }}>
                        <span style={{ marginRight: '10px', width: '60px' }}>{t('token2')}:</span>
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
                            <Button className='submit-button' onClick={handleQuery}>
                                {t('query_nft')}
                            </Button>
                        </div>
                    </Row>
                )}

                {lpNftUri && (
                    <div className='nft-display' style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <img src={lpNftUri} alt="LP NFT" style={{ maxWidth: '100%', maxHeight: '300px', display: 'block' }} />
                        <div className='nft-info' style={{ alignSelf: 'flex-start', width: '100%' }}>
                            <p><strong>{t('token1')}:</strong> {selectedToken1.name} ({selectedToken1.symbol})</p>
                            <p><strong>{t('token2')}:</strong> {selectedToken2.name} ({selectedToken2.symbol})</p>
                            <p><strong>{t('owner')}:</strong> {account?.address?.toString()}</p>
                            <p><strong>{t('nft_mint_time')}:</strong> {lpNftMintTime}</p>
                            <p><strong>已持有时间:</strong> {lpNftMintTime ? formatDuration(Math.floor(Date.now() / 1000) - Number(lpNftMintTime)) : ''}</p>
                            <p><strong>{t('nft_fees')}:</strong> {lpNftFees}</p>
                            <p><strong>{t('nft_percentage')}:</strong> {lpNftPercentage}</p>
                        </div>
                    </div>
                )}
            </>
        );
    };

    // 流动性池查询组件
    const PoolQuery = () => {
        const handleQuery = () => {
            if (selectedToken1.metadata === '' || selectedToken2.metadata === '') {
                message.error({
                    content: t('please_select_token'),
                style: {
                    marginTop: '90vh',
                    marginLeft: '90%',
                },
                    duration: 2,
                });
                return;
            }
            
            getPoolInfo();
        };

        return (
            <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ marginBottom: '10px',  marginTop: '10px', display: 'flex' }}>
                        <span style={{ marginRight: '10px', width: '60px' }}>{t('token1')}:</span>
                        <TokenSelector
                            selectedToken={selectedToken1}
                            setSelectedToken={setSelectedToken1}
                            tokenList={filteredTokenListForToken1}
                        />
                    </div>
                    <div style={{ display: 'flex', marginTop: '10px' }}>
                        <span style={{ marginRight: '10px', width: '60px' }}>{t('token2')}:</span>
                        <TokenSelector
                            selectedToken={selectedToken2}
                            setSelectedToken={setSelectedToken2}
                            tokenList={filteredTokenListForToken2}
                        />
                    </div>
                </div>

                <Row justify={'center'}>
                    <div className='submit-button-div'>
                        <Button className='submit-button' onClick={handleQuery}>
                            {t('query_pool')}
                        </Button>
                    </div>
                </Row>

                {poolInfo && (
                    <div className='pool-info'>
                        <div className='info-list'>
                            <p><strong>{selectedToken1.symbol} {t('reserve')}:</strong> {(parseFloat(poolInfo.token1Reserve) / 1_000_000).toFixed(6)}</p>
                            <p><strong>{selectedToken2.symbol} {t('reserve')}:</strong> {(parseFloat(poolInfo.token2Reserve) / 1_000_000).toFixed(6)}</p>
                            <p><strong>{t('swap_fee_bps')}:</strong> {(parseFloat(poolInfo.swap_fee_bps) / 100).toFixed(2)}%</p>
                            <p><strong>{t('nft_total_supply')}:</strong> {poolInfo.nft_total_supply}</p>
                            <p><strong>{t('is_stable')}:</strong> {'false'}</p>
                        </div>
                    </div>
                )}
            </>
        );
    };

    // 渲染当前选择的功能
    const renderFeature = () => {
        switch (activeFeature) {
            case 'nft':
                return <NftQuery />;
            case 'pool':
                return <PoolQuery />;
            default:
                return <NftQuery />;
        }
    };

    return (
        <div className="page-container">
            <Row justify="center">
                <Col span={20}>
                    <div className="page-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h2 style={{ color: '#72a1ff', textAlign: 'center', marginBottom: '30px' }}>
                            {t('query_management')}
                        </h2>
                        <div style={{ width: '100%', maxWidth: 420 }}>
                            <Row justify="center" style={{ marginBottom: '20px' }}>
                                <Col>
                                    <Button
                                        type={activeFeature === 'nft' ? 'primary' : 'default'}
                                        onClick={() => setActiveFeature('nft')}
                                        style={{ marginRight: '10px' }}
                                    >
                                        {t('nft_query')}
                                    </Button>
                                    <Button
                                        type={activeFeature === 'pool' ? 'primary' : 'default'}
                                        onClick={() => setActiveFeature('pool')}
                                    >
                                        {t('pool_query')}
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

export default Query;