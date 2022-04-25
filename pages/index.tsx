import type { NextPage } from 'next'
import React from 'react'
import { clusterStatsI, validatorI, ValidatorListing } from '../components/validator'
import config from '../config.json'
import 'bootstrap-icons/font/bootstrap-icons.css'
import {Header, TopBar, Footer} from '../components/common'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'

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
    alertValidator: validatorI
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
      alertValidator: null
    };

  }

  updateState(state) {
    this.setState(state);
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
              userPubkey={(connected) ? publicKey.toString() : null}
            />
          </div>
        </main>
  
        <Footer />
      </div>
    )
}

export default Home;