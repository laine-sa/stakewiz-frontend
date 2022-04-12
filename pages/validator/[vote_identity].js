import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css'
import {Header, TopBar, Footer} from 'components/common';
import { useRouter } from 'next/router'
import { ValidatorDetail } from '../../components/validator'

export default function Home() {
    
    const router = useRouter()
    const { vote_identity } = router.query

    if(!vote_identity) {
        return ''
    }
    else {
        return (
        <div>
            <Header
            title="Stakewiz"
            />
    
            <main>
            <TopBar />
    
            <div className="container full-height">
                <ValidatorDetail
                    vote_identity={vote_identity}
                />
            </div>
            
            </main>
    
            <Footer />
        </div>
        )
    }
  }
  
