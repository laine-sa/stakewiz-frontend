import React from 'react';

class SearchBar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            textInput: '',
            hideAnonymous: false,
            hidePrivate: false,
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
                const {textInput, hideAnonymous, hidePrivate, hideHighStake } = this.state;
                const list = this.props.validators;
                let filteredValidators = Array();

                var counter = 0;
                // Loop through all list items, and hide those who don't match the search query
                for (let i = 0; i < list.length; i++) {
            
                    let stakeRatio = list[i].stake_ratio*1000;
                    let commission = list[i].commission;
                    let name = list[i].name;
                    let txtValue = list[i].name + list[i].identity + list[i].vote_identity;
                
                    
                    if (txtValue.toUpperCase().indexOf(textInput.toUpperCase()) > -1 ) {
                        
                        if((name=='' && hideAnonymous===true) || (hidePrivate && commission==100) || (hideHighStake && stakeRatio>=100)) {
                            
                            
                        }
                        else {
                            
                                filteredValidators.push(list[i]);
                            
                            counter ++;
                        }
                        
                    }
                
                }

                let sf = this.state.sortField;
                
                if(!sf.includes('_asc')) {
                    console.log(sf);
                    filteredValidators.sort((a,b) => (a[sf] < b[sf]) ? 1 : ((b[sf] < a[sf]) ? -1 : 0));
                }
                else {
                    console.log(sf);
                    sf = sf.substring(0,sf.length-4);
                    filteredValidators.sort((a,b) => (a[sf] > b[sf]) ? 1 : ((b[sf] > a[sf]) ? -1 : 0));
                }

                this.setState({
                    validatorCount: filteredValidators.length
                });
                this.props.onClick(filteredValidators);
                //addClickListeners();
                //setResultsCount(counter);
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
        return (
            <div className="container text-white py-2">
                <div className="row search-row">
                    <div className="col col-md-4 position-relative d-flex align-items-center">
                        <input className="p-2 form-control" type="text" id="vsearch" name='textInput' value={this.state.textInput} placeholder="Search validators..." autoComplete="off" onChange={event => this.doSearch(event.target.name,event.target.value)} onKeyDown={event => this.keyPressed(event)} />
                        <button className="btn btn-sm btn-outline-dark" id="clear-input" onClick={(event) => this.clearInput(event.target.previousSibling.name)}>
                            Clear
                        </button>
                    </div>
                    <div className="col col-md-auto d-flex align-items-center text-left form-check form-switch searchToggle">
                        <input className="form-check-input p-2 hideAnonymous vcheckbox mx-1" type="checkbox" name="hideAnonymous" id="vhideanonymous" role="switch" onChange={event => this.doSearch(event.target.name,event.target.checked)} checked={this.state.hideAnonymous} />
                        <label htmlFor="vhideanonymous">Hide unnamed</label>
                    </div>
                    <div className="col col-md-auto d-flex align-items-center text-left form-check form-switch searchToggle">
                        <input className="form-check-input p-2 hidePrivate vcheckbox mx-1" type="checkbox" name="hidePrivate" id="vhideprivate" role="switch" onChange={event => this.doSearch(event.target.name,event.target.checked)} checked={this.state.hidePrivate} />
                        <label htmlFor="vhideprivate" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Validators with 100% Commission">Hide private</label>
                    </div>
                    <div className="col col-md-auto d-flex align-items-center text-left form-check form-switch searchToggle">
                        <input className="form-check-input p-2 hideHStake vcheckbox mx-1" type="checkbox" name="hideHighStake" id="vhidehstake" role="switch" onChange={event => this.doSearch(event.target.name,event.target.checked)} checked={this.state.hideHighStake} />
                        <label htmlFor="vhidestake">Hide high-stake</label>
                    </div>
                    <div className="col col-md-auto d-flex align-items-center text-left form-check form-switch searchSort">
                        <label className="text-nowrap pe-1" htmlFor="sortField">Sort by</label>
                        <select className='form-select form-select-sm' name='sortField' onChange={event => this.doSearch(event.target.name,event.target.value)}>
                            <option value='rank_asc'>Wiz Score ↑</option>
                            <option value='rank'>Wiz Score ↓</option>
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