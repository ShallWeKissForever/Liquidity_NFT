import './css/Body.css'
import { useState } from 'react';
import {  Col, Row, Button, Input, Modal, List } from 'antd';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';

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

// 功能组件
function Swap() {
  return (
    <>

    <div className='box'>

      <span className='box-span'>
      出售
      </span>

      <br />

      <input className='box-input'/>

      <CoinSelector />

    </div>

    <div className='box' >

      <span className='box-span'>
      购买
      </span>

      <br />

      <input className='box-input'/>

      <CoinSelector />

    </div>

  </>

);
}

// todo
function CreatePool() {
  return (
    <>

    <div className='box' >

      <span className='box-span'>
      Token1
      </span>

      <br />

      <input className='box-input'/>

    </div>

    <div className='box' >

      <span className='box-span'>
      Token2
      </span>

      <br />

      <input className='box-input'/>

    </div>

  </>
  );
}

// todo
function AddLiquidity() {
  return (
    <>

    <div className='box' >

      <span className='box-span'>
      Token1
      </span>

      <br />

      <input className='box-input'/>

      <CoinSelector />
      
    </div>

    <div className='box' >

      <span className='box-span'>
      Token2
      </span>

      <br />

      <input className='box-input'/>

      <CoinSelector />

    </div>

  </>
  );
}

// todo
function RemoveLiquidity() {
  return (
    <>

    <div className='box' >

      <span className='box-span'>
      Token1
      </span>

      <br />

      <input className='box-input'/>

      <CoinSelector />
      
    </div>

    <div className='box' >

      <span className='box-span'>
      Token2
      </span>

      <br />

      <input className='box-input'/>

      <CoinSelector />

    </div>

  </>
  );
}

export default function UniswapFeature() {
  // 定义状态来保存当前选择的功能
  const [activeFeature, setActiveFeature] = useState('swap');
  //account 对象是 null 如果没有连接帐户;连接帐户时， account 对象将保存帐户信息，包括帐户地址。
  const { account, signAndSubmitTransaction } = useWallet();

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
      default:
        return <Swap />;
    }
  };

  // 切换大按钮上的内容
  const FeatureText = () => {
    switch (activeFeature) {
      case 'swap':
        return <p>兑换</p>;
      case 'createPool':
        return <p>创建</p>;
      case 'addLiquidity':
        return <p>添加</p>;
      case 'removeLiquidity':
        return <p>移除</p>;
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

            {(account === null) ? (
              <Row justify={'center'}>
                <WalletSelector />
              </Row>
            ) : (
              <Row justify={'center'}>
                <Button className='submit-button'>
                  {<FeatureText />}
                </Button>
              </Row>
            )}

          </div>

        </div>

      </Col>

    </Row>

  );
}
