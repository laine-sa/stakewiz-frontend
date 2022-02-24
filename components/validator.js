import React from 'react';
import axios from 'axios';
import config from '../config.json';
import Search from './search.js';
import WizScore from './wizscore.js';
import Alert from './alert.js';

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
        else return <img className="rounded-circle" src={img} width="50px" height="50px" loading="lazy"></img>
    }

    renderURL(url) {
        if(url==null || url=='') {
            return '';
        }
        else {
            return <a className="fst-normal text-white" href={url} target="_new">{url}</a>
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
                                <div className="p-2">{this.props.validator.wiz_score}</div>                
                            </div>            
                        </div>            
                        <div className="row wiz-score-button" type="button" onClick={this.props.showWizModal} >                
                            <div className="col apy-label text-center mb-1 vlist-label text-warning fst-italic" data-bs-toggle="tooltip" data-bs-placement="bottom" title="" data-bs-original-title="Click for detailed calculation">WIZ SCORE</div>            
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
                                {this.props.validator.apy_estimate}
                                <br />                    
                                <span className="cluster_statistic text-secondary" data-bs-toggle="tooltip" title="" data-bs-placement="bottom" data-bs-original-title="Stake weighted cluster average (excludes private validators)">Ø TODO</span>                
                            </div>            
                        </div>            
                        <div className="row">                
                            <div className="col apy-label text-center my-1 vlist-label">Estimated APY</div>            
                        </div>        
                    </div>
                    <div className="col my-1 mobile-stake-column">            
                        <div className="row">                
                            <div className="col text-center">                    
                                <span data-bs-toggle="tooltip" title="" data-bs-placement="right" data-bs-original-title="Active Stake">◎ {this.activated_stake}</span>
                                <br />                        
                                <span className="cluster_statistic text-secondary" data-bs-toggle="tooltip" title="" data-bs-placement="right" data-bs-original-title="Cluster average">Ø ◎ TODO</span>                
                            </div>            
                        </div>            
                        {this.renderStakeBar()}   
                    </div>
                    <div className="col mobile-stats-column">            
                        <div className="row">                
                            <div className="col my-1">                    
                                <i className="bi bi-box pe-2" data-bs-toggle="tooltip" title="" data-bs-placement="left" data-bs-original-title="Slot Skip Rate (lower is better)" aria-label="Slot Skip Rate (lower is better)"></i>
                                    {this.skip_rate} %
                                <span className="cluster_statistic text-secondary ps-1" data-bs-toggle="tooltip" title="" data-bs-placement="right" data-bs-original-title="Cluster average">Ø TODO</span>                
                            </div>            
                        </div>            
                        <div className="row">                
                            <div className="col my-1">                    
                                <i className="bi bi-pencil-square pe-2" data-bs-toggle="tooltip" title="" data-bs-placement="left" data-bs-original-title="Voting Success Rate (higher is better)" aria-label="Voting Success Rate (higher is better)"></i>
                                    {this.credit_ratio} %
                                <span className="cluster_statistic text-secondary ps-1" data-bs-toggle="tooltip" title="" data-bs-placement="right" data-bs-original-title="Cluster average">Ø TODO</span>                
                            </div>            
                        </div>            
                        <div className="row">                
                            <div className="col my-1">                    
                                <i className="bi bi-cash-coin pe-2" data-bs-toggle="tooltip" title="" data-bs-placement="left" data-bs-original-title="Commission" aria-label="Commission"></i>
                                    {this.props.validator.commission} %
                                <span className="cluster_statistic text-secondary ps-1" data-bs-toggle="tooltip" title="" data-bs-placement="right" data-bs-original-title="Cluster average">Ø TODO</span>                
                            </div>            
                        </div>            
                        <div className="row">                
                            <div className="col my-1">                    
                                <i className="bi bi-cpu pe-2" data-bs-toggle="tooltip" title="" data-bs-placement="left" data-bs-original-title="Version" aria-label="Version"></i>
                                    {this.props.validator.version}                
                            </div>            
                        </div>        
                    </div>
                    <div className="col col-md-3 vlist-identity">            
                        <div className="row">                
                            <div className="col my-1 mt-1 text-truncate">                    
                                <i className="bi bi-card-text pe-1"></i>
                                    <span data-bs-toggle="tooltip" title="" data-bs-placement="left" data-bs-original-title="Zero Percent Commission - High Yields - Reliable Infrastructure">
                                        {this.props.validator.description}
                                    </span>
                                                
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
                                <span className="click-to-copy videntity" id={this.props.validator.identity} data-bs-toggle="tooltip" title="" data-bs-placement="left" data-bs-original-title="Copy">{this.props.validator.identity}</span>                
                            </div>            
                        </div>            
                        <div className="row my-1 mobile-identities">                
                            <div className="col text-truncate">                    
                                <span className="vlist-label">Vote Account:&nbsp;</span>
                                <span className="click-to-copy vvoteaccount" id={this.props.validator.vote_identity} data-bs-toggle="tooltip" title="" data-bs-placement="left" data-bs-original-title="Copy">{this.props.validator.vote_identity}</span>                
                            </div>            
                        </div>        
                    </div>
                    <div className="col align-items-center justify-content-center d-flex">            
                        <button className="desktop-visible btn btn-success alert-button"  onClick={this.props.showAlertModal} >                
                            <i className="bi bi-exclamation-triangle px-2 alert-btn-icon" data-bs-toggle="tooltip" title="" data-bs-original-title="Create alert" aria-label="Create alert"></i>            
                        </button>            
                        <button className="mobile-visible btn btn-success alert-button" onClick={this.props.showAlertModal} >                
                            <i className="bi bi-exclamation-triangle px-2 alert-btn-icon" data-bs-toggle="tooltip" title="" data-bs-original-title="Create alert" aria-label="Create alert"></i>
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


class Validator extends React.Component {
  constructor(props) {
    super(props);
    if(this.props.state.validators==null) this.getValidators();
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

  doFilter(filteredValidators) {
    this.props.onClick({
        visibleCount: config.DEFAULT_LIST_SIZE,
        filteredValidators: filteredValidators
    });
  }

  bumpVisibleCount() {
      console.log('bumping');
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
                onClick={() => this.bumpVisibleCount()}
                />
          ]
      );
    }
  }
}

export default Validator;