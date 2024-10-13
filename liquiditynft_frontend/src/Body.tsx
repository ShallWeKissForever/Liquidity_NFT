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

      <div style={{ position:'relative', left:'280px', bottom:'45px' }}>
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
          <Input placeholder="搜索币对" style={{ marginBottom: '10px' }} />
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

    <div style={{backgroundColor:'#f5f5f5', marginBottom:'3px', height:'120px', borderRadius:'10px'}}>

      <span 
        style={{
          marginLeft:'15px',
          marginTop:'15px',
          display: 'inline-block',
        }}
      >
      出售
      </span>

      <br />

      <input 
      style={{
        height:'50px',
        width:'250px',
        marginLeft:'15px',
        marginTop:'5px',
        fontSize:'40px',
        backgroundColor:'#f5f5f5',
        borderWidth:'0',
        borderColor:'#f5f5f5',
        outline:'none',
      }} 
      />

      <CoinSelector />

    </div>

    <div style={{backgroundColor:'#f5f5f5', marginBottom:'3px', height:'120px', borderRadius:'10px'}}>

      <span 
        style={{
          marginLeft:'15px',
          marginTop:'15px',
          display: 'inline-block',
        }}
      >
      购买
      </span>

      <br />

      <input 
      style={{
        height:'50px',
        width:'250px',
        marginLeft:'15px',
        marginTop:'5px',
        fontSize:'40px',
        backgroundColor:'#f5f5f5',
        borderWidth:'0',
        borderColor:'#f5f5f5',
        outline:'none',
      }} 
      />

      <CoinSelector />

    </div>

  </>

);
}

// todo
function CreatePool() {
  return (
    <>

    <div style={{backgroundColor:'#f5f5f5', marginBottom:'3px', height:'120px', borderRadius:'10px'}}>

      <span 
        style={{
          marginLeft:'15px',
          marginTop:'15px',
          display: 'inline-block',
        }}
      >
      Token1
      </span>

      <br />

      <input 
      style={{
        height:'50px',
        width:'250px',
        marginLeft:'15px',
        marginTop:'5px',
        fontSize:'40px',
        backgroundColor:'#f5f5f5',
        borderWidth:'0',
        borderColor:'#f5f5f5',
        outline:'none',
      }} 
      />

    </div>

    <div style={{backgroundColor:'#f5f5f5', marginBottom:'3px', height:'120px', borderRadius:'10px'}}>

      <span 
        style={{
          marginLeft:'15px',
          marginTop:'15px',
          display: 'inline-block',
        }}
      >
      Token2
      </span>

      <br />

      <input 
      style={{
        height:'50px',
        width:'250px',
        marginLeft:'15px',
        marginTop:'5px',
        fontSize:'40px',
        backgroundColor:'#f5f5f5',
        borderWidth:'0',
        borderColor:'#f5f5f5',
        outline:'none',
      }} 
      />

    </div>

  </>
  );
}

// todo
function AddLiquidity() {
  return (
    <>

    <div style={{backgroundColor:'#f5f5f5', marginBottom:'3px', height:'120px', borderRadius:'10px'}}>

      <span 
        style={{
          marginLeft:'15px',
          marginTop:'15px',
          display: 'inline-block',
        }}
      >
      Token1
      </span>

      <br />

      <input 
      style={{
        height:'50px',
        width:'250px',
        marginLeft:'15px',
        marginTop:'5px',
        fontSize:'40px',
        backgroundColor:'#f5f5f5',
        borderWidth:'0',
        borderColor:'#f5f5f5',
        outline:'none',
      }} 
      />

      <CoinSelector />
      
    </div>

    <div style={{backgroundColor:'#f5f5f5', marginBottom:'3px', height:'120px', borderRadius:'10px'}}>

      <span 
        style={{
          marginLeft:'15px',
          marginTop:'15px',
          display: 'inline-block',
        }}
      >
      Token2
      </span>

      <br />

      <input 
      style={{
        height:'50px',
        width:'250px',
        marginLeft:'15px',
        marginTop:'5px',
        fontSize:'40px',
        backgroundColor:'#f5f5f5',
        borderWidth:'0',
        borderColor:'#f5f5f5',
        outline:'none',
      }} 
      />

      <CoinSelector />

    </div>

  </>
  );
}

// todo
function RemoveLiquidity() {
  return (
    <>

    <div style={{backgroundColor:'#f5f5f5', marginBottom:'3px', height:'120px', borderRadius:'10px'}}>

      <span 
        style={{
          marginLeft:'15px',
          marginTop:'15px',
          display: 'inline-block',
        }}
      >
      Token1
      </span>

      <br />

      <input 
      style={{
        height:'50px',
        width:'250px',
        marginLeft:'15px',
        marginTop:'5px',
        fontSize:'40px',
        backgroundColor:'#f5f5f5',
        borderWidth:'0',
        borderColor:'#f5f5f5',
        outline:'none',
      }} 
      />

      <CoinSelector />
      
    </div>

    <div style={{backgroundColor:'#f5f5f5', marginBottom:'3px', height:'120px', borderRadius:'10px'}}>

      <span 
        style={{
          marginLeft:'15px',
          marginTop:'15px',
          display: 'inline-block',
        }}
      >
      Token2
      </span>

      <br />

      <input 
      style={{
        height:'50px',
        width:'250px',
        marginLeft:'15px',
        marginTop:'5px',
        fontSize:'40px',
        backgroundColor:'#f5f5f5',
        borderWidth:'0',
        borderColor:'#f5f5f5',
        outline:'none',
      }} 
      />

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
          <div style={{ marginBottom: '10px' }}>

            <Button 
              onClick={() => setActiveFeature('swap')}
              style={{
                height:'35px',
                width:'60px',
                border:'0px',
                borderRadius:'17px',
                backgroundColor: activeFeature === 'swap' ? '#1677ff' : 'white',
                color: activeFeature === 'swap' ? 'white' : 'black',
                marginRight:'10px',
              }}
            >
            兑换
            </Button>

            <Button 
            onClick={() => setActiveFeature('createPool')}
            style={{
              height:'35px',
              width:'60px',
              border:'0px',
              borderRadius:'17px',
              backgroundColor: activeFeature === 'createPool' ? '#1677ff' : 'white',
              color: activeFeature === 'createPool' ? 'white' : 'black',
              marginRight:'10px',
            }}
            >
            创建
            </Button>

            <Button 
            onClick={() => setActiveFeature('addLiquidity')}
            style={{
              height:'35px',
              width:'60px',
              border:'0px',
              borderRadius:'17px',
              backgroundColor: activeFeature === 'addLiquidity' ? '#1677ff' : 'white',
              color: activeFeature === 'addLiquidity' ? 'white' : 'black',
              marginRight:'10px',
            }}
            >
            添加
            </Button>

            <Button 
            onClick={() => setActiveFeature('removeLiquidity')}
            style={{
              height:'35px',
              width:'60px',
              border:'0px',
              borderRadius:'17px',
              backgroundColor: activeFeature === 'removeLiquidity' ? '#1677ff' : 'white',
              color: activeFeature === 'removeLiquidity' ? 'white' : 'black',
              marginRight:'10px',
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
                <Button
                style={{
                  height:'50px',
                  width:'380px',
                  color:'white',
                  backgroundColor:'#1677ff',
                }}
                >
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
