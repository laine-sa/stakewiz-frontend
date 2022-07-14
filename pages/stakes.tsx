import React, { FC, useEffect, useState } from 'react';
import Link from 'next/link'
import 'bootstrap-icons/font/bootstrap-icons.css'
import {Header, TopBar, Footer} from '../components/common'
import { WizScoreWeightings } from '../components/wizscore';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getStakeAccounts } from 'components/stake';

const API_URL = process.env.API_BASE_URL;

const Stakes: FC<{userPubkey, connection, connected}> = ({userPubkey, connection, connected}) => {

    const [ stakes, setStakes ] = useState(null);
    const [renderResult, setRenderResult] = useState(null)

    useEffect(() => {
        if(connected && stakes == null) {
            getStakeAccounts(userPubkey, connection).then((stakes) => {
                console.log(stakes)
                setStakes(stakes);
            })
        }
    })

    useEffect(() => {
        renderStakes()
    }, [stakes])

    const renderStakes = () => {
        if(stakes!=null) {
            let result = []
                stakes.map((stake) => {
                    result.push((
                        <div className='d-flex border border-light p-2 rounded' key={'stake-'+stake.pubkey.toString()}>
                            {stake.pubkey.toString()}
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