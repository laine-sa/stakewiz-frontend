import { createContext, useState, useEffect } from "react";
import axios from 'axios';
import config from '../config.json';

const ReferenceDataContext = createContext(null);
const API_URL = process.env.API_BASE_URL;

const ValidatorData = async() => {

  return await new Promise((resolve, reject) => {
    axios(API_URL+config.API_ENDPOINTS.validators, {
    headers: {'Content-Type':'application/json'}
    }).then(response => {
      resolve(response.data);
    })
    .catch(error => {
      reject(error);
    });
  });

};

const WalletValidator = async(pubkey) => {

  return await new Promise((resolve, reject) => {
    axios(API_URL+config.API_ENDPOINTS.wallet_validators+'/'+pubkey, {
    headers: {'Content-Type':'application/json'}
    }).then(response => {
      resolve(response.data);
    })
    .catch(error => {
      reject(error);
    });
  });

};
export {ValidatorData, WalletValidator};
