import React, { FC, useContext, useEffect, useState } from "react";
import config from '../../config.json';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { getStakeAccounts, StakeStatus, getStakeStatus } from './common';
import { ValidatorContext } from '../validator/validatorhook';
import { getClusterStats, Spinner} from '../common'
import { RenderImage, RenderName } from '../validator/common'
import { Alert, Form, InputGroup, Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { addMeta, closeStake, deactivateStake, delegateStake } from "./transactions";
import { useWallet } from "@solana/wallet-adapter-react";
import { validatorI } from "components/validator/interfaces";
import ordinal from "ordinal";

const API_URL = process.env.API_BASE_URL;

export const Stakes: FC<{userPubkey: string, connection: Connection, connected: boolean}> = ({userPubkey, connection, connected}) => {

    const [ stakes, setStakes ] = useState(null);
    const [renderResult, setRenderResult] = useState<any>(<Spinner />)
    const validatorList = useContext(ValidatorContext)
    const [epoch, setEpoch] = useState(0)
    const {publicKey, sendTransaction, signTransaction, signAllTransactions} = useWallet();
    const [awaitingSignature, setAwaitingSignature] = useState(false)
    const [updatingStakes, setUpdatingStakes] = useState([])
    const [message, setMessage] = useState(null)
    const [messageType, setMessageType] = useState('success')
    const [delegatingStake, setDelegatingStake] = useState(null)
    const [delegateSearch, setDelegateSearch] = useState([])
    const [delegateValidator, setDelegateValidator] = useState(null)
    const [delegateSearchInput, setDelegateSearchInput] = useState('')
    const [clusterStats, setClusterStats] = useState(null)
    const [initialFetch, setInitialFetch] = useState(false)

    useEffect(() => {
        if(stakes == null) {
            getStakeAccounts(userPubkey, connection).then((stakes) => {
                
                setStakes(stakes);
                setInitialFetch(true)

            })
            
        }
    }, [userPubkey])

    useEffect(() => {
        renderStakes()
    }, [stakes, validatorList, awaitingSignature, updatingStakes, initialFetch])

    useEffect(() => {
        if(connected && epoch == 0) {
            connection.getEpochInfo()
            .then((epoch) => {
                setEpoch(epoch.epoch)
            })
        }
        getClusterStats()
        .then((results) => {
            setClusterStats(results)
        })
    })

    useEffect(() => {
        doSearch(delegateSearchInput)
    }, [delegateSearchInput])

    const findStakeValidator = (vote_identity) => {
        
        if(validatorList!=null) {
            for(let i = 0; i < validatorList.length; i++) {
                if(validatorList[i].vote_identity == vote_identity) {
                    return validatorList[i]
                }
            }
        }
        return null;
    }

    const renderStakeButtons = (stake, status) => {
        
        if(updatingStakes.includes(stake)) {
            return (
                <div className='spinner-grow text-light' role="status">
                    <span className='visually-hidden'>Loading...</span>
                </div>
            )
        }
        else {
            if(status == 2 || status == 1) {
                return (
                    <OverlayTrigger
                    placement="bottom"
                    overlay={
                        <Tooltip>
                            Deactivate
                        </Tooltip>
                    } 
                    > 
                        <button className='btn btn-outline-light btn-sm px-4' onClick={() => doDeactivate(stake)} disabled={awaitingSignature}><i className='bi bi-chevron-double-down fs-6'></i></button>
                    </OverlayTrigger>
                )
            }
            if(status == 0) {
                return (
                    [
                        <OverlayTrigger
                        placement="bottom"
                        key={'withdraw-button-'+stake.pubkey.toString()}
                        overlay={
                            <Tooltip>
                                Withdraw &amp; close
                            </Tooltip>
                        } 
                        > 
                            <button className='btn btn-outline-light me-1 px-4' onClick={() => doClose(stake)} disabled={awaitingSignature}><i className='bi bi-box-arrow-left fs-6'></i></button>
                        </OverlayTrigger>,
                        <OverlayTrigger
                        placement="bottom"
                        key={'delegate-button-'+stake.pubkey.toString()}
                        overlay={
                            <Tooltip>
                                Delegate
                            </Tooltip>
                        } 
                        > 
                            <button className='btn btn-outline-light px-4' onClick={() => setDelegatingStake(stake)} disabled={awaitingSignature}><i className='bi bi-arrow-up-right-square-fill fs-6'></i></button>
                        </OverlayTrigger>
                    ]
                )
            }
            if(status ==3 ) {
                return (
                    <OverlayTrigger
                        placement="bottom"
                        key={'delegate-button-'+stake.pubkey.toString()}
                        overlay={
                            <Tooltip>
                                Cancel deactivation
                            </Tooltip>
                        } 
                        > 
                            <button className='btn btn-outline-light px-4' onClick={() => doDelegate(stake, stake.account.data.parsed.info.stake.delegation.voter)} disabled={awaitingSignature}><i className='bi bi-x-octagon fs-6'></i></button>
                        </OverlayTrigger>
                )
            }
            
        }
        
    }

    const displayAlert = (message,type) => {
        setMessageType(type)
        setMessage(message)

        setTimeout(() => {
            setMessage(null)
        }, 5000)
    }

    const submitTx = async (tx, stake, isClose:Boolean = false) => {

        let signature = await connection.sendRawTransaction(tx.serialize())
        console.log('Transaction signature: '+signature)
        
        setUpdatingStakes(updatingStakes => [...updatingStakes, stake])
        setDelegatingStake(null)
        setDelegateValidator(null)

        let blockhash = await connection.getLatestBlockhash()

        connection.confirmTransaction({
            signature: signature, 
            blockhash: blockhash.blockhash, 
            lastValidBlockHeight: blockhash.lastValidBlockHeight}, 
            'confirmed'
        )
        .then(async (conf) => {
            
            setAwaitingSignature(false)
            if(conf.value.err!=null) {
                console.log(conf.value.err)
                setUpdatingStakes(updatingStakes.filter(item => item !== stake))

                let alert = (
                    <span>
                        Error confirming the transaction.<br />
                        <a href={config.EXPLORER_TX_BASE+signature} target="_blank" rel="noreferrer">View in Explorer<i className='bi bi-box-arrow-up-right ms-2'></i></a>
                    </span>
                )

                displayAlert(alert,'error')
            }
            else {
                if(!isClose) {
                    let account = await connection.getParsedAccountInfo(stake.pubkey,'processed')
        
                    let tempStake = stake
                    tempStake.account.data = account.value.data
                    setStakes(stakes => [...stakes.filter(item => item !== stake),tempStake])

                    let alert = (
                        <span>
                            Transaction confirmed.<br />
                            <a href={config.EXPLORER_TX_BASE+signature} target="_blank" rel="noreferrer">View in Explorer<i className='bi bi-box-arrow-up-right ms-2'></i></a>
                        </span>
                    )

                    displayAlert(alert,'success')
                }
                else {
                    setStakes(stakes => stakes.filter(item => item !== stake))

                    let alert = (
                        <span>
                            Transaction confirmed.<br />
                            <a href={config.EXPLORER_TX_BASE+signature} target="_blank" rel="noreferrer">View in Explorer<i className='bi bi-box-arrow-up-right ms-2'></i></a>
                        </span>
                    )

                    displayAlert(alert,'success')
                }
                
                setUpdatingStakes(updatingStakes.filter(item => item !== stake))    
            }
            
        })

        return signature
        
    }

    const doDeactivate = async (stake) => {
        
        setAwaitingSignature(true)
        
        try {

            let tx = deactivateStake(publicKey,stake.pubkey)

            tx = await addMeta(tx,publicKey,connection)
    
            await signTransaction(tx)
            await submitTx(tx,stake)
    
        }
        catch(e) {
            console.log(e.message)
            displayAlert(e.message,'error')
            setAwaitingSignature(false)
        }

    }

    const doClose = async (stake) => {
        
        setAwaitingSignature(true)
        
        try {
            let tx = closeStake(publicKey, stake.pubkey, stake.account.lamports)

            tx = await addMeta(tx,publicKey,connection)

            await signTransaction(tx)
            await submitTx(tx,stake,true)
        }
        catch(e) {
            console.log(e.message)
            displayAlert(e.message,'error')
            setAwaitingSignature(false)
        }
    }

    const doDelegate = async (stake, vote_identity, hideModal = false) => {

        setAwaitingSignature(true)
        
        try {
            let votePubkey = new PublicKey(vote_identity)

            let tx = delegateStake(publicKey, stake.pubkey, votePubkey)

            tx = await addMeta(tx,publicKey,connection)

            await signTransaction(tx)
            await submitTx(tx,stake)
        }
        catch(e) {
            console.log(e.message)
            displayAlert(e.message,'error')
            setAwaitingSignature(false)
        }
    }
    
    const doSearch = (input) => {
        
        const filteredValidators = [];
        if(input.length > config.DEFAULT_SEARCH_KEY_COUNT){
          validatorList.map((validator) => {
            
                let name = validator.name;
                let txtValue = validator.name + validator.identity + validator.vote_identity;
                
                if (txtValue.toUpperCase().indexOf(input.toUpperCase()) > -1 ) {
                    
                    let sf = "rank"
                    filteredValidators.sort((a,b) => (a[sf] > b[sf]) ? 1 : ((b[sf] > a[sf]) ? -1 : 0));
                    filteredValidators.push(validator);
                    
                }   
            })
            console.log(filteredValidators)
            setDelegateSearch(filteredValidators)
        }
        else setDelegateSearch([])

    }

    const renderDelegateSearchResults = () => {
        if(delegateSearch.length>0) {
            let result = []
            delegateSearch.map((validator,i) => {
                if(i<3) {
                    result.push((
                        <div className='d-flex flex-row align-items-center px-2 py-1' onClick={() => selectDelegateValidator(validator)}>
                            <div className='me-2'>
                                {(validator.image!=null) ? <RenderImage vote_identity={validator.vote_identity} img={validator.image} size={25} /> : null}
                            </div>
                            <div>
                                <RenderName validator={validator} />
                            </div>
                        </div>
                    ))
                }
            })

            return (
                <div className='d-flex flex-column bg-light text-dark rounded-bottom pt-2 delegate-search-results'>
                    {result}
                </div>
            )
        }
        else return null
    }

    const selectDelegateValidator = (validator: validatorI) => {
        setDelegateValidator(validator)
        setDelegateSearch([])
        setDelegateSearchInput('')
    }

    const renderStakes = () => {
        if(stakes!=null && stakes.length > 0) {
            let result = []

            stakes.sort((a,b) => {
                if(b.account.data.parsed.info.stake.delegation.stake === a.account.data.parsed.info.stake.delegation.stake) {

                    return b.pubkey.toString().toLowerCase().localeCompare(a.pubkey.toString().toLowerCase())
                }
                else {
                    return b.account.data.parsed.info.stake.delegation.stake - a.account.data.parsed.info.stake.delegation.stake
                }

            })

            stakes.map((stake) => {
                let validator = findStakeValidator(stake.account.data.parsed.info.stake.delegation.voter);
                let status = getStakeStatus(stake,epoch);
                let statusbg = (status == 2) ? 'bg-success' : 'bg-secondary';
                statusbg = (status == 1) ? 'bg-info' : statusbg;
                statusbg = (status == 3) ? 'bg-warning' : statusbg;
                let statustext = (status==3 || status ==1) ? 'text-dark' : 'text-white'
                
                result.push((
                    <div className='d-flex card-light rounded border border-1 border-dark flex-column align-items-center m-1 text-light my-stake-box mt-5'>
                        <div className='me-2 stake-image'>
                            {(validator!=null) ? (
                            <RenderImage
                                img={validator.image}
                                vote_identity={validator.vote_identity}
                                size={60}
                                className='border border-2 border-dark'
                            />   
                            ) : null}
                        </div>
                        <div className='fs-5 text-truncate w-100 px-3 text-center'>
                            <RenderName
                                validator={validator}
                            />
                        </div> 
                        
                            <div className='d-flex align-items-center'>
                                <div className='justify-content-center fs-6 p-1 px-3 badge bg-dark flex-nowrap ms-4'>
                                    ◎ {Number(stake.account.data.parsed.info.stake.delegation.stake/LAMPORTS_PER_SOL).toFixed(9)}
                                </div>
                                <div>
                                    <OverlayTrigger
                                        placement="top"
                                        overlay={
                                            <Tooltip>
                                                Delegated amount, excludes rent exempt amount<br />(~ ◎ 0.002)
                                            </Tooltip>
                                        } 
                                    >
                                        <i className='bi bi-info-circle ms-2'></i>
                                    </OverlayTrigger>
                                </div>
                            </div>
                        
                        <div className={'p-1 my-1 px-3 badge '+statusbg+' '+statustext}>
                            {StakeStatus[status]}
                        </div>
                        <div className='w-100 text-truncate p-1 px-3 text-center'>
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip>
                                        Click to copy stake account address
                                    </Tooltip>
                                } 
                            >
                        
                                <span className='pointer' onClick={() => {navigator.clipboard.writeText(stake.pubkey.toString())}}>
                                    <i className='bi bi-key me-2'></i>{stake.pubkey.toString()}
                                </span>
                            
                            </OverlayTrigger>
                            
                        </div>
                        <div className='p-1'>
                            {renderStakeButtons(stake,status)}
                        </div>
                    </div>
                    
                ))
            })
            
            setRenderResult(result); 
        }
        else if(stakes!=null && initialFetch) {
            if(stakes.length==0) {
                setRenderResult((
                    <div className='d-flex justify-content-center text-white p-5 fs-5'>
                        Uh oh... looks like you don&apos;t have any stake accounts or we&apos;re having trouble finding them.
                    </div>
                ))
            }
            
        }
        
    }
    
    if(!connected || userPubkey == null) {
        return (
            <div className='w-50 p-2 border border-light text-light rounded text-center fs-5 m-auto mt-5'>
                Please connect your wallet to view your stake accounts.
            </div>
        )
    }
    else {
        return (
            <React.Fragment>
                [
                <div className='d-flex flex-wrap justify-content-center' key='my-stakes'>
                    {renderResult}
                </div>,
                <Alert 
                    show={(message!=null)} 
                    variant={(messageType=='error') ? 'danger' : 'success'} 
                    key='alert'
                    dismissible
                    className='my-stake-error'
                    >
                        {message}
                </Alert>,
                <Modal show={(delegatingStake!=null)} onHide={() => {setDelegatingStake(null); setDelegateValidator(null)}} dialogClassName='modal-md'>
                    <Modal.Header closeButton>
                        <Modal.Title>Delegate to a validator</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className='d-flex flex-column'>
                        <div className='d-flex flex-column'>
                            <InputGroup>
                                <Form.Control
                                    onChange={(event) => setDelegateSearchInput(event.target.value)}
                                    value={delegateSearchInput}
                                    placeholder='Type to search...'
                                ></Form.Control>
                            </InputGroup>
                            <div className='position-relative'>
                                {renderDelegateSearchResults()}
                            </div>
                            
                        </div>
                        {(delegateValidator!=null && clusterStats !=null) ?
                        <div className='d-flex justify-content-center flex-column mt-3'>
                            <div className='d-flex justify-content-center'>
                                <div className='fw-bold fs-5 mb-2'>
                                    <RenderImage
                                        img={delegateValidator.image}
                                        vote_identity={delegateValidator.vote_identity}
                                        size={60}
                                        className='border border-dark border-1'
                                    />
                                </div>
                            </div>
                            <div className='d-flex justify-content-center'>
                                <div className='fw-bold fs-5 mb-2 text-truncate'>
                                    <RenderName validator={delegateValidator} />
                                </div>
                            </div>
                            <div className='row'>
                                <div className='col col-md-3 fw-bold'>
                                    Vote Account
                                </div>
                                <div className='col col-md-9 text-truncate'>
                                        {delegateValidator.vote_identity}
                                </div>
                            </div>
                            <div className='row'>
                                <div className='col col-md-3 fw-bold'>
                                    Identity
                                </div>
                                <div className='col col-md-9 text-truncate'>
                                        {delegateValidator.identity}
                                </div>
                            </div>

                            <div className='d-flex text-center my-2'>
                                <div className='flex-grow-1'>
                                    <span className='pointer wiz-font me-3 '>WIZ SCORE</span>
                                    <span className='fw-bold'>{delegateValidator.wiz_score}%</span>
                                </div>
                                <div className='flex-grow-1'>
                                    <span className='wiz-font me-3'>WIZ RANK</span>
                                    <span className='fw-bold'>{ordinal(delegateValidator.rank)}</span>
                                </div>
                            </div>
                            <div className='d-flex my-2'>
                                <OverlayTrigger
                                    placement="bottom"
                                    overlay={
                                        <Tooltip>
                                            Skip rate (lower is better)
                                        </Tooltip>
                                    } 
                                >
                                    <div className='bg-wizlight rounded text-center flex-grow-1 m-1'>
                                        <div className='p-2'>
                                            {delegateValidator.skip_rate.toFixed(1)}%
                                        </div>
                                        <div>
                                            
                                                <i className='bi bi-box'></i>
                                            
                                        </div>
                                        <div className="progress bg-semidark" style={{height: '2px'}}>                        
                                            <div className="progress-bar bg-warning" role="progressbar" aria-valuenow={delegateValidator.skip_rate} aria-valuemin={0} aria-valuemax={100} style={{width: delegateValidator.skip_rate+'%'}}>
                                            </div>                    
                                        </div>                
                                    </div>
                                </OverlayTrigger>
                                <OverlayTrigger
                                    placement="bottom"
                                    overlay={
                                        <Tooltip>
                                            Voting rate (higher is better)
                                        </Tooltip>
                                    } 
                                >
                                    <div className='bg-wizlight rounded text-center flex-grow-1 m-1'>
                                        <div className='p-2'>   
                                            {delegateValidator.credit_ratio.toFixed(1)}%
                                        </div>
                                        <div>
                                            
                                                <i className='bi bi-pencil-square'></i>
                                            
                                        </div>
                                        <div className="progress bg-semidark" style={{height: '2px'}}>                        
                                            <div className="progress-bar bg-warning" role="progressbar" aria-valuenow={delegateValidator.credit_ratio} aria-valuemin={0} aria-valuemax={100} style={{width: delegateValidator.credit_ratio+'%'}}>
                                            </div>                    
                                        </div>    
                                    </div>
                                </OverlayTrigger>
                                <OverlayTrigger
                                    placement="bottom"
                                    overlay={
                                        <Tooltip>
                                            Commission
                                        </Tooltip>
                                    } 
                                >
                                    <div className='bg-wizlight rounded text-center flex-grow-1 m-1'>
                                        <div className='p-2'>
                                            {delegateValidator.commission}%
                                        </div>
                                        <div>
                                            
                                                <i className='bi bi-cash-coin'></i>
                                            
                                        </div>
                                        <div className="progress bg-semidark" style={{height: '2px'}}>                        
                                            <div className={(delegateValidator.commission<=10) ? "progress-bar bg-warning" : "progress-bar bg-danger"} role="progressbar" aria-valuenow={delegateValidator.commission} aria-valuemin={0} aria-valuemax={10} style={{width: delegateValidator.commission*10+'%'}}>
                                            </div>                    
                                        </div>  
                                    </div>
                                </OverlayTrigger>
                                <OverlayTrigger
                                    placement="bottom"
                                    overlay={
                                        <Tooltip>
                                            Estimated APY based on this epoch&apos;s performance
                                        </Tooltip>
                                    } 
                                >
                                    <div className='bg-wizlight rounded text-center flex-grow-1 m-1'>
                                        <div className='p-2'>
                                            {delegateValidator.apy_estimate}%
                                        </div>
                                        <div>
                                                <i className='bi bi-graph-up-arrow'></i>  
                                        </div>
                                        <div className="progress bg-semidark" style={{height: '2px'}}>                        
                                            <div className="progress-bar bg-warning" role="progressbar" aria-valuenow={delegateValidator.apy_estimate} aria-valuemin={0} aria-valuemax={10} style={{width: delegateValidator.apy_estimate*10+'%'}}>
                                            </div>                    
                                        </div> 
                                    </div>
                                </OverlayTrigger>
                            </div>
                            <div className='d-flex align-items-center my-2 flex-column'>
                                {(delegatingStake!=null) ? (
                                    <div className='badge bg-dark text-light p-2 px-3 fs-5'>
                                        ◎ {Number(delegatingStake.account.data.parsed.info.stake.delegation.stake/LAMPORTS_PER_SOL).toFixed(9)}
                                    </div>
                                ) : null }
                                <div className='text-light text-center'>
                                    Amount to delegate
                                    <br />
                                    (excludes rent exempt reserve)
                                </div>
                            </div>
                            <div className='my-2 text-center'>
                                <button 
                                    className='btn btn-outline-light px-5' 
                                    onClick={() => { 
                                        doDelegate(delegatingStake, delegateValidator.vote_identity)
                                    }}
                                    disabled={awaitingSignature}
                                    >
                                    🚀 Stake
                                </button>
                            </div>
                        </div>
                         : null}

                    </Modal.Body>
                </Modal>
                ]
            </React.Fragment>
        )
        
    }
}