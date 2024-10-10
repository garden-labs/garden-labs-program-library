use crate::state::HolderFieldConfig;

pub const THE100_PDA_SEED: &str = "the100-pda";

pub const MINT_FEE_LAMPORTS: u64 = 2_000_000_000; // 2 SOL

pub const TREASURY_PUBKEY_STR: &str = "JCXiqb3oL3xPrs9VWbDPcotEN8mEiNNba7E5fWhz6k8R";

pub const MEMBER_PDA_SEED: &str = "member-pda";

pub const MAX_SUPPLY: u16 = 100;

pub const HOLDER_FIELD_CONFIGS: [HolderFieldConfig; 3] = [
    HolderFieldConfig {
        name: "network",
        max_len: 32,
    },
    HolderFieldConfig {
        name: "genre",
        max_len: 32,
    },
    HolderFieldConfig {
        name: "stream_url",
        max_len: 200,
    },
];

pub const RESERVED_AUTHORITY_STR: &str = "FbaDEEWfq4twAc9QV8RcsKi4QHrHgMRi7hyUTVjYYBh5";
