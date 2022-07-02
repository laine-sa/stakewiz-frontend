import React, { useRef, FC, useContext } from 'react';
import axios from 'axios';
import config from '../config.json';
import SearchBar from './search';
import {WizScore, WizScoreBody, WizScoreChart} from './wizscore';
import {Alert, AlertForm} from './alert';
import Image from 'next/image';
import Link from 'next/link';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import {ConditionalWrapper, Spinner} from './common'
import {Chart} from 'react-google-charts'
import { Connection, ConnectionConfig, PublicKey } from '@solana/web3.js';
import { checkSolflareEnabled } from './common';
import { StakeHistoryChart } from './validator/stake_history'
import { DelinquencyChart } from './validator/delinquency'
import { StakeLabel, RenderUrl, RenderImage, RenderName } from './validator/common'
import { Gauges } from './validator/gauges';
import { EpochStakeChart } from './validator/epoch_stake'
import { validatorI, ValidatorBoxPropsI, ValidatorListI, ValidatorListingI, validatorDetailI, clusterStatsI } from './validator/interfaces'
import { StakeDialog, MultiStakeDialog } from './stake';
import { ValidatorContext } from './validator/validatorhook'
import ordinal from 'ordinal'

const API_URL = process.env.API_BASE_URL;

class ValidatorListing extends React.Component<ValidatorListingI, {}> {
    constructor(props, context ) {
      super(props);

      if(this.props.state.clusterStats==null) this.getClusterStats();
      
      if(this.props.userPubkey) {
          this.getWalletValidators(this.props.userPubkey);
      }
      
    }
    componentDidUpdate() {
        const validatorsContext : any = this.context
        if(this.props.state.validators == null && (validatorsContext) && (validatorsContext.length > 0)){
            this.props.updateState({
                validators: validatorsContext,
                filteredValidators: validatorsContext,
                hasData: true,
            });
        }
    }

    getWalletValidators(pubkey) {
      axios(API_URL+config.API_ENDPOINTS.wallet_validators+'/'+pubkey, {
          headers: {'Content-Type':'application/json'}
      })
        .then(response => {
          let json = response.data;
          
          this.props.updateState({
              walletValidators: json
          });
        })
        .catch(e => {
          console.log(e);
          setTimeout(() => { this.getWalletValidators(pubkey) }, 5000);
        })
    }
  
    getClusterStats() {
      axios(API_URL+config.API_ENDPOINTS.cluster_stats, {
        headers: {'Content-Type':'application/json'}
      })
        .then(response => {
          let json = response.data;
  
          this.props.updateState({
              clusterStats: json
          });
        })
        .catch(e => {
          console.log(e);
          setTimeout(() => { this.getClusterStats() }, 5000);
        })
    }
  
    doFilter(filteredValidators) {
  
      this.props.updateState({
          visibleCount: config.DEFAULT_LIST_SIZE,
          filteredValidators: filteredValidators
      });
    }
  
    bumpVisibleCount() {
        
        this.props.updateState({
          visibleCount: this.props.state.visibleCount + config.DEFAULT_LIST_SIZE
        });
    }

    updateStakeValidators(validator: validatorI) {

        if(this.props.state.stakeValidators!=null) {
            if(this.props.state.stakeValidators.includes(validator)) {
                let sv = this.props.state.stakeValidators;

                sv.splice(this.props.state.stakeValidators.indexOf(validator),1);

                this.props.updateState({
                    stakeValidators: sv
                })
            }
            else {
                let sv = this.props.state.stakeValidators;
                sv.push(validator);

                this.props.updateState({
                    stakeValidators: sv
                });
            }
        }
        else {
            this.props.updateState({
                stakeValidators: [validator]
            });
        }
    }
  
    updateWizModalVisibility(show:boolean,validator=null) {
      console.log(show);
  
        if(validator==null && this.props.state.wizValidator!=null) {
            validator = this.props.state.wizValidator;
        }
        this.props.updateState({
            showWizModal: show,
            wizValidator: validator
        });
    }
  
    updateAlertModalVisibility(show:boolean,validator=null) {
      if(validator==null && this.props.state.alertValidator!=null) {
          validator = this.props.state.alertValidator;
      }
      this.props.updateState({
          showAlertModal: show,
          alertValidator: validator
      });
    }

    updateMultiStakeModalVisibility(show:boolean) {
        
        this.props.updateState({
            showMultiStakeModal: show
        });
    }
  
    render() {
      if(!this.props.state.hasData || this.props.state.clusterStats == null) {
        return (
          <Spinner />
          );
      }
      else {
        return (
            [
              <SearchBar 
                  validators={this.props.state.validators}
                  setFilter={(filteredValidators:[validatorI]) => {
                      return this.doFilter(filteredValidators);
                  }}
                  walletValidators={this.props.state.walletValidators}
                  stakeValidators={this.props.state.stakeValidators}
                  showMultiStakeModal={this.props.state.showMultiStakeModal}
                  updateMultiStakeModal={(show: boolean) => this.updateMultiStakeModalVisibility(show)}
                  key='searchBar'
                  />,
              <ValidatorList 
                  validators={this.props.state.filteredValidators}
                  clusterStats={this.props.state.clusterStats}
                  listSize={this.props.state.visibleCount}
                  key='validatorlist'
                  showWizModal={this.props.state.showWizModal}
                  updateWizModal={(show:boolean,validator:validatorI) => this.updateWizModalVisibility(show,validator)}
                  wizValidator={this.props.state.wizValidator}
                  showAlertModal={this.props.state.showAlertModal}
                  updateAlertModal={(show:boolean,validator:validatorI) => this.updateAlertModalVisibility(show,validator)}
                  showMultiStakeModal={this.props.state.showMultiStakeModal}
                  updateMultiStakeModal={(show:boolean) => this.updateMultiStakeModalVisibility(show)}
                  alertValidator={this.props.state.alertValidator}
                  userPubkey={this.props.userPubkey}
                  solflareEnabled={this.props.state.solflareNotificationsEnabled}
                  connection={this.props.connection}
                  connected={this.props.connected}
                  updateStakeValidators={(validator: validatorI) => this.updateStakeValidators(validator)}
                  stakeValidators={this.props.state.stakeValidators}
                  />,
              <LoadMoreButton
                  key='loadMoreButton'
                  viewDelta={this.props.state.filteredValidators.length - this.props.state.visibleCount}
                  onClick={() => this.bumpVisibleCount()}
                  />
            ]
        );
      }
    }
}
ValidatorListing.contextType = ValidatorContext;

class ValidatorList extends React.Component<ValidatorListI, {}> {
    renderValidator(i:number) {
      return (
              <ValidatorBox key={i}
                clusterStats={this.props.clusterStats}
                validator={this.props.validators[i]} 
                showWizModal={() => this.props.updateWizModal(true,this.props.validators[i])}
                showAlertModal={() => this.props.updateAlertModal(true,this.props.validators[i])}
                connected={this.props.connected}
                index={i}
                updateStakeValidators={(validator: validatorI) => this.props.updateStakeValidators(validator)}
                isStakeValidator={this.isStakeValidator(this.props.validators[i])}
              />
      );
    }

    isStakeValidator(validator: validatorI) {
        if(this.props.stakeValidators!=null) {
            if(this.props.stakeValidators.includes(validator)) {
                return true
            }
            else return false
        }
        return false
    }
  
    render() {
      let list = [];
      let laine = null;
      
      for(let i=0; i<this.props.validators.length; i++) {
        if(this.props.validators[i].vote_identity==config.LAINE_VOTE_IDENTITY) laine = this.props.validators[i];
      }

      for(let i=0; i<this.props.validators.length && i < this.props.listSize; i++) {
        list.push(this.renderValidator(i));
      }
      list.push(<div className='d-flex w-25 flex-grow-1' key='spacer-1'></div>);
      list.push(<div className='d-flex w-25 flex-grow-1' key='spacer-2'></div>);
  

      return (
          [
            <div className='d-flex justify-content-center' key='flex-list-container'>
                <div className={'d-flex flex-wrap w-100'}>
                    {list}
                </div>
            </div>,
            <WizScore 
                key='wizScoreModal'  
                showWizModal={this.props.showWizModal}
                hideWizModal={() => this.props.updateWizModal(false)}
                validator={this.props.wizValidator}
            />,
            <Alert 
                key='alertModal'  
                showAlertModal={this.props.showAlertModal}
                hideAlertModal={() => this.props.updateAlertModal(false)}
                validator={this.props.alertValidator}
                userPubkey={this.props.userPubkey}
                solflareEnabled={this.props.solflareEnabled}
            />,
            <MultiStakeDialog
                key='multiStakeModal'
                stakeValidators={this.props.stakeValidators}
                updateStakeValidators={(validator: validatorI) => this.props.updateStakeValidators(validator)}
                showStakeModal={this.props.showMultiStakeModal}
                hideStakeModal={(alert,validator) => {
                    this.props.updateMultiStakeModal(false)
                    if(alert) this.props.updateAlertModal(true, validator);
                }}
                clusterStats={this.props.clusterStats}
                allowAlertDialog={true}
                laine={laine}
            />
          ]
      );
    }
  }
  
  function LoadMoreButton(props) {
      
      if(props.viewDelta>0) {
          return (
                  <div className="container my-3 text-center">
                      <button className="px-5 btn btn-outline-light btn-lg" 
                              type="button" 
                              id="load-more-btn" 
                              onClick={() => props.onClick()}
                      >
                          Load More...
                      </button>
                  </div>
          );
      }
      else {
          return null;
      }
}

const ValidatorBox: FC<ValidatorBoxPropsI> = ({validator,clusterStats,showWizModal,showAlertModal,connected,index,updateStakeValidators,isStakeValidator}) => {

    const renderStakeBar = () => {

        let stakeText, stakeColor, stakeBg, stakeWidth;
        if(validator.stake_ratio > config.STAKE_CATEGORIES.HIGH) {
            stakeText = 'High Stake: ◎ '+new Intl.NumberFormat().format(Number(validator.activated_stake.toFixed(0)));
            stakeColor = 'text-danger';
            stakeBg = 'bg-danger';
            stakeWidth = 100;
        }
        else if(validator.stake_ratio > config.STAKE_CATEGORIES.MEDIUM) {
            stakeText = 'Medium Stake: ◎ '+new Intl.NumberFormat().format(Number(validator.activated_stake.toFixed(0)));
            stakeColor = 'text-warning';
            stakeBg = 'bg-warning';
            stakeWidth = validator.stake_ratio*1000;
        }
        else {
            stakeText = 'Low Stake: ◎ '+new Intl.NumberFormat().format(Number(validator.activated_stake.toFixed(0)));
            stakeColor = 'text-success';
            stakeBg = 'bg-success';
            stakeWidth = validator.stake_ratio*1000;
        }        

        let btnColor = (isStakeValidator) ? 'btn-outline-success btn-validator-selected' : 'btn-outline-light';

        return (
            [
                <div key={'stakebalabel-'+validator.vote_identity}>                
                    <div className={"d-flex align-items-center justify-content-center vstakelabel my-1"}>
                        {stakeText}
                        <ConditionalWrapper
                                condition={(!connected) ? true : false}
                                wrapper={children => (
                                    <OverlayTrigger
                                        placement="top"
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
                                
                                <button className={'btn btn-sm ms-2 py-0 '+btnColor} onClick={() => updateStakeValidators(validator)} disabled={!connected}>
                                    {(!isStakeValidator) ? (
                                        <span>
                                            <i className='bi bi-plus pe-1 alert-btn-icon'></i>
                                            Stake
                                        </span>
                                        ) : (
                                            <span>
                                                <i className='bi bi-check pe-1 alert-btn-icon'></i>
                                                Stake
                                            </span>
                                            )
                                        }
                                </button>
                            </span>
                        </ConditionalWrapper>
                    </div>            
                </div>,
                <div key={'stakebar-'+validator.vote_identity}>                
                    <div className="col mt-1">                    
                        <div className='progress bg-wizdark' data-bs-toggle="tooltip" title="See FAQ for formula of this display." data-bs-placement="bottom" style={{height: '5px'}}>                        
                            <div className={"progress-bar bg-primary"} role="progressbar" aria-valuenow={stakeWidth} aria-valuemin={0} aria-valuemax={100} style={{width: stakeWidth+'%'}}>
                            </div>                    
                        </div>                
                    </div>            
                </div>     
            ]
        );
    }

    const borderColor = (validator.delinquent) ? 'border-danger' : 'border-primary';
    const bgColor = (isStakeValidator) ? 'validator-box-selected' : 'validator-box-unselected';    

    return (
        <div className={'d-flex position-relative w-25 flex-grow-1 rounded border p-2 m-1 flex-column validator-flex-container justify-content-center '+borderColor+' '+bgColor}>
            {(validator.delinquent) ? (
                <div className='badge bg-danger delinquent-badge'>
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
            ) : null}
            <div className='validator-flex-logo align-items-center d-flex'>
                <div className='flex-shrink-0 my-3'>
                    <RenderImage
                        img={validator.image}
                        vote_identity={validator.vote_identity}
                        size={50}
                    />
                </div>
                <div className='text-truncate fs-6 my-3 ms-2'>
                    <Link href={'/validator/'+validator.vote_identity} passHref>
                        <span className="ms-2 vlist-name-inner pointer">
                            <RenderName
                                validator={validator}    
                            />
                        </span>  
                    </Link>              
                </div>
                
                <OverlayTrigger
                    placement="top"
                    overlay={
                        <Tooltip>
                            Copy identity: {validator.identity}
                        </Tooltip>
                    } 
                >
                    <div className='ms-auto badge bg-semidark align-self-start pointer'>
                        <span id={validator.identity} onClick={() => {navigator.clipboard.writeText(validator.identity)}}>
                            i
                        </span>
                    </div>
                </OverlayTrigger>

                <OverlayTrigger
                    placement="top"
                    overlay={
                        <Tooltip>
                            Copy vote account: {validator.vote_identity}
                        </Tooltip>
                    } 
                >
                    <div className='ms-1 badge bg-semidark align-self-start pointer'>
                        <span id={validator.identity} onClick={() => {navigator.clipboard.writeText(validator.vote_identity)}}>
                            v
                        </span>
                    </div>
                </OverlayTrigger>
                
                <OverlayTrigger
                        placement="top"
                        overlay={
                            <Tooltip>
                                Ranking in these search results
                            </Tooltip>
                        } 
                    >
                    <div className='ms-1 badge bg-semidark align-self-start'>
                            <span>{index+1}</span>
                    </div>
                </OverlayTrigger>
            </div>  

            <div className='d-flex text-center my-2'>
                <div className='flex-grow-1'>
                    <span className='pointer wiz-font me-3 ' onClick={() => showWizModal()}>WIZ SCORE</span>
                    <span className='fw-bold'>{validator.wiz_score}%</span>
                </div>
                <div className='flex-grow-1'>
                    <span className='wiz-font me-3'>WIZ RANK</span>
                    <span className='fw-bold'>{ordinal(validator.rank)}</span>
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
                            {validator.skip_rate.toFixed(1)}%
                        </div>
                        <div>
                            
                                <i className='bi bi-box'></i>
                            
                        </div>
                        <div className="progress bg-semidark" style={{height: '2px'}}>                        
                            <div className="progress-bar bg-warning" role="progressbar" aria-valuenow={validator.skip_rate} aria-valuemin={0} aria-valuemax={100} style={{width: validator.skip_rate+'%'}}>
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
                            {validator.credit_ratio.toFixed(1)}%
                        </div>
                        <div>
                            
                                <i className='bi bi-pencil-square'></i>
                            
                        </div>
                        <div className="progress bg-semidark" style={{height: '2px'}}>                        
                            <div className="progress-bar bg-warning" role="progressbar" aria-valuenow={validator.credit_ratio} aria-valuemin={0} aria-valuemax={100} style={{width: validator.credit_ratio+'%'}}>
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
                            {validator.commission}%
                        </div>
                        <div>
                            
                                <i className='bi bi-cash-coin'></i>
                            
                        </div>
                        <div className="progress bg-semidark" style={{height: '2px'}}>                        
                            <div className={(validator.commission<=10) ? "progress-bar bg-warning" : "progress-bar bg-danger"} role="progressbar" aria-valuenow={validator.commission} aria-valuemin={0} aria-valuemax={10} style={{width: validator.commission*10+'%'}}>
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
                            {validator.apy_estimate}%
                        </div>
                        <div>
                                <i className='bi bi-graph-up-arrow'></i>  
                        </div>
                        <div className="progress bg-semidark" style={{height: '2px'}}>                        
                            <div className="progress-bar bg-warning" role="progressbar" aria-valuenow={validator.apy_estimate} aria-valuemin={0} aria-valuemax={10} style={{width: validator.apy_estimate*10+'%'}}>
                            </div>                    
                        </div> 
                    </div>
                </OverlayTrigger>
            </div>
            <div className='d-flex flex-column my-2'>
                {renderStakeBar()}
            </div>
            <div className='d-flex my-2'>
                <div className='flex-grow-1 mx-1'>
                    <OverlayTrigger
                        placement="bottom"
                        overlay={
                            <Tooltip>
                                Scorecard
                            </Tooltip>
                        } 
                    >
                        <button className='btn btn-outline-light btn-sm w-100' onClick={() => showWizModal()}>
                            <i className='bi bi-list-columns pe-1 alert-btn-icon'></i>
                        </button>
                    </OverlayTrigger>
                </div>
                <div className='flex-grow-1 mx-1'>
                    <OverlayTrigger
                        placement="bottom"
                        overlay={
                            <Tooltip>
                                Create Alert
                            </Tooltip>
                        } 
                    >
                        <button className='btn btn-outline-light btn-sm w-100' onClick={() => showAlertModal()}>
                            <i className='bi bi-bell pe-1 alert-btn-icon'></i>
                        </button>
                    </OverlayTrigger>
                </div>
                <div className='flex-grow-1 mx-1'>
                    <OverlayTrigger
                        placement="bottom"
                        overlay={
                            <Tooltip>
                                More Info
                            </Tooltip>
                        } 
                    >
                        <span>
                            <Link href={'/validator/'+validator.vote_identity} passHref>
                                <button className='btn btn-outline-light btn-sm w-100'>
                                    <i className='bi bi-info-lg pe-1 alert-btn-icon'></i>
                                </button>
                            </Link>
                        </span>
                    </OverlayTrigger>
                    
                </div>
            </div>
        </div>

    )
}

class ValidatorDetail extends React.Component<validatorDetailI, 
    {
        validator: validatorI;
        stake_change: number;
        showStakeModal: boolean;
        clusterStats: clusterStatsI;
    }> {
    constructor(props) {
        super(props);
        this.state = {
            validator: null,
            stake_change: null,
            showStakeModal: false,
            clusterStats: null
        };
        if(this.props.vote_identity!='') this.getValidator();
        if(this.state.clusterStats==null) this.getClusterStats();
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

    getClusterStats() {
        axios(API_URL+config.API_ENDPOINTS.cluster_stats, {
          headers: {'Content-Type':'application/json'}
        })
          .then(response => {
            let json = response.data;
    
            this.setState({
                clusterStats: json
            });
          })
          .catch(e => {
            console.log(e);
            setTimeout(() => { this.getClusterStats() }, 5000);
          })
      }

    renderName() {
        if(this.state.validator.name=='') {
            return this.state.validator.vote_identity;
        }
        else return this.state.validator.name;
    }

    updateStakeChange(change) {
        
        this.setState({
            stake_change: change
        });
    }

    render() {
        const alertFormRef = React.createRef()
        const scrollToAlertForm = () => (alertFormRef.current as HTMLElement).scrollIntoView()
        const solflareEnabled = checkSolflareEnabled(this.props.userPubkey);

        if(this.state.validator!=null) {
            

            let updated_at = new Date(this.state.validator.updated_at);

            let activated_stake = new Intl.NumberFormat().format(Number(this.state.validator.activated_stake.toFixed(0)));

            return ( [
                <div className='container-sm m-1 mt-5 rounded-top position-relative' key='validator-details-header'>
                    
                   
                    <div className='row rounded-top'>
                        <div className='col text-center validator-logo'>
                            <RenderImage
                                img={this.state.validator.image}
                                vote_identity={this.state.validator.vote_identity}
                                size={100}
                                className={(this.state.validator.delinquent) ? 'border border-danger border-3' : null}
                            />
                        </div>
                    </div>

                    <div className='row'>
                        <div className='col text-white text-center p-2'>
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
                <div className='container validator-details-content' key='validator-details-content'>

                    <Gauges
                        skip_rate={this.state.validator.skip_rate}
                        credit_ratio={this.state.validator.credit_ratio}
                        wiz_score={this.state.validator.wiz_score}
                        uptime={this.state.validator.uptime}

                    />

                    <div className='row'>
                        <div className='col p-2 text-white border border-white rounded'>
                        
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
                                                        <span className='pointer' onClick={() => {navigator.clipboard.writeText(this.state.validator.identity)}}>{this.state.validator.identity}</span>
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
                                                        <span className='pointer' onClick={() => {navigator.clipboard.writeText(this.state.validator.vote_identity)}}>{this.state.validator.vote_identity}</span>
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
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className='row  mobile-validator-info-row'>
                                <div className='col'>
                                        <div className='row mb-2'>
                                            <div className='col fw-bold'>
                                                APY (estimate)
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
                                            <div className='col'>
                                                ◎ {activated_stake}
                                                <StakeLabel
                                                    stake={this.state.stake_change}
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
                    </div>


                    <div className='row m-0'>
                        <div className='col p-2 m-1 text-white text-center'>
                        
                            <h3>Active Stake (20 epochs)</h3>
                            <StakeHistoryChart
                                vote_identity={this.state.validator.vote_identity}
                            />
                        </div>
                        <div className='col p-2 m-1 text-white text-center'>
                            <h3>24h Moving Average Wiz Score</h3>
                            <WizScoreChart 
                                vote_identity={this.state.validator.vote_identity}
                            />
                        </div>
                    </div>


                    <div className='row m-0'>
                        <div className='col p-2 m-1 text-white text-center'>
                            <div>
                                <h3>Delinquencies (30 days)</h3>
                                <DelinquencyChart
                                    vote_identity={this.state.validator.vote_identity}
                                />
                            </div>
                            <div>
                                <h3>
                                    Stake changes this epoch: 
                                    <StakeLabel
                                        stake={this.state.stake_change}
                                    />
                                </h3>
                                <EpochStakeChart 
                                    vote_identity={this.state.validator.vote_identity}
                                    updateStake={(change) => this.updateStakeChange(change)}
                                />
                            </div>
                        </div>
                        <div className='col p-2 m-1 text-white text-center'>
                            <h3>Scorecard</h3>
                            <div className='text-start text-white validator-detail-scorecard'>
                                <WizScoreBody
                                    validator={this.state.validator}
                                />
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

export { ValidatorListing, ValidatorDetail }