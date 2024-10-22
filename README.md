### 项目概述：Liquidity_NFT

**项目网址**：http://162.14.114.2/

**项目目标**：将NFT与流动性交换（swap）结合，为用户在提供流动性时生成一个动态NFT，旨在提升用户的投资体验。

**NFT信息内容**：
- **持有时间**：记录用户提供流动性多久。
- **可提取费用**：展示用户能从流动性池中提取的费用数量。
- **LP Token持有比例**：反映用户在流动性池中的份额占比。

**动态更新机制**：
当持有时间、可提取费用或LP Token持有比例满足特定条件时，NFT会自动更新其内容和外观，提供实时反馈。

**用户体验**：
该项目旨在提供直观且互动的投资体验，降低DeFi的学习门槛，通过创新设计激励用户长期参与，同时为NFT赋予更广泛的实用性和交易价值。这种结合不仅增强了用户的参与感，还能提升市场流动性和NFT的市场价值。

**操作示例**：

0.在浏览器安装Petra钱包扩展程序并创建账户

切换网络到testnet

<img src="https://github.com/user-attachments/assets/5e9c5135-e973-4305-baea-5dcbc54d4900" alt="image" width="200" />

在水龙头领取测试币用于支付gas

![image](https://github.com/user-attachments/assets/490161c4-a99b-4b51-8c0b-e2efc7e35a85 =200x)

1.铸造要使用的FA

我们先点击`Mint Test Token`铸造测试用的FA用于接下来要进行的操作

小数位数decimal = 6
- FA3  BTC  0x6184d78efca94412c86a924d76795e2bc7c7185fcc63c425a45a02749e58e731
- FA4  ETH  0xf4ead8c3e1b47837ddae82e9a58e8e6d3fb719fe538bc71a8476444e8ceb4f3c
- FA5  APT  0xdff567dd9ac79fd8f18cb7150c7c487d59bbec2334b0707a17cc9fafee710e6e
- FA6  SUI  0xa945fdeded2e060125f502de64886ce5e7b0849647afa1004dff511b9e990038

![image](https://github.com/user-attachments/assets/80dafc9d-427a-49c8-8790-9c60e66daaf6)

2.创建流动性池

用BTC和APT这两个代币的的Metadata创建流动性池

![image](https://github.com/user-attachments/assets/0e2f8e36-7ab5-42d9-8e73-a953041d62e9)

3. 添加流动性

可以通过弹窗来选择要进行操作的Token

![image](https://github.com/user-attachments/assets/afff7ebd-f3d3-46f0-8466-a10466b15f90)
![image](https://github.com/user-attachments/assets/520bf1dd-7749-4527-8123-43cf390d2164)

添加FA，会获得LP Token和LP NFT，LP NFT会展示在页面的左边

![image](https://github.com/user-attachments/assets/7c5240d8-411d-4698-8388-297d34951784)
![image](https://github.com/user-attachments/assets/4e715100-6322-449d-bd0e-30cef3f4dc7e)

4. 用另一个账户添加流动性

切换到另一个账户并添加流动性，可以看到，由于 LP Token 持有的份额不同，NFT的样式也是不一样的

![image](https://github.com/user-attachments/assets/2ee668c4-12e5-4dbc-bdc3-e056752338d2)

第一个账户的NFT样式也发生了 变化
![image](https://github.com/user-attachments/assets/2bbea4a1-7e14-470a-878a-ecc4f525ea85)


5. 进行swap

填入要出售的代币数量，即可购买另一种代币

![image](https://github.com/user-attachments/assets/a5777d1d-3562-4bcc-bb70-1172acffc589)

继续进行swap使LP的手续费快速累积，当可提取的手续费达到一定阈值的时候，NFT的样式也会改变（你可以一眼看出你获得的手续费已经积累了很多了）

![image](https://github.com/user-attachments/assets/7d79199d-f174-426b-9435-3d4cecd9d92e)
![image](https://github.com/user-attachments/assets/914e9b33-5bf8-4600-909d-d7b4006039b7)


6. 移除流动性

移除所有的 LP Token

![image](https://github.com/user-attachments/assets/56089571-01ab-45a8-8d8c-a57091601152)


LP Token为0时，LP NFT 也被销毁了

![image](https://github.com/user-attachments/assets/ca81db13-d47c-4a96-afa2-17c3009ebaf8)

