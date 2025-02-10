export interface CommissionHistoryI {
    vote_identity: string;
    commission: number;
    observed_at: string;
}

export interface JitoCommissionHistoryI {
    commission_bps: number;
    created_at: string;
}