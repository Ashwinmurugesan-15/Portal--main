// Email Automation JavaScript Code
// Replace the existing automation code (around line 1151 in app.js) with this:

const EMAIL_AUTOMATION_SNIPPET = `
} else if (newStatus === 'Rejected') {
    select.classList.add('status-rejected');

    // AUTOMATION: Send rejection email and update "Reject Mail Sent"
    const rejectMailCell = rowElement.querySelector('td[data-column="Reject Mail Sent"]');
    if (rejectMailCell) {
        const rejectMailSelect = rejectMailCell.querySelector('select');
        if (rejectMailSelect && rejectMailSelect.value !== 'Yes') {
            // Get candidate details
            const candidateName = row['Name'] || 'Candidate';
            const candidateEmail = row['Email ID'];
            const position = row['Interested Position'] || 'the position';

            if (candidateEmail && candidateEmail.includes('@')) {
                // Show sending notification
                showNotification('Sending rejection email...', 'info');

                // Send rejection email
                fetch(API_BASE_URL + '/api/send-rejection-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: candidateName,
                        email: candidateEmail,
                        position: position
                    })
                })
                    .then(response => response.json())
                    .then(emailData => {
                        if (emailData.status === 'success') {
                            // Update "Reject Mail Sent" to "Yes"
                            rejectMailSelect.value = 'Yes';

                            // Update the backend
                            updateRecordStatus(recordIndex, 'Reject Mail Sent', 'Yes', rowElement, '', 'Reject Mail Sent');

                            // Update local data
                            row['Reject Mail Sent'] = 'Yes';

                            // Show success notification
                            showNotification('✅ Rejection email sent to ' + candidateName, 'success');
                        } else {
                            showNotification('⚠️ Failed to send rejection email: ' + emailData.message, 'error');
                            console.error('Email sending failed:', emailData.message);
                        }
                    })
                    .catch(error => {
                        console.error('Error sending rejection email:', error);
                        showNotification('❌ Error sending rejection email. Check console for details.', 'error');
                    });
            } else {
                // No valid email address
                showNotification('⚠️ No valid email address found for ' + candidateName, 'warning');
                console.warn('Invalid or missing email for candidate:', row);
            }
        }
    }
}
`;
