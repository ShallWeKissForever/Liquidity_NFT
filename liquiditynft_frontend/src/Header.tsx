import "./css/Header.css";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { Col, Layout, Row, Button } from 'antd';
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { handleMintTestFA } from './utils/mintTestFA';

function Header() {
    const { account, signAndSubmitTransaction } = useWallet();

    return (
        <>
            <Layout style={{ backgroundColor: '#ffffff' }}>
                <Row align={"middle"}>
                    <Col span={1} offset={1}>
                        <h1 style={{ color: "#72a1ff" }}>DNFT</h1>
                    </Col>

                    <Col span={19} style={{ textAlign: "right", paddingRight: "20px" }}>
                        {account && (
                            <Button
                                className="mint-button"
                                onClick={() => handleMintTestFA(signAndSubmitTransaction)}
                            >
                                Mint test tokens
                            </Button>
                        )}
                    </Col>

                    <Col span={2} className="header-wallet">
                        <WalletSelector />
                    </Col>
                </Row>
            </Layout>
        </>
    );
}

export default Header