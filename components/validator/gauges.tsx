import { FC } from "react";
import Chart from "react-google-charts";

export const Gauges: FC<{
    skip_rate: number, 
    credit_ratio: number,
    wiz_score: number, 
    uptime: number }> = ({
        skip_rate, credit_ratio, wiz_score, uptime
    }) => {


    let skipGauge = [
        ["Label", "Value"],
        ["Skip Rate", {v: skip_rate, f: skip_rate.toFixed(1)+'%'}]
        
    ];
    let creditGauge = [
        ["Label", "Value"],
        ["Vote Credits", {v: credit_ratio, f: credit_ratio.toFixed(1)+'%'}]
    ]
    let wizScoreGauge = [
        ["Label", "Value"],
        ["Wiz Score", {v: wiz_score, f: wiz_score.toFixed(1)+'%'}]
    ]
    let uptimeGauge = [
        ["Label", "Value"],
        ["Uptime", {v: uptime, f: uptime.toFixed(2)+'%'}]
    ]

    return (
        <div className='d-flex'>
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
    );
}