import './css/Body.css';
import { useState, useEffect, useRef } from 'react';
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import {  Col, Row, Button, Modal, List } from 'antd';
import { useWallet, InputTransactionData } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';

export default function SwapFeature() {

  //合约发布的账户地址
  const moduleAddress = "0x3a689c0f3956a4b847d9778fb227490a62c2e5c34e6fc31972c3811434336df2";
  //mint测试币地址
  const mintFaAddress = "0x71dfdf10572f2d5ba5a66ccbf6e7a785d201fdb4bda312a870deeec3d8fd2f96";

  //设置 Aptos 与 testnet 网络交互
  const aptosConfig = new AptosConfig({ network: Network.TESTNET });
  //初始化一个 Aptos 实例
  const aptos = new Aptos(aptosConfig);
  //account 对象是 null 如果没有连接帐户;连接帐户时， account 对象将保存帐户信息，包括帐户地址。
  const { account, signAndSubmitTransaction } = useWallet();

  //Pool的结构体
  type Pool = {
    token_name_1:string,
    token_name_2:string,
    token_symbol_1:string,
    token_symbol_2:string,
    token_uri_1:string,
    token_uri_2:string,
    token_metadata_1: string,
    token_metadata_2: string,
  };

  //储存pool的数组
  const [pools, setPools] = useState<Pool[]>([]);

  //用于CoinSelector的储存token的list
  const [coinList, setCoinList] = useState<Array<{ 
    name: string; 
    symbol: string; 
    uri: string; 
    metadata: string; 
    pairTokenMetadata:string 
  }>>([]);

  //用于filter后的CoinSelector的储存token1的去重的list
  const [filteredCoinListForToken1, setFilteredCoinListForToken1] = useState<Array<{ 
    name: string; 
    symbol: string; 
    uri: string; 
    metadata: string; 
    pairTokenMetadata:string 
  }>>([]);

  //在coinSelector1中被选中的token
  const [selectedCoin1, setSelectedCoin1] = useState<{ 
    name: string; 
    symbol: string; 
    uri: string; 
    metadata: string; 
    pairTokenMetadata:string 
  }>({
    name: "Select token",
    symbol: "", 
    uri: "", 
    metadata: "", 
    pairTokenMetadata:"" ,
  })

  //在coinSelector2中被选中的token
  const [selectedCoin2, setSelectedCoin2] = useState<{ 
    name: string; 
    symbol: string; 
    uri: string; 
    metadata: string; 
    pairTokenMetadata:string 
  }>({
    name: "Select token",
    symbol: "", 
    uri: "", 
    metadata: "", 
    pairTokenMetadata:"" ,
  })

  //保存当前选择币对的NFT的Uri
  const [lpNftUri, setLpNftUri] = useState('');

  //保存当前选择币对的LP Token的余额
  const [lpTokenBalance, setLpTokenBalance] = useState('');

  // 定义状态来保存当前选择的功能
  const [activeFeature, setActiveFeature] = useState('swap');
  
  // 在组件挂载时执行 getCoinList
  useEffect(() => {
    getCoinList();
  }, []); // 空依赖数组表示只在组件挂载时执行一次

  // 在selectedCoin2有值并连接了钱包时更新
  useEffect(() => {
    if (selectedCoin2.uri !== '' && account !== null) {
      getLpNftUri();
    } else {
      setLpNftUri('');
    }
  }, [selectedCoin2, account?.address]); //当selectedCoin2变化和连接&断开钱包时更新

  // 在selectedCoin2有值并连接了钱包时更新
  useEffect(() => {
    if (selectedCoin2.uri !== '' && account !== null) {
      getLpTokenBalance();
    } else {
      setLpTokenBalance('');
    }
  }, [selectedCoin2, account?.address]); //当selectedCoin2变化和连接&断开钱包时更新

  // 使用 useEffect 在 pools 更新时更新 coinList
  useEffect(() => {

    // 使用 Set 来跟踪已出现的 metadata，避免重复
    const seenMetadata = new Set();

    const coinList = pools.flatMap((pool) => [
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
    const filteredCoinListForToken1 = coinList.filter((coin) => {
      // 只在 metadata 没有被见过的情况下保留这个币
      if (!seenMetadata.has(coin.metadata)) {
        seenMetadata.add(coin.metadata);
        return true;
      }
      return false;
    });
    setCoinList(coinList);
    setFilteredCoinListForToken1(filteredCoinListForToken1);
  }, [pools]); // 当 pools 更新时，更新 coinList

  // 当 selectedCoin1 变化时，重置 selectedCoin2
  useEffect(() => {
    setSelectedCoin2({
      name: 'Select token',
      symbol: '',
      uri: '',
      metadata: '',
      pairTokenMetadata: '',
    });
  }, [selectedCoin1]);

  // 过滤出符合 token1 的 pairTokenMetadata 的 token2 列表
  const filteredCoinListForToken2 = coinList.filter(
    (coin) => coin.pairTokenMetadata === selectedCoin1.metadata
  );

  // 从链上获取币对
  const getCoinList = async () => {
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

      console.log(metadataStrings);

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

    } catch (error) {
      console.log(error);
    }
  };

  //获取NFT Uri
  const getLpNftUri = async () => {
    try {
      const returnGetLpNftUri = await aptos.view({
        payload: {
          function: `${moduleAddress}::liquidity_pool::get_nft_uri`,
          typeArguments: [],
          functionArguments: [account?.address, selectedCoin1.metadata, selectedCoin2.metadata, false],
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
          functionArguments: [account?.address, selectedCoin1.metadata, selectedCoin2.metadata, false],
        },
      });
      setLpTokenBalance(`${returnGetLpTokenBalance[0]}`);
    } catch (error) {
      console.log(error);
    }
  }

  //选择代币的按钮
  const CoinSelector = ({
    selectedCoin,
    setSelectedCoin,
    coinList,
  }: {
    selectedCoin: { name: string; symbol: string; uri: string };
    setSelectedCoin: (coin: { name: string; symbol: string; uri: string; metadata: string; pairTokenMetadata: string }) => void;
    coinList: { name: string; symbol: string; uri: string; metadata: string; pairTokenMetadata: string }[];
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
    const handleSelectCoin = (coin: { name: string; symbol: string; uri: string; metadata: string; pairTokenMetadata: string; }) => {
      setSelectedCoin(coin);  // 选择的币对传回上层
      setIsModalVisible(false);  // 选择后关闭弹窗
    };
  
    return (
      <div className='coin-selector-div'>
        <Button className='coin-selector-button' type="primary" onClick={showModal}>
          {selectedCoin.name !== 'Select token' ? 
            <img className='coin-selector-button-token-img' src={selectedCoin.uri} alt={selectedCoin.symbol} /> : 
            ''}
          {selectedCoin.name !== 'Select token' ? `${selectedCoin.symbol}` : 'Select token'}
        </Button>

        {/* 弹窗显示币对选择 */}
        <Modal title="Select token" open={isModalVisible} onCancel={handleCancel} footer={null}>
          <List
            dataSource={coinList}
            renderItem={coin => (
              <List.Item onClick={() => handleSelectCoin(coin)}>

                <div className="coin-selector-modal-row">
                    <div className="coin-selector-modal-image-column">
                      <img className="coin-selector-modal-token-img" src={coin.uri} alt={coin.symbol} />
                    </div>
                    <div className="coin-selector-modal-info-column">
                      <span className="coin-selector-modal-token-name-symbol">{coin.name} ({coin.symbol})</span>
                      <span className="coin-selector-modal-token-metadata">{coin.metadata}</span>
                    </div>
                </div>

              </List.Item>
            )}
          />
        </Modal>
      </div>
    );
  };

  // “兑换”功能组件
  const Swap = () => {
    const [sellTokenAmount, setSellTokenAmount] = useState("");
    const [buyTokenAmount, setBuyTokenAmount] = useState("");
  
    // 用于存储之前获取的金额的缓存
    const amountCache = useRef<{ [key: string]: string }>({});
  
    const onWriteSellTokenAmount = (value: string) => {
      setSellTokenAmount(value);
    };
  
    const calculateAndSetBuyTokenAmount = async () => {
      if (!sellTokenAmount || !selectedCoin1 || !selectedCoin2) return; // 确保有数据后才调用
  
      // 根据sellTokenAmount和选择的币种生成唯一的缓存键
      const cacheKey = `${sellTokenAmount}-${selectedCoin1.metadata}-${selectedCoin2.metadata}`;
  
      if (amountCache.current[cacheKey]) {
        // 如果有缓存金额，则直接使用缓存
        setBuyTokenAmount(amountCache.current[cacheKey]);
        return;
      }
  
      try {
        const returnGetAmount = await aptos.view({
          payload: {
            function: `${moduleAddress}::router::get_amount_out`,
            typeArguments: [],
            functionArguments: [sellTokenAmount, selectedCoin1.metadata, selectedCoin2.metadata],
          },
        });
  
        const amountOut = `${returnGetAmount[0]}`;
        amountCache.current[cacheKey] = amountOut; // 缓存结果
        setBuyTokenAmount(amountOut);
      } catch (error) {
        console.log(error);
      }
    };
  
    // 监听sellTokenAmount变化并计算buyTokenAmount
    useEffect(() => {
      if (sellTokenAmount === "") {
        setBuyTokenAmount("");
      } else {
        setBuyTokenAmount("0"); // 在获取数据时设置为0
        calculateAndSetBuyTokenAmount();
      }
    }, [sellTokenAmount, selectedCoin1, selectedCoin2]); // 添加依赖项
  
    const handleSwap = async () => {
      const transactionSwap: InputTransactionData = {
        data: {
          function: `${moduleAddress}::router::swap_entry`,
          functionArguments: [
            sellTokenAmount,
            1,
            selectedCoin1.metadata,
            selectedCoin2.metadata,
            false,
            account?.address,
          ],
        },
      };
  
      try {
        const responseSwap = await signAndSubmitTransaction(transactionSwap);
        await aptos.waitForTransaction({ transactionHash: responseSwap.hash });
      } catch (error) {
        console.log(error);
      }
    };
  
    return (
      <>
        <div className="box">
          <span className="box-span">Sell</span>
          <br />
          <input
            className="box-input"
            onChange={(e) => onWriteSellTokenAmount(e.target.value)}
            placeholder="0"
          />
          <CoinSelector
            selectedCoin={selectedCoin1}
            setSelectedCoin={setSelectedCoin1}
            coinList={filteredCoinListForToken1}
          />
        </div>
  
        <div className="box">
          <span className="box-span">Buy</span>
          <br />
          <input className="box-input display-buy-token-amount" value={buyTokenAmount} placeholder="0" readOnly />
          <CoinSelector
            selectedCoin={selectedCoin2}
            setSelectedCoin={setSelectedCoin2}
            coinList={filteredCoinListForToken2}
          />
        </div>
  
        {account === null ? (
          <Row justify={"center"}>
            <WalletSelector />
            <div style={{marginBottom:'5px'}}></div>
          </Row>
        ) : (
          <Row justify={"center"}>
            <Button className="submit-button" onClick={handleSwap}>
              Swap
            </Button>
          </Row>
        )}
      </>
    );
  };
  
  

  // “创建”功能组件
  const CreatePool = () => {

    const token1Ref = useRef<HTMLInputElement>(null);  // 使用 useRef 来控制输入框
    const token2Ref = useRef<HTMLInputElement>(null);

    const handleCreatePool = async () => {

      const token1 = token1Ref.current ? token1Ref.current.value : "";  // 获取输入框的值
      const token2 = token2Ref.current ? token2Ref.current.value : "";

      const transactionCreatePool:InputTransactionData = {
        data: {
          function:`${moduleAddress}::router::create_pool`,
          functionArguments:[token1, token2, false]
        }
      };
    
      try {
    
        const responseCreatePool = await signAndSubmitTransaction(transactionCreatePool);
        await aptos.waitForTransaction({transactionHash:responseCreatePool.hash});
        
      } catch (error) {
        console.log("error",error)
      };

      // 重置输入框值
      if (token1Ref.current) token1Ref.current.value = "";
      if (token2Ref.current) token2Ref.current.value = "";

      //拉取Coin列表
      getCoinList();

    };

    return (
      <>

        <div className='box' >

          <span className='box-span'>
          Token1
          </span>

          <br />

          <input 
            className='box-address-input' 
            ref={token1Ref} // 使用 useRef 绑定输入框
            placeholder='Object<Metadata>'
          />

        </div>

        <div className='box' >

          <span className='box-span'>
          Token2
          </span>

          <br />

          <input 
            className='box-address-input' 
            ref={token2Ref} // 使用 useRef 绑定输入框
            placeholder='Object<Metadata>'
          />

        </div>

        {(account === null) ? (
          <Row justify={'center'}>
            <WalletSelector />
            <div style={{marginBottom:'5px'}}></div>
          </Row>
        ) : (
          <Row justify={'center'}>
            <Button className='submit-button' onClick={handleCreatePool}>
              Create Pool
            </Button>
          </Row>
        )}
      </>
    );
  };

  // “添加”功能组件
  const AddLiquidity = () => {

    const token1AmountRef = useRef<HTMLInputElement>(null);
    const token2AmountRef = useRef<HTMLInputElement>(null);

    const handleAddLiquidity = async () => {

      const token1Amount = token1AmountRef.current ? token1AmountRef.current.value : "";
      const token2Amount = token2AmountRef.current ? token2AmountRef.current.value : "";

      const transactionAddLiquidity: InputTransactionData = {
        data: {
          function: `${moduleAddress}::router::add_liquidity_entry`,
          functionArguments:[selectedCoin1.metadata, selectedCoin2.metadata, false, token1Amount, token2Amount, 1, 1]
        }
      };

      try {

        const responseAddLiquidity = await signAndSubmitTransaction(transactionAddLiquidity);
        await aptos.waitForTransaction({transactionHash:responseAddLiquidity.hash})

        //更新LP NFT和LP Token的余额
        getLpNftUri();
        getLpTokenBalance();
        
      } catch (error) {
        console.log("error",error)
      }

      //重置输入框
      if (token1AmountRef.current) token1AmountRef.current.value = "";
      if (token2AmountRef.current) token2AmountRef.current.value = "";

    };
    
    return (
      <>

      <div className='box' >

        <span className='box-span'>
        Token1
        </span>

        <br />

        <input 
          className='box-input'
          ref={token1AmountRef}
          placeholder='0'
        />

        <CoinSelector 
          selectedCoin={selectedCoin1} 
          setSelectedCoin={setSelectedCoin1} 
          coinList={filteredCoinListForToken1} 
        />

        
      </div>

      <div className='box' >

        <span className='box-span'>
        Token2
        </span>

        <br />

        <input 
          className='box-input'
          ref={token2AmountRef}
          placeholder='0'
        />

        <CoinSelector 
          selectedCoin={selectedCoin2} 
          setSelectedCoin={setSelectedCoin2} 
          coinList={filteredCoinListForToken2} 
        />

      </div>

      {(account === null) ? (
        <Row justify={'center'}>
          <WalletSelector />
          <div style={{marginBottom:'5px'}}></div>
        </Row>
      ) : (
        <Row justify={'center'}>
          <Button className='submit-button' onClick={handleAddLiquidity}>
            Add Liquidity
          </Button>
        </Row>
      )}

    </>
    );
  };

  // “移除”功能组件
  const RemoveLiquidity = () => {

    const lpTokentokenAmountRef = useRef<HTMLInputElement>(null);

    const handleRemoveLiquidity = async () => {

      const lpTokentokenAmount = lpTokentokenAmountRef.current ? lpTokentokenAmountRef.current.value : "";

      const transactionRemoveLiquidity: InputTransactionData = {
        data: {
          function: `${moduleAddress}::router::remove_liquidity_entry`,
          functionArguments:[selectedCoin1.metadata, selectedCoin2.metadata, false, lpTokentokenAmount, 1, 1, account?.address]
        }
      };

      try {

        const responseRemoveLiquidity = await signAndSubmitTransaction(transactionRemoveLiquidity);
        await aptos.waitForTransaction({transactionHash:responseRemoveLiquidity.hash})

        //更新LP NFT和LP Token的余额
        getLpNftUri();
        getLpTokenBalance();
        
      } catch (error) {
        console.log("error",error)
      }

      //重置输入框
      if (lpTokentokenAmountRef.current) lpTokentokenAmountRef.current.value = "";

    };

    return (
      <>

      <div className='box' >

        <span className='box-span'>
        LP Token
        </span>

        <br />

        <input 
          className='box-input'
          ref={lpTokentokenAmountRef}
          placeholder='0'
        />

        <span className='box-span-lp-token-balance'>
        LP Token Balance : {lpTokenBalance}
        </span>

        <div className="coin-selector-button-container">

          <CoinSelector 
            selectedCoin={selectedCoin1} 
            setSelectedCoin={setSelectedCoin1} 
            coinList={filteredCoinListForToken1} 
          />

          <CoinSelector 
            selectedCoin={selectedCoin2} 
            setSelectedCoin={setSelectedCoin2} 
            coinList={filteredCoinListForToken2} 
          />

        </div>
        
      </div>

      {(account === null) ? (
        <Row justify={'center'}>
            <WalletSelector />
            <div style={{marginBottom:'5px'}}></div>
        </Row>
      ) : (
        <Row justify={'center'}>
          <Button className='submit-button' onClick={handleRemoveLiquidity}>
            Remove Liquidity
          </Button>
        </Row>
      )}

    </>
    );
  };

  const handleMintTestFA = async () => {

    const transactionMintBTC: InputTransactionData = {
      data: {
        function: `${mintFaAddress}::launchpad1::mint_fa`,
        functionArguments:[
          "0x6184d78efca94412c86a924d76795e2bc7c7185fcc63c425a45a02749e58e731",
          100000000000
        ]
      }
    };

    const transactionMintAPT: InputTransactionData = {
      data: {
        function: `${mintFaAddress}::launchpad1::mint_fa`,
        functionArguments:[
          "0xdff567dd9ac79fd8f18cb7150c7c487d59bbec2334b0707a17cc9fafee710e6e",
          100000000000
        ]
      }
    };

    const transactionMintETH: InputTransactionData = {
      data: {
        function: `${mintFaAddress}::launchpad1::mint_fa`,
        functionArguments:[
          "0xf4ead8c3e1b47837ddae82e9a58e8e6d3fb719fe538bc71a8476444e8ceb4f3c",
          100000000000
        ]
      }
    };

    const transactionMintSUI: InputTransactionData = {
      data: {
        function: `${mintFaAddress}::launchpad1::mint_fa`,
        functionArguments:[
          "0xa945fdeded2e060125f502de64886ce5e7b0849647afa1004dff511b9e990038",
          100000000000
        ]
      }
    };

    try {

      const responseMintBTC = await signAndSubmitTransaction(transactionMintBTC);
      await aptos.waitForTransaction({transactionHash:responseMintBTC.hash});

      const responseMintAPT = await signAndSubmitTransaction(transactionMintAPT);
      await aptos.waitForTransaction({transactionHash:responseMintAPT.hash});

      const responseMintETH = await signAndSubmitTransaction(transactionMintETH);
      await aptos.waitForTransaction({transactionHash:responseMintETH.hash});

      const responseMintSUI = await signAndSubmitTransaction(transactionMintSUI);
      await aptos.waitForTransaction({transactionHash:responseMintSUI.hash});
      
    } catch (error) {
      console.log(error);
    }

  };


  // 处理功能切换的函数
  const renderFeature = () => {
    switch (activeFeature) {
      case 'swap':
        return <Swap />;
      case 'createPool':
        return <CreatePool />;
      case 'addLiquidity':
        return <AddLiquidity />;
      case 'removeLiquidity':
        return <RemoveLiquidity />;
    }
  };

  return (

    <Row align={"middle"} justify={'center'}>

      <Col span={6} style={{marginTop:'50px'}}>

        <div>

          {/* 按钮组 */}
          <div className='feature-button-div'>
            <Button
              className='feature-button'
              onClick={() => setActiveFeature('swap')}
              style={{
                backgroundColor: activeFeature === 'swap' ? '#1677ff' : 'white',
                color: activeFeature === 'swap' ? 'white' : 'black',
              }}
            >
              Swap
            </Button>

            <Button
              className='feature-button'
              onClick={() => setActiveFeature('createPool')}
              style={{
                backgroundColor: activeFeature === 'createPool' ? '#1677ff' : 'white',
                color: activeFeature === 'createPool' ? 'white' : 'black',
              }}
            >
              Create
            </Button>

            <Button
              className='feature-button'
              onClick={() => setActiveFeature('addLiquidity')}
              style={{
                backgroundColor: activeFeature === 'addLiquidity' ? '#1677ff' : 'white',
                color: activeFeature === 'addLiquidity' ? 'white' : 'black',
              }}
            >
              Add
            </Button>

            <Button
              className='feature-button'
              onClick={() => setActiveFeature('removeLiquidity')}
              style={{
                backgroundColor: activeFeature === 'removeLiquidity' ? '#1677ff' : 'white',
                color: activeFeature === 'removeLiquidity' ? 'white' : 'black',
              }}
            >
              Remove
            </Button>
          </div>

          {/* 动态内容区域 */}
          <div>
            {renderFeature()}
          </div>

          {/* 领取测试币 */}

          <Row justify={'center'}>
            <Button className='submit-button' onClick={handleMintTestFA}>Mint Test Tokens</Button>
          </Row> 

        </div>
      </Col>
    </Row>


  );
}