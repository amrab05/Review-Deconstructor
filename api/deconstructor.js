// This is a Vercel-style serverless function, V1.3 - FINAL PROMPT ROBUSTNESS
// It will listen at the endpoint /api/deconstructor

export default async function handler(request, response) {
    // 1. We only accept POST requests
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { reviewText } = request.body;

    // 2. Basic validation
    if (!reviewText) {
        return response.status(400).json({ error: 'Review text is required.' });
    }

    // 3. Securely get the GEMINI API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('Gemini API key not configured on the server.');
        return response.status(500).json({ error: 'Server configuration error.' });
    }

    // 4. Construct the FINAL, MOST ROBUST AI Prompt
    const prompt = `You are an expert customer service analyst. Your task is to deconstruct a customer complaint and return a valid JSON object.
    Read the following review text: "${reviewText}"

    Now, perform these four actions and ensure every corresponding field is in your JSON response:
    1.  **primary_issue**: Identify the single most significant issue from this list: Delayed Response/No Update, Billing/Fee Confusion, Unclear Next Steps, Difficulty Reaching Representative, Case/Order Status Uncertainty, Document/File Confusion, Jargon/Term Confusion, Shipping/Delivery Delay, Damaged/Incorrect Item, Return/Refund Difficulty, Product Not As Described, Website/Checkout Issue, Poor Agent Experience, Discount Code Issue.
    2.  **secondary_issues**: Identify any other secondary issues present from the same list.
    3.  **churn_score**: Assign a 'churn_score' from 1 to 5 based on the customer's perceived risk of leaving, using this rubric: 1 (Low Risk), 2 (Moderate Risk), 3 (High Risk), 4 (Very High Risk), 5 (Critical/Churned).
    4.  **suggested_reply**: Write a professional, empathetic, two-sentence reply that a business owner could use. The first sentence must acknowledge the primary issue. The second sentence must suggest a positive next step or resolution.

    Your response MUST be ONLY the raw JSON object and nothing else. Do not add any extra text or markdown formatting. The JSON object must contain these exact keys: "primary_issue", "secondary_issues", "churn_score", and "suggested_reply".`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    // 5. Make the call to the Gemini API
    try {
        const geminiResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        });

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.json();
            console.error('Gemini API Error:', errorBody);
            return response.status(geminiResponse.status).json({ error: `Failed to get analysis from AI provider. Status: ${geminiResponse.status}` });
        }

        const data = await geminiResponse.json();
        
        // Robust JSON Parser
        let resultText = data.candidates[0].content.parts[0].text;
        const startIndex = resultText.indexOf('{');
        const endIndex = resultText.lastIndexOf('}');
        
        if (startIndex === -1 || endIndex === -1) {
            throw new Error("AI response did not contain valid JSON.");
        }
        
        const jsonString = resultText.substring(startIndex, endIndex + 1);
        const resultJson = JSON.parse(jsonString);

        // 6. Send the clean JSON result back to our frontend
        return response.status(200).json(resultJson);

    } catch (error) {
        console.error('Internal server error during final processing:', error.message);
        return response.status(500).json({ error: 'An unexpected error occurred during final processing.' });
    }
}