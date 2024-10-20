import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { Col, Layout, Row } from 'antd';
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";

function Header() {

    return (
        <>
        
        <Layout>
            <Row align={"middle"}>

                <Col span={10} offset={2}>
                    <h1>Liquidity NFT</h1>
                </Col>

                <Col span={10} style={{textAlign:"right", paddingRight:"100px"}}>
                    <WalletSelector />
                </Col>

            </Row>
        </Layout>

        </>
    );
}

export default Header