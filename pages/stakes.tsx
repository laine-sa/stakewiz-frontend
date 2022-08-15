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

                <div className='container text-center'>
                    <h2 className='text-white py-2'>Manage your stake accounts</h2>
                    {(connected && publicKey != null) ? (
                        <div className='d-flex flex-wrap justify-content-center'>
                            <Stakes 
                                key={'stakes-container-'+publicKey.toString()}
                                userPubkey={publicKey.toString()}
                                connection={connection}
                                connected={connected}
                            /> 
                        </div>
                    ) : null}
                </div>
                
            </main>

            <Footer />
        </div>
    )
}