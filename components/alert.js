import React from 'react';
import axios from 'axios';
import config from '../config.json';
import { Modal, Button, Overlay, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Formik, Field, Form } from 'formik';
import $ from 'jquery';

const API_URL = process.env.API_BASE_URL;

function ErrorFlash(props) {
    return (
        <div className="container p-0 pt-2" id="alertAlert">
            <div className="alert alert-dismissible alert-danger fade show" role="alert">
                Unable to create alert, please ensure you provided your email address and selected at least one alert. If this error persists please contact us or try again later.
                <br /><br />
                Error Details: {props.text}.
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

class AlertForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            delinquencyRadiosVisible: false,
            alertCommission: false,
            promoOptIn: true,
            alertEmail: '',
            delinquencyThreshold: 60,
            success: false,
            error: false
        };
    }

    validate() {
        const errors = {};
        let validEmail = String(this.state.alertEmail)
                            .toLowerCase()
                            .match(
                                /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
                            );
        if(validEmail==null) {
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

    handleDelinquencyThreshold(value) {
        this.setState({
            delinquencyThreshold: value
        });
    }

    async submitHandler(values) {
        
        this.setState({
            error:false
        });

        let payload = {alerts: {}};
        
        payload.email = values.alertEmailText;
        payload.alerts.delinquency = (values.alertDelinquency) ? values.delinquencyThreshold : false;
        payload.alerts.commission = values.alertCommissionCheckbox;
        payload.vote_identity = values.alertValidator;
        payload.opt_in = values.alertOptIn;

        console.log(payload);

        axios.post(
                API_URL+config.API_ENDPOINTS.alert, 
                JSON.stringify(payload), 
                {
                    crossDomain:true
                })
            .then(response => {
              let json = response.data;
              if(json.result=='success') {
                this.setState({
                    success: true
                });
              }
              else {
                  console.log(json);
              }
            })
            .catch(e => {
            
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
              console.log(e);
            })
    }

    render() {
        const form = (
            
            <div className="container-fluid" id="alertFormInputs">
                <Formik
                initialValues={{
                    alertValidator: this.props.validator.vote_identity,
                    alertEmailText: this.state.alertEmail,
                    alertCommissionCheckbox: this.state.alertCommission,
                    alertDelinquency: this.state.delinquencyRadiosVisible,
                    alertOptIn: this.state.promoOptIn,
                    delinquencyThreshold: this.state.delinquencyThreshold
                }}
                enableReinitialize={true}
                validate={() => this.validate()}
                validateOnBlur={false}
                onSubmit={async (values) => {
                    await this.submitHandler(values);
                }}
                >
                {({ errors, touched, isSubmitting }) => (
                    <Form>
                        <div className="row">
                            <div className="col my-1">
                                Enter your email address and select which alerts you'd like to receive. We'll send you an activation email with a link, please click it to active your alerts.
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                <div className="input-group mb-3">
                                    <span className="input-group-text" id="vid1">
                                        <i className="bi bi-info-circle"></i>
                                    </span>
                                    <Field className="form-control" type="text" name='alertValidator' />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                <div className="input-group mb-3">
                                    <span className="input-group-text" id="email1">
                                        @
                                    </span>
                                    <Field className={"form-control "+(errors.alertEmailText && touched.alertEmailText ? 'is-invalid' : null)} type="text" name="alertEmailText" value={this.state.alertEmail} onChange={(event) => this.storeEmail(event.target.value)} />
                                    {errors.alertEmailText && touched.alertEmailText ? <div className="invalid-feedback">{errors.alertEmailText}</div> : null}
                                </div>
                                
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                <div className="form-check form-switch">
                                    <Field className={"form-check-input p-2 "+(errors.alertChoice ? 'is-invalid' : null)} type="checkbox" name="alertDelinquency" onChange={() => this.toggleRadios()} checked={this.state.delinquencyRadiosVisible} />
                                    <label className="d-flex align-items center form-check-label" htmlFor="alertDelinquency">
                                        Get Delinquency Alerts
                                        <i className="px-2 bi bi-info-circle" data-bs-toggle="tooltip" title="" data-bs-placement="right" data-bs-original-title="If the validator is marked delinquent continuously beyond your chosen threshold you'll get an alert."></i>
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
                                        <i className="px-2 bi bi-info-circle" data-bs-toggle="tooltip" title="" data-bs-placement="right" data-bs-original-title="If the validator changes their commission (up or down) you'll get an alert."></i>
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
                                By clicking "Create Alert" you accept our&nbsp;<a href="/terms" target="_new">Privacy Policy &amp; Terms of Use</a>.
                            </div>
                            <div className="d-flex"> 
                                <input type="hidden" id="alertRecaptchaToken" name="token" />
                                <Button variant="secondary" onClick={this.props.hideAlertModal} className='btn btn-secondary mx-2'>
                                    Close   
                                </Button>
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
        else {
            return (
                <div className="container p-0 pt-2" id="alertAlert">
                    <div className="alert alert-dismissible alert-success fade show" role="alert">
                        Alert created, you'll receive a confirmation email, please click on the activation link.
                    </div>
                </div>
            )
        }
    }
}

class Alert extends React.Component {
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
            <Modal show={this.props.showAlertModal} onHide={this.props.hideAlertModal} dialogClassName='modal-lg'>
                <Modal.Header closeButton>
                    <Modal.Title>{this.renderName()}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <AlertForm 
                        validator={this.props.validator}
                        hideAlertModal={() => this.props.hideAlertModal()}
                    />
                </Modal.Body>
            </Modal>
        );
        }
}

export default Alert;