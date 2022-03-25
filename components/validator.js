import React from 'react';
import axios from 'axios';
import config from '../config.json';
import Search from './search.js';
import {WizScore} from './wizscore.js';
import {Alert} from './alert.js';
import Image from 'next/image';
import Link from 'next/link';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';


const API_URL = process.env.API_BASE_URL;

class ValidatorBox extends React.Component {
    static activated_stake;
    static credit_ratio;
    
    constructor(props) {
        super(props);
        try {
            this.activated_stake = new Intl.NumberFormat().format(Number(this.props.validator.activated_stake).toFixed(0));
            this.credit_ratio = new Intl.NumberFormat().format(Number(this.props.validator.credit_ratio).toFixed(1));
            this.skip_rate = new Intl.NumberFormat().format(Number(this.props.validator.skip_rate).toFixed(1));
            
        }
        catch (e) {
            console.log(this.props.validator.identity);
            console.log(e);
        }
    }

    renderImage(img) {
        if(img==null) {
            return '';
        }
        else return <Image className="rounded-circle" src={img} width={50} height={50} loading="lazy" alt={this.props.validator.vote_identity+"-logo"} />
    }

    renderURL(url) {
        if(url==null || url=='') {
            return '';
        }
        else {
            return (
                <a href={url} target="_new">
                    <span className="fst-normal text-white pointer" >{url}</span>
                </a>
            );
        }
    }

    renderRankColor() {
        if(this.props.validator.rank<=config.WIZ_SCORE_RANK_GROUPS.TOP) {
            return 'bg-success';
        }
        else if(this.props.validator.rank<=config.WIZ_SCORE_RANK_GROUPS.MEDIUM) {
            return 'bg-warning';
        }
        else return 'bg-danger';
    }

    renderStakeBar() {

        let stakeText, stakeColor, stakeBg, stakeWidth;
        if(this.props.validator.stake_ratio > config.STAKE_CATEGORIES.HIGH) {
            stakeText = 'High Stake';
            stakeColor = 'text-danger';
            stakeBg = 'bg-danger';
            stakeWidth = 100;
        }
        else if(this.props.validator.stake_ratio > config.STAKE_CATEGORIES.MEDIUM) {
            stakeText = 'Medium Stake';
            stakeColor = 'text-warning';
            stakeBg = 'bg-warning';
            stakeWidth = this.props.validator.stake_ratio*1000;
        }
        else {
            stakeText = 'Low Stake';
            stakeColor = 'text-success';
            stakeBg = 'bg-success';
            stakeWidth = this.props.validator.stake_ratio*1000;
        }

        return (
            [
                <div className="row" key={'stakebalabel-'+this.props.validator.vote_identity}>                
                    <div className={"col text-center vstakelabel my-1 "+stakeColor}>{stakeText}</div>            
                </div>,
                <div className="row" key={'stakebar-'+this.props.validator.vote_identity}>                
                    <div className="col mt-1">                    
                        <div className="progress" data-bs-toggle="tooltip" title="See FAQ for formula of this display." data-bs-placement="bottom">                        
                            <div className={"progress-bar progress-bar-striped progress-bar-animated "+stakeBg} role="progressbar" aria-valuenow={stakeWidth} aria-valuemin="0" aria-valuemax="100" style={{width: stakeWidth+'%'}}>
                            </div>                    
                        </div>                
                    </div>            
                </div>     
            ]
        );
    }
    
    render() {
        
        return (
                <div className="row py-2 my-2 border vbox rounded border-white" id={this.props.validator.vote_identity}>
                    <div className="col my-1 mt-3">            
                        <div className="row">                
                            <div className="col apy-value text-center">         
                                <span className={"cluster_statistic rounded-pill text-white fw-bold p-2 px-3 mx-1 "+this.renderRankColor()}>
                                    {this.props.validator.rank}
                                </span>                    
                                <div className="p-2">{this.props.validator.wiz_score} %</div>                
                            </div>            
                        </div>            
                        <div className="row wiz-score-button" type="button" onClick={this.props.showWizModal} >                
                            <OverlayTrigger
                                    placement="bottom"
                                    overlay={
                                        <Tooltip>
                                            Click for detailed scorecard
                                        </Tooltip>
                                    } 
                                >
                                <div className="col apy-label text-center mb-1 vlist-label text-warning fst-italic">WIZ SCORE</div>            
                            </OverlayTrigger>
                        </div>        
                    </div>
                    <div className="col col-md-2 my-2 mobile-name-column">            
                        <div className="row">                
                            <div className="col text-center">                    
                                {this.renderImage(this.props.validator.image)}
                            </div>            
                        </div>            
                        <div className="row pt-2">                
                            <div className="col text-center vlist-name">                                        
                                <span className="vlist-name-inner">{this.props.validator.name}</span>                
                            </div>            
                        </div>        
                    </div>
                    <div className="col my-1 mt-4">            
                        <div className="row">                
                            <div className="col apy-value text-center">
                                {this.props.validator.apy_estimate} %
                                <br />                    
                                
                                    <OverlayTrigger
                                        placement="bottom"
                                        overlay={
                                            <Tooltip>
                                                Stake weighted cluster average (excludes private validators)
                                            </Tooltip>
                                        } 
                                    >
                                        <span className="cluster_statistic text-secondary">Ø {this.props.clusterStats.avg_apy} %</span>
                                    </OverlayTrigger>
                                             
                            </div>            
                        </div>            
                        <div className="row">                
                            <div className="col apy-label text-center my-1 vlist-label">Estimated APY</div>            
                        </div>        
                    </div>
                    <div className="col my-1 mobile-stake-column">            
                        <div className="row">                
                            <div className="col text-center">                    
                                <OverlayTrigger
                                    placement="right"
                                    overlay={
                                        <Tooltip>
                                            Active Stake
                                        </Tooltip>
                                    } 
                                >
                                    <span>◎ {this.activated_stake}</span>
                                </OverlayTrigger>
                                <br />                        
                                <OverlayTrigger
                                    placement="right"
                                    overlay={
                                        <Tooltip>
                                            Cluster average
                                        </Tooltip>
                                    } 
                                >
                                    <span className="cluster_statistic text-secondary">Ø ◎ {new Intl.NumberFormat().format(Number(this.props.clusterStats.avg_activated_stake).toFixed(0))}</span>                
                                </OverlayTrigger>
                            </div>            
                        </div>            
                        {this.renderStakeBar()}   
                    </div>
                    <div className="col mobile-stats-column">            
                        <div className="row">                
                            <div className="col my-1">                    
                                <OverlayTrigger
                                    placement="left"
                                    overlay={
                                        <Tooltip>
                                            Skip Rate (lower is better)
                                        </Tooltip>
                                    } 
                                >
                                    <i className="bi bi-box pe-2"></i>
                                </OverlayTrigger>
                                    {this.skip_rate} %
                                    <OverlayTrigger
                                placement="right"
                                overlay={
                                    <Tooltip>
                                        Cluster average
                                    </Tooltip>
                                } 
                                >
                                    <span className="cluster_statistic text-secondary ps-1">Ø {this.props.clusterStats.avg_skip_rate} %</span>                
                                </OverlayTrigger>
                            </div>            
                        </div>            
                        <div className="row">                
                            <div className="col my-1">                    
                                <OverlayTrigger
                                    placement="left"
                                    overlay={
                                        <Tooltip>
                                            Voting Success Rate (higher is better)
                                        </Tooltip>
                                    } 
                                >
                                    <i className="bi bi-pencil-square pe-2"></i>
                                </OverlayTrigger>
                                    {this.credit_ratio} %
                                <OverlayTrigger
                                placement="right"
                                overlay={
                                    <Tooltip>
                                        Cluster average
                                    </Tooltip>
                                } 
                                >
                                    <span className="cluster_statistic text-secondary ps-1">Ø {this.props.clusterStats.avg_credit_ratio} %</span>                
                                </OverlayTrigger>
                            </div>            
                        </div>            
                        <div className="row">                
                            <div className="col my-1">                    
                                <OverlayTrigger
                                    placement="left"
                                    overlay={
                                        <Tooltip>
                                            Commission
                                        </Tooltip>
                                    } 
                                >
                                    <i className="bi bi-cash-coin pe-2"></i>
                                </OverlayTrigger>
                                    {this.props.validator.commission} %
                                <OverlayTrigger
                                placement="right"
                                overlay={
                                    <Tooltip>
                                        Cluster average
                                    </Tooltip>
                                } 
                                >
                                    <span className="cluster_statistic text-secondary ps-1">Ø {this.props.clusterStats.avg_commission} %</span>                
                                </OverlayTrigger>
                            </div>            
                        </div>            
                        <div className="row">                
                            <div className="col my-1">                    
                                <OverlayTrigger
                                    placement="left"
                                    overlay={
                                        <Tooltip>
                                            Version
                                        </Tooltip>
                                    } 
                                >
                                    <i className="bi bi-cpu pe-2"></i>
                                </OverlayTrigger>
                                    {this.props.validator.version}                
                            </div>            
                        </div>        
                    </div>
                    <div className="col col-md-3 vlist-identity">            
                        <div className="row">                
                            <div className="col my-1 mt-1 text-truncate">                    
                                <i className="bi bi-card-text pe-1"></i>
                                    <OverlayTrigger
                                        placement="left"
                                        overlay={
                                            <Tooltip>
                                                {this.props.validator.description}
                                            </Tooltip>
                                        } 
                                    >
                                        <span>
                                            {this.props.validator.description}
                                        </span>
                                    </OverlayTrigger>
                            </div>            
                        </div>            
                        <div className="row">                
                            <div className="col my-1 align-items-center">                    
                                <i className="bi bi-globe pe-1"> </i>
                                    {this.renderURL(this.props.validator.website)}
                            </div>            
                        </div>            
                        <div className="row my-1 mobile-identities">                
                            <div className="col text-truncate">                    
                                <span className="vlist-label">Identity:&nbsp;</span>
                                <OverlayTrigger
                                        placement="left"
                                        overlay={
                                            <Tooltip>
                                                Copy
                                            </Tooltip>
                                        } 
                                    >
                                    <span className="click-to-copy videntity" id={this.props.validator.identity} onClick={() => {navigator.clipboard.writeText(this.props.validator.identity)}}>{this.props.validator.identity}</span>                
                                </OverlayTrigger>
                            </div>            
                        </div>            
                        <div className="row my-1 mobile-identities">                
                            <div className="col text-truncate">                    
                                <span className="vlist-label">Vote Account:&nbsp;</span>
                                <OverlayTrigger
                                        placement="left"
                                        overlay={
                                            <Tooltip>
                                                Copy
                                            </Tooltip>
                                        } 
                                    >
                                    <span className="click-to-copy vvoteaccount" id={this.props.validator.vote_identity} onClick={() => {navigator.clipboard.writeText(this.props.validator.vote_identity)}}>{this.props.validator.vote_identity}</span>                
                                </OverlayTrigger>
                            </div>            
                        </div>        
                    </div>
                    <div className="col align-items-center justify-content-center d-flex">         
                        
                        <button className="btn btn-success alert-button" onClick={this.props.showAlertModal} >                
                            <i className="bi bi-plus px-1 alert-btn-icon"></i>
                                Create Alert            
                        </button>        
                    </div>
                </div>
        );
    }
}

class ValidatorList extends React.Component {
  renderValidator(i) {
    return (
            <ValidatorBox 
              key={this.props.validators[i].vote_identity}
              clusterStats={this.props.clusterStats}
              validator={this.props.validators[i]} 
              showWizModal={() => this.props.updateWizModal(true,this.props.validators[i])}
              showAlertModal={() => this.props.updateAlertModal(true,this.props.validators[i])}
            />
    );
  }

  render() {
    let list = [];
    for(let i=0; i<this.props.validators.length && i < this.props.listSize; i++) {
      list.push(this.renderValidator(i));
    }
    return (
        [
            list,
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
        return '';
    }
}


class Validator extends React.Component {
  constructor(props) {
    super(props);
    if(this.props.state.validators==null) this.getValidators();
    if(this.props.state.clusterStats==null) this.getClusterStats();
  }

  getValidators() {
    axios(API_URL+config.API_ENDPOINTS.validators, {
      crossDomain: true,
      headers: {'Content-Type':'application/json'}
    })
      .then(response => {
        let json = response.data;
        
        this.props.onClick({
            validators: json,
            filteredValidators: json,
            hasData: true,
        });
      })
      .catch(e => {
        console.log(e);
        setTimeout(() => { this.getValidators() }, 5000);
      })
  }

  getClusterStats() {
    axios(API_URL+config.API_ENDPOINTS.cluster_stats, {
      crossDomain: true,
      headers: {'Content-Type':'application/json'}
    })
      .then(response => {
        let json = response.data;
        
        this.props.onClick({
            clusterStats: json
        });
      })
      .catch(e => {
        console.log(e);
        setTimeout(() => { this.getClusterStats() }, 5000);
      })
  }

  doFilter(filteredValidators) {
    this.props.onClick({
        visibleCount: config.DEFAULT_LIST_SIZE,
        filteredValidators: filteredValidators
    });
  }

  bumpVisibleCount() {
      
      this.props.onClick({
        visibleCount: this.props.state.visibleCount+config.DEFAULT_LIST_SIZE
      });
  }

  updateWizModalVisibility(show,validator=null) {
      if(validator==null && this.props.state.wizValidator!=null) {
          validator = this.props.state.wizValidator;
      }
      this.props.onClick({
          showWizModal: show,
          wizValidator: validator
      });
  }

  updateAlertModalVisibility(show,validator=null) {
    if(validator==null && this.props.state.alertValidator!=null) {
        validator = this.props.state.alertValidator;
    }
    this.props.onClick({
        showAlertModal: show,
        alertValidator: validator
    });
}

  render() {
    if(!this.props.state.hasData) {
      return (
        <div className="container text-center" id='loading-spinner'>
            <div className='spinner-grow text-light' role="status">
            <span className='visually-hidden'>Loading...</span>
            </div>
        </div>
        );
    }
    else {
      return (
          [
            <Search 
                validators={this.props.state.validators}
                onClick={(filteredValidators) => {
                    return this.doFilter(filteredValidators);
                }}
                key='searchBar'
                />,
            <ValidatorList 
                validators={this.props.state.filteredValidators}
                clusterStats={this.props.state.clusterStats}
                listSize={this.props.state.visibleCount}
                key='validatorList'
                showWizModal={this.props.state.showWizModal}
                updateWizModal={(show,validator) => this.updateWizModalVisibility(show,validator)}
                wizValidator={this.props.state.wizValidator}
                showAlertModal={this.props.state.showAlertModal}
                updateAlertModal={(show,validator) => this.updateAlertModalVisibility(show,validator)}
                alertValidator={this.props.state.alertValidator}
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

export default Validator;