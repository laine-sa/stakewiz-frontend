import React from 'react';
import { validatorI } from './validator/interfaces';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

interface searchI {
    validators: [validatorI];
    setFilter: Function;
    walletValidators: [string];
    stakeValidators: [validatorI];
    showMultiStakeModal: boolean;
    updateMultiStakeModal: Function;
    showListView: boolean;
    updateListView: Function;
}

class SearchBar extends React.Component<
        searchI, 
        {
            textInput:string;
            hideAnonymous:boolean;
            onlyMine:boolean;
            hideHighStake:boolean;
            showListView:boolean;
            validatorCount: number;
            sortField: string;
            onlyJito: boolean;
        }
    > {
    constructor(props) {
        super(props);
        this.state = {
            textInput: '',
            hideAnonymous: false,
            onlyMine: false,
            hideHighStake: false,
            showListView: this.props.showListView,
            validatorCount: this.props.validators.length,
            sortField: 'rank_asc',
            onlyJito: false,
        };
    }

    renderStakeSelection() {
        let selectCount = 0;
        if(this.props.stakeValidators!=null) {
            selectCount = this.props.stakeValidators.length;
        }

        return (
            <div className='d-flex mx-2 justify-content-center'>
                <button className='btn btn-sm btn-outline-light' onClick={() => this.props.updateMultiStakeModal(true)} disabled={(selectCount==0) ? true : false}>
                    {(selectCount==0) ? <i className='bi bi-minecart me-2'></i> : <i className='bi bi-minecart-loaded me-2'></i> }
                    {selectCount} selected
                </button>
            </div>
        )
    }


    doSearch(key,value) {
        
        this.setState(() => {
            let obj = {};
            obj[key] = value;
            return obj;
            },() => {
                const {textInput, hideAnonymous, onlyMine, hideHighStake, onlyJito } = this.state;
                const list = this.props.validators;
                let filteredValidators: validatorI[] = [];


                var counter = 0;
                // Loop through all list items, and hide those who don't match the search query
            
                for (let i = 0; i < list.length; i++) {
            
                    let stakeRatio = list[i].stake_ratio*1000;
                    let name = list[i].name;
                    let is_jito = list[i].is_jito;
                    let txtValue = list[i].name + list[i].identity + list[i].vote_identity;
                    let vote_identity = list[i].vote_identity;
                    
                    if (txtValue.toUpperCase().indexOf(textInput.toUpperCase()) > -1 ) {
                        
                        if((name=='' && hideAnonymous===true) || (hideHighStake && stakeRatio>=100)) {
                            continue;
                        }
                        else {
                            if(onlyMine && this.props.walletValidators!=null) {
                                if(!this.props.walletValidators.includes(vote_identity)) continue;
                            }
                            if(!is_jito && this.state.onlyJito) continue;
                            filteredValidators.push(list[i]);
                            
                            counter ++;
                        }
                        
                    }
                
                }

                let sf = this.state.sortField;
                
                if(!sf.includes('_asc')) {
                    filteredValidators.sort((a,b) => (a[sf] < b[sf]) ? 1 : ((b[sf] < a[sf]) ? -1 : 0));
                }
                else {
                    sf = sf.substring(0,sf.length-4);
                    filteredValidators.sort((a,b) => (a[sf] > b[sf]) ? 1 : ((b[sf] > a[sf]) ? -1 : 0));
                }

                this.setState({
                    validatorCount: filteredValidators.length
                });
                this.props.setFilter(filteredValidators);
            });
    }

    keyPressed(event) {
        if(event.code=='Escape' || event.code=='Delete') {
            this.clearInput(event.target.name);
        }
    }

    clearInput(key) {
        this.doSearch(key,'');
    }

    render() {
        let onlyMineDisabled = (this.props.walletValidators==null || this.props.walletValidators.length<1) ? true : false;
        
        if(this.props.walletValidators==null) {
            var onlyMineTooltip = 'Connect your wallet to filter for validators you have stakes with.';
        }
        else if(this.props.walletValidators.length<1) {
            var onlyMineTooltip = "You don't have any stakes on this wallet.";
        }
        else {
            var onlyMineTooltip = "Only show validators with which you have stakes.";
        }


        return (
            <div className="d-flex flex-column align-items-center gap-2">
                
                <div className="position-relative d-flex align-items-center w-100">
                    <input className="p-2 form-control" type="text" id="vsearch" name='textInput' value={this.state.textInput} placeholder="Search validators..." autoComplete="off" onChange={event => this.doSearch(event.target.name,event.target.value)} onKeyDown={event => this.keyPressed(event)} />
                    <button className="btn btn-sm btn-outline-dark" id="clear-input" onClick={(event) => this.clearInput(((event.target as HTMLButtonElement).previousSibling as HTMLInputElement).name)}>
                        Clear
                    </button>
                </div>
            
                <div className="d-flex flex-row validator-search-filter-row">
                    
                    <div className="d-flex align-items-center text-left form-check form-switch searchToggle">
                        <input className="form-check-input p-2 vcheckbox mx-1" type="checkbox" name="hideAnonymous" id="vhideanonymous" role="switch" onChange={event => this.doSearch(event.target.name,event.target.checked)} checked={this.state.hideAnonymous} />
                        <label htmlFor="vhideanonymous">Hide unnamed</label>
                    </div>
                    <OverlayTrigger
                            placement='top'    
                            overlay={<Tooltip>{onlyMineTooltip}</Tooltip>}
                        >
                        <div className="d-flex align-items-center text-left form-check form-switch searchToggle">
                            <input className="form-check-input p-2 vcheckbox mx-1" type="checkbox" name="onlyMine" id="vhideprivate" role="switch" onChange={event => this.doSearch(event.target.name,event.target.checked)} checked={this.state.onlyMine} disabled={onlyMineDisabled} />
                            <label htmlFor="vonlymine">Only Mine</label>
                        </div>
                    </OverlayTrigger>
                    <div className="d-flex align-items-center text-left form-check form-switch searchToggle">
                        <input className="form-check-input p-2 vcheckbox mx-1" type="checkbox" name="hideHighStake" id="vhidehstake" role="switch" onChange={event => this.doSearch(event.target.name,event.target.checked)} checked={this.state.hideHighStake} />
                        <label htmlFor="vhidestake">Hide high-stake</label>
                    </div>
                    <div className="d-flex align-items-center text-left form-check form-switch searchToggle">
                        <input className="form-check-input p-2 vcheckbox mx-1" type="checkbox" name="onlyJito" id="vonlyjito" role="switch" onChange={event => this.doSearch(event.target.name,event.target.checked)} checked={this.state.onlyJito} />
                        <label htmlFor="vhidestake">Only Jito</label>
                    </div>
                    <div className="d-flex align-items-center text-left form-check form-switch searchSort">
                        <label className="text-nowrap pe-1" htmlFor="sortField">Sort by</label>
                        <select className='form-select form-select-sm' name='sortField' onChange={event => this.doSearch(event.target.name,event.target.value)} value={this.state.sortField} >
                            <option value='rank'>Wiz Score ↑</option>
                            <option value='rank_asc'>Wiz Score ↓</option>
                            <option value='activated_stake_asc'>Stake ↑</option>
                            <option value='activated_stake'>Stake ↓</option>
                            <option value='total_apy'>TrueAPY ↓</option>
                            <option value='skip_rate_asc'>Slot skip rate ↑</option>
                            <option value='epoch_credits_asc'>Vote Credits ↑</option>
                            <option value='epoch_credits'>Vote Credits ↓</option>
                            <option value='commission_asc'>Commission ↑</option>
                            <option value='commission'>Commission ↓</option>
                            <option value='uptime_asc'>30 day uptime ↑</option>
                            <option value='uptime'>30 day uptime ↓</option>
                            <option value='first_epoch_with_stake'>Epochs active ↑</option>
                            <option value='first_epoch_with_stake_asc'>Epochs active ↓</option>
                            <option value='asncity_concentration_asc'>ASN+City Concentration ↑</option>
                            <option value='asncity_concentration'>ASN+City Concentration ↓</option>
                        </select>
                    </div>
                    <div className='d-flex flex-row justify-content-center'>
                        <div className="d-flex align-items-center bg-dark text-white p-1 px-2 ms-2 mt-0 rounded justify-content-center" id="resultsno">
                            {this.state.validatorCount} validators
                        </div>
                        <OverlayTrigger
                            placement='top'    
                            overlay={<Tooltip>{this.props.showListView?'Card':'List'} view</Tooltip>}
                        >
                            <div className="d-flex align-items-center show-list-view ps-2 mobile-col-hide">
                                <label htmlFor="showlistview" className="btn btn-sm btn-outline-light" onClick={() => this.props.updateListView(this.props.showListView ? false : true)}>
                                    {this.props.showListView ? <i className="bi bi-filter-square"></i> : <i className="bi bi-list"></i>}
                                </label>
                            </div>
                        </OverlayTrigger>
                        {this.renderStakeSelection()}
                    </div>
                </div>
                
            </div>
        );
    }
}

export default SearchBar;