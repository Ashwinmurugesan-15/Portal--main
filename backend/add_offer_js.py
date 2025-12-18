#!/usr/bin/env python3
"""
Script to add JavaScript code to populate Offer Details table
"""

file_path = r"d:\jagadeesh\hr portal project\29-11\RecurimentPortal\templates\analytics.html"

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find where to insert the JavaScript (after POSITION STATISTICS section)
insert_marker = """                    // POSITION STATISTICS
                    const positionStatisticsBody = document.getElementById('positionStatisticsBody');"""

# The JavaScript code to populate offer details
offer_details_js = """                    // OFFER DETAILS
                    const offerDetailsBody = document.getElementById('offerDetailsBody');
                    if (offerDetailsBody && data.offer_details && data.offer_details.length > 0) {
                        offerDetailsBody.innerHTML = data.offer_details.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.offered_ctc || 'N/A'}</td>
                                <td>${item.joining_date || 'N/A'}</td>
                            </tr>
                        `).join('');
                    } else if (offerDetailsBody) {
                        offerDetailsBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No offer details available</td></tr>';
                    }
                    
                    // POSITION STATISTICS
                    const positionStatisticsBody = document.getElementById('positionStatisticsBody');"""

# Replace the marker
if insert_marker in content:
    content = content.replace(insert_marker, offer_details_js, 1)
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Successfully added JavaScript for Offer Details table")
else:
    print("❌ Could not find the insertion point for JavaScript")
