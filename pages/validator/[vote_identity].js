import React, { useEffect, useState } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css'
import {Header, TopBar, Footer} from 'components/common';
import { useRouter } from 'next/router'
import { ValidatorDetail } from '../../components/validator'

export default function Home() {
    
    const router = useRouter()
    const { vote_identity } = router.query

    const [title, setTitle] = useState('Stakewiz');

    const updateTitle = (name) => {
        setTitle(name);
    };

    useEffect(() => {
        document.title = title;
    }, []);

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
                />
            </div>
            
            </main>
    
            <Footer />
        </div>
        )
    }
  }
  
