pub const MAX_NAME_LEN: usize = 32;
pub const MAX_SYMBOL_LEN: usize = 10;
pub const MAX_URI_LEN: usize = 200;
// TODO: Move to Vec once field authority interface is switched from
// PDA model to single tlv account
// pub const MAX_HOLDER_FIELDS: usize = 10;
pub const MAX_HOLDER_FIELD_KEY_LEN: usize = 28; // Max seed length is 32 bytes. We append "key:"
pub const MAX_HOLDER_FIELD_VAL_LEN: usize = 200;

pub const VENDING_MACHINE_PDA_SEED: &str = "vending-machine-pda";

// TODO: Export this out of crate
pub const ADVANCED_TOKEN_METADATA_PROGRAM_ID_STR: &str =
    "2GkHVZ2y5wP4nw4uA2GWFnc7jphfjKbbcEKwqMCV42a6";

pub const PROTOCOL_FEE_LAMPORTS: u64 = 1_000_000;

pub const TREASURY_PUBKEY_STR: &str = "JCXiqb3oL3xPrs9VWbDPcotEN8mEiNNba7E5fWhz6k8R";
