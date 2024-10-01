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

我们先[铸造](https://explorer.aptoslabs.com/account/0x71dfdf10572f2d5ba5a66ccbf6e7a785d201fdb4bda312a870deeec3d8fd2f96/modules/run/launchpad1?network=testnet)两种FA各1000个用于提供流动性和进行swap

decimal = 6
- FA1_Metadata: 0x7f2bf107ba43b8f16332aa88d43713b811dc24f4abc8c68bb73ac44613559476
- FA2_Metadata: 0x1c71da02f726fa948d0d790d215401020a701ee5e1968b8329a2fcdb032315ad

[![pA31MUx.png](https://s21.ax1x.com/2024/10/01/pA31MUx.png)](https://imgse.com/i/pA31MUx)

[![pA311PK.png](https://s21.ax1x.com/2024/10/01/pA311PK.png)](https://imgse.com/i/pA311PK)

2.创建流动性池

用这两个FA的Metadata创建流动性池，稳定币选项填false

[![pA3138O.png](https://s21.ax1x.com/2024/10/01/pA3138O.png)](https://imgse.com/i/pA3138O)

3. 添加流动性

填入两种FA的Metadata来确定流动性池，稳定币选项是false，两种代币分别添加100个，以及两种代币分别的期望最小添加数（这是为了保护LP，避免因添加比例不同或其他计算因素导致的添加数量过少）为了方便演示我们填1

[![pA31Q56.png](https://s21.ax1x.com/2024/10/01/pA31Q56.png)](https://imgse.com/i/pA31Q56)

我们减少了对应数量的FA，并获得了 LP Token和 LP NFT

[![pA337ff.jpg](https://s21.ax1x.com/2024/10/01/pA337ff.jpg)](https://imgse.com/i/pA337ff)

4. 用另一个账户添加流动性

切换到另一个账户，这次两种代币分别添加75个，可以看到，由于 LP Token 持有的份额不同，NFT的样式也是不一样的

[![pA33R6e.png](https://s21.ax1x.com/2024/10/01/pA33R6e.png)](https://imgse.com/i/pA33R6e)

5. 进行swap

填入要进行swap的数量100，期望最小收到代币的值1，源代币Metadata，目标代币Metadata，稳定币选项false，接收人地址

[![pA33WOH.png](https://s21.ax1x.com/2024/10/01/pA33WOH.png)](https://imgse.com/i/pA33WOH)

继续进行swap使LP的手续费快速累积，当可提取的手续费达到一定阈值的时候，NFT的样式也会改变（你可以一眼看出你获得的手续费已经积累了很多了）

[![pA336fK.jpg](https://s21.ax1x.com/2024/10/01/pA336fK.jpg)](https://imgse.com/i/pA336fK)

6. 移除流动性

移除所有的 LP Token

[![pA332lD.png](https://s21.ax1x.com/2024/10/01/pA332lD.png)](https://imgse.com/i/pA332lD)

LP Token为0时，LP NFT 也被销毁了

[![pA33yY6.png](https://s21.ax1x.com/2024/10/01/pA33yY6.png)](https://imgse.com/i/pA33yY6)

