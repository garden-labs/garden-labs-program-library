import "dotenv/config";

import { execSync } from "child_process";

import { DEPLOY_ATM_SCRIPT_PATH } from "./constants";

export default function setup(): void {
  // eslint-disable-next-line no-console
  console.log("Deploying advanced token metadata program...");
  execSync(DEPLOY_ATM_SCRIPT_PATH);
}
