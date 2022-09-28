import React, { FC, useEffect, useState, useContext } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css'
import {Header, TopBar, Footer, Spinner} from '../components/common'
import { Stakes } from '../components/stake/my-stakes'
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';


export default function Home() {

    let {connection} = useConnection()
    let {connected, publicKey} = useWallet()
    let [userPublicKey, setUserPublicKey] = useState(null)
    let [manualEntry, setManualEntry] = useState('')
    let [manualError, setManualError] = useState('')

    useEffect(() => {
        setUserPublicKey(null)
    }, [connected])

    const setPublicKey = () => {
        setManualError('')
        try {
            setUserPublicKey(new PublicKey(manualEntry))
            setManualEntry('')
        }
        catch(e) {
            console.log(e.message)
            setManualError(e.message)
        }
    }

    return (
        <div>
            <Header
                title="Manage Stake Accounts - Stakewiz"
            />

            <main>
                <TopBar />

                <div className='container p-relative'>
                    {(userPublicKey!==null || publicKey !== null) ? (
                    <Stakes 
                        key={(publicKey===null) ? 'stakes-container-'+userPublicKey.toString() : 'stakes-container-'+publicKey}
                        userPubkey={(publicKey===null) ? userPublicKey : publicKey}
                        connection={connection}
                        connected={connected}
                        unsetUserPublicKey={() => setUserPublicKey(null)}
                    /> 
                    ) : (
                        <div className='d-flex flex-column  align-items-center justify-content-center text-white py-5'>
                            <div className='fs-6 text-center'>
                                Please connect your wallet to manage your stake accounts or enter a wallet address below
                            </div>
                            <div className='my-stakes-manual-input'>
                                <input type='text' className='form-control my-2' placeholder='Enter wallet address/pubkey here' onChange={(event) => setManualEntry(event.target.value)} /> 
                                <input type='submit' className='form-control btn btn-outline-light mb-1' value='Submit' onClick={() => setPublicKey()} />
                                {(manualError!='') ? (
                                    <div className='alert alert-danger p-2 text-center'>
                                        That doesn&apos;t seem like a valid wallet address, please double check and try again.<br /><br />Make sure you enter the address of the owner wallet, not of the stake account.
                                    </div> ) : null}
                            </div>
                        </div>
                    )}
                </div>
                
            </main>

            <Footer />
        </div>
    )
}