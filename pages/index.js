import React from 'react';
import { ValidatorListing } from '../components/validator.js'
import config from '../config.json'
import 'bootstrap-icons/font/bootstrap-icons.css'
import {Header, TopBar, Footer} from '../components/common.js';

const API_URL = process.env.API_BASE_URL;

class Homepage extends React.Component {
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
                onClick={(state) => this.updateState(state)}
                key='validatorParent'
            />
          ]
  }
}


export default function Home() {
  return (
    <div>
      <Header
        title="Stakewiz"
      />

      <main>
        <TopBar />

        <div id="vlist" className="container text-white py-2">
          <Homepage />
        </div>
        
      </main>

      <Footer />
    </div>
  )
}
