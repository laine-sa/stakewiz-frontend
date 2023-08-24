import { FC } from "react";
import GaugeChart from 'react-gauge-chart'
import WizEmblem from '../../public/images/emblem.svg'

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

    let chartStyle = {
        width: 180
    }

    return (
        <div className='d-flex flex-nowrap justify-content-center mobile-gauge-container text-white my-2'>
                <div className='d-flex flex-row'>
                    <div className='flex-shrink-1 d-flex flex-column align-items-center'>
                        <div>
                            <GaugeChart id='gauge-chart-skip' 
                                nrOfLevels={15} 
                                percent={skip_rate/100} 
                                colors={["#ffffff", "#666666"]} 
                                arcWidth={0.08} 
                                arcPadding={0.03}
                                needleBaseColor="#AAAAAA"
                                needleColor="#AAAAAA"
                                animate={false}
                                cornerRadius={0}
                                style={chartStyle}
                            />
                        </div>
                        <div>
                            Skip rate
                        </div>
                    </div>
                    <div className='flex-grow-1 d-flex flex-column align-items-center'>
                        <div>
                        <GaugeChart id='gauge-chart-credits' 
                            nrOfLevels={15} 
                            percent={credit_ratio/100}  
                            colors={["#666666", "#ffffff"]} 
                            arcWidth={0.08} 
                            arcPadding={0.03}
                            needleBaseColor="#AAAAAA"
                            needleColor="#AAAAAA"
                            animate={false}
                            cornerRadius={0}
                            style={chartStyle}
                        />
                        </div>
                        <div>
                            Voting rate
                        </div>
                    </div>
                </div>
                <div className='d-flex flex-row'>
                    <div className='flex-grow-1 d-flex flex-column align-items-center'>
                        <div>
                        <GaugeChart id='gauge-chart-wiz' 
                            nrOfLevels={15} 
                            percent={wiz_score/100}  
                            colors={["#666666", "#ffffff"]} 
                            arcWidth={0.08} 
                            arcPadding={0.03}
                            needleBaseColor="#AAAAAA"
                            needleColor="#AAAAAA"
                            animate={false}
                            cornerRadius={0}
                            style={chartStyle}
                        />
                        </div>
                        <div>
                            <span><WizEmblem fill="#fff" width="25px" height="25px" /> Score</span>
                        </div>
                    </div>
                    <div className='flex-grow-1 d-flex flex-column align-items-center'>
                        <div>
                        <GaugeChart id='gauge-chart-uptime' 
                            nrOfLevels={15} 
                            percent={uptime/100}  
                            colors={["#666666", "#ffffff"]} 
                            arcWidth={0.08} 
                            arcPadding={0.03}
                            needleBaseColor="#AAAAAA"
                            needleColor="#AAAAAA"
                            animate={false}
                            cornerRadius={0}
                            style={chartStyle}
                        />
                        </div>
                        <div>
                            Uptime (30 days)
                        </div>
                    </div>
                </div>
        </div>
    );
}