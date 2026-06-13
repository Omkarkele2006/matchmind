import matchesJson from "../data/matches.json";

import {
  validateMatchesOrThrow,
} from "../lib/dataset-validator";

try {
  const matches =
    validateMatchesOrThrow(matchesJson);

  console.log(
    `Dataset validation passed. Loaded ${matches.length} matches.`
  );
} catch (error) {
  console.error("Dataset validation failed.");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exit(1);
}