import { FC, useContext, useEffect, useState } from "react";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { getStakeAccounts, StakeStatus, getStakeStatus } from './common';
import { ValidatorContext } from '../validator/validatorhook';
import {Header, TopBar, Footer, Spinner} from '../common'
import { RenderImage, RenderName } from '../validator/common'
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { deactivateStake } from "./transactions";
import { useWallet } from "@solana/wallet-adapter-react";

const API_URL = process.env.API_BASE_URL;

export const Stakes: FC<{userPubkey: string, connection: Connection, connected: boolean}> = ({userPubkey, connection, connected}) => {

    const [ stakes, setStakes ] = useState(null);
    const [renderResult, setRenderResult] = useState<any>(<Spinner />)
    const validatorList = useContext(ValidatorContext)
    const [epoch, setEpoch] = useState(0)
    const {publicKey, sendTransaction, signTransaction, signAllTransactions} = useWallet();

    useEffect(() => {
        if(stakes == null) {
            getStakeAccounts(userPubkey, connection).then((stakes) => {
                
                setStakes(stakes);
            })
            
        }
    }, [userPubkey])

    useEffect(() => {
        renderStakes()
    }, [stakes, validatorList])

    useEffect(() => {
        if(connected && epoch == 0) {
            connection.getEpochInfo()
            .then((epoch) => {
                setEpoch(epoch.epoch)
            })
        }
    })

    const findStakeValidator = (vote_identity) => {
        for(let i = 0; i < validatorList.length; i++) {
            if(validatorList[i].vote_identity == vote_identity) {
                return validatorList[i]
            }
        }
        return null;
    }

    const doDeactivate = async (stake) => {
        
        let authorized = new PublicKey(userPubkey)
        let blockhash = await connection.getLatestBlockhash()
        
        let tx = deactivateStake(authorized,stake.pubkey)

        tx.recentBlockhash = blockhash.blockhash
        tx.lastValidBlockHeight = blockhash.lastValidBlockHeight
        tx.feePayer = authorized

        let signed = await signTransaction(tx)

        let signature = await connection.sendRawTransaction(signed.serialize())

        console.log(signature)

    }

    const renderStakes = () => {
        if(stakes!=null) {
            let result = []

            stakes.sort((a,b) => {
                return b.account.data.parsed.info.stake.delegation.stake - a.account.data.parsed.info.stake.delegation.stake
            })

            stakes.map((stake) => {
                let validator = findStakeValidator(stake.account.data.parsed.info.stake.delegation.voter);
                let status = getStakeStatus(stake,epoch);
                let statusbg = (status == 2) ? 'bg-success' : 'bg-secondary';
                statusbg = (status == 3 || status == 1) ? 'bg-warning' : statusbg;
                let statustext = (status==3 || status ==1) ? 'text-dark' : 'text-white'
                
                result.push((
                    <div className='d-flex bg-wizlight rounded border border-1 border-dark flex-column align-items-center m-1 text-light my-stake-box mt-5'>
                        <div className='me-2 stake-image'>
                            <RenderImage
                                img={validator.image}
                                vote_identity={validator.vote_identity}
                                size={60}
                                className='border border-2 border-dark'
                            />   
                        </div>
                        <div className='fs-5'>
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
                            {(status == 2 || status == 1) ? (
                                <OverlayTrigger
                                placement="bottom"
                                overlay={
                                    <Tooltip>
                                        Deactivate
                                    </Tooltip>
                                } 
                                > 
                                    <button className='btn btn-outline-light btn-sm px-4' onClick={() => doDeactivate(stake)}><i className='bi bi-chevron-double-down fs-6'></i></button>
                                </OverlayTrigger>
                            ) : null}
                            {(status == 0) ? (
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
                                        <button className='btn btn-outline-light me-1 px-4'><i className='bi bi-box-arrow-left fs-6'></i></button>
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
                                        <button className='btn btn-outline-light px-4'><i className='bi bi-arrow-up-right-square-fill fs-6'></i></button>
                                    </OverlayTrigger>]
                            ) : null}
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
        return renderResult
    }
}