// This is the "engine" of our application, V1.6 - EMAIL CAPTURE ENABLED
// It runs in the user's browser.

document.addEventListener('DOMContentLoaded', () => {

    // --- Main Deconstruction Elements ---
    const deconstructBtn = document.getElementById('deconstruct-btn');
    const reviewText = document.getElementById('review-text');
    const resultsSection = document.getElementById('results-section');
    const upsellSection = document.getElementById('upsell-section');
    
    // --- V1.1 / V1.6 Result Elements ---
    const churnMeterFill = document.getElementById('churn-meter-fill');
    const churnMeterText = document.getElementById('churn-meter-text');
    const primaryIssueEl = document.getElementById('primary-issue');
    const secondaryIssuesEl = document.getElementById('secondary-issues');
    const suggestedReplyEl = document.getElementById('suggested-reply');

    // --- V1.6 Email Capture Elements ---
    const emailInput = document.getElementById('email-input');
    const emailCaptureBtn = document.getElementById('email-capture-btn');

    // --- Main Deconstruction Logic ---
    deconstructBtn.addEventListener('click', async () => {
        if (reviewText.value.trim() === '') {
            alert('Please paste a review into the text box first.');
            return;
        }

        deconstructBtn.disabled = true;
        deconstructBtn.textContent = 'Analyzing...';
        resultsSection.style.display = 'none';
        upsellSection.style.display = 'none';

        try {
            const response = await fetch('/api/deconstructor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewText: reviewText.value }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const errorMessage = errorData?.error || 'The server responded with an error.';
                throw new Error(errorMessage);
            }

            const data = await response.json();
            populateResults(data);

            resultsSection.style.display = 'block';
            upsellSection.style.display = 'block';

        } catch (error) {
            console.error('Error during deconstruction:', error);
            alert(`Sorry, something went wrong. Please try again.`);
        } finally {
            deconstructBtn.disabled = false;
            deconstructBtn.textContent = 'Analyze Complaint';
        }
    });

    // --- NEW: Email Capture Logic ---
    emailCaptureBtn.addEventListener('click', async () => {
        const leadEmail = emailInput.value.trim();
        if (!leadEmail || !leadEmail.includes('@')) {
            alert('Please enter a valid email address.');
            return;
        }
        
        // Change button state to show work is being done
        emailCaptureBtn.disabled = true;
        emailCaptureBtn.textContent = 'Sending...';

        // Gather the data from the results to create the report
        const reportData = {
            churnMeterText: churnMeterText.textContent,
            primaryIssue: primaryIssueEl.textContent,
            secondaryIssues: Array.from(secondaryIssuesEl.children).map(tag => tag.textContent),
            suggestedReply: suggestedReplyEl.textContent.replace(/"/g, '') // Remove quotes for cleaner email
        };

        try {
            const response = await fetch('/api/send-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadEmail, reportData }),
            });

            if (!response.ok) {
                throw new Error('Failed to send the report.');
            }

            alert('Success! Your report has been sent.');
            emailCaptureBtn.textContent = 'Sent!';

        } catch (error) {
            console.error('Error sending report:', error);
            alert('Sorry, there was a problem sending your report. Please try again.');
            // Re-enable button on failure
            emailCaptureBtn.disabled = false;
            emailCaptureBtn.textContent = 'Send Report';
        }
    });

    // --- Helper Functions ---
    function populateResults(data) {
        primaryIssueEl.textContent = data.primary_issue;
        suggestedReplyEl.textContent = `"${data.suggested_reply}"`;

        secondaryIssuesEl.innerHTML = '';
        data.secondary_issues.forEach(issue => {
            const tag = document.createElement('p');
            tag.className = 'tag';
            tag.textContent = issue;
            secondaryIssuesEl.appendChild(tag);
        });

        handleChurnMeter(data.churn_score);
    }

    function handleChurnMeter(score) {
        const percentage = (score / 5) * 100;
        churnMeterFill.style.width = `${percentage}%`;

        churnMeterFill.classList.remove('churn-green', 'churn-yellow', 'churn-red');
        
        let scoreText = '';
        if (score <= 2) {
            churnMeterFill.classList.add('churn-green');
            scoreText = 'Low Risk';
        } else if (score === 3) {
            churnMeterFill.classList.add('churn-yellow');
            scoreText = 'Moderate Risk';
        } else {
            churnMeterFill.classList.add('churn-red');
            scoreText = score === 4 ? 'High Risk' : 'Critical Risk';
        }
        
        churnMeterText.textContent = `${score}/5 - ${scoreText}`;
    }
});