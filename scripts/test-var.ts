import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

import { explainVar } from "../lib/explain-var";

const MATCH_ID = "argentina-france-2022-final";
const INCIDENT_IDS = [
  "af2022-var-1",
  "af2022-var-2",
  "af2022-var-3",
];

async function main() {
  console.log("Starting VAR Decision Explainer MVP Integration Tests...");
  console.log(`Target match: ${MATCH_ID}`);
  console.log(`Target incidents to test: ${INCIDENT_IDS.join(", ")}`);

  for (const incidentId of INCIDENT_IDS) {
    console.log(`\n========================================`);
    console.log(`TESTING INCIDENT: ${incidentId}`);
    console.log(`========================================`);

    try {
      const result = await explainVar(MATCH_ID, incidentId);

      console.log(`\n========================================`);
      console.log(`[VAR EXPLAINER] Validated Response Object`);
      console.log(`========================================`);
      console.dir(result, { depth: null });

      // Fail loudly if schema fields are missing
      if (!result.lawApplied || !result.decisionLogic || result.decisionLogic.length === 0 || !result.reviewReason || !result.confidenceLevel || !result.confidenceReason) {
        throw new Error("Validation check failed: Response object schema mismatch.");
      }

      console.log(`\n✓ SUCCESS: Incident ${incidentId} verified successfully.\n`);
    } catch (error) {
      console.error(`\n❌ ERROR: VAR analysis failed for incident: ${incidentId}`);
      console.error(error);
      process.exit(1);
    }
  }

  console.log("\nAll VAR Explainer tests completed successfully! ✓");
}

main().catch((error) => {
  console.error("Test runner failed unexpectedly:");
  console.error(error);
  process.exit(1);
});
