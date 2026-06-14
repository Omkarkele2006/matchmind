import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const IAM_URL = "https://iam.cloud.ibm.com/identity/token";

async function getAccessToken(apiKey: string): Promise<string> {
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

    if (!response.ok) {
        throw new Error(
            `Failed to obtain IAM token: ${response.status} ${response.statusText}`
        );
    }

    const data = await response.json();

    return data.access_token;
}

async function main() {
    const apiKey = process.env.WATSONX_API_KEY!;
    const projectId = process.env.WATSONX_PROJECT_ID!;
    const url = process.env.WATSONX_URL!;
    const modelId = process.env.WATSONX_MODEL_ID!;
    console.log({
        apiKey: process.env.WATSONX_API_KEY,
        projectId: process.env.WATSONX_PROJECT_ID,
        url: process.env.WATSONX_URL,
        modelId: process.env.WATSONX_MODEL_ID,
    });
    if (!apiKey || !projectId || !url || !modelId) {
        throw new Error("Missing required environment variables.");
    }

    console.log("Getting IAM token...");

    const token = await getAccessToken(apiKey);

    console.log("IAM token acquired.");
    console.log("Calling Granite...");

    const response = await fetch(
        `${url}/ml/v1/text/generation?version=2023-05-29`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model_id: modelId,
                project_id: projectId,
                input: "Reply with exactly: MatchMind Granite Connected",
                parameters: {
                    decoding_method: "greedy",
                    max_new_tokens: 20,
                    min_new_tokens: 1,
                },
            }),
        }
    );

    const data = await response.json();

    console.log("\n===== GRANITE RESPONSE =====\n");
    console.dir(data, { depth: null });
}

main().catch((error) => {
    console.error("\nGranite test failed:");
    console.error(error);
    process.exit(1);
});