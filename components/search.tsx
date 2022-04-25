import React from 'react';
import { validatorI } from './validator';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

interface searchI {
    validators: [validatorI];
    setFilter: Function;
    walletValidators: [string]
}

class SearchBar extends React.Component<
        searchI, 
        {
            textInput:string,
            hideAnonymous:boolean,
            onlyMine:boolean,
            hideHighStake:boolean,
            validatorCount: number;
            sortField: string;
        }
    > {
    constructor(props) {
        super(props);
        this.state = {
            textInput: '',
            hideAnonymous: false,
            onlyMine: false,
            hideHighStake: false,
            validatorCount: this.props.validators.length,
            sortField: 'rank_asc'
        };
    }


    doSearch(key,value) {
        
        this.setState(() => {
            let obj = {};
            obj[key] = value;
            return obj;
            },() => {
                const {textInput, hideAnonymous, onlyMine, hideHighStake } = this.state;
                const list = this.props.validators;
                var filteredValidators = [];


                var counter = 0;
                // Loop through all list items, and hide those who don't match the search query
            
                for (let i = 0; i < list.length; i++) {
            
                    let stakeRatio = list[i].stake_ratio*1000;
                    let commission = list[i].commission;
                    let name = list[i].name;
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

        return (
            <div className="container text-white py-2">
                <div className="row search-row">
                    <div className="col col-md-4 position-relative d-flex align-items-center m-bottom-13">
                        <input className="p-2 form-control" type="text" id="vsearch" name='textInput' value={this.state.textInput} placeholder="Search validators..." autoComplete="off" onChange={event => this.doSearch(event.target.name,event.target.value)} onKeyDown={event => this.keyPressed(event)} />
                        <button className="btn btn-sm btn-outline-dark" id="clear-input" onClick={(event) => this.clearInput(((event.target as HTMLButtonElement).previousSibling as HTMLInputElement).name)}>
                            Clear
                        </button>
                    </div>
                    <div className="col col-md-auto d-flex align-items-center text-left form-check form-switch searchToggle">
                        <input className="form-check-input p-2 vcheckbox mx-1" type="checkbox" name="hideAnonymous" id="vhideanonymous" role="switch" onChange={event => this.doSearch(event.target.name,event.target.checked)} checked={this.state.hideAnonymous} />
                        <label htmlFor="vhideanonymous">Hide unnamed</label>
                    </div>
                    <OverlayTrigger
                            placement='top'    
                            overlay={<Tooltip>Only show validators you have stakes with</Tooltip>}
                        >
                        <div className="col col-md-auto d-flex align-items-center text-left form-check form-switch searchToggle">
                            <input className="form-check-input p-2 vcheckbox mx-1" type="checkbox" name="onlyMine" id="vhideprivate" role="switch" onChange={event => this.doSearch(event.target.name,event.target.checked)} checked={this.state.onlyMine} disabled={onlyMineDisabled} />
                            <label htmlFor="vonlymine">Only Mine</label>
                        </div>
                    </OverlayTrigger>
                    <div className="col col-md-auto d-flex align-items-center text-left form-check form-switch searchToggle">
                        <input className="form-check-input p-2 vcheckbox mx-1" type="checkbox" name="hideHighStake" id="vhidehstake" role="switch" onChange={event => this.doSearch(event.target.name,event.target.checked)} checked={this.state.hideHighStake} />
                        <label htmlFor="vhidestake">Hide high-stake</label>
                    </div>
                    <div className="col col-md-auto d-flex align-items-center text-left form-check form-switch searchSort">
                        <label className="text-nowrap pe-1" htmlFor="sortField">Sort by</label>
                        <select className='form-select form-select-sm' name='sortField' onChange={event => this.doSearch(event.target.name,event.target.value)}>
                            <option value='rank'>Wiz Score ↑</option>
                            <option value='rank_asc'>Wiz Score ↓</option>
                            <option value='activated_stake_asc'>Stake ↑</option>
                            <option value='activated_stake'>Stake ↓</option>
                            <option value='apy_estimate'>Estimated APY ↓</option>
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
                    <div className="col d-flex align-items-center bg-dark text-white p-1 rounded justify-content-center" id="resultsno">
                        {this.state.validatorCount} validators
                    </div>
                </div>
            </div>
        );
    }
}

export default SearchBar;