import React from 'react';
import axios from 'axios';
import 'bootstrap-icons/font/bootstrap-icons.css'
import {Header, TopBar, Footer} from '../../components/common.js';
import { useRouter } from 'next/router'
import { Activate } from '../../components/alert.js';

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
                <h1>{vote_identity}</h1>
            </div>
            
            </main>
    
            <Footer />
        </div>
        )
    }
  }
  
