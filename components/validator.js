import React from 'react';
import axios from 'axios';
import config from '../config.json';
import Search from './search.js';
import {WizScore, WizScoreChart} from './wizscore.js';
import {Alert} from './alert.js';
import Image from 'next/image';
import Link from 'next/link';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import {Spinner} from './common.js'
import {Chart} from 'react-google-charts'

const API_URL = process.env.API_BASE_URL;

function RenderImage(props) {
    if(props.img==null) {
        return '';
    }
    else return <Image className="rounded-circle pointer" src={props.img} width={props.size} height={props.size} loading="lazy" alt={props.vote_identity+"-logo"} />
}

function RenderUrl(props) {
    if(props.url==null || props.url=='') {
        return '';
    }
    else {
        return (
            <a href={props.url} target="_new">
                <span className="fst-normal text-white pointer" >{props.url}</span>
            </a>
        );
    }
}

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
                <div className="row py-2 my-2 border vbox rounded border-secondary" id={this.props.validator.vote_identity}>
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
                                <Link href={'/validator/'+this.props.validator.vote_identity} passHref>
                                    <RenderImage
                                        img={this.props.validator.image}
                                        vote_identity={this.props.validator.vote_identity}
                                        size={50}
                                    />
                                </Link>
                            </div>            
                        </div>            
                        <div className="row pt-2">                
                            <div className="col text-center vlist-name">
                                <Link href={'/validator/'+this.props.validator.vote_identity} passHref>                                        
                                    <span className="vlist-name-inner pointer">{this.props.validator.name}</span>                
                                </Link>
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
                                    <RenderUrl
                                        url={this.props.validator.website}
                                    />
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


class ValidatorListing extends React.Component {
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
        <Spinner />
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

class ValidatorDetail extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            validator: null
        };
        if(this.props.vote_identity!='') this.getValidator(this.props.vote_identity);
    }

    getValidator(vote_identity) {
        axios(API_URL+config.API_ENDPOINTS.validator+'/'+vote_identity, {
          crossDomain: true,
          headers: {'Content-Type':'application/json'}
        })
          .then(response => {
            let json = response.data;
            console.log(json);
            this.setState({
                validator: json
            })
          })
          .catch(e => {
            console.log(e);
            setTimeout(() => { this.getValidator() }, 5000);
          })
    }

    renderName() {
        
    }

    render() {
    

        if(this.state.validator!=null) {

            let skipGauge = [
                ["Label", "Value"],
                ["Skip Rate", parseFloat(this.state.validator.skip_rate)]
                
            ];
            let creditGauge = [
                ["Label", "Value"],
                ["Vote Credits", parseFloat(this.state.validator.credit_ratio)]
            ]
            let wizScoreGauge = [
                ["Label", "Value"],
                ["Wiz Score", parseFloat(this.state.validator.wiz_score)]
            ]

            return (
                <div className='container-sm vbox mt-5 rounded-top'>
                    <div className='row'>
                        <div className='col text-center validator-logo'>
                            <RenderImage
                                img={this.state.validator.image}
                                vote_identity={this.state.validator.vote_identity}
                                size={100}
                            />
                        </div>
                    </div>

                    <div className='row'>
                        <div className='col text-white text-center p-2'>
                            <h2>{this.state.validator.name}</h2>
                        </div>
                    </div>

                    <div className='row'>
                        <div className='col p-2 m-2 text-white'>
                            <table className='table table-dark'>
                                <tbody>
                                    <tr>
                                        <th scope="row">
                                            Description
                                        </th>
                                        <td>
                                            {this.state.validator.description}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row">
                                            Website
                                        </th>
                                        <td>
                                        <RenderUrl
                                            url={this.state.validator.website}
                                        />
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row">
                                            Keybase
                                        </th>
                                        <td>
                                            {this.state.validator.keybase}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            
                        </div>
                        
                        <div className='col col-md-6 text-white text-center p-2'>
                            <div className='row'>
                                <div className='col ms-5 text-center d-flex justify-content-center'>
                                    <Chart
                                        chartType="Gauge"
                                        width="100%"
                                        height="10rem"
                                        data={skipGauge}
                                        options={{
                                            greenFrom: 0,
                                            greenTo: 5,
                                            yellowFrom: 5,
                                            yellowTo: 10,
                                            minorTicks: 5
                                        }}
                                    />
                                </div>
                                <div className='col text-center d-flex justify-content-center'>
                                    <Chart
                                        chartType="Gauge"
                                        width="100%"
                                        height="10rem"
                                        data={creditGauge}
                                        options={{
                                            greenFrom: 90,
                                            greenTo: 100,
                                            yellowFrom: 80,
                                            yellowTo: 90,
                                            minorTicks: 5,
                                        }}
                                    />
                                </div>
                                <div className='col me-5 text-center d-flex justify-content-center'>
                                    <Chart
                                        chartType="Gauge"
                                        width="100%"
                                        height="10rem"
                                        data={wizScoreGauge}
                                        options={{
                                            greenFrom: 90,
                                            greenTo: 100,
                                            yellowFrom: 75,
                                            yellowTo: 90,
                                            minorTicks: 5,
                                        }}
                                    />
                                </div>
                            </div>
                            <div className='row'>
                                <div className='col p-2 mt-4 text-white text-center'>
                                    <h3>24h Moving Average Wiz Score</h3>
                                    <WizScoreChart 
                                        vote_identity={this.state.validator.vote_identity}
                                    />
                                </div>
                            </div>

                        </div>
                    </div>

                    
                </div>
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