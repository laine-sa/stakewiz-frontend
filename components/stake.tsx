import React, {useCallback} from 'react';
import { validatorI } from './validator'
import config from '../config.json';
import { Modal, Button, Overlay, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { ConnectionContextState } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

const GetBalance = (connection,publicKey) => {
    useCallback(async (connection, publicKey) => {
    if(publicKey) {
      const rbh = await connection.connection.getBalance(publicKey);
      return rbh / LAMPORTS_PER_SOL;
    }
    return null;
    
  }, []);
};

class StakeDialog extends React.Component<{
    validator: validatorI;
    showStakeModal: boolean;
    hideStakeModal: Function;
    connection: ConnectionContextState;
    userPubkey: PublicKey;
},
{}> {
    renderName() {
        
        if(this.props.validator!=null) {
            return this.props.validator.name;
        }
        else {
            return 'Validator Not Chosen';
        }
    }

    renderStakeBody() {
        if(this.props.validator!=null) {
            return this.props.validator.name
        }
        else {
            return null;
        }
    }

   
    
    render() {
        GetBalance(this.props.connection, this.props.userPubkey);

        return (
            <Modal show={this.props.showStakeModal} onHide={() => this.props.hideStakeModal()} dialogClassName='modal-lg'>
                <Modal.Header closeButton>
                    <Modal.Title>{this.renderName()}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                        
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => this.props.hideStakeModal()}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        );
        }
}

export {StakeDialog}