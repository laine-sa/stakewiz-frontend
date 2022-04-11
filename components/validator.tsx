import React, { useRef } from 'react';
import axios from 'axios';
import config from '../config.json';
import SearchBar from './search';
import {WizScore, WizScoreBody, WizScoreChart} from './wizscore';
import {Alert, AlertForm} from './alert';
import Image from 'next/image';
import Link from 'next/link';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import {Spinner} from './common'
import {Chart} from 'react-google-charts'

const API_URL = process.env.API_BASE_URL;

export interface validatorI {
    identity: string;
    vote_identity: string;
    last_vote: number;
    root_slot: number;
    credits: number;
    epoch_credits: number;
    activated_stake: number;
    version: string;
    delinquent: boolean;
    skip_rate: number;
    created_at: string;
    updated_at: string;
    oldest_active_stake_pubkey: string;
    first_epoch_with_stake: number;
    name: string;
    keybase: string;
    description: string;
    info_pubkey: string;
    website: string;
    commission: number;
    image: string;
    gossip_ip: string;
    ip_latitude: string;
    ip_longitude: string;
    ip_city: string;
    ip_country: string;
    ip_asn: string;
    ip_org: string;
    withdraw_authority: string;
    wiz_score_id: number;
    ignore: boolean;
    vote_success: number;
    vote_success_score: number;
    skip_rate_score: number;
    info_score: number;
    commission_score: number;
    first_epoch_distance: number;
    epoch_distance_score: number;
    stake_weight: number;
    above_halt_line: boolean;
    stake_weight_score: number;
    withdraw_authority_score: number;
    asn: string;
    asn_concentration: number;
    asn_concentration_score: number;
    uptime: number;
    uptime_score: number;
    wiz_score: number;
    version_valid: boolean;
    city_concentration: number;
    city_concentration_score: number;
    invalid_version_score: number;
    superminority_penalty: number;
    score_version: number;
    no_voting_override: boolean;
    epoch: number;
    epoch_slot_height: number;
    asncity_concentration: number;
    asncity_concentration_score: number;
    stake_ratio: number;
    credit_ratio: number;
    apy_estimate: number;
    rank: number;
};

export interface clusterStatsI {
    avg_credit_ratio: number;
    avg_activated_stake: number;
    avg_commission: number;
    avg_skip_rate: number;
    avg_apy: number;
};

export interface ValidatorBoxPropsI {
    validator: validatorI;
    clusterStats: clusterStatsI;
    showWizModal: Function;
    showAlertModal: Function;

}

export interface ValidatorListI {
    clusterStats: clusterStatsI;
    validators: [validatorI];
    updateWizModal: Function;
    updateAlertModal: Function;
    listSize: number;
    showWizModal: boolean;
    wizValidator: validatorI;
    alertValidator: validatorI;
    showAlertModal: boolean;
}

export interface ValidatorListingI {
    state: {
        validators: [validatorI],
        clusterStats: clusterStatsI,
        filteredValidators: [validatorI],
        hasData: boolean,
        visibleCount: number,
        showWizModal: boolean,
        wizValidator: validatorI,
        showAlertModal: boolean,
        alertValidator: validatorI
      },
    updateState: Function;
}

function RenderImage(props) {
    if(props.img==null) {
        return null;
    }
    else return (
        <Link href={'/validator/'+props.vote_identity} passHref>
            <a>
                <Image className="rounded-circle pointer" src={props.img} width={props.size} height={props.size} loading="lazy" alt={props.vote_identity+"-logo"} />
            </a>
        </Link>
    )
}

function RenderUrl(props) {
    if(props.url==null || props.url=='') {
        return null;
    }
    else {
        return (
            <a href={props.url} target="_new">
                <span className="fst-normal text-white pointer" >{props.url}</span>
            </a>
        );
    }
}



class ValidatorBox extends React.Component<ValidatorBoxPropsI,{}> {
    constructor(props) {
        super(props);
        
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
                            <div className={"progress-bar progress-bar-striped progress-bar-animated "+stakeBg} role="progressbar" aria-valuenow={stakeWidth} aria-valuemin={0} aria-valuemax={100} style={{width: stakeWidth+'%'}}>
                            </div>                    
                        </div>                
                    </div>            
                </div>     
            ]
        );
    }
    
    render() {

        try {
            const activated_stake = new Intl.NumberFormat().format(Number(this.props.validator.activated_stake.toFixed(0)));
            const credit_ratio = new Intl.NumberFormat().format(Number(this.props.validator.credit_ratio.toFixed(1)));
            const skip_rate = new Intl.NumberFormat().format(Number(this.props.validator.skip_rate.toFixed(1)));
            
        }
        catch (e) {
            console.log(this.props.validator.identity);
            console.log(e);
        }
        
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
                        <div className="row wiz-score-button pointer" onClick={() => {this.props.showWizModal()}} >                
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
                                
                                    <RenderImage
                                        img={this.props.validator.image}
                                        vote_identity={this.props.validator.vote_identity}
                                        size={50}
                                    />
                                
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
                                    <span>◎ {activated_stake}</span>
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
                                    <span className="cluster_statistic text-secondary">Ø ◎ {new Intl.NumberFormat().format(Number(this.props.clusterStats.avg_activated_stake.toFixed(0)))}</span>                
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
                                    {skip_rate} %
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
                                    {credit_ratio} %
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
                    <div className="col d-grid gap-2">         
                    
                        <button className="btn btn-outline-success alert-button" onClick={() => this.props.showAlertModal()} >                
                            <i className="bi bi-plus px-1 alert-btn-icon"></i>
                                Create Alert            
                        </button>  
                        <button className="btn btn-outline-warning alert-button" onClick={() => this.props.showWizModal()} >                
                                Scorecard            
                        </button>    
                        <Link href={'/validator/'+this.props.validator.vote_identity} passHref>
                            <button className="btn btn-outline-light alert-button">                
                                    More Info            
                            </button>          
                        </Link>
                    </div>
                </div>
        );
    }
}

class ValidatorList extends React.Component<ValidatorListI, {}> {
  renderValidator(i:number) {
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
        return null;
    }
}

class ValidatorListing extends React.Component<ValidatorListingI, {}> {
  constructor(props) {
    super(props);
    if(this.props.state.validators==null) this.getValidators();
    if(this.props.state.clusterStats==null) this.getClusterStats();
  }

  getValidators() {
    axios(API_URL+config.API_ENDPOINTS.validators, {
        headers: {'Content-Type':'application/json'}
    })
      .then(response => {
        let json = response.data;
        
        this.props.updateState({
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
        visibleCount: this.props.state.visibleCount+config.DEFAULT_LIST_SIZE
      });
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

  render() {
      
    if(!this.props.state.hasData) {
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
                key='searchBar'
                />,
            <ValidatorList 
                validators={this.props.state.filteredValidators}
                clusterStats={this.props.state.clusterStats}
                listSize={this.props.state.visibleCount}
                key='validatorList'
                showWizModal={this.props.state.showWizModal}
                updateWizModal={(show:boolean,validator:validatorI) => this.updateWizModalVisibility(show,validator)}
                wizValidator={this.props.state.wizValidator}
                showAlertModal={this.props.state.showAlertModal}
                updateAlertModal={(show:boolean,validator:validatorI) => this.updateAlertModalVisibility(show,validator)}
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

class ValidatorStakeHistoryChart extends React.PureComponent<
    {
        vote_identity: string;
    }, 
    {
        all_stakes: unknown;
        ten_stakes: unknown;
        epoch_stakes: unknown;
    }> {
    constructor(props) {
        super(props);
        this.state = {
            all_stakes: null,
            ten_stakes: null,
            epoch_stakes: null
        };
        if(this.state.all_stakes==null) this.getStakeHistory();
    }

    getStakeHistory() {
        axios(API_URL+config.API_ENDPOINTS.validator_total_stakes+"/"+this.props.vote_identity, {
            headers: {'Content-Type':'application/json'}
        })
            .then(response => {
            let json = response.data;

            
            if(json.length>0) {

                let stake = [];
                stake.push([
                    'Epoch',
                    'Stake'
                ]);

                for(var i in json) {
                    stake.push([
                        json[i].epoch,
                        json[i].stake
                    ]);
                    

                }

                this.setState({
                    all_stakes: stake
                });
            }
            })
            .catch(e => {
            console.log(e);
            setTimeout(() => { this.getStakeHistory() }, 5000);
            })
        }

    render() {
        if(this.state.all_stakes==null) {
            return (
                <Spinner />
            )
        }
        else {
            return (
                <Chart 
                    chartType='LineChart'
                    width="100%"
                    height="20rem"
                    data={this.state.all_stakes}
                    options={{
                        backgroundColor: 'none',
                        curveType: "function",
                        colors: ['#fff', '#fff', '#fff'],
                        lineWidth: 2,
                        legend:{
                            position:'none'
                        },
                        vAxis: {
                            gridlines: {
                                color: 'transparent'
                            },
                            textStyle: {
                                color: '#fff'
                            },
                            format: 'short'
                        },
                        hAxis: {
                            gridlines: {
                                color: 'transparent'
                            },
                            textStyle: {
                                color: '#fff'
                            }
                        },
                        chartArea: {
                            top: 20,
                            left: 50,
                            width:'100%',
                            height:'80%'
                        },
                        allowAsync: true
                    }}
                />
            )
        }
    };
}

class ValidatorDelinquencyChart extends React.PureComponent<
    {
        vote_identity: string;
    },
    {
        delinquencies: unknown;
    }
    > {
    constructor(props) {
        super(props);
        this.state = {
            delinquencies: null
        };
        if(this.state.delinquencies==null) this.getDelinquencies();
    }

    getDelinquencies() {
        axios(API_URL+config.API_ENDPOINTS.validator_delinquencies+"/"+this.props.vote_identity, {
            headers: {'Content-Type':'application/json'}
        })
            .then(response => {
            let json = response.data;

            if(json.length>0) {

                let delinquencies = [];
                delinquencies.push([
                    'Date', 'Delinquent Minutes'
                ]);

                let d = new Date();
                for(let a = 1; a <= 30; a++) {
                    
                    delinquencies.push([
                        new Date(d.getTime()),
                        0
                    ]);
                    d.setDate(d.getDate() - 1);
                }

                

                for(var i in json) {
                    for(var a in delinquencies) {
                        if(new Date(delinquencies[a][0]).toLocaleDateString() == new Date(json[i].date).toLocaleDateString()) {
                            delinquencies[a][1] = parseInt(json[i].delinquent_minutes);
                        }
                    }
                }


                this.setState({
                    delinquencies: delinquencies
                });
            }
            })
            .catch(e => {
            console.log(e);
            setTimeout(() => { this.getDelinquencies() }, 5000);
            })
        }

    render() {
        if(this.state.delinquencies==null) {
            return (
                <Spinner />
            )
        }
        else {
            return (
                <Chart 
                    chartType='ColumnChart'
                    width="100%"
                    height="20rem"
                    data={this.state.delinquencies}
                    options={{
                        backgroundColor: 'none',
                        curveType: "function",
                        colors: ['#fff', '#fff', '#fff'],
                        lineWidth: 2,
                        legend:{
                            position:'none'
                        },
                        vAxis: {
                            gridlines: {
                                color: 'transparent'
                            },
                            textStyle: {
                                color: '#fff'
                            },
                            format: 'short',
                            maxValue: 30
                        },
                        hAxis: {
                            gridlines: {
                                color: 'transparent'
                            },
                            textStyle: {
                                color: '#fff'
                            }
                        },
                        chartArea: {
                            top: 20,
                            left: 50,
                            width:'100%',
                            height:'80%'
                        },
                        allowAsync: true
                    }}
                />
            )
        }
    };
}

class ValidatorEpochStakeChart extends React.PureComponent<
    {
        vote_identity: string;
        updateStake: Function;
    },
    {
        stakes: unknown;
        change: unknown;   
    }
    > {
    constructor(props) {
        super(props);
        this.state = {
            stakes: null,
            change: null
        };
        if(this.state.stakes==null) this.getEpochStakes();
    }

    getEpochStakes() {
        axios(API_URL+config.API_ENDPOINTS.validator_epoch_stakes+"/"+this.props.vote_identity, {
            headers: {'Content-Type':'application/json'}
        })
            .then(response => {
            let json = response.data;
            

            let stakes = [];
            stakes.push(['Label','Stake',{role: 'style'}]);

            let change = json[0].activating_stake-json[0].deactivating_stake;
            
            stakes.push(['Activating',parseFloat(json[0].activating_stake),'#428c57']);
            stakes.push(['Deactivating',parseFloat(json[0].deactivating_stake)*-1, '#d65127']);
            //stakes.push(['Net Change',parseFloat(change), '#27abd6']);
            
            this.props.updateStake(change);

            this.setState({
                stakes: stakes,
                change: change
            });
            })
            .catch(e => {
            console.log(e);
            setTimeout(() => { this.getEpochStakes() }, 5000);
            })
        }

    render() {
        if(this.state.stakes==null) {
            return (
                <Spinner />
            )
        }
        else {

            return ([
                <Chart 
                    key='epoch-stake-chart'
                    chartType='BarChart'
                    width="100%"
                    height="20rem"
                    data={this.state.stakes}
                    options={{
                        backgroundColor: 'none',
                        lineWidth: 1,
                        bars: 'horizontal',
                        legend:{
                            position:'none'
                        },
                        vAxis: {
                            gridlines: {
                                color: 'transparent'
                            },
                            textStyle: {
                                color: '#fff'
                            },
                            format: 'short',
                            label: 'none'
                        },
                        hAxis: {
                            gridlines: {
                                color: 'transparent'
                            },
                            textStyle: {
                                color: '#fff'
                            }
                        },
                        allowAsync: true
                    }}
                />]
            )
        }
    };
}

class ValidatorLog extends React.PureComponent<
    {
        vote_identity: string;
        updateLogLength: Function;
        log_limit: number;
        onClick: Function;
    },
    {
        log: [{
            [dynamic:string]: {
                value?: unknown
            }
        }];
    }
    > {
    constructor(props) {
        super(props);
        this.state = {
            log: null
        };
        if(this.state.log==null) this.getValidatorLog();
    }

    getValidatorLog() {
        axios(API_URL+config.API_ENDPOINTS.validator_log+"/"+this.props.vote_identity, {
            headers: {'Content-Type':'application/json'}
        })
            .then(response => {
            let json = response.data;
            
            this.props.updateLogLength(json.length);

            this.setState({
                log: json
            });
            })
            .catch(e => {
            console.log(e);
            setTimeout(() => { this.getValidatorLog() }, 5000);
            })
    }

    render() {
        if(this.state.log==null) {
            return (
                <Spinner />
            )
        }
        else {
            let table = [];
            for(let i=0; i<this.state.log.length && i<this.props.log_limit; i++) {
                let log = this.state.log[i];
                let date = new Date(log.created_at as string);

                let old_data = [];
                let new_data = [];

                for(var key in log.old_data) {
                    if(log.old_data.hasOwnProperty(key)) {
                        let data = log.old_data[key];
                        if(key=='activated_stake') data *= config.SOL_PER_LAMPORT;
                        if(key=='delinquent') {
                            data = (data) ? 'true' : 'false';
                        }


                        old_data.push(
                            <p><span className='fw-bold'>{key}:</span><br />{data}<br /></p>
                        )
                    }
                }
                for(var key in log.new_data) {
                    if(log.new_data.hasOwnProperty(key)) {
                        let data = log.new_data[key];
                        if(key=='activated_stake') data = data*config.SOL_PER_LAMPORT;
                        if(key=='delinquent') {
                            data = (data) ? 'true' : 'false';
                        }

                        new_data.push(
                            <p><span className='fw-bold'>{key}:</span><br />{data}<br /></p>
                        )
                    }
                }
                
                table.push(
                    <tr>
                        <th scope="row" className='text-nowrap'>
                            {date.toLocaleString()}
                        </th>
                        <td className='text-wrap validator-log-data'>
                            {old_data}
                        </td>
                        <td className='text-wrap validator-log-data'>
                            {new_data}
                        </td>
                    </tr>
                )
            }

            return ([
                <table className='table table-striped table-dark table-sm' key='validator-log-table'>
                    <thead>
                        <th scope='col'>Date</th>
                        <th scope='col'>Old Data</th>
                        <th scope='col'>New Data</th>
                    </thead>
                    <tbody>
                        {table}
                    </tbody>
                </table>,
                <LoadMoreButton 
                    key='log-more-button'
                    viewDelta={this.state.log.length - this.props.log_limit}
                    onClick={() => this.props.onClick()}
                    />
            ]
            )
        }
    };
}

function StakeLabel(props) {
    if(props.stake!=null) {
        let stake = (props.stake<0) ? props.stake*-1 : props.stake;
        stake = new Intl.NumberFormat().format(Number(stake.toFixed(0)));
        if(props.stake<0) {
            
            return (
                <span className="text-danger ms-1">
                    - ◎ {stake}
                </span>
            );
        }
        else {
            return (
                <span className="text-success ms-1">
                    + ◎ {stake}
                </span>
            );
        }
    }
    else {
        return null;
    }

}

class ValidatorDetail extends React.Component<validatorI, 
    {
        log_limit: number;
        log_length: number;
        validator: validatorI;
        stake_change: number;
        showAlertModal: Function;
    }> {
    constructor(props) {
        super(props);
        this.state = {
            validator: null,
            stake_change: null,
            log_limit: 25,
            log_length: 0,
            showAlertModal: null
        };
        if(this.props.vote_identity!='') this.getValidator();
    }

    updateLogLength(length) {
        this.setState({
            log_length: length
        });
    }

    bumpLogLimit() {
        this.setState({
            log_limit: this.state.log_limit+25
        })
    }

    updateAlertModalVisibility(show) {
        this.setState({
            showAlertModal: show
        });
    }

    getValidator() {
        axios(API_URL+config.API_ENDPOINTS.validator+'/'+this.props.vote_identity, {
          headers: {'Content-Type':'application/json'}
        })
          .then(response => {
            let json = response.data as validatorI;
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

        if(this.state.validator!=null) {

            console.log(typeof(this.state.validator.skip_rate));

            let skipGauge = [
                ["Label", "Value"],
                ["Skip Rate", {v: this.state.validator.skip_rate, f: this.state.validator.skip_rate+'%'}]
                
            ];
            let creditGauge = [
                ["Label", "Value"],
                ["Vote Credits", {v: this.state.validator.credit_ratio, f: this.state.validator.credit_ratio.toFixed(1)+'%'}]
            ]
            let wizScoreGauge = [
                ["Label", "Value"],
                ["Wiz Score", {v: this.state.validator.wiz_score, f: this.state.validator.wiz_score.toFixed(1)+'%'}]
            ]
            let uptimeGauge = [
                ["Label", "Value"],
                ["Uptime", {v: this.state.validator.uptime, f: this.state.validator.uptime.toFixed(2)+'%'}]
            ]

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
                            />
                        </div>
                    </div>

                    <div className='row'>
                        <div className='col text-white text-center p-2'>
                            <h2>{this.renderName()}</h2>
                            
                            <button className='btn btn-outline-success' onClick={scrollToAlertForm}>
                                + Create Alert
                            </button>
                        
                        </div>
                    </div>
                </div>,
                <div className='container validator-details-content' key='validator-details-content'>

                    <div className='row'>
                        <div className='col text-white p-2 m-1 d-flex justify-content-center mobile-gauge-container'>
                                <div className='row mobile-gauges justify-content-center'>
                                    <Chart
                                        chartType="Gauge"
                                        width="10rem"
                                        height="10rem"
                                        data={skipGauge}
                                        options={{
                                            greenFrom: 0,
                                            greenTo: 5,
                                            yellowFrom: 5,
                                            yellowTo: 10,
                                            minorTicks: 5,
                                            min:0,
                                            max:20,
                                            allowAsync: true
                                        }}
                                    />
                                    <Chart
                                        chartType="Gauge"
                                        width="10rem"
                                        height="10rem"
                                        data={creditGauge}
                                        options={{
                                            greenFrom: 85,
                                            greenTo: 100,
                                            yellowFrom: 75,
                                            yellowTo: 85,
                                            minorTicks: 5,
                                            min:50,
                                            max:100,
                                            allowAsync: true
                                        }}
                                    />
                                    <Chart
                                        chartType="Gauge"
                                        width="10rem"
                                        height="10rem"
                                        data={wizScoreGauge}
                                        options={{
                                            greenFrom: 85,
                                            greenTo: 100,
                                            yellowFrom: 70,
                                            yellowTo: 85,
                                            minorTicks: 5,
                                            min:50,
                                            max:100,
                                            allowAsync: true
                                        }}
                                    />
                                    <Chart
                                        chartType="Gauge"
                                        width="10rem"
                                        height="10rem"
                                        data={uptimeGauge}
                                        options={{
                                            greenFrom: 99.5,
                                            greenTo: 100,
                                            yellowFrom: 98.5,
                                            yellowTo:99.5,
                                            minorTicks: 5,
                                            min: 95,
                                            max: 100,
                                            allowAsync: true
                                        }}
                                    />
                                </div>

                        </div>
                    </div>

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
                            <ValidatorStakeHistoryChart 
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
                                <ValidatorDelinquencyChart
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
                                <ValidatorEpochStakeChart 
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
                            />
                        </div>
                    </div>
                    <div className='text-secondary fst-italic text-end my-1'>
                        Updated: {updated_at.toLocaleString()}
                    </div>
                </div>]
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