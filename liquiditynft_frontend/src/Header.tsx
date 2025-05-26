import "./css/Header.css";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { Col, Layout, Row, Button, Switch } from 'antd';
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { handleMintTestFA } from './utils/mintTestFA';
import { useLanguage } from './context/LanguageContext';
import { Link, useLocation } from 'react-router-dom';

function Header() {
    const { account, signAndSubmitTransaction } = useWallet();
    const { language, setLanguage, t } = useLanguage();
    const location = useLocation();

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'zh' : 'en');
    };

    return (
        <>
            <Layout className="layout">
                <Row align={"middle"}>
                    <Col span={9} offset={1}>
                        <h1 style={{ color: "#72a1ff" }}>{t('logo')}</h1>
                    </Col>

                    <Col span={5}>
                        <div className="nav-links">
                            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'nav-link-active' : ''}`}>
                                {t('trading')}
                            </Link>
                            <Link to="/liquidity" className={`nav-link ${location.pathname === '/liquidity' ? 'nav-link-active' : ''}`}>
                                {t('liquidity_pool')}
                            </Link>
                            <Link to="/query" className={`nav-link ${location.pathname === '/query' ? 'nav-link-active' : ''}`}>
                                {t('query')}
                            </Link>
                        </div>
                    </Col>

                    <Col span={5} style={{ textAlign: "right", paddingRight: "20px" }}>
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