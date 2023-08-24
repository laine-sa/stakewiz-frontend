import React, { useEffect, useState } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css'
import {Header, TopBar, Footer} from 'components/common';
import { useRouter } from 'next/router'
import { ValidatorDetail } from '../../components/validator/detail'
import { checkSolflareEnabled } from '../../components/common';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

export default function Home() {
    
    const router = useRouter()
    const { vote_identity } = router.query

    const [title, setTitle] = useState('Stakewiz');

    const [solflareEnabled, setSolflareEnabled] = useState(false);

    const updateTitle = (name) => {
        setTitle(name);
    };

    useEffect(() => {
        document.title = title;
    }, []);

    let { connection } = useConnection();
    let {connected, publicKey} = useWallet();


    if(publicKey) checkSolflareEnabled(publicKey.toString()).then(bool => {
        
        setSolflareEnabled(bool);
    });

    if(!vote_identity) {
        return ''
    }
    else {
        return (
        <div>
            <Header
            title={title}
            />
    
            <main>
            <TopBar />
    
            <div className="container full-height">
                <ValidatorDetail
                    vote_identity={vote_identity}
                    updateTitle={(name) => {updateTitle(name)}}
                    userPubkey={(connected) ? publicKey.toString() : null}
                    solflareEnabled={solflareEnabled}
                    connection={(connected) ? connection : null}
                    connected={connected}
                />
            </div>
            
            </main>
    
            <Footer />
        </div>
        )
    }
  }
  
