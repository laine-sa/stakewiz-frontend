import React, { FC, useEffect, useState, useContext } from 'react';
import Link from 'next/link'
import 'bootstrap-icons/font/bootstrap-icons.css'
import {Header, TopBar, Footer} from '../components/common'
import { WizScoreWeightings } from '../components/wizscore';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getStakeAccounts } from 'components/stake';
import { ValidatorContext } from '../components/validator/validatorhook';
import { RenderImage, RenderName } from 'components/validator/common';
import { validatorI } from 'components/validator/interfaces';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const API_URL = process.env.API_BASE_URL;

const Stakes: FC<{userPubkey, connection, connected}> = ({userPubkey, connection, connected}) => {

    const [ stakes, setStakes ] = useState(null);
    const [renderResult, setRenderResult] = useState(null)
    const validatorList = useContext(ValidatorContext)

    useEffect(() => {
        if(stakes == null) {
            getStakeAccounts(userPubkey, connection).then((stakes) => {
                console.log(stakes)
                setStakes(stakes);
            })
            
        }
    }, [userPubkey])

    useEffect(() => {
        renderStakes()
    }, [stakes, validatorList])

    const findStakeValidator = (vote_identity) => {
        for(let i = 0; i < validatorList.length; i++) {
            if(validatorList[i].vote_identity == vote_identity) {
                return validatorList[i]
            }
        }
        return null;
    }

    const renderStakes = () => {
        if(stakes!=null) {
            let result = []
                stakes.map((stake) => {
                    let validator = findStakeValidator(stake.account.data.parsed.info.stake.delegation.voter);
                    console.log(validator)
                    result.push((
                        <div className='d-flex border border-light p-2 rounded mb-1 text-white align-items-center text-left' key={'stake-'+stake.pubkey.toString()}>
                            <div className='px-2 flex-shrink-1'>
                                <RenderImage
                                    img={validator.image}
                                    vote_identity={validator.vote_identity}
                                    size={25}
                                />    
                            </div>
                            <div className='px-2 w-25'>
                                <RenderName
                                    validator={validator}
                                />
                            </div>
                            <div className='px-2 flex-grow-1'>
                                {stake.pubkey.toString()}
                            </div>
                            <div className='px-2'>
                                ◎ {stake.account.data.parsed.info.stake.delegation.stake/LAMPORTS_PER_SOL}
                            </div>
                        </div>
                    ))
                })
            setRenderResult(result); 
        }
        
    }
    
    if(!connected || userPubkey == null) {
        return (
            <div className='w-50 p-2 border border-light text-light rounded text-center fs-5 m-auto mt-5'>
                Please connect your wallet to view your stake accounts.
            </div>
        )
    }
    else {
        return renderResult
    }
}

export default function Home() {

    let {connection} = useConnection();
    let {connected, publicKey} = useWallet();

    return (
        <div>
            <Header
                title="Manage Stake Accounts - Stakewiz"
            />

            <main>
                <TopBar />

                <div className='container'>
                    {(connected && publicKey != null) ? <Stakes 
                        key={'stakes-container-'+publicKey.toString()}
                        userPubkey={publicKey.toString()}
                        connection={connection}
                        connected={connected}
                    /> : null}
                </div>
                
            </main>

            <Footer />
        </div>
    )
}