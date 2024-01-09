
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
    LedgerWalletAdapter,
    PhantomWalletAdapter,
    SlopeWalletAdapter,
    SolflareWalletAdapter,
    SolletExtensionWalletAdapter,
    SolletWalletAdapter,
    TorusWalletAdapter,
    ExodusWalletAdapter,
    BackpackWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { AppProps } from 'next/app';
import { FC, useMemo,  useEffect, useState, useContext } from 'react';
import { ValidatorContext } from '../components/validator/validatorhook';
import { ValidatorData } from '../components/common';

require('@solana/wallet-adapter-react-ui/styles.css');
require('bootstrap/dist/css/bootstrap.css');
require('react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css')
require("../css/style.css");


const Stakewiz: FC<AppProps> = ({ Component, pageProps }) => {
  // Can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = WalletAdapterNetwork.Mainnet;
  

  // You can also provide a custom RPC endpoint
  //const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const endpoint = process.env.RPC_URL;
  

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded
  const wallets = useMemo(
      () => [
          new PhantomWalletAdapter(),
          new SlopeWalletAdapter(),
          new SolflareWalletAdapter({ network }),
          new TorusWalletAdapter(),
          new LedgerWalletAdapter(),
          new SolletWalletAdapter({ network }),
          new SolletExtensionWalletAdapter({ network }),
          new ExodusWalletAdapter({ network }),
          new BackpackWalletAdapter({ network }),
      ],
      [network]
  );

  const [validators, setValidators] = useState(null);
    useEffect(() => {
        if(validators == null){
            const getValidator = async() => {
                let validatorList : any;
                try{
                    validatorList  = await ValidatorData();
                }catch(e){
                    setTimeout(()=>{ console.log(e)},5000);
                }
                setValidators(validatorList)
            }
            getValidator();
        }
    }, [validators]);

  return (
    <ValidatorContext.Provider value={validators}>
      <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
              <WalletModalProvider>
                  <Component {...pageProps} />
              </WalletModalProvider>
          </WalletProvider>
      </ConnectionProvider>
      </ValidatorContext.Provider>
  );
};

export default Stakewiz;

