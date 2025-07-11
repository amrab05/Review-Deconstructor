// This is the "engine" of our application, V1.8 - FAIL-PROOF MAILTO LEAD CAPTURE
document.addEventListener('DOMContentLoaded', () => {

    const deconstructBtn = document.getElementById('deconstruct-btn');
    const reviewText = document.getElementById('review-text');
    const resultsSection = document.getElementById('results-section');
    const upsellSection = document.getElementById('upsell-section');
    
    const churnMeterFill = document.getElementById('churn-meter-fill');
    const churnMeterText = document.getElementById('churn-meter-text');
    const primaryIssueEl = document.getElementById('primary-issue');
    const secondaryIssuesEl = document.getElementById('secondary-issues');
    const suggestedReplyEl = document.getElementById('suggested-reply');

    // NEW SIMPLIFIED LEAD CAPTURE BUTTON
    const emailReportBtn = document.getElementById('email-report-btn');

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

    // NEW FAIL-PROOF EMAIL LOGIC
    emailReportBtn.addEventListener('click', () => {
        const recipientEmail = "mike@aiadvisorsgroup.co"; // Your email address here
        const subject = "Complaint Compass Analysis Report";

        // Gather all the data from the report
        const reportBody = `
            Complaint Compass Analysis:
            -----------------------------------
            Original Complaint:
            "${reviewText.value}"

            -----------------------------------
            Root Cause Analysis:
            - Churn Meter: ${churnMeterText.textContent}
            - Primary Issue: ${primaryIssueEl.textContent}
            - Secondary Issues: ${Array.from(secondaryIssuesEl.children).map(tag => tag.textContent).join(', ')}

            -----------------------------------
            Suggested Reply:
            "${suggestedReplyEl.textContent.replace(/"/g, '')}"
        `;

        // Create the mailto link and trigger it
        const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(reportBody)}`;
        window.location.href = mailtoLink;
    });

    function populateResults(data) {
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