import { FC, useEffect, useState } from "react";
import axios from "axios";
import config from '../../config.json'
import { Spinner } from '../common'
import Chart from "react-google-charts";

const API_URL = process.env.API_BASE_URL;

export const EpochStakeChart: FC<{vote_identity: string, updateStake: Function}> = ({vote_identity, updateStake}) => {
    const [stakes, setStakes] = useState(null);
    
    useEffect(() => {
        axios(API_URL+config.API_ENDPOINTS.validator_epoch_stakes+"/"+vote_identity, {
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
                
                updateStake(change);
    
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
                    chartType='BarChart'
                    width="100%"
                    height="20rem"
                    data={stakes}
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
                />
        )
    }
}

