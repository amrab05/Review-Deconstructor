// This is a Vercel-style serverless function, V1.1 - UPGRADED FOR CHURN METER & FULL REPLY
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

    // 4. Construct the UPGRADED AI Prompt for Gemini
    const prompt = `You are an expert customer service analyst. Your task is to deconstruct a customer complaint. Read the following review text and perform these actions:
    1. Identify the single most significant issue from the following list: Delayed Response/No Update, Billing/Fee Confusion, Unclear Next Steps, Difficulty Reaching Representative, Case/Order Status Uncertainty, Document/File Confusion, Jargon/Term Confusion, Shipping/Delivery Delay, Damaged/Incorrect Item, Return/Refund Difficulty, Product Not As Described, Website/Checkout Issue, Poor Agent Experience, Discount Code Issue.
    2. Identify any other secondary issues present from the same list.
    3. Analyze the review and assign a 'churn_score' from 1 to 5 based on the customer's perceived risk of leaving. Use this rubric: Score 1 (Low Risk): Minor complaint, not frustrated. Score 2 (Moderate Risk): Clear frustration, but seems willing to resolve. Score 3 (High Risk): Expressing anger or multiple problems, trust is damaged. Score 4 (Very High Risk): Extreme anger, feels ignored, or threatening action. Score 5 (Critical/Churned): Explicitly states they are leaving or canceling.
    4. Write a professional, empathetic, two-sentence reply that a business owner could use. The first sentence must acknowledge the primary issue. The second sentence must suggest a positive next step or resolution.

    The user's review is: "${reviewText}"

    Your response MUST be in a clean JSON format and nothing else. Do not add any extra text or markdown formatting. Your entire response must be ONLY the raw JSON object, like this example:
    {
      "primary_issue": "Incorrect Item Received",
      "secondary_issues": ["Return Process Difficulty", "Delayed Response / No Update"],
      "churn_score": 4,
      "suggested_reply": "I am so sorry to hear you received the wrong item and that our process has been frustrating. I am personally looking into this right now to ensure we get the correct product shipped to you today, along with a prepaid label to return the original."
    }`;

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
            return response.status(geminiResponse.status).json({ error: 'Failed to get analysis from AI provider.' });
        }

        const data = await geminiResponse.json();
        const resultText = data.candidates[0].content.parts[0].text;
        const resultJson = JSON.parse(resultText);

        // 6. Send the clean JSON result back to our frontend
        return response.status(200).json(resultJson);

    } catch (error) {
        console.error('Internal server error during Gemini call:', error);
        return response.status(500).json({ error: 'An unexpected error occurred.' });
    }
}