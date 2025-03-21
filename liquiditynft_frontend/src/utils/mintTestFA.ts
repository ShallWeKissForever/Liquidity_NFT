import { InputTransactionData } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const mintFaAddress = "0x71dfdf10572f2d5ba5a66ccbf6e7a785d201fdb4bda312a870deeec3d8fd2f96";

export const handleMintTestFA = async (signAndSubmitTransaction: (transaction: InputTransactionData) => Promise<{ hash: string }>) => {
    const aptosConfig = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(aptosConfig);

    const transactionMintBTC: InputTransactionData = {
        data: {
            function: `${mintFaAddress}::launchpad1::mint_fa`,
            functionArguments: [
                "0x6184d78efca94412c86a924d76795e2bc7c7185fcc63c425a45a02749e58e731",
                1_000_000_000_000
            ]
        }
    };

    const transactionMintAPT: InputTransactionData = {
        data: {
            function: `${mintFaAddress}::launchpad1::mint_fa`,
            functionArguments: [
                "0xdff567dd9ac79fd8f18cb7150c7c487d59bbec2334b0707a17cc9fafee710e6e",
                1_000_000_000_000
            ]
        }
    };

    const transactionMintETH: InputTransactionData = {
        data: {
            function: `${mintFaAddress}::launchpad1::mint_fa`,
            functionArguments: [
                "0xf4ead8c3e1b47837ddae82e9a58e8e6d3fb719fe538bc71a8476444e8ceb4f3c",
                1_000_000_000_000
            ]
        }
    };

    const transactionMintSUI: InputTransactionData = {
        data: {
            function: `${mintFaAddress}::launchpad1::mint_fa`,
            functionArguments: [
                "0xa945fdeded2e060125f502de64886ce5e7b0849647afa1004dff511b9e990038",
                1_000_000_000_000
            ]
        }
    };

    try {
        const responseMintBTC = await signAndSubmitTransaction(transactionMintBTC);
        await aptos.waitForTransaction({ transactionHash: responseMintBTC.hash });

        const responseMintAPT = await signAndSubmitTransaction(transactionMintAPT);
        await aptos.waitForTransaction({ transactionHash: responseMintAPT.hash });

        const responseMintETH = await signAndSubmitTransaction(transactionMintETH);
        await aptos.waitForTransaction({ transactionHash: responseMintETH.hash });

        const responseMintSUI = await signAndSubmitTransaction(transactionMintSUI);
        await aptos.waitForTransaction({ transactionHash: responseMintSUI.hash });

    } catch (error) {
        console.log(error);
    }
};