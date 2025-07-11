// This is the "engine" of our application, V2.0 - FAIL-PROOF FORMSPREE INTEGRATION
document.addEventListener('DOMContentLoaded', () => {

    const deconstructBtn = document.getElementById('deconstruct-btn');
    const reviewText = document.getElementById('review-text');
    const resultsSection = document.getElementById('results-section');
    const upsellSection = document.getElementById('upsell-section');
    
    const churnMeterText = document.getElementById('churn-meter-text');
    const primaryIssueEl = document.getElementById('primary-issue');
    const secondaryIssuesEl = document.getElementById('secondary-issues');
    const suggestedReplyEl = document.getElementById('suggested-reply');

    // Hidden form fields
    const hiddenComplaint = document.getElementById('hidden-complaint');
    const hiddenChurn = document.getElementById('hidden-churn');
    const hiddenPrimary = document.getElementById('hidden-primary');
    const hiddenSecondary = document.getElementById('hidden-secondary');
    const hiddenReply = document.getElementById('hidden-reply');
    
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
            // NOTE: We still have ONE serverless function for the AI analysis
            const response = await fetch('/api/deconstructor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewText: reviewText.value }),
            });

            if (!response.ok) throw new Error('Failed to get analysis.');
            
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

    function populateResults(data) {
        // Populate visible fields
        primaryIssueEl.textContent = data.primary_issue;
        suggestedReplyEl.textContent = `"${data.suggested_reply}"`;
        secondaryIssuesEl.innerHTML = '';
        (data.secondary_issues || []).forEach(issue => {
            const tag = document.createElement('p');
            tag.className = 'tag';
            tag.textContent = issue;
            secondaryIssuesEl.appendChild(tag);
        });
        handleChurnMeter(data.churn_score);

        // Populate HIDDEN fields for the Formspree submission
        hiddenComplaint.value = reviewText.value;
        hiddenChurn.value = churnMeterText.textContent;
        hiddenPrimary.value = primaryIssueEl.textContent;
        hiddenSecondary.value = Array.from(secondaryIssuesEl.children).map(tag => tag.textContent).join(', ');
        hiddenReply.value = suggestedReplyEl.textContent.replace(/"/g, '');
    }

    function handleChurnMeter(score) {
        const churnMeterFill = document.getElementById('churn-meter-fill');
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