import "./css/Header.css";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { Col, Layout, Row, Button, Switch } from 'antd';
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { handleMintTestFA } from './utils/mintTestFA';
import { useLanguage } from './context/LanguageContext';

function Header() {
    const { account, signAndSubmitTransaction } = useWallet();
    const { language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'zh' : 'en');
    };

    const { t } = useLanguage();

    return (
        <>
            <Layout className="layout">
                <Row align={"middle"}>
                    <Col span={5} offset={1}>
                        <h1 style={{ color: "#72a1ff" }}>{t('logo')}</h1>
                    </Col>

                    <Col span={14} style={{ textAlign: "right", paddingRight: "20px" }}>
                        {account && (
                            <Button
                                className="mint-button"
                                onClick={() => handleMintTestFA(signAndSubmitTransaction)}
                            >
                                {t('mint_test_token')}
                            </Button>
                        )}
                    </Col>

                    <Col span={2} className="header-wallet" style={{ textAlign: "right", paddingRight: "10px" }}>
                        <WalletSelector />
                    </Col>

                    <Col span={1} style={{ textAlign: "right" }}>
                        <Switch
                            checkedChildren="中"
                            unCheckedChildren="En"
                            checked={language === 'zh'}
                            onChange={toggleLanguage}
                            className="language-switch"
                        />
                    </Col>

                </Row>
            </Layout>
        </>
    );
}

export default Header