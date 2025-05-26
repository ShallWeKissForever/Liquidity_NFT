import './css/Body.css';
import { useState, useEffect, useRef } from 'react';
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { Col, Row, Button, Modal, List, message } from 'antd';
import { useWallet, InputTransactionData } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import { Pool, Token, defaultToken } from './types/type.ts';
import { useLanguage } from './context/LanguageContext';

export default function SwapFeature() {
  //中英文切换
  const { t } = useLanguage();

  //合约发布的账户地址
  const moduleAddress = "0x8e3f47d8f639212ee51a4131ecf1ee28a74e11223904241e682fd94806b4a1cb";

  //设置 Aptos 与 testnet 网络交互
  const aptosConfig = new AptosConfig({ network: Network.TESTNET });

  //初始化一个 Aptos 实例
  const aptos = new Aptos(aptosConfig);

  //account 对象是 null 如果没有连接帐户;连接帐户时， account 对象将保存帐户信息，包括帐户地址。
  const { account, signAndSubmitTransaction } = useWallet();

  //储存pool的数组
  const [pools, setPools] = useState<Pool[]>([]);

  //用于TokenSelector的储存token的list
  const [tokenList, setTokenList] = useState<Token[]>([]);

  //用于filter后的TokenSelector的储存token1的去重的list
  const [filteredTokenListForToken1, setFilteredTokenListForToken1] = useState<Token[]>([]);

  //在tokenSelector1中被选中的token
  const [selectedToken1, setSelectedToken1] = useState<Token>(defaultToken);

  //在tokenSelector2中被选中的token
  const [selectedToken2, setSelectedToken2] = useState<Token>(defaultToken);

  //保存正在拉取token列表的状态
  const [fetchingTokenList, setFetchingTokenList] = useState(false)

  // 在组件挂载时执行 getTokenList
  useEffect(() => {
    getTokenList();
  }, []);

  // 使用 useEffect 在 pools 更新时更新 tokenList
  useEffect(() => {
    // 使用 Set 来跟踪已出现的 metadata，避免重复
    const seenMetadata = new Set();

    const tokenList = pools.flatMap((pool) => [
      {
        name: pool.token_name_1,         // 用 token_name_1 作为 name
        symbol: pool.token_symbol_1,     // 用 token_symbol_1 作为 symbol
        uri: pool.token_uri_1,           // 用 token_uri_1 作为 uri
        metadata: pool.token_metadata_1, // 用 token_metadata_1 作为 metadata
        pairTokenMetadata: pool.token_metadata_2 // 用 token_metadata_2 作为 pairTokenMetadata
      },
      {
        name: pool.token_name_2,         // 用 token_name_2 作为 name
        symbol: pool.token_symbol_2,     // 用 token_symbol_2 作为 symbol
        uri: pool.token_uri_2,           // 用 token_uri_2 作为 uri
        metadata: pool.token_metadata_2, // 用 token_metadata_2 作为 metadata
        pairTokenMetadata: pool.token_metadata_1 // 用 token_metadata_1 作为 pairTokenMetadata
      },
    ]);
    //去掉重复token的 token1 列表
    const filteredTokenListForToken1 = tokenList.filter((token) => {
      // 只在 metadata 没有被见过的情况下保留这个币
      if (!seenMetadata.has(token.metadata)) {
        seenMetadata.add(token.metadata);
        return true;
      }
      return false;
    });
    setTokenList(tokenList);
    setFilteredTokenListForToken1(filteredTokenListForToken1);
  }, [pools]); // 当 pools 更新时，更新 tokenList

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
  const filteredTokenListForToken2 = tokenList.filter(
    (token) => token.pairTokenMetadata === selectedToken1.metadata
  );



  // 从链上获取币对
  const getTokenList = async () => {
    setFetchingTokenList(true);
    try {
      const returnGetPools: Array<Array<{ inner: string }>> = await aptos.view({
        payload: {
          function: `${moduleAddress}::liquidity_pool::all_pools`,
          typeArguments: [],
          functionArguments: [],
        },
      });

      // 提取每个对象中的 inner 字段
      const metadataStrings = returnGetPools.flatMap(poolArray =>
        poolArray.map(pool => pool.inner)
      );

      // 在这里定义一个临时数组
      const tempPools = [];

      for (const address of metadataStrings) {
        const returnGetPoolResource = await aptos.getAccountResource({
          accountAddress: address,
          resourceType: `${moduleAddress}::liquidity_pool::LiquidityPool`
        });

        const token1 = (returnGetPoolResource as any).token_1.inner;
        const token2 = (returnGetPoolResource as any).token_2.inner;

        // 依次获取 token 的名称、符号和 URI
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

        // 将新池添加到临时数组中
        tempPools.push(newPool);
      }

      // 在所有池处理完后一次性更新状态
      setPools(tempPools);
      // 日志输出
      console.log('pools:', tempPools);
      const tokenList = tempPools.flatMap((pool) => [
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
      console.log('tokenList:', tokenList);

    } catch (error) {
      console.log(error);
    }
    setFetchingTokenList(false);
  };

  //选择代币的按钮
  const TokenSelector = ({
    selectedToken,
    setSelectedToken,
    tokenList,
  }: {
    selectedToken: { name: string; symbol: string; uri: string; metadata: string };
    setSelectedToken: (token: { name: string; symbol: string; uri: string; metadata: string; pairTokenMetadata: string }) => void;
    tokenList: { name: string; symbol: string; uri: string; metadata: string; pairTokenMetadata: string }[];
  }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);  // 控制弹窗的显示状态

    // 显示弹窗
    const showModal = () => {
      setIsModalVisible(true);
    };

    // 隐藏弹窗
    const handleCancel = () => {
      setIsModalVisible(false);
    };

    // Select token
    const handleSelectToken = (token: { name: string; symbol: string; uri: string; metadata: string; pairTokenMetadata: string; }) => {
      setSelectedToken(token);  // 选择的币对传回上层
      setIsModalVisible(false);  // 选择后关闭弹窗
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

        {/* 弹窗显示币对选择 */}
        <Modal title={t('select_token')} open={isModalVisible} onCancel={handleCancel} footer={null}>
          <List
            dataSource={tokenList}
            locale={{ emptyText: t('no_tokens_available') || '暂无可选代币' }}
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

  // "兑换"功能组件
  const Swap = () => {
    const [sellTokenAmount, setSellTokenAmount] = useState("");
    const [displaySellTokenAmount, setDisplaySellTokenAmount] = useState(""); // 用于保存用户看到的值
    const [buyTokenAmount, setBuyTokenAmount] = useState("");

    const amountCache = useRef<{ [key: string]: string }>({});

    const handleSellTokenChange = (value: string) => {
      // 只允许数字和一个小数点的输入，最多6位小数
      const formattedValue = value
        .replace(/[^0-9.]/g, '')  // 移除非数字和小数点的字符
        .replace(/(\..*)\./g, '$1');  // 防止用户输入多个小数点

      const [integerPart, decimalPart] = formattedValue.split('.');
      if (decimalPart && decimalPart.length > 6) {
        // 限制小数点后最多6位
        setDisplaySellTokenAmount(`${integerPart}.${decimalPart.substring(0, 6)}`);
      } else {
        setDisplaySellTokenAmount(formattedValue);
      }

      setSellTokenAmount(formattedValue); // 保存用户输入的原始值
    };

    // 将用户输入的值乘以 1000000
    const convertToInternalValue = (amount: string) => {
      const numericValue = parseFloat(amount);
      if (!isNaN(numericValue)) {
        // 将用户的输入乘以 1,000,000
        return numericValue * 1_000_000;
      }
      return amount;
    };

    const calculateAndSetBuyTokenAmount = async () => {
      if (!sellTokenAmount || !selectedToken1 || !selectedToken2) return;

      // 根据sellTokenAmount和选择的币种生成唯一的缓存键
      const cacheKey = `${sellTokenAmount}-${selectedToken1.metadata}-${selectedToken2.metadata}`;

      if (amountCache.current[cacheKey]) {
        // 如果有缓存金额，则直接使用缓存
        setBuyTokenAmount((parseFloat(amountCache.current[cacheKey]) / 1_000_000).toString()); // 除以1000000
        return;
      }

      try {
        // 调用合约函数，计算买到的 token 数量
        const returnGetAmount = await aptos.view({
          payload: {
            function: `${moduleAddress}::router::get_amount_out`,
            typeArguments: [],
            functionArguments: [
              (parseFloat(sellTokenAmount) * 1_000_000).toString(), // 在传递时乘以1000000
              selectedToken1.metadata,
              selectedToken2.metadata,
            ],
          },
        });

        const amountOut = `${returnGetAmount[0]}`;

        // 将结果缓存
        amountCache.current[cacheKey] = amountOut;

        // 将得到的结果除以1000000后再设置buyTokenAmount
        setBuyTokenAmount((parseFloat(amountOut) / 1_000_000).toString());
      } catch (error) {
        console.log(error);
      }
    };

    useEffect(() => {
      if (sellTokenAmount === "") {
        setBuyTokenAmount("");
      } else {
        setBuyTokenAmount("0");
        calculateAndSetBuyTokenAmount();
      }
    }, [sellTokenAmount, selectedToken1, selectedToken2]);

    const handleSwap = async () => {
      const transactionSwap: InputTransactionData = {
        data: {
          function: `${moduleAddress}::router::swap_entry`,
          functionArguments: [
            convertToInternalValue(sellTokenAmount).toString(),  // 在逻辑中使用转换后的值
            1,
            selectedToken1.metadata,
            selectedToken2.metadata,
            false,
            account?.address,
          ],
        },
      };

      try {
        const responseSwap = await signAndSubmitTransaction(transactionSwap);
        await aptos.waitForTransaction({ transactionHash: responseSwap.hash });
        message.success({
          content: (
            <div>
              {t('transaction_success')}
              <br />
              <a href={`https://explorer.aptoslabs.com/txn/${responseSwap.hash}?network=testnet`} target="_blank" rel="noopener noreferrer">
                {t('view_on_explorer')}
              </a>
            </div>
          ),
          style: {
            marginTop: '90vh',
            marginLeft: '90%',
        },
          duration: 4, // 显示时间，让用户有足够时间点击链接
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
        console.log(error);
      }
    };

    return (
      <>
        <div className="box">
          <span className="box-span">{t('sell')}</span>
          <div className="box-row">
            <input
              className="box-input"
              value={displaySellTokenAmount}  // 显示用户输入的值
              onChange={(e) => handleSellTokenChange(e.target.value)}
              placeholder="0"
            />
            <TokenSelector
              selectedToken={selectedToken1}
              setSelectedToken={setSelectedToken1}
              tokenList={filteredTokenListForToken1}
            />
          </div>
        </div>

        <div className="box">
          <span className="box-span">{t('buy')}</span>
          <div className="box-row">
            <input
              className="box-input display-buy-token-amount"
              value={buyTokenAmount}
              placeholder="0"
              readOnly
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
              <Button className="submit-button" onClick={handleSwap}>
                {t('swap')}
              </Button>
            </div>
          </Row>
        )}
      </>
    );
  };

  return (
    <div className="page-container">
      <Row justify="center">
        <Col span={20}>
          <div className="page-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ color: '#72a1ff', textAlign: 'center', marginBottom: '30px' }}>
              {t('swap')}
            </h2>
            <div style={{ width: '100%', maxWidth: 420 }}>
              <Swap />
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}