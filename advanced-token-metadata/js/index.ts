import { PublicKey } from "@solana/web3.js";

// We can't use fs to read dynamically from target because fs not supported in
// browser
export const ATM_PROGRAM_ID = new PublicKey(
  "2GkHVZ2y5wP4nw4uA2GWFnc7jphfjKbbcEKwqMCV42a6"
);
