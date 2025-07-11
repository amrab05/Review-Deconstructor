// This is the "engine" of our application, V1.9 - "SILVER BULLET" MAILTO FIX
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

    // --- THIS IS THE NEW, MORE ROBUST CODE ---
    emailReportBtn.addEventListener('click', () => {
        const recipientEmail = "mike@aiadvisorsgroup.co";
        const subject = "Complaint Compass Analysis Report";

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

        // Create a temporary, invisible link
        const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(reportBody)}`;
        const a = document.createElement('a');
        a.href = mailtoLink;
        
        // This is the key part: telling it to open in a new tab if possible.
        a.target = '_blank';
        
        // Programmatically click the link and then remove it
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
    // --- END OF NEW CODE ---

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