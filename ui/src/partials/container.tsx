import React, { Component } from 'react';
import { Navbar, Nav } from 'react-bootstrap'
//@ts-ignore
import Octicon from 'react-octicon'

export class WmContainer extends React.Component<any, any> {
  constructor(props: any) {
    super(props)
  }
  componentDidMount() { }

  render() {
    return (<>
      <Navbar>
        <Navbar.Brand href="#home">Webmodelica {this.props.title}</Navbar.Brand>
        <Navbar.Toggle />
        <div className="collapse navbar-collapse justify-content-end">
          {this.props.sessionId && (<Nav.Item><Nav.Link href={`/session/${this.props.sessionId}/simulate`}> Simulate</Nav.Link></Nav.Item>)}
          <Nav.Item><Nav.Link href="/projects"><Octicon name="repo" /> Projects</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link href="/logout"><Octicon name="sign-out" /> Logout</Nav.Link></Nav.Item>
        </div>
      </Navbar>
      <div className="container-fluid">
        {this.props.children}
      </div>
    </>)
  }
}
