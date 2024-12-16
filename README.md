### 项目概述：Liquidity_NFT

**项目目标**：本项目旨在将 NFT 与流动性交换（swap）相结合，为用户在提供流动性时生成动态 NFT，从而提升投资体验。

#### NFT 信息内容：
- **持有时间**：记录用户提供流动性的时长。
- **可提取费用**：展示用户从流动性池中可提取的费用数量。
- **LP Token 持有比例**：反映用户在流动性池中的份额占比。

#### 动态更新机制：
NFT 的内容和外观将根据持有时间、可提取费用或 LP Token 持有比例的特定条件自动更新，确保用户能够获得实时反馈。

#### 用户体验：
本项目致力于提供直观且互动的投资体验，降低 DeFi 的学习门槛。通过创新设计，激励用户长期参与，同时赋予 NFT 更广泛的实用性和交易价值。这种结合不仅增强了用户的参与感，还能提升市场流动性及 NFT 的市场价值。

# 操作示例

## 0. 安装 Petra 钱包并创建账户

首先，在浏览器中安装 Petra 钱包扩展程序，并创建一个新账户。确保将网络切换到 **testnet**。

<img src="https://github.com/user-attachments/assets/5e216935-ebc4-437f-870e-f5ac5336b870" alt="切换网络" width="300" />

接下来，通过水龙头领取测试币，以便支付 gas 费用。

<img src="https://github.com/user-attachments/assets/c69714fa-e912-4bc7-bc30-c098a4a74d80" alt="领取测试币" width="300" />

## 1. 铸造测试代币 (FA)

点击 `Mint Test Token` 铸造用于后续操作的测试代币。请注意，这几种测试代币的小数位数都设置为 6。

- **FA3 BTC**: `0x6184d78efca94412c86a924d76795e2bc7c7185fcc63c425a45a02749e58e731`
- **FA4 ETH**: `0xf4ead8c3e1b47837ddae82e9a58e8e6d3fb719fe538bc71a8476444e8ceb4f3c`
- **FA5 APT**: `0xdff567dd9ac79fd8f18cb7150c7c487d59bbec2334b0707a17cc9fafee710e6e`
- **FA6 SUI**: `0xa945fdeded2e060125f502de64886ce5e7b0849647afa1004dff511b9e990038`

![铸造 FA](https://github.com/user-attachments/assets/80dafc9d-427a-49c8-8790-9c60e66daaf6)

## 2. 创建流动性池

使用 BTC 和 APT 这两个代币的 Metadata 创建流动性池，开始为交易提供支持。

![创建流动性池](https://github.com/user-attachments/assets/0e2f8e36-7ab5-42d9-8e73-a953041d62e9)

## 3. 添加流动性

在弹出的窗口中选择要进行操作的 Token，为流动性池添加资金。

![选择 Token](https://github.com/user-attachments/assets/afff7ebd-f3d3-46f0-8466-a10466b15f90)
![选择 Token 2](https://github.com/user-attachments/assets/520bf1dd-7749-4527-8123-43cf390d2164)

完成后，您将获得 LP Token 和 LP NFT，LP NFT 会在页面的左侧展示。

![LP NFT](https://github.com/user-attachments/assets/7c5240d8-411d-4698-8388-297d34951784)
![LP NFT 2](https://github.com/user-attachments/assets/4e715100-6322-449d-bd0e-30cef3f4dc7e)

## 4. 使用另一个账户添加流动性

切换到另一个账户并添加流动性。您会发现，由于 LP Token 持有的份额不同，NFT 的样式也会相应变化。

![另一个账户的 NFT](https://github.com/user-attachments/assets/2ee668c4-12e5-4dbc-bdc3-e056752338d2)

第一个账户的 NFT 样式也会随之变化，展现出流动性变化的直观效果。

![第一个账户的 NFT](https://github.com/user-attachments/assets/2bbea4a1-7e14-470a-878a-ecc4f525ea85)

## 5. 进行 Swap 操作

填写您希望出售的代币数量，即可购买另一种代币，体验流动性的便捷。

![进行 Swap](https://github.com/user-attachments/assets/a5777d1d-3562-4bcc-bb70-1172acffc589)

继续进行 Swap 操作，让 LP 的手续费快速累积。当可提取的手续费达到一定阈值时，NFT 的样式也会发生变化，清晰显示您的收益。

![手续费累积](https://github.com/user-attachments/assets/7d79199d-f174-426b-9435-3d4cecd9d92e)
![手续费累积 2](https://github.com/user-attachments/assets/914e9b33-5bf8-4600-909d-d7b4006039b7)

## 6. 移除流动性

最后，您可以选择移除所有的 LP Token，以结束当前的流动性提供。

![移除流动性](https://github.com/user-attachments/assets/56089571-01ab-45a8-8d8c-a57091601152)

当 LP Token 为 0 时，对应的 LP NFT 也将被销毁，标志着流动性结束。

![LP NFT 被销毁](https://github.com/user-attachments/assets/ca81db13-d47c-4a96-afa2-17c3009ebaf8)

