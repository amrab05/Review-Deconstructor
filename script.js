// This is the "engine" of our application. It runs in the user's browser.

// Wait until the entire HTML page is loaded before we try to find our buttons and text areas.
document.addEventListener('DOMContentLoaded', () => {

    // Get references to all the interactive elements on our page
    const deconstructBtn = document.getElementById('deconstruct-btn');
    const reviewText = document.getElementById('review-text');
    const resultsSection = document.getElementById('results-section');
    const upsellSection = document.getElementById('upsell-section');
    const primaryIssueEl = document.getElementById('primary-issue');
    const secondaryIssuesEl = document.getElementById('secondary-issues');
    const empathyPointEl = document.getElementById('empathy-point');

    // This is the main event: what happens when the user clicks the "Deconstruct Review" button.
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

            // 4. Error Handling: Check if the API call itself failed.
            if (!response.ok) {
                throw new Error('The server responded with an error.');
            }

            // 5. Success: Get the JSON data from the response.
            const data = await response.json();

            // 6. Populate the page with the results from the AI.
            primaryIssueEl.textContent = data.primary_issue;
            empathyPointEl.textContent = `"${data.empathy_point}"`;

            // Clear out any old secondary issues before adding new ones
            secondaryIssuesEl.innerHTML = '';
            data.secondary_issues.forEach(issue => {
                const tag = document.createElement('p');
                tag.className = 'tag';
                tag.textContent = issue;
                secondaryIssuesEl.appendChild(tag);
            });

            // 7. Reveal the results and upsell sections.
            resultsSection.style.display = 'block';
            upsellSection.style.display = 'block';

        } catch (error) {
            // If anything in the 'try' block fails, this 'catch' block will run.
            console.error('Error during deconstruction:', error);
            alert('Sorry, something went wrong. Please try again.');
        } finally {
            // 8. Final State: This runs whether the process succeeded or failed.
            // Re-enable the button so the user can try again.
            deconstructBtn.disabled = false;
            deconstructBtn.textContent = 'Deconstruct Review';
        }
    });
});