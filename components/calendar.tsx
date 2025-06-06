import dayjs from 'dayjs';
import React, { ReactElement } from 'react';
import Measure, { BoundingRect } from 'react-measure';

interface Props {
  weekNames?: string[]
  monthNames?: string[]
  panelColors?: string[]
  values: { [date: string]: number }
  until: string
  start: string
  dateFormat?: string
  weekLabelAttributes: any | undefined
  monthLabelAttributes: any | undefined
  panelAttributes: any | undefined
}

interface State {
  columns: number
  maxWidth: number
}

export default class GitHubCalendar extends React.Component<Props, State> {
  monthLabelHeight: number;
  weekLabelWidth: number;
  panelSize: number;
  panelMargin: number;
  heightFactor: number;
  maxColorValue: number;

  constructor(props: any) {
    super(props);

    this.monthLabelHeight = 18;
    this.weekLabelWidth = 15;
    this.panelSize = 18;
    this.panelMargin = 4;
    this.heightFactor = 0.9;
    this.maxColorValue = 120;

    this.state = {
        columns: 27,
        maxWidth: 27
    }
  }

  getPanelPosition(row: number, col: number) {
    const xbounds = this.panelSize + this.panelMargin;
    const ybounds = this.panelSize*this.heightFactor + this.panelMargin;
    return {
      x: this.weekLabelWidth + xbounds * row,
      y: this.monthLabelHeight + ybounds * col
    };
  }

  makeCalendarData(history: { [k: string]: number }, lastDay: string, firstDay: string, columns: number) {
    const d = dayjs(lastDay, { format: this.props.dateFormat })
    const startDate = dayjs(firstDay, {format: this.props.dateFormat})
    const lastWeekend = d.endOf('week');
    const endDate = d.endOf('day');

    var result: ({ value: number, month: number, preOperative: boolean } | null)[][] = [];
    for (var i = 0; i < columns; i++) {
      result[i] = [];
      for (var j = 0; j < 14; j++) {
        var date = lastWeekend.subtract((columns - i - 1) * 14 + (5 - j), 'day');
        if (date <= endDate) {
          result[i][j] = {
            value: history[date.format(this.props.dateFormat)] || 0,
            month: date.month(),
            preOperative: (date < startDate) ? true : false
          };
        } else {
          result[i][j] = null;
        }
      }
    }

    return result;
  }

  render() {
    const columns = this.state.columns;
    const values = this.props.values;
    const until = this.props.until;
    const start = this.props.start;

    // TODO: More sophisticated typing
    if (this.props.panelColors == undefined || this.props.weekNames == undefined || this.props.monthNames == undefined) {
      return;
    }

    var contributions = this.makeCalendarData(values, until, start, columns);
    var innerDom: ReactElement[] = [];

    // panels
    for (var i = 0; i < columns; i++) {
      for (var j = 0; j < 14; j++) {
        var contribution = contributions[i][j];
        if (contribution === null) continue;
        const pos = this.getPanelPosition(i, j);
        const numOfColors = this.props.panelColors.length
        const color =
            (contribution.preOperative) ? this.props.panelColors[0]
            : (contribution.value >= numOfColors * 10)
            ? this.props.panelColors[numOfColors - 1]
            : (contribution.value > numOfColors * 5 && numOfColors >= 4) 
            ? this.props.panelColors[numOfColors - 2] 
            : (contribution.value > numOfColors*2.5 && numOfColors >=4) 
            ? this.props.panelColors[numOfColors-3] 
            : (contribution.value>0) ? this.props.panelColors[2] : this.props.panelColors[1];
        const dom = (
                <g className='uptime-svg-group'>
                    <rect
                        key={ 'panel_key_' + i + '_' + j }
                        x={ pos.x }
                        y={ pos.y }
                        width={ this.panelSize }
                        height={ this.panelSize * this.heightFactor }
                        style={{ strokWidth: 3, stroke: color }}
                        fill={(contribution.value>0 && !contribution.preOperative) ? color : 'transparent'}
                        { ...this.props.panelAttributes }
                    >
                        <title>{(!contribution.preOperative) ? (contribution.value===0) ? '100%' : ((1-(contribution.value/3600))*100).toFixed(3)+'%, '+contribution.value+' min delinquent' : 'Not operating'}</title>
                    </rect>
                </g>
        );
        innerDom.push(dom);
      }
    }

    // week texts
    for (var i = 0; i < this.props.weekNames.length; i++) {
      const textBasePos = this.getPanelPosition(0, i);
      const dom = (
        <text
          key={ 'week_key_' + i }
          style={ {
            fontSize: 9,
            alignmentBaseline: 'central',
            fill: '#AAA'
          } }
          x={ textBasePos.x - this.panelSize / 2 - 2 }
          y={ textBasePos.y + this.panelSize / 2 }
          textAnchor={ 'middle' }
          { ...this.props.weekLabelAttributes }
        >
          { this.props.weekNames[i] }
        </text>
      );
      innerDom.push(dom);
    }

    // month texts
    var prevMonth = -1;
    for (var i = 0; i < columns; i++) {
      const c = contributions[i][0];
      if (c === null) continue;
      if (columns > 1 && i == 0 && c.month != contributions[i + 1][0]?.month) {
        // skip first month name to avoid text overlap
        continue;
      }
      if (c.month != prevMonth) {
        var textBasePos = this.getPanelPosition(i, 0);
        innerDom.push(<text
            key={ 'month_key_' + i }
            style={ {
              fontSize: 10,
              alignmentBaseline: 'central',
              fill: '#AAA'
            } }
            x={ textBasePos.x + this.panelSize / 2 }
            y={ textBasePos.y - this.panelSize / 2 - 2 }
            textAnchor={ 'middle' }
            { ...this.props.monthLabelAttributes }
          >
            { this.props.monthNames[c.month] }
          </text>
        );
      }
      prevMonth = c.month;
    }

    return (
      <Measure bounds onResize={ (rect) => this.updateSize(rect.bounds) }>
        { ({ measureRef }: any) => (
          <div ref={ measureRef } style={ { width: "100%" } }>
            <svg
              style={ {
                fontFamily: 'Helvetica, arial, nimbussansl, liberationsans, freesans, clean, sans-serif',
                width: '100%'
              } }
              height="100%">
              { innerDom }
            </svg>
          </div>
        ) }
      </Measure>
    );
  }

  updateSize(size?: BoundingRect) {
    if (!size) return;

    const visibleWeeks = Math.floor((size.width - this.weekLabelWidth) / 22);
    this.setState({
      columns: Math.min(visibleWeeks, this.state.maxWidth)
    });
  }
};

// @ts-ignore
GitHubCalendar.defaultProps = {
  weekNames: ['', 'M', '', 'W', '', 'F', '', 'S', '', 'T', '', 'T', '', 'S'],
  monthNames: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ],
  panelColors: ['#EEE', '#DDD', '#AAA', '#444'],
  dateFormat: 'YYYY-MM-DD'
};