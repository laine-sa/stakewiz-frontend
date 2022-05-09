import React, {useEffect, useState, FC, useCallback} from 'react';
import { clusterStatsI, EpochInfoI, validatorI } from './validator/interfaces'
import config from '../config.json';
import { Modal, Button, Overlay, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Authorized, Connection, Keypair, LAMPORTS_PER_SOL, Lockup, PublicKey, StakeProgram, Transaction } from '@solana/web3.js';
import RangeSlider from 'react-bootstrap-range-slider'
import { RenderImage } from './validator/common';
import { getEpochInfo } from './common';


const StakeInput: FC<{
    balance: number;
    minStakeAmount: number;
    stakeAmount: number;
    updateAmount: Function;
}> = ({balance, minStakeAmount, stakeAmount, updateAmount}) => {
    
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
                <span onClick={() => processUpdate(minStakeAmount/LAMPORTS_PER_SOL)} className='pointer'>Min</span>
            </div>
            <div className='col'>
                <RangeSlider 
                    value={sliderValue} 
                    min={minStakeAmount/LAMPORTS_PER_SOL}
                    max={(balance-config.TX_RESERVE_LAMPORTS)/LAMPORTS_PER_SOL} 
                    step={5000/LAMPORTS_PER_SOL}
                    onChange={(event) => processUpdate(parseFloat(event.target.value))}
                    tooltip='off'
                    variant='light'
                />
            </div>
            <div className='col col-md-1 text-right'>
                <span onClick={() => processUpdate((balance-config.TX_RESERVE_LAMPORTS)/LAMPORTS_PER_SOL)} className='pointer'>Max</span>
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

    const [stakeRentExemptAmount, setStakeRentExemptAmount] = useState(0);
    const [stakeAmount, setStakeAmount] = useState(null);
    const [balance, setBalance] = useState(0);

    const[renderTime, setRenderTime] = useState(Math.floor(Date.now() / 1000));

    const [epochInfo, setEpochInfo] = useState<EpochInfoI | null>(null);
    const [epochReturn, setEpochReturn] = useState(0);
    const [monthReturn, setMonthReturn] = useState(0);

    const [submitError, setSubmitError] = useState();

    const calculateReturns = async () => {
        let epoch;
        if(epochInfo==undefined) {
            epoch = await getEpochInfo();
            setEpochInfo(epoch);
        }
        if(epochInfo!=undefined || epoch != undefined) {

            if(epoch == undefined) epoch = epochInfo;
        
            let epoch_return = Math.pow(1+validator.apy_estimate/100, 1/epoch.epochs_per_year)-1;
            setEpochReturn(epoch_return);

            let month_return = Math.pow(1+epoch_return, epoch.epochs_per_year/12)-1;
            setMonthReturn(month_return);
            
        }
    }

    const validateAmount = (amount) => {
        setRenderTime(Math.floor(Date.now() / 1000));
        if(amount > balance/LAMPORTS_PER_SOL) setStakeAmount((balance-config.TX_RESERVE_LAMPORTS)/LAMPORTS_PER_SOL);
        else setStakeAmount(amount);

        calculateReturns();
    }

    const getBalance = () => {
        if(publicKey && connection) {
            connection.getBalance(publicKey)
            .then((resolved) => {
                setBalance(resolved);
                if(stakeAmount==null) setStakeAmount((resolved-config.TX_RESERVE_LAMPORTS)/LAMPORTS_PER_SOL);
                calculateReturns();
            })
            .catch((error) => {
                console.log(error);
            });

        }
    }

    const getStakeRentExemptAmount= () => {
        if(publicKey && connection) {
            connection.getMinimumBalanceForRentExemption(StakeProgram.space)
            .then((resolved) => {
                setStakeRentExemptAmount(resolved);
            })
            .catch((error) => {
                console.log(error);
            });

        }
    };

    useEffect(() => {
        if(publicKey && connection) {
            getBalance();
            getStakeRentExemptAmount();

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

        setSubmitError(undefined);

        try {
            
            let stakeKeys = Keypair.generate();
            let auth = new Authorized(
                publicKey,
                publicKey
            );

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
        }
        catch(error) {
            setSubmitError(error.message);
        }

    };

    if(validator!=null && clusterStats !=null) {
        return (
            <Modal show={showStakeModal} onHide={() => hideStakeModal()} dialogClassName='modal-md stake-modal-modal'>
                <Modal.Body className='py-0'>
                    {(validator.image!='') ? (
                    <div className='d-flex justify-content-center validator-logo'>
                        <div className='fw-bold fs-5 mb-2'>
                            <RenderImage
                                img={validator.image}
                                vote_identity={validator.vote_identity}
                                size={100}
                                className='border border-secondary border-2'
                            />
                        </div>
                    </div>
                    ) : null}
                    <div className='d-flex justify-content-center'>
                        <div className='fw-bold fs-5 mb-2'>
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
                    <div className='row'>
                        <div className='col col-md-3 fw-bold'>
                            Identity
                        </div>
                        <div className='col col-md-9 text-truncate'>
                                {validator.identity}
                        </div>
                    </div>
                    <div className='row my-2 text-center text-light'>
                        <div className='col'>
                            <div className={(validator.wiz_score>80) ? 'text-success' : 'text-warning'}>
                                {validator.wiz_score} %
                            </div>
                            <div>
                                Wiz Score
                            </div>
                        </div>
                        <div className='col'>
                            <div className={(validator.skip_rate<clusterStats.avg_skip_rate*2) ? 'text-success' : 'text-danger'}>
                                {validator.skip_rate.toFixed(1)} %
                            </div>
                            <div>
                                Skip rate
                            </div>
                        </div>
                        <div className='col'>
                            <div className={(validator.credit_ratio>80) ? 'text-success' : 'text-warning'}>
                                {validator.credit_ratio} %
                            </div>
                            <div>
                                Vote Success
                            </div>
                        </div>
                        <div className='col'>
                            <div className={(validator.commission<10) ? null : 'text-danger'}>
                                {validator.commission} %
                            </div>
                            <div>
                                Commission
                            </div>
                        </div>
                    </div>
                    <div className='row mt-3 text-center justify-content-center d-flex'>
                        <div className='col-md-6 rounded border border-light border-2 bg-secondary text-dark p-2'>
                            <div className='fs-4'>{validator.apy_estimate} %</div>
                            <div className='fw-bold fs-6'>Estimated APY</div>
                        </div>
                    </div>
                    {(balance > stakeRentExemptAmount) ? ([
                    <div className='row' key='stakeInputDiv1'>
                        <StakeInput
                            key={'range-slider-'+stakeAmount}
                            balance={balance}
                            minStakeAmount={stakeRentExemptAmount}
                            stakeAmount={stakeAmount}
                            updateAmount={(amount) => validateAmount(amount)}
                        />
                    </div>,
                    <div className='row text-center' key='stakeInputDiv2'>
                        <div className='input-group input-group-lg'>
                            <span className='input-group-text' id='stakeAmountInputText'>◎</span>
                            <input  
                                className='form-control text-center' 
                                name='stakeAmountInput' 
                                type='number' 
                                value={stakeAmount} 
                                onChange={(event) => validateAmount(parseFloat(event.target.value))} 
                                
                                max={(balance - config.TX_RESERVE_LAMPORTS) / LAMPORTS_PER_SOL}    
                                min={stakeRentExemptAmount / LAMPORTS_PER_SOL}
                                
                            />
                        </div>
                        <div className="balance-sm text-end text-secondary">Balance: ◎ {balance/LAMPORTS_PER_SOL}</div>
                    </div>,
                    <div className='row m-2'  key='stakeInputDiv3'>
                        <div className='col text-center'>
                            The maximum stake is your balance minus ◎ {config.TX_RESERVE_LAMPORTS/LAMPORTS_PER_SOL}, to ensure you have some SOL left for future transactions.
                        </div>
                    </div>
                    ]) : (
                        <div className='fs-3 text-danger text-center'>
                            Insufficient funds to stake.
                            <div className='fs-6 text-secondary px-2'>You need at least ◎ {stakeRentExemptAmount/LAMPORTS_PER_SOL} for rent plus the amount you'd like to stake.</div>
                        </div>

                    )}
                    <div className='row'>
                        
                        <div className='col fs-5 m-2'>
                            Projected Returns
                        </div>
                    </div>
                    <div className='row m-1'>
                        <table className='table table-sm table-dark table-responsive'>
                            <thead>
                                <tr>
                                    <th scope='col'>
                                        Period
                                    </th>
                                    <th scope='col'>
                                        ◎ earned
                                    </th>
                                    <th scope='col'>
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        Epoch
                                    </td>
                                    <td>
                                        {(stakeAmount * epochReturn).toFixed(8)}
                                    </td>
                                    <td>
                                        {(stakeAmount + stakeAmount * epochReturn).toFixed(8)}
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        Month
                                    </td>
                                    <td>
                                        {(stakeAmount * monthReturn).toFixed(8)}
                                    </td>
                                    <td>
                                        {(stakeAmount + stakeAmount * monthReturn).toFixed(8)}
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        Year
                                    </td>
                                    <td>
                                        {(stakeAmount * validator.apy_estimate/100).toFixed(8)}
                                    </td>
                                    <td>
                                        {(stakeAmount + stakeAmount * validator.apy_estimate/100).toFixed(8)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    {(submitError!=undefined) ? (
                        <div className='bg-danger rounded m-1 p-2 text-white text-center'>
                            {submitError}. Please try again.
                        </div>
                    ) : null}
                </Modal.Body>
                <Modal.Footer className='d-flex justify-content-center flex-column border-0'>
                    {(balance > stakeRentExemptAmount) ? ([
                        
                            <Button 
                                variant="success" 
                                onClick={() => doStake()}
                                className='w-75 btn-lg'
                                key='stake-confirm-button'
                                >
                                Stake
                            </Button>
                        ,
                        <div 
                            className='text-secondary pointer' 
                            onClick={() => hideStakeModal()}
                            key='stake-cancel-button'
                            >
                            Cancel
                        </div>
                    ]) : (
                        <Button 
                            variant="secondary" 
                            onClick={() => hideStakeModal()}
                            className='w-75 btn-lg'
                            >
                            Cancel
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        );
    }
    else {
        return null;
    }
        
}
