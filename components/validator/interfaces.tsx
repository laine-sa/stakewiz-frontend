import { ConnectionContextState } from "@solana/wallet-adapter-react";
import { Connection } from "@solana/web3.js";

export interface validatorI {
    identity: string;
    vote_identity: string;
    last_vote: number;
    root_slot: number;
    credits: number;
    epoch_credits: number;
    activated_stake: number;
    version: string;
    delinquent: boolean;
    skip_rate: number;
    created_at: string;
    updated_at: string;
    oldest_active_stake_pubkey: string;
    first_epoch_with_stake: number;
    name: string;
    keybase: string;
    description: string;
    info_pubkey: string;
    website: string;
    commission: number;
    image: string;
    gossip_ip: string;
    mod: boolean;
    ip_latitude: string;
    ip_longitude: string;
    ip_city: string;
    ip_country: string;
    ip_asn: string;
    ip_org: string;
    withdraw_authority: string;
    wiz_score_id: number;
    ignore: boolean;
    vote_success: number;
    vote_success_score: number;
    skip_rate_score: number;
    info_score: number;
    commission_score: number;
    first_epoch_distance: number;
    epoch_distance_score: number;
    stake_weight: number;
    above_halt_line: boolean;
    stake_weight_score: number;
    withdraw_authority_score: number;
    asn: string;
    asn_concentration: number;
    asn_concentration_score: number;
    uptime: number;
    uptime_score: number;
    wiz_score: number;
    version_valid: boolean;
    city_concentration: number;
    city_concentration_score: number;
    invalid_version_score: number;
    superminority_penalty: number;
    score_version: number;
    no_voting_override: boolean;
    epoch: number;
    epoch_slot_height: number;
    asncity_concentration: number;
    asncity_concentration_score: number;
    stake_ratio: number;
    credit_ratio: number;
    apy_estimate: number;
    rank: number;
    updateTitle: Function;
    userPubkey: string;
    solflareEnabled: boolean;
};

export interface clusterStatsI {
    avg_credit_ratio: number;
    avg_activated_stake: number;
    avg_commission: number;
    avg_skip_rate: number;
    avg_apy: number;
};

export interface ValidatorBoxPropsI {
    validator: validatorI;
    clusterStats: clusterStatsI;
    showWizModal: Function;
    showAlertModal: Function;
    showStakeModal: Function;
    connected: boolean;
    index: number;
    updateStakeValidators: Function;
}

export interface ValidatorListI {
    clusterStats: clusterStatsI;
    validators: [validatorI];
    updateWizModal: Function;
    updateAlertModal: Function;
    listSize: number;
    showWizModal: boolean;
    wizValidator: validatorI;
    alertValidator: validatorI;
    showAlertModal: boolean;
    stakeValidator: validatorI;
    showStakeModal: boolean;
    updateStakeModal: Function;
    userPubkey: string;
    solflareEnabled: boolean;
    connection: Connection;
    connected: boolean;
    updateStakevalidators: Function;
    stakeValidators: [validatorI];
}

export interface ValidatorListingI {
    state: {
        validators: [validatorI],
        clusterStats: clusterStatsI,
        filteredValidators: [validatorI],
        stakeValidators: [validatorI],
        hasData: boolean,
        visibleCount: number,
        showWizModal: boolean,
        wizValidator: validatorI,
        showAlertModal: boolean,
        alertValidator: validatorI,
        stakeValidator: validatorI,
        showStakeModal: boolean,
        walletValidators: [string],
        solflareNotificationsEnabled: boolean,
      },
    updateState: Function;
    userPubkey: string;
    connection: Connection;
    connected: boolean;
}

export interface validatorDetailI {
    vote_identity: string;
    updateTitle: Function;
    userPubkey: string;
    solflareEnabled: boolean;
    connection: Connection;
    connected: boolean;
}

export interface EpochInfoI {
    epoch: number;
    duration_seconds: number;
    epochs_per_year: number;
    slot_height: number;
    start_slot: number;
    start_time: string;
    remaining_seconds: number;
    elapsed_seconds: number;
}