import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

import { detectMisconception } from "../lib/detect-misconception";

const TEST_QUESTIONS = [
  "Portugal had more possession so they were clearly the better team.",

  "High xG means a team deserved to win.",

  "A team with more shots is always better.",
];

async function main() {
  for (const question of TEST_QUESTIONS) {
    console.log(
      "\n========================================"
    );

    console.log(
      `Question: ${question}`
    );

    console.log(
      "========================================\n"
    );

    try {
      const result =
        await detectMisconception(
          question
        );

      console.log(
        "Validated Result:\n"
      );

      console.dir(result, {
        depth: null,
      });

      console.log(
        "\nDetected Misconception:"
      );

      console.log(
        result.misconceptionType
      );

      console.log(
        "\nConfidence:"
      );

      console.log(
        result.confidence
      );

      console.log(
        "\nUser Belief:"
      );

      console.log(
        result.userBelief
      );
    } catch (error) {
      console.error(
        "\nClassification failed:"
      );

      console.error(error);
    }
  }
}

main().catch((error) => {
  console.error(error);

  process.exit(1);
});