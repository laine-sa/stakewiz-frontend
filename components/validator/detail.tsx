import React, { useRef, FC, useContext } from 'react';
import axios from 'axios';
import config from '../../config.json';
import { validatorI, ValidatorBoxPropsI, ValidatorListI, ValidatorListingI, validatorDetailI, clusterStatsI } from './interfaces'
import {checkSolflareEnabled, ConditionalWrapper, getClusterStats, Spinner} from '../common'
import { RenderImage, RenderUrl, StakeLabel } from './common';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Gauges } from './gauges';
import { StakeHistoryChart } from './stake_history';
import { WizScoreBody, WizScoreChart } from '../wizscore';
import { DelinquencyChart } from './delinquency';
import { EpochStakeChart } from './epoch_stake';
import { AlertForm } from '../alert';
import { StakeDialog } from '../stake/single-stake';
import { getCommissionHistory } from '../stake/common';
import { CommissionHistoryI } from '../stake/interfaces';

const API_URL = process.env.API_BASE_URL;

class ValidatorDetail extends React.Component<validatorDetailI, 
    {
        validator: validatorI|null;
        stake_change: number|null;
        showStakeModal: boolean;
        clusterStats: clusterStatsI|null;
        commissionHistory: CommissionHistoryI[]|null;
    }> {
    constructor(props) {
        super(props);
        this.state = {
            validator: null,
            stake_change: null,
            showStakeModal: false,
            clusterStats: null,
            commissionHistory: null
        };
        if(this.props.vote_identity!='') this.getValidator();
        if(this.state.clusterStats==null) getClusterStats().then((stats) => {
            this.setState({
                clusterStats: stats
            });
        });
        if(this.state.commissionHistory==null) getCommissionHistory(this.props.vote_identity).then((history) => {
            this.setState({
                commissionHistory: history
            })
            console.log(history)
        })
    }
    getValidator() {
        axios(API_URL+config.API_ENDPOINTS.validator+'/'+this.props.vote_identity, {
          headers: {'Content-Type':'application/json'}
        })
          .then(response => {
            let json = response.data as validatorI;
            
            
            this.setState({
                validator: json
            })

            let title = this.props.vote_identity;
            if(json.name!='') title = json.name;
            
            this.props.updateTitle(title);
          })
          .catch(e => {
            console.log(e);
            setTimeout(() => { this.getValidator() }, 5000);
          })
    }

    renderName() {
        if(this.state.validator!==null) {
            if(this.state.validator.name=='') {
                return this.state.validator.vote_identity;
            }
            else return this.state.validator.name;
        }
    }

    updateStakeChange(change) {
        
        this.setState({
            stake_change: change
        });
    }

    renderCommissionLabel() {
        if(this.state.commissionHistory!==null && this.state.validator !== null) {
            if(this.state.commissionHistory.length>0) {
                if(this.state.commissionHistory[0].commission == this.state.validator.commission) {
                    let since = new Date(this.state.commissionHistory[0].observed_at)
                    return (
                        <div className='badge bg-light text-dark badge-sm mx-1'>
                            Since {since.toLocaleDateString(undefined, {
                                dateStyle: "medium"
                            })}
                        </div>
                    )
                }
            }
        }
    }

    renderCommissionTable() {
        if(this.state.commissionHistory!==null) {

            let rows: JSX.Element[] = []
            this.state.commissionHistory.map((event,i) => {
                let formatted_date = new Date(event.observed_at)

                let prev_comm = (this.state.commissionHistory!==null && i+1 < this.state.commissionHistory.length) ? this.state.commissionHistory[i+1].commission+' %' : 'N/A'

                let row = (
                    <tr>
                        <th scope='row' className='fw-normal'>
                            {formatted_date.toLocaleDateString(undefined,{dateStyle:'medium'})+' '+formatted_date.toLocaleTimeString()}
                        </th>
                        <td>
                            {prev_comm}
                        </td>
                        <td>
                            {event.commission} %
                        </td>
                    </tr>
                )
                rows.push(row)
            })

            return (
                <table className='table table-sm text-light'>
                    <thead>
                        <tr>
                            <th scope='col'>
                                Observation time
                            </th>
                            <th scope='col'>
                                Previous commission
                            </th>
                            <th scope='col'>
                                New commission
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            )
        }
        else {
            <div>No commission changes in our records for this validator.</div>
        }
        
    }

    render() {
        const alertFormRef = React.createRef()
        const scrollToAlertForm = () => (alertFormRef.current as HTMLElement).scrollIntoView()
        const solflareEnabled = checkSolflareEnabled(this.props.userPubkey);

        if(this.state.validator!=null) {
            

            let updated_at = new Date(this.state.validator.updated_at);

            let activated_stake = new Intl.NumberFormat().format(Number(this.state.validator.activated_stake.toFixed(0)));

            return ( [
                <div className='container-sm m-1 mt-5 rounded-top position-relative d-flex align-items-center flex-column' key='validator-details-header'>
                    
                   
                    <div className='d-flex'>
                        <RenderImage
                            img={this.state.validator.image}
                            vote_identity={this.state.validator.vote_identity}
                            size={100}
                            className={(this.state.validator.delinquent) ? 'border border-danger border-3' : ''}
                        />
                    </div>

                    <div className='d-flex text-white text-center p-2 flex-column'>
                        <h2 className='d-flex align-items-center justify-content-center'>{this.renderName()}
                        {(this.state.validator.delinquent) ? (
                            <div className='ms-2 badge bg-danger fs-6'>
                                <OverlayTrigger
                                    placement="bottom"
                                    overlay={
                                        <Tooltip>
                                            This validator is currently delinquent, which means they aren&apos;t voting.
                                        </Tooltip>
                                    } 
                                > 
                                    <span>DELINQUENT</span>
                                </OverlayTrigger>
                            </div>
                        ): null}
                        </h2>
                        
                        <div>
                            <button className='btn btn-outline-light mx-1' onClick={scrollToAlertForm}>
                                + Create Alert
                            </button>
                            <ConditionalWrapper
                                    condition={(!this.props.connected) ? true : false}
                                    wrapper={children => (
                                        <OverlayTrigger
                                            placement="right"
                                            overlay={
                                                <Tooltip>
                                                    Connect wallet to enable
                                                </Tooltip>
                                            } 
                                        >
                                            {children}
                                        </OverlayTrigger>
                                    )}
                            >
                                <span>
                                    <button 
                                        className='btn btn-outline-light mx-1' 
                                        onClick={() => this.setState({showStakeModal:true})}
                                        disabled={!this.props.connected}
                                        >
                                        + Stake
                                    </button>
                                </span>
                            </ConditionalWrapper>
                        </div>
                        
                    </div>
                </div>,
                <div className='d-flex flex-column validator-details-content' key='validator-details-content'>

                    <Gauges
                        skip_rate={this.state.validator.skip_rate}
                        credit_ratio={this.state.validator.credit_ratio}
                        wiz_score={this.state.validator.wiz_score}
                        uptime={this.state.validator.uptime}

                    />

                    <div className='d-flex flex-column p-2 text-white border border-white rounded'>
                    
                            <div className='row'>
                                <div className='col'>
                                        <div className='row mb-2'>
                                            <div className='col col-md-2 fw-bold'>
                                                Identity
                                            </div>
                                            <div className='col text-truncate'>

                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={
                                                        <Tooltip>
                                                            Copy
                                                        </Tooltip>
                                                    } 
                                                >
                                                    <span className='pointer' onClick={() => {navigator.clipboard.writeText((this.state.validator!==null) ? this.state.validator.identity : '')}}>{this.state.validator.identity}</span>
                                                </OverlayTrigger>
                                            </div>
                                        </div>
                                </div>
                            </div>
                            <div className='row'>
                                <div className='col'>
                                    <div className='row mb-2'>
                                            <div className='col col-md-2 fw-bold'>
                                                Vote Account
                                            </div>
                                            <div className='col text-truncate'>

                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={
                                                        <Tooltip>
                                                            Copy
                                                        </Tooltip>
                                                    } 
                                                >
                                                    <span className='pointer' onClick={() => {navigator.clipboard.writeText((this.state.validator!==null) ? this.state.validator.vote_identity : '')}}>{this.state.validator.vote_identity}</span>
                                                </OverlayTrigger>
                                            </div>
                                        </div>
                                </div>
                            </div>
                            <div className='row'>
                                <div className='col'>
                                    <div className='row mb-2'>
                                        <div className='col col-md-2 fw-bold'>
                                            Description
                                        </div>
                                        <div className='col'>
                                            {this.state.validator.description}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='row mobile-validator-info-row'>
                                <div className='col'>
                                    <div className='row mb-2'>
                                        <div className='col fw-bold'>
                                            Website
                                        </div>
                                        <div className='col text-truncate'>
                                            <RenderUrl
                                                url={this.state.validator.website}
                                            />
                                        </div>
                                    </div>
                                    
                                </div>
                                <div className='col'>
                                    <div className='row mb-2'>
                                        <div className='col fw-bold'>
                                            Keybase
                                        </div>
                                        <div className='col'>
                                            {this.state.validator.keybase}
                                        </div>
                                    </div>
                                </div>
                                <div className='col'>
                                    <div className='row mb-2'>
                                        <div className='col fw-bold'>
                                            Commission
                                        </div>
                                        <div className='col'>
                                            {this.state.validator.commission} %
                                            {this.renderCommissionLabel()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='row  mobile-validator-info-row'>
                            <div className='col'>
                                    <div className='row mb-2'>
                                        <div className='col fw-bold'>
                                            TrueAPY (estimate)
                                            <OverlayTrigger
                                                placement="bottom"
                                                overlay={
                                                    <Tooltip>
                                                        Our TrueAPY is calculated by estimating the precise on-chain inflation for the current estimated epoch duration, giving you the most accurate compounded, annualised yield estimate based on real-time performance.
                                                    </Tooltip>
                                                } 
                                            >
                                                <i className='bi bi-info-circle ms-2'></i>
                                            </OverlayTrigger>
                                        </div>
                                        <div className='col'>
                                            {this.state.validator.apy_estimate} %
                                        </div>
                                    </div>
                                </div>
                                <div className='col'>
                                    <div className='row mb-2'>
                                        <div className='col fw-bold'>
                                            Stake
                                        </div>
                                        <div className='col d-flex align-items-center'>
                                            ◎ {activated_stake}
                                            <StakeLabel
                                                stake={(this.state.stake_change!==null) ? this.state.stake_change : 0}
                                                />
                                        </div>
                                    </div>
                                </div>
                                <div className='col'>
                                    <div className='row mb-2'>
                                        <div className='col fw-bold'>
                                            Version
                                        </div>
                                        <div className='col'>
                                            {this.state.validator.version}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            
                        
                    </div>


                    <div className='d-flex my-2 flex-grow-1 flex-wrap validator-detail-flex-container'>
                        <div className='flex-grow-1 m-1 validator-detail-flex-card'>
                            <div className='validator-detail-flex-opacity-bg'></div>
                            <div className='card text-light'>
                                <div className='card-header'>
                                    Delinquencies (30 days)
                                </div>
                                <div className='card-body'>
                                    <DelinquencyChart
                                        vote_identity={this.state.validator.vote_identity}
                                    />
                                </div>
                                
                            </div>
                        </div>
                        <div className='flex-grow-1 m-1 validator-detail-flex-card'>
                            <div className='validator-detail-flex-opacity-bg'></div>
                            <div className='card text-light'>
                                <div className='card-header'>
                                    24h Moving Average Wiz Score
                                </div>
                                <div className='card-body'>
                                    <WizScoreChart 
                                        vote_identity={this.state.validator.vote_identity}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className='flex-grow-1 m-1 validator-detail-flex-card'>
                            <div className='validator-detail-flex-opacity-bg'></div>
                            <div className='card text-light'>
                                <div className='card-header'>
                                    Active Stake (30 epochs)
                                </div>
                                <div className='card-body'>
                                    <StakeHistoryChart
                                        vote_identity={this.state.validator.vote_identity}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className='flex-grow-1 m-1 validator-detail-flex-card'>
                            <div className='validator-detail-flex-opacity-bg'></div>
                            <div className='card text-light'>
                                <div className='card-header'>
                                    Stake changes this epoch: 
                                    <StakeLabel
                                        stake={(this.state.stake_change!==null) ? this.state.stake_change : 0}
                                    />
                                </div>
                                <div className='card-body'>
                                    <EpochStakeChart 
                                        vote_identity={this.state.validator.vote_identity}
                                        updateStake={(change) => this.updateStakeChange(change)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className='flex-grow-1 m-1 validator-detail-flex-card'>
                            <div className='validator-detail-flex-opacity-bg'></div>
                            <div className='card text-light'>
                                <div className='card-header'>
                                    Scorecard
                                </div>
                                <div className='card-body validator-detail-scorecard'>
                                    <WizScoreBody
                                    validator={this.state.validator}
                                />
                                </div>
                            </div>
                        </div>
                        <div className='flex-grow-1 m-1 validator-detail-flex-card'>
                            <div className='validator-detail-flex-opacity-bg'></div>
                            <div className='card text-light'>
                                <div className='card-header'>
                                    Commission History
                                </div>
                                <div className='card-body'>
                                    {this.renderCommissionTable()}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='row'>
                        <div ref={alertFormRef as React.RefObject<HTMLDivElement>} className='col p-2 text-white border border-white rounded'>
                            <AlertForm
                                validator={this.state.validator}
                                hideAlertModal={null}
                                userPubkey={this.props.userPubkey}
                                solflareEnabled={this.props.solflareEnabled}
                            />
                        </div>
                    </div>
                    <div className='text-secondary fst-italic text-end my-1'>
                        Updated: {updated_at.toLocaleString()}
                    </div>
                </div>,
                <StakeDialog
                    key='stakeModal'
                    validator={this.state.validator}
                    showStakeModal={this.state.showStakeModal}
                    hideStakeModal={() => this.setState({showStakeModal:false})}
                    clusterStats={this.state.clusterStats}
                />
            ]
            )
        }
        else {
            return (
                <Spinner />
            )
        }
    }
}

export {ValidatorDetail}