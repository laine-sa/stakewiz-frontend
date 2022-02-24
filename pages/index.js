import React from 'react';
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import Validator from '../components/validator.js'
import config from '../config.json'
import 'bootstrap-icons/font/bootstrap-icons.css'

const API_URL = process.env.API_BASE_URL;

class Homepage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      validators: null,
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
            <Validator
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
      <Head>
        <title>Stakewiz</title>
        <meta name="description" content="Validator monitoring and alerting" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/favicon.png" />
      </Head>

      <main>
          <div className="container">
          <div className="row">
            <div className="col col-md-4">
              <div className="logo p-3 position-relative">
                <Link href="/" passHref>
                  <Image 
                    src="/images/stakewiz-logo-white.webp" 
                    width={300}
                    height={96}
                    alt="Stakewiz Logo" />
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div id="vlist" className="container text-white py-2">
          <Homepage />
        </div>
      </main>

      <footer className='container-fluid footer bg-dark p-5 text-white text-center'>
        <div className="container">
          <div className="row"> 
            <div className="col"> 
              <Link className="text-white" href="/" passHref>Home</Link>
              <br />
              <Link className="text-white" href="/faq" passHref>Frequently Asked Questions </Link>
              <br />
              <Link className="text-white" href="/terms" passHref>Terms &amp; Conditions</Link>
            </div>
            <div className="col social-icons">
              <Link className="text-white" href="https://discord.gg/3JXdTavv6x" target="_new" passHref><i className="bi bi-discord p-2"></i></Link>
              <Link className="text-white" href="https://twitter.com/laine_sa_" target="_new" passHref><i className="bi bi-twitter p-2"></i></Link>
            </div>
            <div className="col"> 
              This site is protected by reCAPTCHA and the Google&nbsp;<Link href="https://policies.google.com/privacy">Privacy Policy</Link>&nbsp;and&nbsp;<Link href="https://policies.google.com/terms">Terms of Service</Link>&nbsp;apply.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
