// This is a Vercel-style serverless function, RE-ENGINEERED FOR GOOGLE GEMINI (Corrected).
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

    // 4. Construct the AI Prompt for Gemini
    const prompt = `You are an expert customer service analyst. Your task is to deconstruct a customer complaint. Read the following review text and perform these actions:
    1. Identify the single most significant issue from the following list: Delayed Response/No Update, Billing/Fee Confusion, Unclear Next Steps, Difficulty Reaching Representative, Case/Order Status Uncertainty, Document/File Confusion, Jargon/Term Confusion, Shipping/Delivery Delay, Damaged/Incorrect Item, Return/Refund Difficulty, Product Not As Described, Website/Checkout Issue, Poor Agent Experience, Discount Code Issue.
    2. Identify any other secondary issues present from the same list.
    3. Write a single, empathetic sentence that a business owner could use in their reply that directly acknowledges the primary issue.
    The user's review is: "${reviewText}"
    Your response MUST be in a clean JSON format and nothing else. Do not add any extra text or markdown formatting like \`\`\`json. Your entire response must be ONLY the raw JSON object, like this example:
    { "primary_issue": "Incorrect Item Received", "secondary_issues": ["Return Process Difficulty", "Delayed Response / No Update"], "empathy_point": "It is completely unacceptable that you received the wrong item and then had a frustrating experience trying to fix our mistake." }`;

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
        // The response from Gemini is inside this specific path
        const resultText = data.candidates[0].content.parts[0].text;
        const resultJson = JSON.parse(resultText);

        // 6. Send the clean JSON result back to our frontend
        return response.status(200).json(resultJson);

    } catch (error) {
        console.error('Internal server error during Gemini call:', error);
        return response.status(500).json({ error: 'An unexpected error occurred.' });
    }
}