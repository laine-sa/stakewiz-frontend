import type { NextPage } from 'next'
import React from 'react'
import { clusterStatsI, validatorI, ValidatorListing } from '../components/validator'
import config from '../config.json'
import 'bootstrap-icons/font/bootstrap-icons.css'
import {Header, TopBar, Footer} from '../components/common'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { checkSolflareEnabled } from '../components/common'

const API_URL = process.env.API_BASE_URL;

class Homepage extends React.Component<
  {
    userPubkey: string;
  },
  {
    validators: [validatorI],
    clusterStats: clusterStatsI,
    filteredValidators: [validatorI],
    hasData: boolean,
    visibleCount: number,
    showWizModal: boolean,
    wizValidator: validatorI,
    showAlertModal: boolean,
    alertValidator: validatorI,
    walletValidators: [string],
    solflareNotificationsEnabled: boolean;
  }> {
  constructor(props) {
    super(props);

    this.state = {
      validators: null,
      clusterStats: null,
      filteredValidators: null,
      hasData: false,
      visibleCount: config.DEFAULT_LIST_SIZE,
      showWizModal: false,
      wizValidator: null,
      showAlertModal: false,
      alertValidator: null,
      walletValidators: null,
      solflareNotificationsEnabled: false
    };

    if(this.props.userPubkey) this.checkSolflare(this.props.userPubkey);
  }

  updateState(state) {
    this.setState(state);
  }

  async checkSolflare(pubkey) {
    let enabled = await checkSolflareEnabled(pubkey);
    
    this.setState({
        solflareNotificationsEnabled: enabled
    });
  }

  render() {
    return [
            <ValidatorListing
                state={this.state}
                updateState={(state) => this.updateState(state)}
                userPubkey={this.props.userPubkey}
                key={'validatorParent'+this.props.userPubkey}
            />
          ]
  }
}


const Home: NextPage = () => {

  let {connected, publicKey} = useWallet();

    return (
    
      <div>
        <Header
          title="Stakewiz"
        />
  
        <main>
          <TopBar />
  
          <div id="vlist" className="container text-white py-2 text-modal-white">
            <Homepage
              key={(publicKey) ? 'homepage'+publicKey.toString() : 'homepage'}
              userPubkey={(connected) ? publicKey.toString() : null}
            />
          </div>
        </main>
  
        <Footer />
      </div>
    )
  
  
}

export default Home;