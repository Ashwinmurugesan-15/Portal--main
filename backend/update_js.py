import re

# Read the file
with open('static/js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the automation code
old_code = """                            } else if (newStatus === 'Rejected') {
                                select.classList.add('status-rejected');
                                
                                // AUTOMATION: Auto-set "Reject Mail Sent" to "Yes" when status is "Rejected"
                                const rejectMailCell = rowElement.querySelector('td[data-column="Reject Mail Sent"]');
                                if (rejectMailCell) {
                                    const rejectMailSelect = rejectMailCell.querySelector('select');
                                    if (rejectMailSelect && rejectMailSelect.value !== 'Yes') {
                                        // Update the dropdown value
                                        rejectMailSelect.value = 'Yes';
                                        
                                        // Update the backend
                                        updateRecordStatus(recordIndex, 'Reject Mail Sent', 'Yes', rowElement, rejectMailSelect.value, 'Reject Mail Sent');
                                        
                                        // Update local data
                                        row['Reject Mail Sent'] = 'Yes';
                                        
                                        // Show notification
                                        showNotification('Reject Mail Sent automatically set to Yes', 'info');
                                    }
                                }"""

new_code = """                            } else if (newStatus === 'Rejected') {
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
                                            fetch('/api/send-rejection-email', {
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
                                                showNotification('❌ Error sending rejection email', 'error');
                                            });
                                        } else {
                                            // No valid email address
                                            showNotification('⚠️ No valid email address found for ' + candidateName, 'warning');
                                            console.warn('Invalid or missing email for candidate:', row);
                                        }
                                    }
                                }"""

# Replace the code
content = content.replace(old_code, new_code)

# Write back
with open('static/js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Successfully updated app.js with email automation!")
print("✅ Email sending code added to JavaScript")
