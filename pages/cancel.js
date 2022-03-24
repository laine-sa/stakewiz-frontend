import React from 'react';
import axios from 'axios';
import 'bootstrap-icons/font/bootstrap-icons.css'
import {Header, TopBar, Footer} from '../components/common.js';
import { useRouter } from 'next/router'
import { Cancel } from '../components/alert.js';

export default function Home() {
    
    const router = useRouter()
    const query = router.query
    console.log(router.query)

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
  