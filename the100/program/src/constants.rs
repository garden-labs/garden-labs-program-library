use crate::state::HolderFieldConfig;

pub const THE100_PDA_SEED: &str = "the100-pda";
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
