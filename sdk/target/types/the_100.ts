/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/the_100.json`.
 */
export type The100 = {
  "address": "GPsudi35ndUQzhUuUn1Z9mCZWrJGbPLdsmMzP9LUzmbz",
  "metadata": {
    "name": "the100",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "mintNft",
      "discriminator": [
        211,
        57,
        6,
        167,
        15,
        219,
        35,
        251
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "treasury",
          "writable": true
        },
        {
          "name": "receiver"
        },
        {
          "name": "mint",
          "writable": true,
          "signer": true
        },
        {
          "name": "receiverAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "receiver"
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
          "name": "memberPda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114,
                  45,
                  112,
                  100,
                  97
                ]
              },
              {
                "kind": "arg",
                "path": "index"
              }
            ]
          }
        },
        {
          "name": "the100Pda",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  104,
                  101,
                  49,
                  48,
                  48,
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
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u16"
        }
      ]
    },
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
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "holder",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint",
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
          "name": "the100Pda",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  104,
                  101,
                  49,
                  48,
                  48,
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
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "field",
          "type": "string"
        },
        {
          "name": "val",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "memberPda",
      "discriminator": [
        187,
        10,
        22,
        63,
        200,
        42,
        43,
        145
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "indexOutOfBounds",
      "msg": "Index out of bounds"
    },
    {
      "code": 6001,
      "name": "invalidHolderField",
      "msg": "Invalid holder field"
    },
    {
      "code": 6002,
      "name": "holderFieldValTooLong",
      "msg": "Holder field value too long"
    }
  ],
  "types": [
    {
      "name": "memberPda",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          }
        ]
      }
    }
  ]
};
