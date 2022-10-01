import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link'
import 'bootstrap-icons/font/bootstrap-icons.css'
import {Header, TopBar, Footer} from '../components/common'
import { WizScoreWeightings } from '../components/wizscore';
import axios from 'axios';
import config from '../config.json'
import Talk from 'talkjs';
var random = require('random-name')

const API_URL = process.env.API_BASE_URL;

const getStake = async () => {
    axios(API_URL+config.API_ENDPOINTS.gossip_stake, {
        headers: {'Content-Type':'application/json'}
    })
      .then(response => {
        let json = response.data;
        
        return json;
      })
      .catch(e => {
        console.log(e);
      })
      return null
}

export default function Home() {

    const [stake, setStake] = useState(null);
    const chatboxEl = useRef();
    const [name, setName] = useState(() => random.first())


    const getStake = () => {
        axios(API_URL+config.API_ENDPOINTS.gossip_stake, {
            headers: {'Content-Type':'application/json'}
        })
          .then(response => {
            let json = response.data;
            setStake(json.active_stake);
          })
          .catch(e => {
            console.log(e);
          })
    }

    setTimeout(() => {
            getStake()
        },
        5000
    );

    useEffect(() => {
        if(stake!=null) {
            Talk.ready.then(() => {
                const currentUser = new Talk.User({
                    id: Math.random(),
                    name: name,
                    photoUrl: 'https://avatars.dicebear.com/api/human/'+name+'.svg',
                    role: 'guest',
                });

                const session = new Talk.Session({
                    appId: 'txwElVkJ',
                    me: currentUser,
                });

                const conversation = session.getOrCreateConversation(
                    'stakewiz_groupchat'
                );

                const chatbox = session.createChatbox();
                    chatbox.select(conversation, {asGuest: true});
                    chatbox.mount(chatboxEl.current);
            });
        }
    }, [stake])


    return (
        <div>
            <Header
                title="Restart Tracker - Stakewiz"
            />

            <main>
                <TopBar />

                {(stake!=null) ? (
                    <div className='container h-100'>         
                        <div className='text-center'>
                            <h2 className='text-white'>Cluster restart is underway</h2>
                        </div>       
                        <div className="d-flex justify-content-center my-5">                    
                            <div className="w-50 progress" data-bs-toggle="tooltip" title="See FAQ for formula of this display." data-bs-placement="bottom" style={{height:'30px'}}>                        
                                <div className={"progress-bar progress-bar-striped progress-bar-animated bg-success"} role="progressbar"  style={{width: stake+'%'}}>
                                    {stake+'%'}
                                </div>                    
                            </div>                
                        </div>    
                        <div className='text-center text-white fs-5'>
                            Bar above shows active stake visible in gossip. Once 80% is active the network will restart.
                        </div>       
                        <div className='d-flex h-100 restart-flex'>
                            <div className='text-center text-white fs-6 my-5 flex-grow-1 w-50'>
                                <p>This display was rapidly built to provide insight into the restart. It receives data directly from our validator log every 5 seconds, refresh to update.</p>
                                <p>Built by <a href='http://laine.co.za/solana' target='_new'>Laine</a> - a Solana Validator</p>
                                <p>Join our Discord <a href='https://discord.gg/4jWhWZX7ef' target='_new'>here</a></p>
                                <p>Join our chat on the right. It&apos;s in test mode because we don&apos;t want to pay $280 for a few hours of chat!</p>
                                <p>Information is provided without warranty for its accuracy.</p>
                            </div>         
                            <div ref={chatboxEl} className='flex-grow-1 w-50 chatbox'></div>
                        </div>   
                    </div>     
                ) : (
                    <div className='container'>         
                        <div className='text-center'>
                            <h2 className='text-white'>Loading...</h2>
                        </div>
                    </div>
                    )}
                
            </main>

            <Footer />
        </div>
    )
}