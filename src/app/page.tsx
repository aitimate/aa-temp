"use client";

import {Web3Auth} from "@web3auth/modal";
import {useEffect, useState} from "react";
import {Config} from "@/config/config";
import styled from "styled-components";
import {ECDSAProvider} from "@zerodev/sdk";
import {SmartAccountSigner, UserOperationCallData} from "@alchemy/aa-core";
import {ethers} from "ethers";

const Between = styled.div`
  display: flex;
  justify-content: space-between;
`

const Button = styled.button`
  width: 6vw;
  height: 2.5vw;
`

const Title = styled.div`
  height: 5vw;
  font-size: 2rem;
  align-content: center;
  justify-content: center;
  color: #007e8d;
`

export default function App() {
    const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
    const [loggedIn, setLoggedIn] = useState(false);
    const [provider, setProvider] = useState<ECDSAProvider>();
    const refresh = async () => {
        setLoggedIn(web3auth?.status === "connected")
        if (web3auth?.provider) {
            const ethersProvider = new ethers.BrowserProvider(web3auth.provider);
            const signer = await ethersProvider.getSigner();
            const ecdsaProvider = await ECDSAProvider.init({
                projectId: Config.ZeroDev,
                // The signer
                owner: signer as any as SmartAccountSigner,
            });
            setProvider(ecdsaProvider)
            const priKey = await web3auth.provider.request({method: "eth_private_key"})
            const wallet = new ethers.Wallet(priKey as string)
            // EOA: 0xF47e962E7b3160b8BB9288AC19cd41948DeF9849
            // page.tsx:48 AaWallet: 0xE76B9aC7D90D33287c3Ab318A10880998e7c3034
            console.log("EOA:", wallet.address)
            console.log("EOA PriKey:", priKey)
            console.log("AaWallet:", await ecdsaProvider.getAddress())
        }
    }

    useEffect(() => {
        const init = async () => {
            try {
                const web3auth = new Web3Auth(Config.Web3Auth.Goerli);
                setWeb3auth(web3auth);
                await web3auth.initModal();
            } catch (error) {
                console.error(error);
            }
        };
        init().then(refresh);
    }, []);

    const login = async () => {
        await web3auth!.connect();
        await refresh();
    };

    const logout = async () => {
        await web3auth!.logout();
        await refresh();
    };

    const mock = async () => {
        const uniFace = new ethers.Interface(Config.abi)
        const mint: UserOperationCallData = {
            target: Config.erc20 ,
            data: uniFace.encodeFunctionData('sudoMint', [Config.aaWallet, 10000n * 10n ** 18n]),
        } as any
        const approve: UserOperationCallData = {
            target: Config.erc20,
            data: uniFace.encodeFunctionData('approve', [Config.platform, 10000n * 10n ** 18n]),
        }  as any
        const stake: UserOperationCallData = {
            target: Config.platform,
            data: uniFace.encodeFunctionData('stake', [Config.erc20, 1n * 10n ** 18n]),
        }  as any
        const sendUserOperation = await provider?.sendUserOperation([mint, approve, stake],{
            verificationGasLimit: "0x430520"
        } as any);
        console.log(sendUserOperation)
    }

    if (loggedIn) {
        return (
            <>
                <Between>
                    <Title>
                        Social AA
                    </Title>
                    <Button onClick={logout} className="card">
                        Log Out
                    </Button>
                </Between>
                <button onClick={mock} className="card">
                    Click: [mint, approve, stake]
                </button>
            </>
        )
    }
    return (
        <>
            <Between>
                <Title>
                    Social Aa
                </Title>
                <Button onClick={login} className="card">
                    Login
                </Button>
            </Between>
        </>
    )
}
