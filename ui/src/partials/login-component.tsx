import React, { Component } from 'react';
import { WmContainer } from '../partials/container'
import { Button, Form, Alert } from 'react-bootstrap'
//@ts-ignore
import Octicon from 'react-octicon'
import { ApiClient } from '../services/api-client'
import { Redirect } from 'react-router'
import { defaultMapDispatchToProps, mapAuthenticationToProps } from '../redux'
import { Action, updateToken } from '../redux/index'
import { renderErrors } from '../partials/errors'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as R from 'ramda'
import { userIsAuthenticated, UserAuth } from '../models/index';
//@ts-ignore
import {cookies, local, db, session, subscribe} from 'brownies';

interface Props {
  api: ApiClient
  history: any
  authentication?: UserAuth
  updateToken(token:string): void
}

class LoginComponentCon extends React.Component<Props, any> {
  private username: string = ''
  private password: string = ''

  constructor(p:Props) {
    super(p)
    this.state = { errors: [] }
  }

  private handleSubmit(ev: any) {
    const props = this.props
    const username = this.username
    const pw = this.password
    props.api.login(username, pw)
      .then(() => props.history.push('/projects'))
      .catch(err => {
        this.setState({ errors: [err] })
      })
    ev.preventDefault()
  }

  componentDidMount() {
    //check if auth-service redireted us here and gave us a cookie
    if(cookies.Authentication) {
      console.log("updating token using authentication cookie !")
      this.props.updateToken(cookies.Authentication)
    }
    if (userIsAuthenticated(this.props.authentication))
      this.props.history.push("/projects")
  }

  render() {
    const usernameChanged = (ev: any) => this.username = ev.target.value
    const passwordChanged = (ev: any) => this.password = ev.target.value
    return (
      <div className="card sm-10 mx-auto">
        <h5 className="card-title">Login</h5>
        <div className="card-body">
          <Form onSubmit={this.handleSubmit.bind(this)}>
            <Form.Group controlId="formUsername">
              <Form.Label>Username</Form.Label>
              <Form.Control required placeholder="Enter username" onChange={usernameChanged} />
            </Form.Group>
            <Form.Group controlId="formPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control required type="password" placeholder="Password" onChange={passwordChanged} />
            </Form.Group>
            {renderErrors(this.state.errors)}
            <Button variant="secondary" href="http://localhost:9000/api/v1/auths/developer">Developer</Button>
            <Button variant="secondary" href="http://localhost:9000/api/v1/auths/github">GitHub</Button>
            <Button variant="primary" type="submit">
              <Octicon name="sign-in" /> Submit
              </Button>
          </Form>
        </div>
      </div>
    )
  }
}

function dispatchToProps(dispatch: (a: Action) => any) {
  return bindActionCreators({ updateToken }, dispatch)
}

const LoginComponent = connect(mapAuthenticationToProps, dispatchToProps)(LoginComponentCon)
export default LoginComponent