// This is our "Mail Carrier" serverless function.
// It will listen at the endpoint /api/send-report

import { Resend } from 'resend';

// Initialize Resend with our secret API key from Vercel
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(request, response) {
    // We only accept POST requests
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { leadEmail, reportData } = request.body;
        const recipientEmail = process.env.RECIPIENT_EMAIL;

        if (!leadEmail || !reportData || !recipientEmail) {
            return response.status(400).json({ error: 'Missing required data for sending report.' });
        }

        // 1. Send the email to the LEAD (the user who wants the report)
        await resend.emails.send({
            from: 'ConvoGauge <noreply@aiadvisorsgroup.co>', // This "from" address uses your verified domain
            to: [leadEmail],
            subject: 'Your Complaint Compass Analysis Report',
            html: `<h1>Your Analysis Report</h1>
                   <p>Thank you for using Complaint Compass! Here is the report you requested:</p>
                   <hr>
                   <h3>Root Cause Analysis</h3>
                   <p><strong>Churn Meter:</strong> ${reportData.churnMeterText}</p>
                   <p><strong>Primary Issue:</strong> ${reportData.primaryIssue}</p>
                   <p><strong>Secondary Issues:</strong> ${reportData.secondaryIssues.join(', ')}</p>
                   <h3>Suggested Reply</h3>
                   <p><em>"${reportData.suggestedReply}"</em></p>
                   <hr>
                   <p>Analyzing one conversation is just the start. Imagine what you could learn from all of them.</p>
                   <p>Discover the hidden patterns costing you revenue with <strong>ConvoGauge</strong>.</p>`
        });

        // 2. Send a notification email to YOU (the business owner)
        await resend.emails.send({
            from: 'ConvoGauge Lead Alert <noreply@aiadvisorsgroup.co>',
            to: [recipientEmail],
            subject: 'New Lead from Complaint Compass!',
            html: `<h1>New Lead Captured!</h1>
                   <p>A new user has requested a report to be sent to the following email address:</p>
                   <h2>${leadEmail}</h2>
                   <p>You can follow up with them directly.</p>`
        });


        // 3. Send a success response back to the browser
        return response.status(200).json({ message: 'Report sent successfully!' });

    } catch (error) {
        console.error('Resend API Error:', error);
        return response.status(500).json({ error: 'Failed to send report.' });
    }
}