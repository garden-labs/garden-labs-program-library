/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/holder_metadata_plugin.json`.
 */
export type HolderMetadataPlugin = {
  "address": "3DkEmKWuBJbza9ur1BnVVhXrzkuiMCqBuKHdoDBdLpxZ",
  "metadata": {
    "name": "holderMetadataPlugin",
    "version": "0.3.0",
    "spec": "0.1.0",
    "description": "Acts as a field authority and checks token ownership before updating metadata"
  },
  "instructions": [
    {
      "name": "updateHolderField",
      "discriminator": [
        183,
        35,
        96,
        131,
        43,
        66,
        192,
        251
      ],
      "accounts": [
        {
          "name": "holder",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "metadata",
          "writable": true
        },
        {
          "name": "holderTokenAccount",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "holder"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "holderMetadataPda",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  108,
                  100,
                  101,
                  114,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97,
                  45,
                  112,
                  100,
                  97
                ]
              }
            ]
          }
        },
        {
          "name": "fieldPda"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "fieldAuthorityProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "field",
          "type": {
            "defined": {
              "name": "anchorField"
            }
          }
        },
        {
          "name": "val",
          "type": "string"
        }
      ]
    },
    {
      "name": "updateHolderFieldV2",
      "discriminator": [
        57,
        86,
        144,
        87,
        144,
        105,
        25,
        124
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "holder",
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "metadata",
          "writable": true
        },
        {
          "name": "holderTokenAccount",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "holder"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "holderMetadataPda",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  108,
                  100,
                  101,
                  114,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97,
                  45,
                  112,
                  100,
                  97
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "fieldAuthorityProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "field",
          "type": {
            "defined": {
              "name": "anchorField"
            }
          }
        },
        {
          "name": "val",
          "type": "string"
        }
      ]
    }
  ],
  "types": [
    {
      "name": "anchorField",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "name"
          },
          {
            "name": "symbol"
          },
          {
            "name": "uri"
          },
          {
            "name": "key",
            "fields": [
              "string"
            ]
          }
        ]
      }
    }
  ]
};
