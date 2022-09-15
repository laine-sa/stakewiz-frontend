import { useConnection } from "@solana/wallet-adapter-react";
import { Authorized, Connection, Keypair, PublicKey, StakeProgram, Transaction, TransactionInstruction } from "@solana/web3.js";

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