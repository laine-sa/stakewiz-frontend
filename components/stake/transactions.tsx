import { useConnection } from "@solana/wallet-adapter-react";
import { Authorized, Connection, Keypair, PublicKey, StakeProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import config from "../../config.json";

export const addMeta = async (tx: Transaction, feePayer:PublicKey, connection: Connection) => {

    let blockhash = await connection.getLatestBlockhash();

    tx.recentBlockhash = blockhash.blockhash
    tx.lastValidBlockHeight = blockhash.lastValidBlockHeight
    tx.feePayer = feePayer

    return tx

}

export const createStake = (publicKey, validator, lamports): [Transaction, Transaction, Keypair] => {
    let stakeKeys = Keypair.generate();
    let auth = new Authorized(
        publicKey,
        publicKey
    );


    let stakeTx = StakeProgram.createAccount({
        authorized: auth,
        fromPubkey: publicKey,
        lamports: lamports,
        stakePubkey: stakeKeys.publicKey
    });
    
    let votePubkey = new PublicKey(validator.vote_identity);

    let delegateIx = StakeProgram.delegate({
        authorizedPubkey: publicKey,
        stakePubkey: stakeKeys.publicKey,
        votePubkey: votePubkey
    });

        return [stakeTx, delegateIx, stakeKeys]
}

export const deactivateStake = (authorizedPubkey, stakePubkey): Transaction => {

    return StakeProgram.deactivate({
        authorizedPubkey: authorizedPubkey,
        stakePubkey: stakePubkey
    })

}

export const closeStake = (authorizedPubkey, stakePubkey, lamports): Transaction => {

    return StakeProgram.withdraw({
        authorizedPubkey: authorizedPubkey,
        lamports: lamports,
        stakePubkey: stakePubkey,
        toPubkey: authorizedPubkey
    })
}

export const delegateStake = (authorizedPubkey, stakePubkey, votePubkey): Transaction => {

    return StakeProgram.delegate({
        authorizedPubkey: authorizedPubkey,
        stakePubkey: stakePubkey,
        votePubkey: votePubkey
    })

}

export const mergeStake = (authorizedPubkey, sourcePubkey, targetPubkey): Transaction => {

    return StakeProgram.merge({
        authorizedPubkey: authorizedPubkey,
        sourceStakePubKey: sourcePubkey,
        stakePubkey: targetPubkey
    })
}


// y is the number of txs per batch
export const buildTxBatches = async (txs,y, publicKey, connection) => {
    let transactions = [];
    let x = 0
    let i = 0
    for(const tx of txs) {

        if(transactions[i]!==undefined) {
            let currentLength = transactions[i].serialize({requireAllSignatures:false, verifySignatures:false}).length
            let pertx = currentLength / x
            if((currentLength + pertx) > config.MAX_CONSERVATIVE_TX_SIZE_BYTES) i++
        }
    
        if(transactions[i]==undefined) {
            transactions[i] = new Transaction();
            transactions[i] = await addMeta(transactions[i],publicKey,connection)
            
        }

        transactions[i].add(tx);
        x++
    }
    console.log(transactions[0].serialize({requireAllSignatures:false, verifySignatures:false}).length)

    return transactions
    
}