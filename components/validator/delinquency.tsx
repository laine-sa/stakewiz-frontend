import { FC, useEffect, useState } from "react";
import axios from "axios";
import config from '../../config.json'
import { Spinner } from '../common'
import Chart from "react-google-charts";
import Calendar from '../calendar';

const API_URL = process.env.API_BASE_URL;

export const DelinquencyChart: FC<{vote_identity: string}> = ({vote_identity}) => {
    const [delinquencies, setDelinquencies] = useState(null);
    
    useEffect(() => {
        axios(API_URL+config.API_ENDPOINTS.validator_delinquencies+"/"+vote_identity, {
            headers: {'Content-Type':'application/json'}
        })
            .then(async (response) => {
                let json: [] = response.data;

                let d: Object = {};

                json.forEach((delinquency: any) => {
                        d[delinquency.date] = delinquency.delinquent_minutes
                })

                /*delinquencies.push([
                    'Date', 'Delinquent Minutes'
                ]);

                let d = new Date();
                for(let a = 1; a <= 365; a++) {
                    let label = d.getFullYear()+'-'+d.getMonth()+'-'+d.getDay()
                    let delinquency: any|undefined = json.find((delinquency: any) => delinquency.date==label)
                    let delinquent_minutes = (delinquency==undefined) ? 0 : delinquency.delinquent_minutes;
                    
                    console.log(label+': '+delinquent_minutes)
                    delinquencies.push([
                        label,
                        delinquent_minutes
                    ]);
                    d.setDate(d.getDate() - 1);
                }*/

                setDelinquencies(d);
            })
            .catch(e => {
            console.log(e);
            })
    }, []);

    const today = new Date();
    let year = today.getFullYear()
    let month: string|number = today.getMonth() + 1
    let day = today.getDate();
    if(month<10) month = '0'+month
    const until = year+'-'+month+'-'+day

    if(delinquencies==null) {
        
        return <Spinner />
    
    }
    else {
        return (
            <div className='w-100 d-flex'>
                <Calendar 
                    key='del1'
                    values={delinquencies}
                    until={until}
                    weekLabelAttributes={{}}
                    monthLabelAttributes={{}}
                    panelColors={['#198754', '#e5b467', '#e2a124', '#dd6e1d', '#c34c0b']}
                    panelAttributes={{}}
                />
            </div>
        )
    }
}
