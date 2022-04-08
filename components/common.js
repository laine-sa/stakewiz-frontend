import Head from 'next/head';
import React from 'react';
import Script from 'next/script'
import Link from 'next/link'
import { Navbar, Container, Nav, NavDropdown } from 'react-bootstrap'
import { WalletDisconnectButton, WalletMultiButton } from '@solana/wallet-adapter-react-ui';

import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

function Spinner() {
  return (
    <div className="container text-center" id='loading-spinner'>
        <div className='spinner-grow text-light' role="status">
            <span className='visually-hidden'>Loading...</span>
        </div>
    </div>
  )
}

class Header extends React.Component {

    render() {
        return (
            <Head>
                <title>{this.props.title}</title>
                <meta name="description" content="Validator monitoring and alerting" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/images/wiz-square.webp" />
            </Head>
        )
    }
}

class TopBar extends React.Component {
    

    render() {

      return (
              [
                <Script
                  key='gtag-script'
                  src="https://www.googletagmanager.com/gtag/js?id=G-L7C5EZ0C4F"
                  strategy="afterInteractive"
                />,
                <Script key='ga-script' id="google-analytics" strategy="afterInteractive">
                  {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){window.dataLayer.push(arguments);}
                    gtag('js', new Date());

                    gtag('config', 'G-L7C5EZ0C4F');
                  `}
                </Script>,
                <Navbar key='navbar' bg="none" variant="dark" expand="lg">
                  <Container>
                    <Navbar.Brand href="/" className='brand-box'>
                        <img 
                          src="/images/stakewiz-logo-white.webp" 
                          className='stakewiz-logo'
                          alt="Stakewiz Logo" 
                        />
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav" className='justify-content-end'>
                      <Nav>
                        <div className='wallet-container'>
                          <WalletMultiButton />
                        </div>
                        <Nav.Link href="/">Home</Nav.Link>
                        <Nav.Link href="/faq">FAQs</Nav.Link>
                        <Nav.Link href="https://laine.co.za/solana" target="_new">Support Laine</Nav.Link>
                      </Nav>
                    </Navbar.Collapse>
                  </Container>
                </Navbar>
              ]
      )
    }
}

class Footer extends React.Component {

  render() {
      return (
          <footer className='container-fluid footer bg-dark p-5 text-white text-center'>
              <div className="container">
              <div className="row"> 
                  <div className="col"> 
                  <Link href="/" passHref>
                    <span className="text-white pointer" >Home</span>
                  </Link>
                  <br />
                  <Link href="/faq" passHref>
                    <span className="text-white pointer" >Frequently Asked Questions</span>
                  </Link>
                  <br />
                  <Link href="/terms" passHref>
                    <span className="text-white pointer" >Terms &amp; Conditions</span>
                  </Link>
                  </div>
                  <div className="col social-icons">
                  <a href="https://discord.gg/3JXdTavv6x" target="_new"><i className="bi bi-discord p-2 pointer"></i></a>
                  <a href="https://twitter.com/laine_sa_" target="_new"><i className="bi bi-twitter p-2 pointer"></i></a>
                  </div>
                  <div className="col"> 
                  This site is protected by reCAPTCHA and the Google&nbsp;<a href="https://policies.google.com/privacy">Privacy Policy</a>&nbsp;and&nbsp;<a href="https://policies.google.com/terms">Terms of Service</a>&nbsp;apply.
                  </div>
              </div>
              </div>
          </footer>
      )
  }
}

export {Header, TopBar, Footer, Spinner}