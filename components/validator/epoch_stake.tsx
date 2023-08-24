import { FC, useEffect, useState } from "react";
import axios from "axios";
import config from '../../config.json'
import { Spinner } from '../common'
import Chart from "react-google-charts";

const API_URL = process.env.API_BASE_URL;

export const EpochStakeChart: FC<{vote_identity: string, updateStake: Function}> = ({vote_identity, updateStake}) => {
    const [stakes, setStakes] = useState(null);
    
    useEffect(() => {
        axios(API_URL+config.API_ENDPOINTS.validator_epoch_stake_accounts+"/"+vote_identity, {
            headers: {'Content-Type':'application/json'}
        })
            .then(response => {
                
                let json = response.data;

                let change = json.activating.amount-json.deactivating.amount;
                
                updateStake(change);
                
                let stakes = [];
                stakes.push(['Location','Parent','Value (SOL)','Color value']);
                stakes.push(['Total Epoch Stake Changes',null,0,0]);
                stakes.push(['Activating','Total Epoch Stake Changes',0,0]);
                stakes.push(['Deactivating','Total Epoch Stake Changes', 0,0]);
                
                json.activating.stake_accounts.map((stake) => {
                    stakes.push([
                        stake.pubkey,
                        'Activating',
                        parseFloat(stake.delegated_amount),
                        Math.sqrt(parseFloat(stake.delegated_amount))
                    ])
                })
                json.deactivating.stake_accounts.map((stake) => {
                    stakes.push([
                        stake.pubkey,
                        'Deactivating',
                        parseFloat(stake.delegated_amount),
                        Math.sqrt(parseFloat(stake.delegated_amount))*-1
                    ])
                })

                console.log(stakes)

                setStakes(stakes);
            })
            .catch(e => {
            console.log(e);
            })
    }, []);


    if(stakes==null) {
        
        return <Spinner />
    
    }
    else {
        return (
            <Chart 
                    key='epoch-stake-chart'
                    chartType='TreeMap'
                    width="100%"
                    height="20rem"
                    data={stakes}
                    options={{
                        backgroundColor: 'none',
                        highlightOnMouseOver: false,
                        maxDepth: 1,
                        maxPostDepth: 2,
                        minColor: "#dc3545",
                        maxColor: "#198754",
                        headerHeight: 0,
                        hintOpacity: 0.4,
                        showScale: false,
                        useWeightedAverageForAggregation: true,
                        textStyle: {
                            fontName: 'lato',
                            bold: true
                        }
                    }}
                />
        )
    }
}

