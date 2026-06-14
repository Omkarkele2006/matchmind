import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const IAM_URL = "https://iam.cloud.ibm.com/identity/token";

async function getAccessToken(apiKey: string) {
  const response = await fetch(IAM_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ibm:params:oauth:grant-type:apikey",
      apikey: apiKey,
    }),
  });

  const data = await response.json();
  return data.access_token;
}

async function main() {
  const token = await getAccessToken(
    process.env.WATSONX_API_KEY!
  );

  const response = await fetch(
    `${process.env.WATSONX_URL}/ml/v1/foundation_model_specs?version=2023-05-29`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  console.dir(data, { depth: null });
}

main();