import React, { useState, useEffect } from 'react';
import { Button, Modal, List } from 'antd';
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
// 假设 pools 已经通过 useState 储存了
const [pools, setPools] = useState<Pool[]>([]);

// 使用 useState 存储 coinList
const [coinList, setCoinList] = useState<
  { name: string; symbol: string; uri: string; metadata: string; pairTokenMetadata: string }[]
>([]);

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
        {selectedCoin.name !== '' ? `${selectedCoin.name} (${selectedCoin.symbol})` : '选择币对'}
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

// 使用两个 CoinSelector 组件
const App = () => {
  const [selectedCoin1, setSelectedCoin1] = useState({
    name: '选择币对',
    symbol: '',
    uri: '',
    metadata: '',
    pairTokenMetadata: '',
  });
  const [selectedCoin2, setSelectedCoin2] = useState({
    name: '选择币对',
    symbol: '',
    uri: '',
    metadata: '',
    pairTokenMetadata: '',
  });

  // 使用 useEffect 在 pools 更新时更新 coinList
  useEffect(() => {
    const updatedCoinList = pools.flatMap((pool) => [
      {
        name: pool.token_name_1, // 用 token_name_1 作为 name
        symbol: pool.token_symbol_1, // 用 token_symbol_1 作为 symbol
        uri: pool.token_uri_1, // 用 token_uri_1 作为 uri
        metadata: pool.token_metadata_1, // 用 token_metadata_1 作为 metadata
        pairTokenMetadata: pool.token_metadata_2, // 用 token_metadata_2 作为 pairTokenMetadata
      },
      {
        name: pool.token_name_2, // 用 token_name_2 作为 name
        symbol: pool.token_symbol_2, // 用 token_symbol_2 作为 symbol
        uri: pool.token_uri_2, // 用 token_uri_2 作为 uri
        metadata: pool.token_metadata_2, // 用 token_metadata_2 作为 metadata
        pairTokenMetadata: pool.token_metadata_1, // 用 token_metadata_1 作为 pairTokenMetadata
      },
    ]);
    setCoinList(updatedCoinList);
  }, [pools]); // 当 pools 发生变化时，更新 coinList

  // 过滤出符合 token1 的 pairTokenMetadata 的 token2 列表
  const filteredCoinListForToken2 = coinList.filter(
    (coin) => coin.pairTokenMetadata === selectedCoin1.metadata
  );

  return (
    <>
      <h1>选择Token1</h1>
      <CoinSelector selectedCoin={selectedCoin1} setSelectedCoin={setSelectedCoin1} coinList={coinList} />
      <h1>选择Token2</h1>
      <CoinSelector selectedCoin={selectedCoin2} setSelectedCoin={setSelectedCoin2} coinList={filteredCoinListForToken2} />
    </>
  );
};

export default App;
