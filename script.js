// This is the "engine" of our application, V1.1 - UPGRADED FOR NEW FEATURES
// It runs in the user's browser.

document.addEventListener('DOMContentLoaded', () => {

    // Get references to all the interactive elements on our page
    const deconstructBtn = document.getElementById('deconstruct-btn');
    const reviewText = document.getElementById('review-text');
    const resultsSection = document.getElementById('results-section');
    const upsellSection = document.getElementById('upsell-section');
    
    // V1.1 Elements
    const churnMeterFill = document.getElementById('churn-meter-fill');
    const churnMeterText = document.getElementById('churn-meter-text');
    const primaryIssueEl = document.getElementById('primary-issue');
    const secondaryIssuesEl = document.getElementById('secondary-issues');
    const suggestedReplyEl = document.getElementById('suggested-reply');

    // This is the main event: what happens when the user clicks the button.
    deconstructBtn.addEventListener('click', async () => {

        // 1. Validation: Check if the text area is empty.
        if (reviewText.value.trim() === '') {
            alert('Please paste a review into the text box first.');
            return; // Stop the function here
        }

        // 2. Loading State: Show the user we are working.
        deconstructBtn.disabled = true;
        deconstructBtn.textContent = 'Analyzing...';
        resultsSection.style.display = 'none'; // Hide old results
        upsellSection.style.display = 'none';

        try {
            // 3. API Call: Send the review text to our secure serverless function.
            const response = await fetch('/api/deconstructor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reviewText: reviewText.value }),
            });

            if (!response.ok) {
                // If the server returns an error, we can try to get more info
                const errorData = await response.json().catch(() => null); // Catch if response is not json
                const errorMessage = errorData?.error || 'The server responded with an error.';
                throw new Error(errorMessage);
            }

            // 5. Success: Get the JSON data from the response.
            const data = await response.json();

            // 6. Populate the page with the results from the AI.
            primaryIssueEl.textContent = data.primary_issue;
            suggestedReplyEl.textContent = `"${data.suggested_reply}"`;

            // Clear out any old secondary issues
            secondaryIssuesEl.innerHTML = '';
            data.secondary_issues.forEach(issue => {
                const tag = document.createElement('p');
                tag.className = 'tag';
                tag.textContent = issue;
                secondaryIssuesEl.appendChild(tag);
            });

            // NEW: Handle the Churn Meter logic
            handleChurnMeter(data.churn_score);

            // 7. Reveal the results and upsell sections.
            resultsSection.style.display = 'block';
            upsellSection.style.display = 'block';

        } catch (error) {
            console.error('Error during deconstruction:', error);
            alert(`Sorry, something went wrong. Please try again. Error: ${error.message}`);
        } finally {
            // 8. Final State: Re-enable the button.
            deconstructBtn.disabled = false;
            deconstructBtn.textContent = 'Deconstruct Review';
        }
    });

    // NEW: Helper function to update the churn meter UI
    function handleChurnMeter(score) {
        const percentage = (score / 5) * 100;
        churnMeterFill.style.width = `${percentage}%`;

        // Reset previous color classes
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