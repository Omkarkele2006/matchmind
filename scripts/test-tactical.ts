import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

import { explainTactics } from "../lib/explain-tactics";

const MATCH_IDS = [
  "argentina-france-2022-final",
  "germany-brazil-2014-semi",
  "morocco-portugal-2022-quarter",
];

async function main() {
  console.log("Starting Tactical Explainer MVP Integration Tests...");
  console.log(`Target matches to test: ${MATCH_IDS.join(", ")}`);

  for (const matchId of MATCH_IDS) {
    console.log(`\n========================================`);
    console.log(`TESTING MATCH: ${matchId}`);
    console.log(`========================================`);

    try {
      const result = await explainTactics(matchId);

      console.log(`\n========================================`);
      console.log(`[TACTICAL EXPLAINER] Validated Response Object`);
      console.log(`========================================`);
      console.dir(result, { depth: null });

      // Fail loudly if schema properties are missing or malformed
      if (!result.verdict || !result.causalFactors || result.causalFactors.length !== 3 || !result.hiddenInsight) {
        throw new Error("Validation check failed: Response object schema mismatch.");
      }

      console.log(`\n✓ SUCCESS: Match ${matchId} verified successfully.\n`);
    } catch (error) {
      console.error(`\n❌ ERROR: Tactical analysis failed for match: ${matchId}`);
      console.error(error);
      process.exit(1);
    }
  }

  console.log("\nAll Tactical Explainer tests completed successfully! ✓");
}

main().catch((error) => {
  console.error("Test runner failed unexpectedly:");
  console.error(error);
  process.exit(1);
});
