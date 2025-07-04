// This is a Vercel-style serverless function.
// It will listen at the endpoint /api/deconstructor

export default async function handler(request, response) {
    // 1. We only accept POST requests
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { reviewText } = request.body;

    // 2. Basic validation: Ensure review text exists
    if (!reviewText) {
        return response.status(400).json({ error: 'Review text is required.' });
    }

    // 3. Securely get the API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('API key not configured on the server.');
        // Don't leak implementation details to the client
        return response.status(500).json({ error: 'Server configuration error.' });
    }

    // 4. Construct the AI Prompt (as per the brief)
    const prompt = `You are an expert customer service analyst. Your task is to deconstruct a customer complaint. Read the following review text and perform these actions:
    1. Identify the single most significant issue from the following list: Delayed Response/No Update, Billing/Fee Confusion, Unclear Next Steps, Difficulty Reaching Representative, Case/Order Status Uncertainty, Document/File Confusion, Jargon/Term Confusion, Shipping/Delivery Delay, Damaged/Incorrect Item, Return/Refund Difficulty, Product Not As Described, Website/Checkout Issue, Poor Agent Experience, Discount Code Issue.
    2. Identify any other secondary issues present from the same list.
    3. Write a single, empathetic sentence that a business owner could use in their reply that directly acknowledges the primary issue.
    The user's review is: "${reviewText}"
    Your response MUST be in a clean JSON format, like this example:
    { "primary_issue": "Incorrect Item Received", "secondary_issues": ["Return Process Difficulty", "Delayed Response / No Update"], "empathy_point": "It is completely unacceptable that you received the wrong item and then had a frustrating experience trying to fix our mistake." }`;

    // 5. Make the call to the OpenAI API
    try {
        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo', // Or 'gpt-4' if you prefer
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: "json_object" }, // Enforce JSON output
            }),
        });

        if (!openAIResponse.ok) {
            // If OpenAI returns an error, log it and send a generic error to the client
            const errorBody = await openAIResponse.json();
            console.error('OpenAI API Error:', errorBody);
            return response.status(openAIResponse.status).json({ error: 'Failed to get analysis from AI provider.' });
        }

        const data = await openAIResponse.json();
        const result = JSON.parse(data.choices[0].message.content);

        // 6. Send the clean JSON result back to our frontend
        return response.status(200).json(result);

    } catch (error) {
        console.error('Internal server error:', error);
        return response.status(500).json({ error: 'An unexpected error occurred.' });
    }
}