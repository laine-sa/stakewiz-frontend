import React from 'react';
import axios from 'axios';
import 'bootstrap-icons/font/bootstrap-icons.css'
import {Header, TopBar, Footer} from '../components/common.js';
import { useRouter } from 'next/router'
import { Activate } from '../components/alert.js';

export default function Home() {
    
    const router = useRouter()
    const {token} = router.query

    if(!token) {
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
                <Activate token={token} /> 
            </div>
            
            </main>
    
            <Footer />
        </div>
        )
    }
  }
  