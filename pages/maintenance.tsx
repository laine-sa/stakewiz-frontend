import React, { useEffect, useState } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css'
import {Header, TopBar, Footer} from '../components/common'


export default function Home() {

    return (
        <div>
            <Header
                title="Maintenance - Stakewiz"
            />

            <main>
                
                    <div className='container py-5'>         
                        <div className='text-center py-5'>
                            <h3 className='text-white py-5'>Stakewiz is undergoing planned maintenance, we&apos;ll be back shortly!</h3>
                            <h5 className='text-white'>Don&apos;t worry, we&apos;re just tinkering on our machines to make your experience better!</h5>
                        </div>       
                    </div>
                
            </main>
        </div>
    )
}