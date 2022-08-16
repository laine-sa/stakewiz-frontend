import React, { FC, useContext, useEffect, useState } from "react";
import config from '../../config.json';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { getStakeAccounts, StakeStatus, getStakeStatus } from './common';
import { ValidatorContext } from '../validator/validatorhook';
import { Spinner} from '../common'
import { RenderImage, RenderName } from '../validator/common'
import { Alert, OverlayTrigger, Tooltip } from "react-bootstrap";
import { addMeta, closeStake, deactivateStake, delegateStake } from "./transactions";
import { useWallet } from "@solana/wallet-adapter-react";

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

    useEffect(() => {
        if(stakes == null) {
            getStakeAccounts(userPubkey, connection).then((stakes) => {
                
                setStakes(stakes);
            })
            
        }
    }, [userPubkey])

    useEffect(() => {
        renderStakes()
    }, [stakes, validatorList, awaitingSignature, updatingStakes])

    useEffect(() => {
        if(connected && epoch == 0) {
            connection.getEpochInfo()
            .then((epoch) => {
                setEpoch(epoch.epoch)
            })
        }
    })

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
                            <button className='btn btn-outline-light px-4' onClick={() => doDelegate(stake)} disabled={awaitingSignature}><i className='bi bi-arrow-up-right-square-fill fs-6'></i></button>
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
                            <button className='btn btn-outline-light px-4' onClick={() => doDelegate(stake, true)} disabled={awaitingSignature}><i className='bi bi-x-octagon fs-6'></i></button>
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
        
        setUpdatingStakes(updatingStakes => [...updatingStakes, stake])

        let blockhash = await connection.getLatestBlockhash()

        connection.confirmTransaction({
            signature: signature, 
            blockhash: blockhash.blockhash, 
            lastValidBlockHeight: blockhash.lastValidBlockHeight}, 
            'confirmed'
        )
        .then(async (conf) => {
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
                    let account = await connection.getParsedAccountInfo(stake.pubkey,'confirmed')
        
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
    
            let signed = await signTransaction(tx)
    
            let signature = await submitTx(tx,stake)
    
            setAwaitingSignature(false)
            console.log(signature)
    
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

            let signed = await signTransaction(tx)

            let signature = await submitTx(tx,stake,true)

            setAwaitingSignature(false)
            console.log(signature)
        }
        catch(e) {
            console.log(e.message)
            displayAlert(e.message,'error')
            setAwaitingSignature(false)
        }
    }

    const doDelegate = async (stake, redelegate:boolean = false) => {

        setAwaitingSignature(true)
        
        try {
            let votePubkey = new PublicKey(stake.account.data.parsed.info.stake.delegation.voter)

            let tx = delegateStake(publicKey, stake.pubkey, votePubkey)

            tx = await addMeta(tx,publicKey,connection)

            let signed = await signTransaction(tx)

            let signature = await submitTx(tx,stake)
            setAwaitingSignature(false)
            console.log(signature)
        }
        catch(e) {
            console.log(e.message)
            displayAlert(e.message,'error')
            setAwaitingSignature(false)
        }
    }

    const renderStakes = () => {
        if(stakes!=null) {
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
                            <RenderImage
                                img={validator.image}
                                vote_identity={validator.vote_identity}
                                size={60}
                                className='border border-2 border-dark'
                            />   
                        </div>
                        <div className='fs-5 text-truncate w-100 px-3 text-center'>
                            <RenderName
                                validator={validator}
                            />
                        </div> 
                        <div className='justify-content-center fs-6 p-1 px-3 badge bg-dark flex-nowrap'>
                            ◎ {Number(stake.account.data.parsed.info.stake.delegation.stake/LAMPORTS_PER_SOL).toFixed(9)}
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
                </Alert>
                ]
            </React.Fragment>
        )
        
    }
}