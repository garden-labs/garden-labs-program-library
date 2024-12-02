/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/ai_aliens.json`.
 */
export type AiAliens = {
  "address": "48MKwUN9uxxGrFCzXAV4kF5RPMVUyruLyYnapNynNtd4",
  "metadata": {
    "name": "aiAliens",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "createMint",
      "discriminator": [
        69,
        44,
        215,
        132,
        253,
        214,
        41,
        45
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
          "name": "mint",
          "writable": true,
          "signer": true
        },
        {
          "name": "metadata",
          "writable": true,
          "signer": true
        },
        {
          "name": "aiAliensPda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  105,
                  45,
                  97,
                  108,
                  105,
                  101,
                  110,
                  115,
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
          "name": "nftMintedPda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  102,
                  116,
                  45,
                  109,
                  105,
                  110,
                  116,
                  101,
                  100,
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
          "name": "fieldPda",
          "writable": true
        },
        {
          "name": "metadataProgram"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
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
      "name": "createToken",
      "discriminator": [
        84,
        52,
        204,
        228,
        24,
        140,
        234,
        75
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "dest"
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "destAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "dest"
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
          "name": "aiAliensPda",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  105,
                  45,
                  97,
                  108,
                  105,
                  101,
                  110,
                  115,
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
      "args": []
    },
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
          "name": "aiAliensPda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  105,
                  45,
                  97,
                  108,
                  105,
                  101,
                  110,
                  115,
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
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "admin",
          "type": "pubkey"
        },
        {
          "name": "treasury",
          "type": "pubkey"
        },
        {
          "name": "maxSupply",
          "type": "u16"
        },
        {
          "name": "mintPriceLamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "nullifyMintAuthority",
      "discriminator": [
        175,
        132,
        29,
        102,
        177,
        8,
        196,
        139
      ],
      "accounts": [
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "nftMintedPda",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  102,
                  116,
                  45,
                  109,
                  105,
                  110,
                  116,
                  101,
                  100,
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
          "name": "aiAliensPda",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  105,
                  45,
                  97,
                  108,
                  105,
                  101,
                  110,
                  115,
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
      "name": "updateField",
      "discriminator": [
        164,
        49,
        117,
        6,
        187,
        205,
        13,
        217
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "metadata",
          "writable": true
        },
        {
          "name": "aiAliensPda",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  105,
                  45,
                  97,
                  108,
                  105,
                  101,
                  110,
                  115,
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
          "name": "metadataProgram"
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
      "name": "updateState",
      "discriminator": [
        135,
        112,
        215,
        75,
        247,
        185,
        53,
        176
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "aiAliensPda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  105,
                  45,
                  97,
                  108,
                  105,
                  101,
                  110,
                  115,
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
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "admin",
          "type": "pubkey"
        },
        {
          "name": "treasury",
          "type": "pubkey"
        },
        {
          "name": "maxSupply",
          "type": "u16"
        },
        {
          "name": "mintPriceLamports",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "aiAliensPda",
      "discriminator": [
        185,
        229,
        4,
        174,
        25,
        224,
        25,
        236
      ]
    },
    {
      "name": "nftMintedPda",
      "discriminator": [
        105,
        238,
        65,
        174,
        217,
        158,
        78,
        50
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "indexOutOfBounds",
      "msg": "Index is above max supply or below 1."
    },
    {
      "code": 6001,
      "name": "invalidPublicKey",
      "msg": "Invalid public key."
    }
  ],
  "types": [
    {
      "name": "aiAliensPda",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "maxSupply",
            "type": "u16"
          },
          {
            "name": "mintPriceLamports",
            "type": "u64"
          }
        ]
      }
    },
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
    },
    {
      "name": "nftMintedPda",
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
