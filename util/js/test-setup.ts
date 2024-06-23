import "dotenv/config";

import { execSync } from "child_process";

import { DEPLOY_ATM_SCRIPT_PATH } from "./constants";

export default function setup(): void {
  // Deploy advanced metadadata program if localnet
  // TODO: Deploy via Anchor config? Perhaps we need this method for local validator
  if (process.env.TEST_ENV === "localnet") {
    // eslint-disable-next-line no-console
    console.log("Deploying advanced token metadata program...");
    execSync(DEPLOY_ATM_SCRIPT_PATH);
  }
}
