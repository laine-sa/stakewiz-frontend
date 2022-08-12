import React, { FC, useEffect, useState, useContext } from 'react';
import Link from 'next/link'
import 'bootstrap-icons/font/bootstrap-icons.css'
import {Header, TopBar, Footer, Spinner} from '../components/common'
import { WizScoreWeightings } from '../components/wizscore';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getStakeAccounts } from 'components/stake/common';
import { ValidatorContext } from '../components/validator/validatorhook';
import { RenderImage, RenderName } from 'components/validator/common';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

const API_URL = process.env.API_BASE_URL;

const Stakes: FC<{userPubkey: string, connection: Connection, connected: boolean}> = ({userPubkey, connection, connected}) => {

    const [ stakes, setStakes ] = useState(null);
    const [renderResult, setRenderResult] = useState<any>(<Spinner />)
    const validatorList = useContext(ValidatorContext)
    const [epoch, setEpoch] = useState(0)

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

    useEffect(() => {
        if(connected && epoch == 0) {
            connection.getEpochInfo()
            .then((epoch) => {
                setEpoch(epoch.epoch)
            })
        }
    })

    const findStakeValidator = (vote_identity) => {
        for(let i = 0; i < validatorList.length; i++) {
            if(validatorList[i].vote_identity == vote_identity) {
                return validatorList[i]
            }
        }
        return null;
    }

    const renderStakeStatus = (stake) => {

        let activation = stake.account.data.parsed.info.stake.delegation.activationEpoch
        let deactivation = stake.account.data.parsed.info.stake.delegation.deactivationEpoch

        if(epoch!=null) {
            if(deactivation<epoch) return 'Inactive'
            else if(deactivation==epoch) {
                if(activation==deactivation) return 'Inactive'
                if(activation < deactivation) return 'Deactivating'
            }
            else if(activation == epoch)    return 'Activating'
            else if(activation < epoch)     return 'Active'
        }
    }

    const renderStakes = () => {
        if(stakes!=null) {
            let result = []
            stakes.map((stake) => {
                let validator = findStakeValidator(stake.account.data.parsed.info.stake.delegation.voter);
                console.log(validator)
                result.push((
                    <tr key={'stake-'+stake.pubkey.toString()}>
                        <th scope='row' className='px-2'>
                            <RenderImage
                                img={validator.image}
                                vote_identity={validator.vote_identity}
                                size={25}
                            />    
                            <RenderName
                                validator={validator}
                            />
                        </th>
                        <td className='px-2'>
                            {stake.pubkey.toString()}
                        </td>
                        <td className='px-2'>
                            ◎ {stake.account.data.parsed.info.stake.delegation.stake/LAMPORTS_PER_SOL}
                        </td>
                        <td className='px-2 fst-italic'>
                            {renderStakeStatus(stake)}
                        </td>
                    </tr>
                ))
            })
            let table = (
                <table className='table text-white'>
                    <thead>
                        <tr>
                            <th scope='col' colSpan={2}>
                                Validator
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {result}
                    </tbody>
                </table>
            )
            setRenderResult(table); 
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
                    <h2 className='text-white py-2'>Manage your stake accounts</h2>
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