import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css'
import {Header, TopBar, Footer} from '../components/common';
import { useRouter } from 'next/router'
import { Cancel } from '../components/alert';

export default function Home() {
    
    const router = useRouter()
    const query = router.query

    if(!query.checksum) {
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
                <Cancel query={query} />
            </div>
            
            </main>
    
            <Footer />
        </div>
        )
    }
  }
  