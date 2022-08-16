import React, { FC, useEffect, useState, useContext } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css'
import {Header, TopBar, Footer, Spinner} from '../components/common'
import { Stakes } from '../components/stake/my-stakes'
import { useConnection, useWallet } from '@solana/wallet-adapter-react';


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

                <div className='container p-relative'>
                    {(connected) ? (
                    <Stakes 
                        key={'stakes-container-'+publicKey.toString()}
                        userPubkey={publicKey.toString()}
                        connection={connection}
                        connected={connected}
                    /> 
                    ) : (
                        <div className='d-flex justify-content-center fs-5 text-white py-5'>
                            Please connect your wallet to manage your stake accounts.
                        </div>
                    )}
                </div>
                
            </main>

            <Footer />
        </div>
    )
}