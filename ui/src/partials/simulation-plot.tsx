import React from 'react';
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Row, Col, Button } from 'react-bootstrap'
import { AppState, Session, TableFormat } from '../models/index'
import { Chart } from 'react-google-charts'
import { ApiClient } from '../services/api-client'
import { Action } from '../redux/actions'
import * as R from 'ramda';

interface Props {
  api: ApiClient
  data: TableFormat
  address:URL
}
type State = any

class SimulationPlotCon extends React.Component<Props, State> {
  private readonly chartOptions:any
  constructor(p: Props) {
    super(p)
    this.chartOptions = {
      //display edges as soft curves, not hard edges
      //curveType: 'function'
      explorer: {
        axis: 'horizontal',
        keepInBounds: true,
        maxZoomIn: 10.0
      }
    }
  }

  render() {
    const dataSet = R.prepend(this.props.data.header as any[], this.props.data.data as any[][])
    const csvUrl = new URL(window.location.origin+this.props.address)
    csvUrl.searchParams.set("format", "csv")
    return (<><Row>
      <Col xs={10}>
        <Chart chartType="LineChart" height="80vh" data={dataSet} legendToggle options={this.chartOptions}/>
      </Col>
      <Col>
        <h5 className="text-secondary">Plot Actions</h5>
        <Button variant="outline-primary" href={csvUrl.toString()}>Download CSV</Button>
        <p className="text-info" style={{ marginTop: '15px' }}>You can zoom the plot using the mouse wheel.</p>
        {this.props.data.dataManipulated && (
          <p className="text-warning" style={{marginTop: '15px'}}>{this.props.data.dataManipulated}</p>
        )}
      </Col>
    </Row>
    </>)
  }
}

function mapProps(state: AppState) {
  return {}
}

function dispatchToProps(dispatch: (a: Action) => any) {
  return bindActionCreators({}, dispatch)
}

const SimulationPlot = connect(mapProps, dispatchToProps)(SimulationPlotCon)
export default SimulationPlot
