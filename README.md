### 项目概述：Liquidity_NFT

**项目目标**：将NFT与流动性交换（swap）结合，为用户在提供流动性时生成一个动态NFT，旨在提升用户的投资体验。

**NFT信息内容**：
- **持有时间**：记录用户提供流动性多久。
- **可提取费用**：展示用户能从流动性池中提取的费用数量。
- **LP Token持有比例**：反映用户在流动性池中的份额占比。

**动态更新机制**：
当持有时间、可提取费用或LP Token持有比例满足特定条件时，NFT会自动更新其内容和外观，提供实时反馈。

**用户体验**：
该项目旨在提供直观且互动的投资体验，降低DeFi的学习门槛，通过创新设计激励用户长期参与，同时为NFT赋予更广泛的实用性和交易价值。这种结合不仅增强了用户的参与感，还能提升市场流动性和NFT的市场价值。

操作示例：

1.铸造要使用的FA

我们先点击Mint铸造测试用的FA用于接下来要进行的操作

decimal = 6
- FA1  BTC  0x6184d78efca94412c86a924d76795e2bc7c7185fcc63c425a45a02749e58e731
- FA2  APT  0xdff567dd9ac79fd8f18cb7150c7c487d59bbec2334b0707a17cc9fafee710e6e
- FA3  ETH  0xf4ead8c3e1b47837ddae82e9a58e8e6d3fb719fe538bc71a8476444e8ceb4f3c
- FA4  SUI  0xa945fdeded2e060125f502de64886ce5e7b0849647afa1004dff511b9e990038

![image](https://github.com/user-attachments/assets/4239216a-41d0-4c4f-8cf2-373079d5a998)

2.创建流动性池

用APT和ETH这两个FA的Metadata创建流动性池

![image](https://github.com/user-attachments/assets/866b5ee1-c67c-4452-b550-c9e91961616f)

3. 添加流动性

可以通过弹窗来选择要进行操作的Token

![image](https://github.com/user-attachments/assets/cc2a0d5a-42a3-44f6-8bd1-395ac18176db)
![image](https://github.com/user-attachments/assets/7947f088-8b41-453e-bb50-bd82ccb2f9e7)

我们减少了对应数量的FA，并获得了 LP Token和 LP NFT

![image](https://github.com/user-attachments/assets/ee1d2357-8522-4390-a640-cb4459f67228)

4. 用另一个账户添加流动性

切换到另一个账户并添加流动性，可以看到，由于 LP Token 持有的份额不同，NFT的样式也是不一样的

![image](https://github.com/user-attachments/assets/33185ea6-19ef-4bc5-8550-10f2d9ea07f2)
![image](https://github.com/user-attachments/assets/e3754265-193d-4e5b-b37c-abee6f3aed27)
![image](https://github.com/user-attachments/assets/73e331ab-8337-4fc1-a468-898866e62214)


5. 进行swap

填入要进行swap的数量

![image](https://github.com/user-attachments/assets/a90c01ad-cd36-445f-a898-046d3f269b12)

继续进行swap使LP的手续费快速累积，当可提取的手续费达到一定阈值的时候，NFT的样式也会改变（你可以一眼看出你获得的手续费已经积累了很多了）

![image](https://github.com/user-attachments/assets/051c3be3-e31b-41b6-bd81-9d885465570a)
![image](https://github.com/user-attachments/assets/67da0414-b6e1-4ccf-9ffb-b01817c4a5a6)

6. 移除流动性

移除所有的 LP Token

![image](https://github.com/user-attachments/assets/088dc819-ed79-4354-a724-e6fb73d7abe3)


LP Token为0时，LP NFT 也被销毁了

![image](https://github.com/user-attachments/assets/32114a97-b7c5-4025-9957-bac9409335a5)

