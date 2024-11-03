use crate::state::HolderFieldConfig;

pub const THE100_PDA_SEED: &str = "the100-pda";
pub const MEMBER_PDA_SEED: &str = "member-pda";

pub const TREASURY_PUBKEY_STR: &str = "JCXiqb3oL3xPrs9VWbDPcotEN8mEiNNba7E5fWhz6k8R";
pub const ADMIN_PUBKEY_STR: &str = "FbaDEEWfq4twAc9QV8RcsKi4QHrHgMRi7hyUTVjYYBh5";

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

pub const PRICE_LUT: [u64; 100] = [
    2011388284,
    2012969301,
    2014769808,
    2016820276,
    2019155408,
    2021814723,
    2024843225,
    2028292170,
    2032219926,
    2036692967,
    2041786992,
    2047588212,
    2054194807,
    2061718584,
    2070286876,
    2080044689,
    2091157164,
    2103812366,
    2118224469,
    2134637380,
    2153328870,
    2174615269,
    2198856825,
    2226463796,
    2257903399,
    2293707711,
    2334482678,
    2380918367,
    2433800648,
    2494024491,
    2562609112,
    2640715226,
    2729664685,
    2830962854,
    2946324083,
    3077700726,
    3227316175,
    3397702496,
    3591743273,
    3812722419,
    4064379742,
    4350974244,
    4677356197,
    5049049230,
    5472343805,
    5954403682,
    6503387152,
    7128585109,
    7840578289,
    8651416330,
    9574821706,
    10626421958,
    11824014172,
    13187866177,
    14741059552,
    16509880251,
    18524263469,
    20818300252,
    23430814452,
    26406019776,
    29794268045,
    33652901344,
    38047222465,
    43051600083,
    48750727355,
    55241055253,
    62632424880,
    71049926404,
    80636016055,
    91552927035,
    103985415117,
    118143885420,
    134267953266,
    152630499384,
    173542288093,
    197357226621,
    224478354563,
    255364664852,
    290538871665,
    330596256744,
    376214743835,
    428166371738,
    487330360153,
    554707989432,
    631439546055,
    718823620635,
    818339085016,
    931670120434,
    1060734720279,
    1207717149865,
    1375104912527,
    1565730847668,
    1782821073205,
    2030049583788,
    2311600428808,
    2632238522465,
    2997390284297,
    3413235474892,
    3886811781011,
    4426133920089,
];

// Sanity checks

const _: () = assert!(
    PRICE_LUT.len() == MAX_SUPPLY as usize,
    "PRICE_LUT must have exactly MAX_SUPPLY elements"
);

const _: () = assert!(
    {
        let mut is_strictly_increasing = true;
        let mut i = 1;
        while i < PRICE_LUT.len() {
            if PRICE_LUT[i] <= PRICE_LUT[i - 1] {
                is_strictly_increasing = false;
                break;
            }
            i += 1;
        }
        is_strictly_increasing
    },
    "PRICE_LUT must be strictly increasing"
);

const _: () = assert!(PRICE_LUT[0] == 2011388284, "Index 0 must be 2011388284");
const _: () = assert!(PRICE_LUT[26] == 2334482678, "Index 26 must be 2334482678");
const _: () = assert!(
    PRICE_LUT[99] == 4426133920089,
    "Index 99 must be 4426133920089"
);
