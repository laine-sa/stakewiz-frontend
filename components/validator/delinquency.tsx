import { FC, useEffect, useState } from "react";
import axios from "axios";
import config from '../../config.json'
import { Spinner } from '../common'
import Chart from "react-google-charts";

const API_URL = process.env.API_BASE_URL;

export const DelinquencyChart: FC<{vote_identity: string}> = ({vote_identity}) => {
    const [delinquencies, setDelinquencies] = useState(null);
    
    useEffect(() => {
        axios(API_URL+config.API_ENDPOINTS.validator_delinquencies+"/"+vote_identity, {
            headers: {'Content-Type':'application/json'}
        })
            .then(response => {
                let json = response.data;

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

                
                if(json.length>0) {
                    for(var i in json) {
                        for(var a in delinquencies) {
                            if(new Date(delinquencies[a][0]).toLocaleDateString() == new Date(json[i].date).toLocaleDateString()) {
                                delinquencies[a][1] = parseInt(json[i].delinquent_minutes);
                            }
                        }
                    }
                }

                setDelinquencies(delinquencies);
            })
            .catch(e => {
            console.log(e);
            })
    }, []);


    if(delinquencies==null) {
        
        return <Spinner />
    
    }
    else {
        return (
            <Chart 
                chartType='ColumnChart'
                width="100%"
                height="20rem"
                data={delinquencies}
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
}
