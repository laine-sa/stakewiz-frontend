import { Authorized, Keypair, PublicKey, StakeProgram, Transaction, TransactionInstruction } from "@solana/web3.js";

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