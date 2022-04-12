import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css'
import {Header, TopBar, Footer} from '../components/common';
import { useRouter } from 'next/router'
import { Activate } from '../components/alert';

export default function Home() {
    
    const router = useRouter()
    const {token} = router.query

    if(!token) {
        return ''
    }
    else {
        let t: string = token as string;
        return (
        <div>
            <Header
            title="Stakewiz"
            />
    
            <main>
            <TopBar />
    
            <div className="container full-height">
                <Activate token={t} /> 
            </div>
            
            </main>
    
            <Footer />
        </div>
        )
    }
  }
  