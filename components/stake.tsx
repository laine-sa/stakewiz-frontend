import React, {useEffect, useState, FC, useCallback} from 'react';
import { clusterStatsI, EpochInfoI, validatorI } from './validator/interfaces'
import config from '../config.json';
import { Modal, Button, Overlay, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Authorized, Connection, Keypair, LAMPORTS_PER_SOL, Lockup, PublicKey, StakeProgram,  Transaction, ValidatorInfo } from '@solana/web3.js';
import RangeSlider from 'react-bootstrap-range-slider'
import { RenderImage, RenderName } from './validator/common';
import { getEpochInfo, Spinner } from './common';

export const getStakeAccounts = async (pubkey,connection: Connection) => {

    const stakes = await connection.getParsedProgramAccounts(
        StakeProgram.programId,
        {
            commitment: "confirmed",
            filters: [
                {
                memcmp: {
                    bytes: pubkey,
                    offset: 12
                }
            }
            ]
        }
    )


    return stakes;
}

const StakeInput: FC<{
    balance: number;
    minStakeAmount: number;
    stakeAmount: number;
    updateAmount: Function;
    readOnly?: boolean;
}> = ({balance, minStakeAmount, stakeAmount, updateAmount, readOnly}) => {
    

    const [sliderValue, setSliderValue] = useState(stakeAmount);
    const [pendingValue, setPendingValue] = useState(null);

    const processUpdate = (amount) => {
        if(!readOnly) {
            updateAmount(amount);
            setSliderValue(amount);
        }
    }

    useEffect(() => {
        if(pendingValue!=null) {
            const timeoutId = setTimeout(() => processUpdate(pendingValue), 500)
            return () => clearTimeout(timeoutId)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingValue])

    return (
        <div className='my-2 d-flex flex-row align-items-center pe-0 w-100' key={'range-slider-div-'+stakeAmount}>
            <div className='me-1 flex-shrink-1'>
                <OverlayTrigger
                    placement="top"
                    overlay={
                        <Tooltip>
                            The min amount for rent exemption + 1 lamport per validator
                        </Tooltip>
                    } 
                >
                    <span onClick={() => processUpdate(minStakeAmount/LAMPORTS_PER_SOL)} className={(!readOnly) ? 'pointer' : null}>Min</span>
                </OverlayTrigger>
            </div>
            <div className='flex-grow-1 px-1'>
                <RangeSlider 
                    value={(pendingValue != null) ? pendingValue : sliderValue} 
                    min={minStakeAmount/LAMPORTS_PER_SOL}
                    max={(balance-config.TX_RESERVE_LAMPORTS)/LAMPORTS_PER_SOL} 
                    step={500000/LAMPORTS_PER_SOL}
                    onChange={(event) => setPendingValue(parseFloat(event.target.value))}
                    tooltip='off'
                    variant='light'
                    disabled={(readOnly) ? true : false}
                />
            </div>
            <div className='text-start px-0 flex-shrink-1'>
                <OverlayTrigger
                    placement="top"
                    overlay={
                        <Tooltip>
                            Your balance minus ◎ 0.01 for fees
                        </Tooltip>
                    } 
                >
                    <span onClick={() => processUpdate((balance-config.TX_RESERVE_LAMPORTS)/LAMPORTS_PER_SOL)} className={(!readOnly) ? 'pointer' : null}>Max</span>
                </OverlayTrigger>
            </div>
        </div>
        
    )

}

export const MultiStakeDialog: FC<{
    stakeValidators: [validatorI],
    updateStakeValidators: Function,
    showStakeModal: boolean,
    hideStakeModal: Function,
    clusterStats: clusterStatsI,
    allowAlertDialog?: boolean,
    laine: validatorI
}> = ({stakeValidators,updateStakeValidators,showStakeModal,hideStakeModal,clusterStats,allowAlertDialog, laine}) => {

    enum DistributionMethods {
        Equal = 0,
        WizScore = 1,
        APY = 2,
        Custom = 3
    };

    const { connection } = useConnection();
    const {connected, publicKey, sendTransaction, signTransaction, signAllTransactions} = useWallet();

    const [stakeRentExemptAmount, setStakeRentExemptAmount] = useState(config.DEFAULT_STAKE_RENT_LAMPORTS);
    const [stakeAmount, setStakeAmount] = useState(null);
    const [balance, setBalance] = useState(0);

    const[renderTime, setRenderTime] = useState(Math.floor(Date.now() / 1000));

    const [stakeInput, setStakeInput] = useState({validator:null,amount:null});

    const [submitError, setSubmitError] = useState<string>(undefined);
    const [submitted, setSubmitted] = useState(false);
    const [signed, setSigned] = useState(false);
    const [processed, setProcessed] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [signature, setSignature] = useState<string>();
    
    const [stakeDistribution, setStakeDistribution] = useState({})
    const [distributionMethod, setDistributionMethod] = useState(DistributionMethods.Equal);


    const validateAmount = (amount) => {
        setRenderTime(Math.floor(Date.now() / 1000));
        if(amount > balance/LAMPORTS_PER_SOL) setStakeAmount((balance-config.TX_RESERVE_LAMPORTS)/LAMPORTS_PER_SOL);
        else setStakeAmount(amount);

        calculateDistribution();
    }

    const getBalance = () => {
        if(publicKey && connection) {
            connection.getBalance(publicKey)
            .then((resolved) => {
                setBalance(resolved);
                if(stakeAmount==null && resolved > config.TX_RESERVE_LAMPORTS) setStakeAmount((resolved-config.TX_RESERVE_LAMPORTS)/LAMPORTS_PER_SOL);
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

    const calculateDistribution = () => {
        if(stakeValidators!=null && distributionMethod != DistributionMethods.Custom) {

            let remainder = stakeAmount*LAMPORTS_PER_SOL - stakeValidators.length * stakeRentExemptAmount;
            let totalWizScore = 0;
            let totalAPY = 0;
            
            stakeValidators.map((validator) => {
                totalWizScore += validator.wiz_score;
                totalAPY += validator.apy_estimate;
            })

            let distribution = {};
            stakeValidators.map((validator,index) => {
                let validatorStake = stakeRentExemptAmount;
                switch(distributionMethod) {
                    case DistributionMethods.Equal:
                        validatorStake += remainder / stakeValidators.length;
                        break;
                    case DistributionMethods.WizScore:
                        validatorStake += remainder * (validator.wiz_score / totalWizScore);
                        break;
                    case DistributionMethods.APY:
                        validatorStake += remainder * (validator.apy_estimate / totalAPY);
                        break;
                }
                validatorStake = Math.floor(validatorStake);
                distribution[validator.vote_identity] = validatorStake;
            })
            setStakeDistribution({...distribution});
        }
    }

    const calculateCustomDistribution = (validator:validatorI, value: number) => {
        
        value = value * LAMPORTS_PER_SOL;

        if(isNaN(value) || (value <= stakeRentExemptAmount && value != 0)) value = stakeRentExemptAmount + 1;

        let oldValue = stakeDistribution[validator.vote_identity];
        if(oldValue==undefined) oldValue = 0;
        let newTotal = totalStake() - oldValue + value;

        console.log('total '+oldValue)

        if(newTotal > balance - config.TX_RESERVE_LAMPORTS) {
            console.log('Amount is too high');
            value = balance - totalStake() + oldValue - config.TX_RESERVE_LAMPORTS;
            if(value < stakeRentExemptAmount) value = 0;
        }

        let newStake = [];
        newStake[validator.vote_identity] = value;
        
        setStakeDistribution({
            ...stakeDistribution,
            ...newStake
        })
    }

    useEffect(() => {
        if(publicKey && connection) {
            getBalance();
            getStakeRentExemptAmount();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [renderTime]);

    useEffect(() => {
        calculateDistribution();
        if(stakeAmount != null ) {
            if(stakeAmount < minTotalStakeAmount()/LAMPORTS_PER_SOL) setStakeAmount(minTotalStakeAmount()/LAMPORTS_PER_SOL)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stakeValidators, stakeAmount, distributionMethod, balance, showStakeModal]);

    useEffect(() => {
        if(distributionMethod==DistributionMethods.Custom) {
            setStakeAmount(totalStake() / LAMPORTS_PER_SOL)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [distributionMethod, stakeDistribution, stakeValidators])

    useEffect(() => {
        if(stakeInput.validator != null){
            const timeoutId = setTimeout(() => {
                calculateCustomDistribution(stakeInput.validator,stakeInput.amount)
                setStakeInput({
                    validator:null,
                    amount: null
                })
            }, 500)
            return () => clearTimeout(timeoutId)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stakeInput])

    const renderName = (validator) => {
        if(validator!=null) {
            if(validator.name!='') {
                return validator.name;
            }
            else {
                return validator.vote_identity;
            }
        }
    }

    const renderStakeValidators = () => {
        if(stakeValidators!=null) {
            let vl = [];
            stakeValidators.map((validator,index) => {
                vl.push((
                    <div className='d-flex align-items-center flex-row border border-light border-1 rounded mb-1 p-1 px-2' key={'stake-validator-'+validator.vote_identity}>
                        <div className='d-flex flex-shrink-1'>
                            <RenderImage
                                img={validator.image}
                                size={25}
                                vote_identity={validator.vote_identity}
                            />
                        </div>
                        <div className='ps-2 w-25 text-truncate d-flex flex-grow-1'>
                            {renderName(validator)}
                        </div>
                        <div className='d-flex flex-row align-items-center lh-1 multi-stake-validator-badges flex-grow-1'>
                            <div className='badge bg-light text-dark ms-1'>
                                APY {validator.apy_estimate} %
                            </div>
                            <div className='badge bg-light text-dark ms-1'>
                                Comm {validator.commission} %
                            </div>
                            <div className='badge bg-light text-dark ms-1'>
                                <span className='wiz-font me-2'>Wiz</span> {validator.wiz_score} %
                            </div>
                            
                        </div>
                        <div className='mx-2 text-truncate d-flex'>
                            <div className='input-group input-group-sm'>
                                        <span className='input-group-text' id='stakeAmountInputText'>◎</span>
                                        <input  
                                            className='form-control text-center' 
                                            name={'stakeAmountInput-'+validator.vote_identity}
                                            type='number' 
                                            value={(stakeInput.validator==validator) ? stakeInput.amount : (stakeDistribution[validator.vote_identity]!=undefined) ? stakeDistribution[validator.vote_identity]/LAMPORTS_PER_SOL : 0} 
                                            onChange={(e) => setStakeInput({validator:validator,amount:parseFloat(e.target.value)})} 
                                            max={(balance - config.TX_RESERVE_LAMPORTS) / LAMPORTS_PER_SOL}    
                                            min={0}
                                            step={0.00005}
                                            disabled={(distributionMethod == DistributionMethods.Custom) ? false : true}
                                        />
                            </div>
                        </div>
                        <div className='mx-2 d-flex flex-grow-1'>
                            <i className='bi bi-x-lg pointer' onClick={() => updateStakeValidators(validator)}></i>
                        </div>
                    </div>
                ))
            })
            if(!stakeValidators.includes(laine) && laine !=null) {
                vl.push((
                    <div className='d-flex align-items-center flex-row border border-secondary bg-dark text-white border-1 rounded mb-1 p-1 px-2' key={'stake-validator-'+laine.vote_identity}>
                        
                        <div className='me-2 text-truncate d-flex'>
                            <button className='btn btn-outline-light btn-sm' onClick={() => { updateStakeValidators(laine); calculateDistribution() }}>
                                <i className='bi bi-plus me-1'></i>Add Laine
                            </button>
                        </div>
                        <div className='d-flex flex-shrink-1'>
                            <RenderImage
                                img={laine.image}
                                size={25}
                                vote_identity={laine.vote_identity}
                            />
                        </div>
                        <div className='ps-2 w-25 text-truncate d-flex flex-grow-1'>
                            {renderName(laine)}
                        </div>
                    </div>
                ))
            }
            return vl;
        }
        return null;
    }

    const estimatedAPY = () => {
        let apy_multiples = 0;
        stakeValidators.map((validator) => {
            if(stakeDistribution[validator.vote_identity]!=undefined) apy_multiples += validator.apy_estimate * stakeDistribution[validator.vote_identity];
        });

        return Math.round((apy_multiples / stakeAmount/LAMPORTS_PER_SOL*100)+Number.EPSILON) / 100;
    }

    const totalStake = () => {
        let total = 0;
        stakeValidators.map((validator) => {
            if(stakeDistribution[validator.vote_identity]!=undefined) total += stakeDistribution[validator.vote_identity];
        });

        return total;
    }

    const totalValidators = () => {
        let total = 0;
        stakeValidators.map((validator) => {
            if(stakeDistribution[validator.vote_identity]!=undefined && stakeDistribution[validator.vote_identity] != 0) total += 1;
        });
        return total
    }

    const minTotalStakeAmount = () => {
        if(stakeValidators !=null) {
            return (stakeRentExemptAmount+1) * stakeValidators.length;
        }
        else {
            return stakeRentExemptAmount + 1;
        }
    }

    const doStake = async () => {

        setSubmitError(undefined);
        setSubmitted(true);

        try {
            
            let txs = [];
            let signers = [];
            let recentBlockhash = await connection.getLatestBlockhash();

            stakeValidators.map((validator) => {
                let stakeKeys = Keypair.generate();
                let auth = new Authorized(
                    publicKey,
                    publicKey
                );
    
                let stakeTx = StakeProgram.createAccount({
                    authorized: auth,
                    fromPubkey: publicKey,
                    lamports: stakeDistribution[validator.vote_identity],
                    stakePubkey: stakeKeys.publicKey
                });
                
                let votePubkey = new PublicKey(validator.vote_identity);
    
                let delegateIx = StakeProgram.delegate({
                    authorizedPubkey: publicKey,
                    stakePubkey: stakeKeys.publicKey,
                    votePubkey: votePubkey
                });

                txs.push(stakeTx);
                txs.push(delegateIx);
                signers.push(stakeKeys);
            })

            let transactions = [];
            txs.map((tx, i) => {
                let y = Math.floor(i / 4);
                
                if(transactions[y]==undefined) transactions[y] = new Transaction({
                    blockhash: recentBlockhash.blockhash,
                    lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
                    feePayer: publicKey
                });

                transactions[y].add(tx);
            });

            signers.map((keypair, i) => {
                let y = Math.floor(i / 2);

                transactions[y].partialSign(keypair);
            })
            
            console.log(transactions);
            let signedTx = await signAllTransactions(transactions);

            let signatures = [];

            for(let i = 0; i < signedTx.length; i++) {

                let signature = await connection.sendRawTransaction(signedTx[i].serialize())
            
                signatures.push(signature);
                console.log('Submitted transaction '+i+' with signature: '+signature);
                
            }

            setSigned(true);

            let proc = [];
            let proc_error = false;

            for(let i = 0; i < signatures.length; i++) {
                proc[i] = await connection.confirmTransaction({signature: signatures[i], blockhash: recentBlockhash.blockhash, lastValidBlockHeight: recentBlockhash.lastValidBlockHeight}, 'processed');
                console.log(proc[i]);
                if(proc[i].value.err!=null) proc_error = true;
            }

            
            if(proc_error===false) {
                setProcessed(true);
                let conf = [];
                let conf_error = false;

                for(let i = 0; i < signatures.length; i++) {
                    conf[i] = await connection.confirmTransaction({
                        signature: signatures[i], 
                        blockhash: recentBlockhash.blockhash, 
                        lastValidBlockHeight: recentBlockhash.lastValidBlockHeight
                        }, 'confirmed');
                    console.log(conf[i]);
                    if(conf[i].value.err!=null) conf_error = true;
                }
                if(conf_error===false) {
                    setConfirmed(true);    
                }
                else { 
                    throw new Object({error:{message:'Error confirming your transaction, check your transaction history'}});
                }
            }
            else {
                throw new Object({error:{message:'Error confirming your transaction, check your transaction history'}});
            }
        }
        catch(error) {
            console.log(error);
            console.log(error.message);
            setSubmitted(false);
            setSigned(false);
            setProcessed(false);
            setConfirmed(false);
            setSubmitError(error.message);
        }

    };

    if(stakeValidators!=null && clusterStats !=null && Object.keys(stakeDistribution).length>0) {
        
        return (
            <Modal show={showStakeModal} onHide={() => hideStakeModal()} dialogClassName='modal-lg multi-stake-modal-modal'>
                <Modal.Header closeButton>
                    <Modal.Title>Create stake accounts</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    
                    
                    <div className='d-flex flex-column'>
                        
                        <div className='p-2 flex-grow-1 border border-secondary'>
                            <div className='fs-5 flex-grow-1 text-center'>
                                Total to Stake
                            </div>
                            <div>
                                <StakeInput
                                    key={'stake-range-slider-'+totalStake()}
                                    balance={balance}
                                    minStakeAmount={minTotalStakeAmount()}
                                    stakeAmount={totalStake() / LAMPORTS_PER_SOL}
                                    updateAmount={(amount) => validateAmount(amount)}
                                    readOnly={(distributionMethod == DistributionMethods.Custom) ? true : false}
                                />
                            </div>
                            <div className='d-flex flex-row justify-content-center align-items-center'>
                                <div className='flex-grow-1'>
                                    <div className='input-group input-group-lg'>
                                        <span className='input-group-text' id='stakeAmountInputText'>◎</span>
                                        <input  
                                            key={'stake-amount-input'+totalStake}
                                            className='form-control text-center fs-6' 
                                            name='stakeAmountInput' 
                                            type='number' 
                                            value={totalStake()/LAMPORTS_PER_SOL} 
                                            onChange={(event) => validateAmount(parseFloat(event.target.value))} 
                                            max={(balance - config.TX_RESERVE_LAMPORTS) / LAMPORTS_PER_SOL}    
                                            min={minTotalStakeAmount()}
                                            disabled={(distributionMethod == DistributionMethods.Custom) ? true : false}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className='flex-grow-1'>
                                <div className="balance-sm text-end text-light">Balance: ◎ {balance/LAMPORTS_PER_SOL}</div>
                            </div>
                        </div>
                        <div className='p-2 my-1 flex-grow-1 border border-secondary'>
                            <div className='fs-5 mb-2 flex-grow-1 text-center'>
                                Stake distribution
                            </div>
                            <div className='d-flex multi-stake-distribution-buttons'>
                                <button className='btn btn-outline-light flex-grow-1 mx-2' disabled={(distributionMethod==DistributionMethods.Equal)} onClick={() => setDistributionMethod(DistributionMethods.Equal)}>
                                    Equal
                                </button>
                                <button className='btn btn-outline-light flex-grow-1 mx-2 wiz-font' disabled={(distributionMethod==DistributionMethods.WizScore)} onClick={() => setDistributionMethod(DistributionMethods.WizScore)}>
                                    Wiz Score
                                </button> 
                                <button className='btn btn-outline-light flex-grow-1 mx-2' disabled={(distributionMethod==DistributionMethods.APY)} onClick={() => setDistributionMethod(DistributionMethods.APY)}>
                                    APY
                                </button> 
                                <button className='btn btn-outline-light flex-grow-1 mx-2' disabled={(distributionMethod==DistributionMethods.Custom)} onClick={() => setDistributionMethod(DistributionMethods.Custom)}>
                                    Custom
                                </button>
                            </div>
                        </div>
                        <div className='flex-grow-1 border border-secondary p-1'>
                            <div className='fs-5 py-2 flex-grow-1 text-center'>
                                Your validator selection
                            </div>
                            <div>
                                {renderStakeValidators()}
                            </div>
                            
                        </div>
                        <div className='p-2 me-1 flex-grow-1'>
                            <div className='d-flex flex-grow-1 flex-row align-items-center'>
                                <div className='d-flex flex-column align-items-center flex-grow-1'>
                                    <div className='fs-5 fw-bold'>
                                        {totalValidators()}
                                    </div>
                                    <div>
                                        Validators
                                    </div>
                                </div>
                                <div className='d-flex flex-column align-items-center flex-grow-1'>
                                    <div className='fs-5 fw-bold'>
                                    ◎ {totalStake() / LAMPORTS_PER_SOL}
                                    </div>
                                    <div>
                                        Total to stake
                                    </div>
                                </div>
                                <div className='d-flex flex-column align-items-center flex-grow-1'>
                                    <div className='fs-5 fw-bold'>
                                        {estimatedAPY()} %
                                    </div>
                                    <div>
                                        Estimated APY
                                    </div>
                                </div>
                            </div>
                            <div className='mt-2'>
                                <button className='btn btn-outline-light w-100' onClick={() => doStake()}>
                                    Stake
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        );
    }
    else {
        return null;
    }
}

export const StakeDialog: FC<{
    validator: validatorI, 
    showStakeModal: boolean, 
    hideStakeModal: Function,
    clusterStats: clusterStatsI,
    allowAlertDialog?: boolean
}> = ({validator,showStakeModal,hideStakeModal,clusterStats,allowAlertDialog}) => {

    const { connection } = useConnection();
    const {connected, publicKey, sendTransaction, signTransaction} = useWallet();

    const [stakeRentExemptAmount, setStakeRentExemptAmount] = useState(config.DEFAULT_STAKE_RENT_LAMPORTS);
    const [stakeAmount, setStakeAmount] = useState(null);
    const [balance, setBalance] = useState(0);

    const[renderTime, setRenderTime] = useState(Math.floor(Date.now() / 1000));

    const [epochInfo, setEpochInfo] = useState<EpochInfoI | null>(null);
    const [epochReturn, setEpochReturn] = useState(0);
    const [monthReturn, setMonthReturn] = useState(0);

    const [submitError, setSubmitError] = useState<string>(undefined);
    const [submitted, setSubmitted] = useState(false);
    const [signed, setSigned] = useState(false);
    const [processed, setProcessed] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [signature, setSignature] = useState<string>();


    const calculateReturns = async () => {
        let epoch;
        if(epochInfo==undefined) {
            epoch = await getEpochInfo();
            setEpochInfo(epoch);
        }
        if((epochInfo!=undefined || epoch != undefined) && validator!=null) {

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
                if(stakeAmount==null && resolved > config.TX_RESERVE_LAMPORTS) setStakeAmount((resolved-config.TX_RESERVE_LAMPORTS)/LAMPORTS_PER_SOL);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connection, publicKey, renderTime]);

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

    const doHide = (alert) => {
        hideStakeModal(alert,validator);
        setTimeout(() => {
            setSubmitted(false);
            setSigned(false);
            setProcessed(false);
            setConfirmed(false);
            setEpochInfo(null);
            setSubmitError(undefined);
            setStakeAmount(null);
        },500);
        
    }

    
    const doStake = async () => {

        setSubmitError(undefined);
        setSubmitted(true);

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
            stakeTx.partialSign(stakeKeys);

            let signedTx = await signTransaction(stakeTx);

            let signature = await connection.sendRawTransaction(signedTx.serialize());
            console.log('Submitted transaction signature: '+signature);
            setSigned(true);

            setSignature(signature);

            let proc = await connection.confirmTransaction(signature, 'processed');
            if(proc.value.err==null) {
                setProcessed(true);
                let conf = await connection.confirmTransaction(signature, 'confirmed');
                if(conf.value.err==null) {
                    setConfirmed(true);    
                }
                else { 
                    throw new Object({error:{message:'Error confirming your transaction, check your transaction history'}});
                }
            }
            else {
                throw new Object({error:{message:'Error confirming your transaction, check your transaction history'}});
            }
        }
        catch(error) {
            setSubmitted(false);
            setSigned(false);
            setProcessed(false);
            setConfirmed(false);
            setSubmitError(error.message);
        }

    };

    const renderStakeForm = () => {
        getBalance();
        return (
            <div>
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
                            minStakeAmount={stakeRentExemptAmount+1}
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
                    <div className='border rounded border-1 border-secondary m-2 p-2 text-center' key='stakeInputDiv3'>
                            The maximum stake is your balance minus ◎ {config.TX_RESERVE_LAMPORTS/LAMPORTS_PER_SOL}, to ensure you have some SOL left for future transactions.
                        
                    </div>
                    ]) : (
                        <div className='fs-3 text-danger text-center'>
                            Insufficient funds to stake.
                            <div className='fs-6 text-secondary px-2'>You need at least ◎ {stakeRentExemptAmount/LAMPORTS_PER_SOL} for rent plus the amount you&apos;d like to stake. Your balance is ◎ {balance / LAMPORTS_PER_SOL}</div>
                        </div>

                    )}
                    <div className='row'>
                        
                        <div className='col fs-5 m-2 text-center'>
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
                        <div className='bg-danger rounded my-1 p-2 text-white text-center text-truncate'>
                            {submitError}<br /> Please try again.
                            {(signed) ? <span><br /><a href={config.EXPLORER_TX_BASE+signature} target="_blank" rel="noreferrer">View in Explorer<i className='bi bi-box-arrow-up-right ms-2'></i></a></span> : null}
                        </div>
                    ) : null}
                    <div className='d-flex justify-content-center my-2 flex-column text-center'>
                        {(balance > stakeRentExemptAmount) ? ([

                                <Button 
                                    variant="success" 
                                    onClick={() => doStake()}
                                    className='w-100 btn-lg'
                                    key='stake-confirm-button'
                                    disabled={submitted}
                                    >
                                        Stake
                                </Button>
                            ,
                            <div 
                                className='text-secondary pointer mt-3' 
                                onClick={() => doHide(false)}
                                key='stake-cancel-button'
                                >
                                Cancel
                            </div>
                        ]) : (
                            <Button 
                                variant="secondary" 
                                onClick={() => doHide(false)}
                                className='w-100 btn-lg'
                                >
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>
        )
    }


    if(validator!=null && clusterStats !=null) {
        return (
            <Modal show={showStakeModal} onHide={() => doHide(false)} dialogClassName='modal-md stake-modal-modal'>
                <Modal.Body className='py-0'>
                    {(!signed) ? renderStakeForm() : (
                            <div className='d-flex flex-column align-items-center text-center m-2 my-3'>
                                    <div>
                                        {(!confirmed) ? <i className='bi bi-piggy-bank text-light' style={{fontSize:'3rem'}}></i> : (
                                            <i className='bi bi-piggy-bank text-success' style={{fontSize:'3rem'}}></i> 
                                        )}
                                    </div>
                                    <div className='fs-6 fw-bold'>Staking ◎ {stakeAmount} with {renderName()}</div>
                                    <div className='container my-2'>
                                        <div className='row lh-1'>
                                            <div className='col col-md-4'>
                                                <i className='ms-2 bi bi-check text-success' style={{fontSize:'2rem'}}></i>    
                                            </div>
                                            <div className='col col-md-4'>
                                                {(!processed) ? (
                                                <div className="spinner-border spinner-border-sm mt-2" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                ) : (
                                                    <i className='ms-2 bi bi-check text-success' style={{fontSize:'2rem'}}></i>    
                                                )}
                                            </div>
                                            <div className='col col-md-4'>
                                            {(!confirmed) ? (
                                                <div className="spinner-border spinner-border-sm mt-2" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                ) : (
                                                    <i className='ms-2 bi bi-check text-success' style={{fontSize:'2rem'}}></i>    
                                                )}
                                            </div>
                                        </div>
                                        <div className='row'>
                                            <div className='col col-md-4'>
                                                <OverlayTrigger
                                                    placement="bottom"
                                                    overlay={
                                                        <Tooltip>
                                                            Sent to the blockchain
                                                        </Tooltip>
                                                    } 
                                                >
                                                    <span>Submitted</span>
                                                </OverlayTrigger>
                                            </div>
                                            <div className='col col-md-4'>
                                                <OverlayTrigger
                                                    placement="bottom"
                                                    overlay={
                                                        <Tooltip>
                                                            At least one confirmation by the queried node
                                                        </Tooltip>
                                                    } 
                                                >
                                                    <span>Processed</span>
                                                </OverlayTrigger>
                                            </div>
                                            <div className='col col-md-4'>
                                                <OverlayTrigger
                                                    placement="bottom"
                                                    overlay={
                                                        <Tooltip>
                                                            At least one confirmation by the entire cluster
                                                        </Tooltip>
                                                    } 
                                                >
                                                    <span>Confirmed</span>
                                                </OverlayTrigger>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <a href={config.EXPLORER_TX_BASE+signature} target="_blank" rel="noreferrer">View in Explorer<i className='bi bi-box-arrow-up-right ms-2'></i></a>
                                        
                                    </div>

                                    <div className='border rounded border-1 border-secondary m-2 p-2'>
                                        Consider setting up some alerts, that way you&apos;ll be notified should your chosen validator change their commission or be delinquent for an extended period.
                                    </div>
                                    <div className='mt-2'>
                                        <Button 
                                            variant="secondary" 
                                            onClick={() => doHide(false)}
                                            disabled={!confirmed}
                                            className='mx-1'
                                            >
                                            Close
                                        </Button>
                                        {(allowAlertDialog) ? (
                                            <Button 
                                            variant="success" 
                                            onClick={() => doHide(true)}
                                            disabled={!confirmed}
                                            className='mx-1'
                                            >
                                            <i className="bi bi-plus px-1 alert-btn-icon"></i> 
                                            Create Alert 
                                        </Button>
                                        ): null}
                                    </div>
                                    
                            </div> 
                    )}
                </Modal.Body>
            </Modal>
        );
    }
    else {
        return null;
    }
        
}
