import { FC, useEffect, useState } from "react";
import axios from "axios";
import config from '../../config.json'
import { Spinner } from '../common'
import Chart from "react-google-charts";

const API_URL = process.env.API_BASE_URL;

export const StakeHistoryChart: FC<{vote_identity: string}> = ({vote_identity}) => {
    const [allStakes, setAllStakes] = useState(null);
    
    useEffect(() => {
        axios(API_URL+config.API_ENDPOINTS.validator_total_stakes+"/"+vote_identity, {
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

                setAllStakes(stake);
            }
            })
            .catch(e => {
            console.log(e);
            })
    }, []);


    if(allStakes==null) {
        
        return <Spinner />
    
    }
    else {
        return (
            <Chart 
                chartType='LineChart'
                width="100%"
                height="20rem"
                data={allStakes}
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
}