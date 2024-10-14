import './css/Body.css';
import { useState } from 'react';
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import {  Col, Row, Button, Input, Modal, List } from 'antd';
import { useWallet, InputTransactionData } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';

//设置 Aptos 与 testnet 网络交互
const aptosConfig = new AptosConfig({ network: Network.TESTNET });
//初始化一个 Aptos 实例
const aptos = new Aptos(aptosConfig);

const resource_Account_Address = "0x11c78a6c9e5105784f5a380ebc6e4efa71de7c17f0775898f4d57f08470d5251";
const moduleAddress = "0x07428b8f770c6455453e2b0bc602553bc4d145a926e41b8de82f2229fa7e8284";

const coinList = [
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'USDT', name: 'Tether' },
  // 其他币种...
];

function CoinSelector() {
  const [isModalVisible, setIsModalVisible] = useState(false);  // 控制弹窗的显示状态
  const [selectedCoin, setSelectedCoin] = useState('选择币对');  // 存储选择的币对

  // 显示弹窗
  const showModal = () => {
    setIsModalVisible(true);
  };

  // 隐藏弹窗
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // 选择币对
  const handleSelectCoin = (coin: { symbol: any; name?: string; }) => {
    setSelectedCoin(coin.symbol);
    setIsModalVisible(false);  // 选择后关闭弹窗
  };

  return (
    <>

      <div className='coin-selector-div'>
        <Button type="primary" onClick={showModal}>
          {selectedCoin}
        </Button>

        {/* 弹窗显示币对选择 */}
        <Modal 
          title="选择币对" 
          open={isModalVisible} 
          onCancel={handleCancel} 
          footer={null}
        >
          <Input className='coin-selector-modal-input' placeholder="搜索币对" />
          <List
            dataSource={coinList}
            renderItem={coin => (
              <List.Item onClick={() => handleSelectCoin(coin)}>
                {coin.name} ({coin.symbol})
              </List.Item>
            )}
          />
        </Modal>
      </div>
    </>
  );
}

// “兑换”功能组件
function Swap() {

  //account 对象是 null 如果没有连接帐户;连接帐户时， account 对象将保存帐户信息，包括帐户地址。
  const { account, signAndSubmitTransaction } = useWallet();

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

      <CoinSelector />

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

      <CoinSelector />

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
}

// “创建”功能组件
function CreatePool() {

  //account 对象是 null 如果没有连接帐户;连接帐户时， account 对象将保存帐户信息，包括帐户地址。
  const { account, signAndSubmitTransaction } = useWallet();

  const [token1, setToken1] = useState("");
  const [token2, setToken2] = useState("");
  const onWriteToken1 = (value: string) => {
    setToken1(value);
  }
  const onWriteToken2 = (value: string) => {
    setToken2(value);
  }

  const handleCreatePool = async () => {

    const transaction:InputTransactionData = {
      data: {
        function:`${moduleAddress}::router::create_pool`,
        functionArguments:[token1, token2, false]
      }
    }
  
    try {
  
      const response = await signAndSubmitTransaction(transaction);

      await aptos.waitForTransaction({transactionHash:response.hash});
      
    } catch (error) {

      console.log("error",error)
      
    };

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
        onChange={(e) => onWriteToken1(e.target.value)}
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
        onChange={(e) => onWriteToken2(e.target.value)}
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
}

// “添加”功能组件
function AddLiquidity() {

    //account 对象是 null 如果没有连接帐户;连接帐户时， account 对象将保存帐户信息，包括帐户地址。
    const { account, signAndSubmitTransaction } = useWallet();

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

      <CoinSelector />
      
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

      <CoinSelector />

    </div>

    {(account === null) ? (
    <Row justify={'center'}>
      <WalletSelector />
    </Row>
  ) : (
    <Row justify={'center'}>
      <Button className='submit-button'>
        添加
      </Button>
    </Row>
  )}

  </>
  );
}

// “移除”功能组件
function RemoveLiquidity() {

    //account 对象是 null 如果没有连接帐户;连接帐户时， account 对象将保存帐户信息，包括帐户地址。
    const { account, signAndSubmitTransaction } = useWallet();

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

      <CoinSelector />
      
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

      <CoinSelector />

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
}

export default function SwapFeature() {
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

        </div>

      </Col>

    </Row>

  );
}