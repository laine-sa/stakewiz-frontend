import React, { ReactNode } from 'react';
import axios from 'axios';
import config from '../config.json';
import { Modal, Button, Overlay, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Formik, Field, Form } from 'formik';
import ReCAPTCHA from 'react-google-recaptcha';
import Link from 'next/link'
import { validatorI } from './validator';
import { checkSolflareEnabled } from './common';

const API_URL = process.env.API_BASE_URL;

interface ActivateProps {
    token: string;
}

interface alertI {
    validator: validatorI;
    showAlertModal: boolean;
    hideAlertModal: Function;
    userPubkey: string;
    solflareEnabled: boolean;
}

interface CancelProps {
    query: object;
}

interface AlertFormI {
    validator: validatorI;
    hideAlertModal: Function;
    userPubkey: string;
    solflareEnabled: boolean;
}

class Activate extends React.Component<ActivateProps, {activateResult: ReactNode}> {
    constructor(props) {
        super(props);
        this.state = {
            activateResult: null
        }
        if(this.props.token!=undefined) {
            this.doActivate();
        }
        
    }
    
    doActivate() {
        
        const postData = JSON.stringify({
            token: this.props.token
          });

        axios.post(API_URL+config.API_ENDPOINTS.activate, 
            postData)
            .then(response => {
            let json = response.data;
            
            if(json.message.name!='') {
                var message = json.message.name
            }
            else {
                var message = json.message.vote_identity;
            }

            let result = (
                <div className="alert alert-success show text-center">
                    Alert activated for {message}
                </div>
            )

            this.setState({
                activateResult: result
            })
                
            })
            .catch(e => {
                let result = (
                    <div className="alert alert-danger show text-center">
                        Error trying to activate alert: {e.response.data.reason}
                    </div>
                )

                this.setState({
                    activateResult: result
                })
            })

    }


    render() {
      if(this.state.activateResult!=undefined) {
        return (
            this.state.activateResult
        )
        }
        else return null
    }
}

class Cancel extends React.Component<CancelProps, {cancelResult: ReactNode}> {
    constructor(props) {
        super(props);
        this.state = {
            cancelResult: null
        }
        if(this.props.query!=undefined) {
            this.doCancel();
        }
        
    }
    
    doCancel() {
        
        const postData = JSON.stringify(this.props.query);
        console.log(postData)

        axios.post(API_URL+config.API_ENDPOINTS.cancel, 
            postData)
            .then(response => {
            let json = response.data;
            
            if(json.message.type!='all') {
                if(json.message.type=='validator') {
                    var type = json.message.alert_count+' alerts for '
                    var verb = ' have'
                }
                else {
                    var type = 'Your '+json.message.type+' alert for '
                    var verb = ' has'
                }
                if(json.message.name!='') {
                    var message = type+json.message.name+verb+' been cancelled. You can create new alerts at any time.'
                }
                else {
                    var message = type+json.message.vote_identity+verb+' been cancelled. You can create new alerts at any time.'
                }
            }
            else {
                var message = 'We have cancelled all your Stakewiz Alerts ('+json.message.alert_count+' alerts). You can create new alerts at any time.'
            }
            let result = (
                <div className="alert alert-success show text-center">
                    {message}
                </div>
            )

            this.setState({
                cancelResult: result
            })
                
            })
            .catch(e => {
                console.log(e.response)
                let result = (
                    <div className="alert alert-danger show text-center">
                        Error trying to cancel alert. {e.response.data.reason}
                    </div>
                )

                this.setState({
                    cancelResult: result
                })
            })

    }


    render() {
      if(this.state.cancelResult!=undefined) {
        return (
            this.state.cancelResult
        )
        }
        else return null
    }
}

function ErrorFlash(props) {
    return (
        <div className="container p-0 pt-2" id="alertAlert">
            <div className="alert alert-dismissible alert-danger fade show" role="alert">
                Unable to create alert, please ensure you provided your email address and selected at least one alert. If this error persists please contact us or try again later.
                <br /><br />
                Error Details: {props.text}
            </div>
        </div>
    )
}

function AlertDelinquencyRadios(props) {
    
    
    return (
        <div className="row m-2" id="delinquencyOptionsRow">
            <div className="col-md-auto d-flex align-items-center p-1 mobile-checkbox-label">
                Alert after
            </div>
            <div className="col-md-auto d-flex align-items-center p1 mobile-checkbox-wrap">
                <Field className="btn-check" type="radio" name="delinquencyThreshold" id="dt15" autoComplete="off" value="15"
                    checked={props.threshold == 15 ? true : false}
                    onChange={(event) => props.handleState(event.target.value)}
                />
                <label className="my-1 mx-1 btn btn-outline-secondary" htmlFor="dt15">
                    15 Minutes
                </label>
                <Field className="btn-check" type="radio" name="delinquencyThreshold" id="dt30" autoComplete="off" value="30"
                    checked={props.threshold == 30 ? true : false}
                    onChange={(event) => props.handleState(event.target.value)}
                />
                <label className="my-1 mx-1 btn btn-outline-secondary" htmlFor="dt30">
                    30 Minutes
                </label>
                <Field className="btn-check" type="radio" name="delinquencyThreshold" id="dt60" autoComplete="off" value="60"
                    checked={props.threshold == 60 ? true : false}
                    onChange={(event) => props.handleState(event.target.value)}
                />
                <label className="my-1 mx-1 btn btn-outline-secondary" htmlFor="dt60">
                    1 hour
                </label>
                <Field className="btn-check" type="radio" name="delinquencyThreshold" id="dt120" autoComplete="off" value="120"
                    checked={props.threshold == 120 ? true : false}
                    onChange={(event) => props.handleState(event.target.value)}
                />
                <label className="my-1 mx-1 btn btn-outline-secondary" htmlFor="dt120">
                    2 hours
                </label>
                <Field className="btn-check" type="radio" name="delinquencyThreshold" id="dt240" autoComplete="off" value="240"
                    checked={props.threshold == 240 ? true : false}
                    onChange={(event) => props.handleState(event.target.value)}
                />
                <label className="my-1 mx-1 btn btn-outline-secondary" htmlFor="dt240">
                    4 hours
                </label>
                <Field className="btn-check" type="radio" name="delinquencyThreshold" id="dt720" autoComplete="off" value="720"
                    checked={props.threshold == 720 ? true : false}
                    onChange={(event) => props.handleState(event.target.value)}
                />
                <label className="my-1 mx-1 btn btn-outline-secondary" htmlFor="dt720">
                    12 hours
                </label>
            </div>
        </div>
    );
}

class AlertForm extends React.Component<AlertFormI, {
    delinquencyRadiosVisible: boolean;
    alertCommission: boolean;
    promoOptIn: boolean;
    alertEmail: string;
    delinquencyThreshold: number;
    success: boolean;
    error: any;
    deliveryMethod: string;
    activation_token: string;
    initial: {
        delinquencyRadiosVisible: boolean;
        alertCommission: boolean;
        promoOptIn: boolean;
        alertEmail: string;
        delinquencyThreshold: number;
        success: boolean;
        error: any;
        deliveryMethod: string;
        activation_token: string;
        };
    }> {
    constructor(props) {
        super(props);

        const initialState = {
            delinquencyRadiosVisible: false,
            alertCommission: false,
            promoOptIn: true,
            alertEmail: '',
            delinquencyThreshold: 60,
            success: false,
            error: null,
            deliveryMethod: 'telegram',
            activation_token: null,
            initial: {
                delinquencyRadiosVisible: false,
                alertCommission: false,
                promoOptIn: true,
                alertEmail: '',
                delinquencyThreshold: 60,
                success: false,
                error: null,
                deliveryMethod: 'telegram',
                activation_token: null
            }
        };
        
        this.state = initialState;

    }

    resetState() {
        this.setState(this.state.initial);
    }

    validate() {
        const errors: any = {};
        let validEmail = String(this.state.alertEmail)
                            .toLowerCase()
                            .match(
                                /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
                            );
        if(validEmail==null && this.state.deliveryMethod=='email') {
            errors.alertEmailText = 'Invalid email';
        }
        if(!this.state.alertCommission && !this.state.delinquencyRadiosVisible) {
         
            errors.alertChoice = 'Select at least one alert';
        }
        return errors;
    }
    
    toggleRadios() {
        if(this.state.delinquencyRadiosVisible) {
            this.setState({
                delinquencyRadiosVisible: false
            }
            );
        }
        else {
            this.setState({
                delinquencyRadiosVisible: true
            }
            );
        }
    }

    toggleCommission() {
        if(this.state.alertCommission) {
            this.setState({
                alertCommission: false,
            }
            );
        }
        else {
            this.setState({
                alertCommission: true,
            }
            );
        }
    }

    toggleOptIn() {
        if(this.state.promoOptIn) {
            this.setState({
                promoOptIn: false,
            });
        }
        else {
            this.setState({
                promoOptIn: true,
            });
        }
    }

    storeEmail(value) {
        this.setState({
            alertEmail: value
        });
    }

    renderRadios() {
        if(this.state.delinquencyRadiosVisible) {
            return <AlertDelinquencyRadios
                    handleState={(value) => this.handleDelinquencyThreshold(value)} 
                    threshold={this.state.delinquencyThreshold}
                    />
        }
        else return null;
    }

    renderEmail(errors,touched) {
        if(this.state.deliveryMethod=='email') {
            return (
                <div className='row my-1'>
                    <div className="col">
                        <div className="input-group">
                            <span className="input-group-text" id="email1">
                                @
                            </span>
                            <Field className={"form-control "+(errors.alertEmailText && touched.alertEmailText ? 'is-invalid' : null)} type="text" name="alertEmailText" value={this.state.alertEmail} onChange={(event) => this.storeEmail(event.target.value)} />
                            {errors.alertEmailText && touched.alertEmailText ? <div className="invalid-feedback">{errors.alertEmailText}</div> : null}
                        </div>
                        
                    </div>
                </div>
            );
            
        }
        else return null;
    }

    handleDelinquencyThreshold(value) {
        this.setState({
            delinquencyThreshold: value
        });
    }

    async submitHandler(values,recaptchaRef) {

        const token = await recaptchaRef.current.executeAsync();
        
        
        this.setState({
            error:null
        });

        let payload: any = {alerts: {}};
        
        payload.email = values.alertEmailText;
        payload.alerts.delinquency = (values.alertDelinquency) ? values.delinquencyThreshold : false;
        payload.alerts.commission = values.alertCommissionCheckbox;
        payload.deliveryMethod = values.deliveryMethod;
        payload.vote_identity = values.alertValidator;
        payload.opt_in = values.alertOptIn;
        payload.recaptcha_token = token;
        payload.publicKey = (values.deliveryMethod=='solflare') ? this.props.userPubkey : false;

        axios.post(
                API_URL+config.API_ENDPOINTS.alert, 
                JSON.stringify(payload))
            .then(response => {
              let json = response.data;
              if(json.result=='success') {

                let token = null;
                if('message' in json) {
                    if('activation_token' in json.message) token = json.message.activation_token;
                }
                
                this.setState({
                    success: true,
                    activation_token: token
                });
              }
              else {
                  console.log(json);
              }
            })
            .catch(e => {
                console.log(e);
                
              if(e.response.data!=undefined) {
                  this.setState({
                      error: e.response.data
                  });
              }
              else {
                this.setState({
                    error: "Unknown error. Please check that you submitted a valid email address. If the error persists please try again later."
                });
              }
              
            })
    }

    render() {
        const recaptchaRef = React.createRef();
        const close_button = (this.props.hideAlertModal==null) ? '' : (
            <Button variant="secondary" onClick={() => this.props.hideAlertModal()} className='btn btn-secondary mx-2'>
                 Close   
            </Button>
        );
        const reset_button = (this.props.hideAlertModal!=null) ? '' : (
            <Button variant="secondary" onClick={this.resetState.bind(this)} className='btn btn-secondary mx-2'>
                 New Alert   
            </Button>
        );

        const ConditionalWrapper = ({
            condition,
            wrapper,
            children,
        }) => (condition ? wrapper(children) : children);

        const form = (
            
            <div className="container-fluid" id="alertFormInputs">
                <Formik
                initialValues={{
                    alertValidator: this.props.validator.vote_identity,
                    alertEmailText: this.state.alertEmail,
                    alertCommissionCheckbox: this.state.alertCommission,
                    alertDelinquency: this.state.delinquencyRadiosVisible,
                    alertOptIn: this.state.promoOptIn,
                    delinquencyThreshold: this.state.delinquencyThreshold,
                    deliveryMethod: this.state.deliveryMethod
                }}
                enableReinitialize={true}
                validate={() => this.validate()}
                validateOnBlur={false}
                onSubmit={async (values) => {
                    await this.submitHandler(values,recaptchaRef);
                }}
                >
                {({ errors, touched, isSubmitting }: any) => (
                    <Form>
                        <ReCAPTCHA
                            ref={recaptchaRef}
                            size="invisible"
                            sitekey={config.RECAPTCHA_SITE_KEY}
                        />
                        <div className="row">
                            <div className="col my-1">
                                Please choose your delivery method and which alerts you&apos;d like to receive. For email alerts you&apos;ll receive an activation email with a link, for Telegram please click the button in the next step to activate your alert.
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                <div className="input-group mb-3">
                                    <span className="input-group-text" id="vid1">
                                        <i className="bi bi-info-circle"></i>
                                    </span>
                                    <Field className="form-control" type="text" name='alertValidator' disabled />
                                </div>
                            </div>
                        </div>
                        <div className="row align-items-center">
                            <div className="col col-md-auto">
                                <Field className="btn-check" type="radio" name="deliveryMethod" id="delTelegram" autoComplete="off" value="telegram"
                                    checked={this.state.deliveryMethod == 'telegram' ? true : false}
                                    onChange={(event) => {this.setState({deliveryMethod: event.target.value})}}
                                />
                                <label className="my-1 mx-1 btn btn-outline-secondary" htmlFor="delTelegram">
                                    Telegram
                                </label>
                                <Field className="btn-check" type="radio" name="deliveryMethod" id="delEmail" autoComplete="off" value="email"
                                    checked={this.state.deliveryMethod == 'email' ? true : false}
                                    onChange={(event) => {this.setState({deliveryMethod: event.target.value})}}
                                />
                                <label className="my-1 mx-1 btn btn-outline-secondary" htmlFor="delEmail">
                                    Email
                                </label>
                                <ConditionalWrapper
                                    condition={(!this.props.solflareEnabled || !this.props.userPubkey) ? true : false}
                                    wrapper={children => (
                                        <OverlayTrigger
                                            placement="right"
                                            overlay={
                                                <Tooltip>
                                                    Connect Solflare to receive alerts in your wallet (doesn't support Ledger).
                                                </Tooltip>
                                            } 
                                        >
                                            {children}
                                        </OverlayTrigger>
                                    )}
                                >
                                    <div className='d-inline-block'>
                                        <Field key='solflare-alert-button' className="btn-check" type="radio" name="deliveryMethod" id="delSolflare" autoComplete="off" value="solflare"
                                            disabled={(this.props.solflareEnabled && this.props.userPubkey) ? false : true}
                                            checked={(this.state.deliveryMethod == 'solflare' && this.props.solflareEnabled && this.props.userPubkey) ? true : false}
                                            onChange={(event) => {this.setState({deliveryMethod: event.target.value})}}
                                        />
                                        <label key='solflare-alert-label' className="my-1 mx-1 btn btn-outline-secondary" htmlFor="delSolflare">
                                            Solflare
                                        </label>
                                    </div>
                                </ConditionalWrapper>
                            </div>
                        </div>
                            {this.renderEmail(errors,touched)}
                        <div className="row">
                            <div className="col">
                                <div className="form-check form-switch">
                                    <Field className={"form-check-input p-2 "+(errors.alertChoice ? 'is-invalid' : null)} type="checkbox" name="alertDelinquency" onChange={() => this.toggleRadios()} checked={this.state.delinquencyRadiosVisible} />
                                    <label className="d-flex align-items center form-check-label" htmlFor="alertDelinquency">
                                        Get Delinquency Alerts
                                        <OverlayTrigger
                                            placement="right"
                                            overlay={
                                                <Tooltip>
                                                    If the validator is marked delinquent continuously beyond your chosen threshold you&apos;ll get an alert.
                                                </Tooltip>
                                            } 
                                        >
                                            <i className="px-2 bi bi-info-circle"></i>
                                        </OverlayTrigger>
                                    </label>
                                </div>
                            </div>
                        </div>
                        {this.renderRadios()}
                        <div className="row">
                            <div className="col">
                                <div className="form-check form-switch">
                                    <Field className={"form-check-input p-2 "+(errors.alertChoice ? 'is-invalid' : null)} type="checkbox" name="alertCommissionCheckbox" role="switch" checked={this.state.alertCommission} onChange={() => this.toggleCommission()} />
                                    <label className="d-flex align-items-center form-check-label" htmlFor="alertCommission">
                                        Get Commission Alerts
                                        <OverlayTrigger
                                            placement="right"
                                            overlay={
                                                <Tooltip>
                                                    If the validator changes their commission (up or down) you&apos;ll get an alert.
                                                </Tooltip>
                                            } 
                                        >
                                        <i className="px-2 bi bi-info-circle"></i>
                                        </OverlayTrigger>
                                    </label>
                                    {errors.alertChoice ? <div className="invalid-feedback">{errors.alertChoice}</div> : null}
                                </div>
                            </div>
                        </div>
                        <div className="row mt-3">
                            <div className="col">
                                <div className="form-check form-switch">
                                    <Field className="form-check-input p-2" type="checkbox" name="alertOptIn" role="switch" checked={this.state.promoOptIn} onChange={() => this.toggleOptIn()} /> 
                                    <label className="d-flex align-items-center form-check-label" htmlFor="alertOptIn">
                                        We may send you occasional updates or announcements relating to Stakewiz
                                    </label>
                                </div>
                            </div>
                        </div>
                        {this.state.error ? <ErrorFlash text={this.state.error.reason} /> : null}
                        <div className="mt-3 d-flex justify-content-end flex-wrap align-items-center">
                            <div className="d-flex text-end fst-italic me-2" id="alert-terms">
                                By clicking &quot;Create Alert&quot; you accept our&nbsp;<Link href="/terms" passHref><a target="_blank">Privacy Policy &amp; Terms of Use</a></Link>.
                            </div>
                            <div className="d-flex"> 
                                <input type="hidden" id="alertRecaptchaToken" name="token" />
                                {close_button}
                                <Button variant="success" type="submit" disabled={isSubmitting} className='btn btn-success mx-2'>
                                    Submit   
                                </Button>
                            </div>
                        </div>
                    </Form>
                    )}
                </Formik>
            </div>
        );

        if(!this.state.success) {
            return form;
        }
        else if(this.state.activation_token!=null) {
            return (
                <div className="container p-0 pt-2" id="alertAlert">
                    <div className="alert alert-dismissible alert-success fade show text-center" role="alert">
                        Alert created, to activate it please click the link below to open Telegram, then click Start:<br />
                        <span className='d-inline-block mt-2'>
                            <a href={'https://t.me/stakewiz_bot?start='+this.state.activation_token} target='_new'>
                                <button className='btn btn-telegram text-white'>
                                <i className="bi bi-telegram me-1"></i> Activate in Telegram
                                </button>
                            </a>
                            {reset_button}
                        </span>
                    </div>
                </div>
            )
        }
        else {
            return (
                <div className="container p-0 pt-2" id="alertAlert">
                    <div className="alert alert-dismissible alert-success fade show text-center" role="alert">
                        Alert created, you&apos;ll receive a confirmation email, please click on the activation link.<br />
                        {reset_button}
                    </div>
                    
                </div>
            )
        }
    }
}


class Alert extends React.Component<alertI,{}> {
    renderName() {
        
        if(this.props.validator!=null) {
            return this.props.validator.name;
        }
        else {
            return 'Validator Not Chosen';
        }
    }
    
    render() {
        return (
            <Modal show={this.props.showAlertModal} onHide={() => this.props.hideAlertModal()} dialogClassName='modal-lg'>
                <Modal.Header closeButton>
                    <Modal.Title>{this.renderName()}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <AlertForm 
                        validator={this.props.validator}
                        hideAlertModal={() => this.props.hideAlertModal()}
                        userPubkey={this.props.userPubkey}
                        solflareEnabled={this.props.solflareEnabled}
                    />
                </Modal.Body>
            </Modal>
        );
        }
}

export {Alert, AlertForm, Activate, Cancel};