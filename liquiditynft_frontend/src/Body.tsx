import './css/Body.css';
import { useState, useEffect, useRef } from 'react';
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import {  Col, Row, Button, Modal, List } from 'antd';
import { useWallet, InputTransactionData } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';

export default function SwapFeature() {

  //合约发布的账户地址
  const moduleAddress = "0x98eb393f248a291d0aacb3bb2bd8595536eb92eabadbcea5d6cc25bc68946a68";
  //mint测试币地址
  const mintFaAddress = "0x71dfdf10572f2d5ba5a66ccbf6e7a785d201fdb4bda312a870deeec3d8fd2f96";
  //拥有LiquidityPoolConfig资源的资源账户地址
  // const resource_Account_Address = "0x11c78a6c9e5105784f5a380ebc6e4efa71de7c17f0775898f4d57f08470d5251";

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

  //储存两个token
  // const [token1, setToken1] = useState("");
  // const [token2, setToken2] = useState("");

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
    name: "选择币对",
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
    name: "选择币对",
    symbol: "", 
    uri: "", 
    metadata: "", 
    pairTokenMetadata:"" ,
  })

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
    const updatedCoinList = coinList.filter((coin) => {
      // 只在 metadata 没有被见过的情况下保留这个币
      if (!seenMetadata.has(coin.metadata)) {
        seenMetadata.add(coin.metadata);
        return true;
      }
      return false;
    });
    setCoinList(coinList);
    setFilteredCoinListForToken1(updatedCoinList);
  }, [pools]); // 当 pools 发生变化时，更新 coinList

  // 当 selectedCoin1 变化时，重置 selectedCoin2
  useEffect(() => {
    setSelectedCoin2({
      name: '选择币对',
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

  //选择代币的按钮
  const CoinSelector = ({
    selectedCoin,
    setSelectedCoin,
    coinList,
  }: {
    selectedCoin: { name: string; symbol: string };
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
  
    // 选择币对
    const handleSelectCoin = (coin: { name: string; symbol: string; uri: string; metadata: string; pairTokenMetadata: string; }) => {
      setSelectedCoin(coin);  // 选择的币对传回上层
      setIsModalVisible(false);  // 选择后关闭弹窗
    };
  
    return (
      <div className='coin-selector-div'>
        <Button type="primary" onClick={showModal}>
          {selectedCoin.name !== '选择币对' ? `${selectedCoin.symbol}` : '选择币对'}
        </Button>
  
        {/* 弹窗显示币对选择 */}
        <Modal title="选择币对" open={isModalVisible} onCancel={handleCancel} footer={null}>
          <List
            dataSource={coinList}
            renderItem={coin => (
              <List.Item onClick={() => handleSelectCoin(coin)}>
                <img className='coin-selector-token-img' src={coin.uri} alt={coin.symbol} />
                {coin.name} ({coin.symbol})
                <br />
                <p className='coin-selector-token-metadata'>{coin.metadata}</p>
              </List.Item>
            )}
          />
        </Modal>
      </div>
    );
  };

  // “兑换”功能组件
  const Swap = () => {

    return (
      <>

        <div className='box'>

          <span className='box-span'>
          出售
          </span>

          <br />

          <input 
            className='box-input'
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
          购买
          </span>

          <br />

          <input 
            className='box-input'
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
          </Row>
        ) : (
          <Row justify={'center'}>
            <Button className='submit-button'>
              兑换
            </Button>
          </Row>
        )}

      </>

    );
  };

  // “创建”功能组件
  const CreatePool = () => {

    // const onWriteToken1 = (value: string) => {
    //   setToken1(value);
    // }
    // const onWriteToken2 = (value: string) => {
    //   setToken2(value);
    // }

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

        const returnGetToken1Name = await aptos.view({
          payload: {
            function: "0x1::fungible_asset::name",
            typeArguments: ["0x1::fungible_asset::Metadata"],
            functionArguments: [token1],
          }
        })
        
        const returnGetToken2Name = await aptos.view({
          payload: {
            function: "0x1::fungible_asset::name",
            typeArguments: ["0x1::fungible_asset::Metadata"],
            functionArguments: [token2],
          }
        });

        const returnGetToken1Symbol = await aptos.view({
          payload: {
            function: "0x1::fungible_asset::symbol",
            typeArguments: ["0x1::fungible_asset::Metadata"],
            functionArguments: [token1],
          }
        });

        const returnGetToken2Symbol = await aptos.view({
          payload: {
            function: "0x1::fungible_asset::symbol",
            typeArguments: ["0x1::fungible_asset::Metadata"],
            functionArguments: [token2],
          }
        });

        const returnGetToken1Uri = await aptos.view({
          payload: {
            function: "0x1::fungible_asset::icon_uri",
            typeArguments: ["0x1::fungible_asset::Metadata"],
            functionArguments: [token1],
          }
        });

        const returnGetToken2Uri = await aptos.view({
          payload: {
            function: "0x1::fungible_asset::icon_uri",
            typeArguments: ["0x1::fungible_asset::Metadata"],
            functionArguments: [token2],
          }
        });

        const newPool : Pool = {
          token_name_1:`${returnGetToken1Name[0]}`,
          token_name_2:`${returnGetToken2Name[0]}`,
          token_symbol_1:`${returnGetToken1Symbol[0]}`,
          token_symbol_2:`${returnGetToken2Symbol[0]}`,
          token_uri_1:`${returnGetToken1Uri[0]}`,
          token_uri_2:`${returnGetToken2Uri[0]}`,
          token_metadata_1: `${token1}`,
          token_metadata_2: `${token2}`,
        }

        const tempPools = [...pools];
        tempPools.push(newPool);
        setPools(tempPools);
        
      } catch (error) {
        console.log("error",error)
      };

    // 重置输入框值
    if (token1Ref.current) token1Ref.current.value = "";
    if (token2Ref.current) token2Ref.current.value = "";

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
          // onChange={(e) => onWriteToken1(e.target.value)}
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
          // onChange={(e) => onWriteToken2(e.target.value)}
          placeholder='Object<Metadata>'
        />

      </div>

      {(account === null) ? (
      <Row justify={'center'}>
        <WalletSelector />
      </Row>
    ) : (
      <Row justify={'center'}>
        <Button className='submit-button' onClick={handleCreatePool}>
          创建
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
      </Row>
    ) : (
      <Row justify={'center'}>
        <Button className='submit-button' onClick={handleAddLiquidity}>
          添加
        </Button>
      </Row>
    )}

    </>
    );
  };

  // “移除”功能组件
  const RemoveLiquidity = () => {

    return (
      <>

      <div className='box' >

        <span className='box-span'>
        Token1
        </span>

        <br />

        <input 
          className='box-input'
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
      </Row>
    ) : (
      <Row justify={'center'}>
        <Button className='submit-button'>
          移除
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

  // 定义状态来保存当前选择的功能
  const [activeFeature, setActiveFeature] = useState('swap');

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
          <div className='feature-button-div' >

            <Button 
              className='feature-button'
              onClick={() => setActiveFeature('swap')}
              style={{
                backgroundColor: activeFeature === 'swap' ? '#1677ff' : 'white',
                color: activeFeature === 'swap' ? 'white' : 'black',
              }}
            >
            兑换
            </Button>

            <Button 
              className='feature-button'
              onClick={() => setActiveFeature('createPool')}
              style={{
                backgroundColor: activeFeature === 'createPool' ? '#1677ff' : 'white',
                color: activeFeature === 'createPool' ? 'white' : 'black',
              }}
            >
            创建
            </Button>

            <Button 
              className='feature-button'
              onClick={() => setActiveFeature('addLiquidity')}
              style={{
                backgroundColor: activeFeature === 'addLiquidity' ? '#1677ff' : 'white',
                color: activeFeature === 'addLiquidity' ? 'white' : 'black',
              }}
            >
            添加
            </Button>

            <Button 
              className='feature-button'
              onClick={() => setActiveFeature('removeLiquidity')}
              style={{
                backgroundColor: activeFeature === 'removeLiquidity' ? '#1677ff' : 'white',
                color: activeFeature === 'removeLiquidity' ? 'white' : 'black',
              }}
            >
            移除
            </Button>

          </div>

          {/* 动态内容区域 */}
          <div>

            {renderFeature()}

          </div>

          {/* test only */}
          <Button className='submit-button' onClick={handleMintTestFA}>Mint</Button>

        </div>

      </Col>

    </Row>

  );
}