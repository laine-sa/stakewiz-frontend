import React, {useEffect, useState, FC, useCallback} from 'react';
import { clusterStatsI, validatorI } from './validator/interfaces'
import config from '../config.json';
import { Modal, Button, Overlay, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Authorized, Connection, Keypair, LAMPORTS_PER_SOL, Lockup, PublicKey, StakeProgram, Transaction } from '@solana/web3.js';
import RangeSlider from 'react-bootstrap-range-slider'


const StakeInput: FC<{
    balance: number;
    stakeAmount: number;
    updateAmount: Function;
}> = ({balance, stakeAmount, updateAmount}) => {
    
    const { connection } = useConnection();
    const {connected, publicKey} = useWallet();

    const [sliderValue, setSliderValue] = useState(stakeAmount);

    const processUpdate = (amount) => {
        updateAmount(amount);
        setSliderValue(amount);
    }

    return (
        <div className='row my-2 d-flex align-items-center'>
            <div className='col col-md-1'>
                <span onClick={() => processUpdate(5000/LAMPORTS_PER_SOL)} className='pointer'>Min</span>
            </div>
            <div className='col'>
                <RangeSlider 
                    value={sliderValue} 
                    min={5000/LAMPORTS_PER_SOL}
                    max={(balance-50000)/LAMPORTS_PER_SOL} 
                    step={5000/LAMPORTS_PER_SOL}
                    onChange={(event) => processUpdate(parseFloat(event.target.value))}
                    tooltip='off'
                    variant='dark'
                />
            </div>
            <div className='col col-md-1 text-right'>
                <span onClick={() => processUpdate((balance-50000)/LAMPORTS_PER_SOL)} className='pointer'>Max</span>
            </div>
        </div>
        
    )

}

export const StakeDialog: FC<{
    validator: validatorI, 
    showStakeModal: boolean, 
    hideStakeModal: Function,
    clusterStats: clusterStatsI
}> = ({validator,showStakeModal,hideStakeModal,clusterStats}) => {

    const { connection } = useConnection();
    const {connected, publicKey, sendTransaction} = useWallet();

    const [stakeAmount, setStakeAmount] = useState(null);
    const [balance, setBalance] = useState(0);

    const[renderTime, setRenderTime] = useState(Math.floor(Date.now() / 1000));

    const validateAmount = (amount) => {
        setRenderTime(Math.floor(Date.now() / 1000));
        if(amount > balance/LAMPORTS_PER_SOL) setStakeAmount(balance/LAMPORTS_PER_SOL);
        else setStakeAmount(amount);
    }

    useEffect(() => {
        if(publicKey && connection) {
            connection.getBalance(publicKey).then((resolved) => {
            setBalance(resolved);
            if(stakeAmount==null) setStakeAmount(resolved/LAMPORTS_PER_SOL);
        })
        .catch((error) => {
            console.log(error);
        });
    }
    }, [renderTime]);

    const renderName = () => {
        if(validator!=null) {
            if(validator.name!='') {
                return validator.name;
            }
            else {
                return validator.vote_identity;
            }
        }
    }

    const doStake = async () => {
        
        let stakeKeys = Keypair.generate();
        let auth = new Authorized(
            publicKey,
            publicKey
        );

        console.log(stakeKeys.publicKey.toString());

        let stakeTx = StakeProgram.createAccount({
            authorized: auth,
            fromPubkey: publicKey,
            lamports: stakeAmount*LAMPORTS_PER_SOL,
            lockup: new Lockup(0,0, publicKey),
            stakePubkey: stakeKeys.publicKey
        });


        let recentBlockhash = await connection.getLatestBlockhash();
        
        let votePubkey = new PublicKey(validator.vote_identity);

        let delegateIx = StakeProgram.delegate({
            authorizedPubkey: publicKey,
            stakePubkey: stakeKeys.publicKey,
            votePubkey: votePubkey
        });

        stakeTx.add(delegateIx);

        stakeTx.feePayer = publicKey;
        stakeTx.recentBlockhash = recentBlockhash.blockhash;
        stakeTx.sign(stakeKeys);

        let signature = await sendTransaction(stakeTx, connection);

        console.log(signature);

        await connection.confirmTransaction(signature, 'processed');

    };

    if(validator!=null && clusterStats !=null) {
        return (
            <Modal show={showStakeModal} onHide={() => hideStakeModal()} dialogClassName='modal-md'>
                <Modal.Header closeButton>
                    <Modal.Title className='text-center'>Create Stake</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className='row'>
                        <div className='col col-md-3 fw-bold'>
                            Validator
                        </div>
                        <div className='col col-auto'>
                            {renderName()}
                        </div>
                    </div>
                    <div className='row'>
                        <div className='col col-md-3 fw-bold'>
                            Vote Account
                        </div>
                        <div className='col col-md-9 text-truncate'>
                                {validator.vote_identity}
                        </div>
                    </div>
                    <div className='row my-2 text-center text-secondary'>
                        <div className='col'>
                            <div className={(validator.wiz_score>80) ? 'text-success' : 'text-warning'}>
                                {validator.wiz_score} %
                            </div>
                            <div className='fw-bold'>
                                Wiz Score
                            </div>
                        </div>
                        <div className='col'>
                            <div className={(validator.skip_rate<clusterStats.avg_skip_rate*2) ? 'text-success' : 'text-danger'}>
                                {validator.skip_rate.toFixed(1)} %
                            </div>
                            <div className='fw-bold'>
                                Skip rate
                            </div>
                        </div>
                        <div className='col'>
                            <div className={(validator.credit_ratio>80) ? 'text-success' : 'text-warning'}>
                                {validator.credit_ratio} %
                            </div>
                            <div className='fw-bold'>
                                Vote Success
                            </div>
                        </div>
                        <div className='col'>
                            <div className={(validator.commission<10) ? 'text-black' : 'text-danger'}>
                                {validator.commission} %
                            </div>
                            <div className='fw-bold'>
                                Commission
                            </div>
                        </div>
                    </div>
                    <div className='row my-3 text-center justify-content-center d-flex'>
                        <div className='col-md-6 rounded border border-secondary border-2 bg-light p-2'>
                            <div className='fs-3'>{validator.apy_estimate} %</div>
                            <div className='fw-bold fs-6'>Estimated APY</div>
                        </div>
                    </div>
                    <div className='row'>
                        <StakeInput
                            balance={balance}
                            stakeAmount={stakeAmount}
                            updateAmount={(amount) => validateAmount(amount)}
                        />
                    </div>
                    <div className='row text-center'>
                        <div className='input-group input-group-lg'>
                            <span className='input-group-text' id='stakeAmountInputText'>◎</span>
                            <input  
                                className='form-control text-center' 
                                name='stakeAmountInput' 
                                type='number' 
                                value={stakeAmount} 
                                onChange={(event) => validateAmount(parseFloat(event.target.value))} 
                                max={balance/LAMPORTS_PER_SOL}    
                                min={5000/LAMPORTS_PER_SOL}
                                
                            />
                        </div>
                    </div>
                    <div className='row m-1'>
                        <div className='col'>
                            The maximum stake is your balance minus 50,000 lamports, to ensure you have some SOL left to unstake in future.
                        </div>
                    </div>


                </Modal.Body>
                <Modal.Footer className='d-flex justify-content-center'>
                    <Button 
                        variant="success" 
                        onClick={() => doStake()}
                        className='w-75 btn-lg'
                        >
                        Stake
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
    else {
        return null;
    }
        
}
