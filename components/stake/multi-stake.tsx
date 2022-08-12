import React, {useEffect, useState, FC, useCallback} from 'react';
import { clusterStatsI, EpochInfoI, validatorI } from '../validator/interfaces'
import config from '../../config.json';
import { Modal, Button, Overlay, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Authorized, Connection, Keypair, LAMPORTS_PER_SOL, Lockup, PublicKey, SIGNATURE_LENGTH_IN_BYTES, StakeProgram,  Transaction, ValidatorInfo } from '@solana/web3.js';
import RangeSlider from 'react-bootstrap-range-slider'
import { RenderImage, RenderName } from '../validator/common';
import { getEpochInfo, Spinner } from '../common';
import { getStakeAccounts, StakeInput } from './common'



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

    const [signed, setSigned] = useState(false);
    const [signatures, setSignatures] = useState([]);
    const [confirmations, setConfirmations] = useState([]);
    
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

    const renderSignatureConfirmations = () => {
        let result = [];

        signatures.map((signature) => {
            result.push((
                <div className='flex-grow-1 flex-row flex-nowrap' key={'signature-result-'+signature+confirmations.length}>
                    <div className='flex-shrink-1 text-truncate'>
                        {signature}
                    </div>
                    <div className='flex-grow-1 ms-2'>
                        {confirmations.includes(signature) ? (
                            <div className="spinner-border spinner-border-sm mt-2" role="status">
                                <span className="visually-hidden">Pending...</span>
                            </div>
                            ) : (
                                <i className='ms-2 bi bi-check text-success' style={{fontSize:'2rem'}}></i>    
                        )}
                    </div>
                </div>
            ))
        })

        return result
    }

    const doStake = async () => {

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
            setSigned(true);
            let sigs = []

            for(let i = 0; i < signedTx.length; i++) {

                let signature = await connection.sendRawTransaction(signedTx[i].serialize())
                setSignatures(signatures.concat(signature));
                sigs.push(signature)
                console.log('Submitted transaction with signature: '+signature);
                
                
            }

            console.log(sigs)

            for(let i = 0; i < sigs.length; i++) {
                let confirmation = await connection.confirmTransaction({
                    signature: sigs[i], 
                    blockhash: recentBlockhash.blockhash, 
                    lastValidBlockHeight: recentBlockhash.lastValidBlockHeight}, 
                    'confirmed'
                )
                console.log(confirmation)
                if(confirmation.value.err==null) setConfirmations(confirmations.concat(sigs[i]))
                
                
            }
        }
        catch(error) {
            console.log(error);
            console.log(error.message);
            setSigned(false);
            setSignatures([]);
            setConfirmations([]);
        }

    };

    if(stakeValidators!=null && clusterStats !=null && Object.keys(stakeDistribution).length>0) {
        
        return (
            <Modal show={showStakeModal} onHide={() => hideStakeModal()} dialogClassName='modal-lg multi-stake-modal-modal'>
                <Modal.Header closeButton>
                    <Modal.Title>Create stake accounts</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    
                {(!signed) ? (
                    <div className='d-flex flex-column'>
                        
                        <div className='p-2 flex-grow-1 border border-light border-2'>
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
                        <div className='p-2 my-2 flex-grow-1 border border-light border-2'>
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
                        <div className='flex-grow-1 border border-light border-2 p-1'>
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
                            <div className='mt-2 flex-grow-1 text-center'>
                                <button className='btn btn-outline-light px-5' onClick={() => doStake()}>
                                    🚀 Stake
                                </button>
                            </div>
                        </div>
                        
                    </div>
                ) : (
                    <div className='my-2 flex-grow-1'>
                        <div className='flex-grow-1 my-2 fs-5 text-center'>
                            Confirming transactions
                        </div>
                        {renderSignatureConfirmations()}
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


