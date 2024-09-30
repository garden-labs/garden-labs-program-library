/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/vending_machine.json`.
 */
export type VendingMachine = {
  "address": "Uvwz29jANqCpX5F2zMHo5NMZc5MdC23ss8gTUnsEJAY",
  "metadata": {
    "name": "vendingMachine",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "init",
      "discriminator": [
        220,
        59,
        207,
        236,
        108,
        250,
        47,
        100
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "vendingMachinePda",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  101,
                  110,
                  100,
                  105,
                  110,
                  103,
                  45,
                  109,
                  97,
                  99,
                  104,
                  105,
                  110,
                  101,
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
          "name": "vendingMachineData",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "data",
          "type": {
            "defined": {
              "name": "vendingMachineData"
            }
          }
        }
      ]
    },
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
          "name": "creator",
          "writable": true
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
          "name": "metadata",
          "writable": true,
          "signer": true
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
                "kind": "account",
                "path": "vendingMachineData"
              },
              {
                "kind": "arg",
                "path": "index"
              }
            ]
          }
        },
        {
          "name": "vendingMachinePda",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  101,
                  110,
                  100,
                  105,
                  110,
                  103,
                  45,
                  109,
                  97,
                  99,
                  104,
                  105,
                  110,
                  101,
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
          "name": "vendingMachineData"
        },
        {
          "name": "metadataTemplate"
        },
        {
          "name": "metadataProgram"
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
          "type": "u64"
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
    },
    {
      "name": "vendingMachineData",
      "discriminator": [
        118,
        179,
        188,
        239,
        180,
        43,
        228,
        148
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
      "name": "invalidMetadataTemplate",
      "msg": "Invalid metadata template"
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
    },
    {
      "name": "vendingMachineData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "metadataTemplate",
            "type": "pubkey"
          },
          {
            "name": "maxSupply",
            "type": "u64"
          },
          {
            "name": "mintPriceLamports",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
