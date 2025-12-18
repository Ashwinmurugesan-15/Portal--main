#!/usr/bin/env python3
"""
Script to fix the corrupted fetchAnalyticsData function in analytics.html
"""
import re

file_path = r"d:\jagadeesh\hr portal project\29-11\RecurimentPortal\templates\analytics.html"

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# The correct fetchAnalyticsData function
correct_function = """        // Function to fetch analytics data with optional year filter
        function fetchAnalyticsData() {
            console.log('Fetching analytics data');
            
            // Construct URL without year parameter
            let url = '/api/analytics';
            console.log('API URL:', url);
            
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    console.log('Analytics data received:', data);
                    console.log('Monthly statistics count:', data.monthly_statistics ? data.monthly_statistics.length : 0);
                    
                    // OVERALL APPLICATION STATUS
                    const overallAnalyticsList = document.getElementById('overallAnalyticsList');
                    if (overallAnalyticsList) {
                        overallAnalyticsList.innerHTML = `
                            <li class="list-group-item d-flex justify-content-between align-items-start">
                                <div class="ms-2 me-auto">
                                    <div class="fw-bold">Total Applicants</div>
                                </div>
                                <span class="badge bg-primary rounded-pill">${data.total_applicant}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-start">
                                <div class="ms-2 me-auto">
                                    <div class="fw-bold">Rejected</div>
                                </div>
                                <span class="badge bg-danger rounded-pill">${data.total_rejected}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-start">
                                <div class="ms-2 me-auto">
                                    <div class="fw-bold">No Response</div>
                                </div>
                                <span class="badge bg-warning text-dark rounded-pill">${data.no_response}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-start">
                                <div class="ms-2 me-auto">
                                    <div class="fw-bold">Not Interviewed</div>
                                </div>
                                <span class="badge bg-info text-dark rounded-pill">${data.not_interviewed}</span>
                            </li>
                        `;
                    }
                    
                    // HIRING FUNNEL STATUS
                    const hiringFunnelList = document.getElementById('hiringFunnelList');
                    if (hiringFunnelList) {
                        let hiringFunnelHTML = '';
                        data.hiring_funnel_by_role.forEach(role => {
                            hiringFunnelHTML += `
                                <li class="list-group-item d-flex justify-content-between align-items-start">
                                    <div class="ms-2 me-auto">
                                        <div class="fw-bold">${role.role}</div>
                                    </div>
                                    <span class="badge bg-success rounded-pill">${role.count}</span>
                                </li>
                            `;
                        });
                        hiringFunnelList.innerHTML = hiringFunnelHTML;
                    }
                    
                    // MONTHLY STATISTICS
                    const monthlyStatisticsBody = document.getElementById('monthlyStatisticsBody');
                    if (monthlyStatisticsBody) {
                        if (data.monthly_statistics && data.monthly_statistics.length > 0) {
                            monthlyStatisticsBody.innerHTML = data.monthly_statistics.map(item => `
                                <tr>
                                    <td>${item.month}</td>
                                    <td>${item.accepted}</td>
                                    <td>${item.rejected}</td>
                                    <td>${item.in_notice}</td>
                                    <td>${item.joined}</td>
                                </tr>
                            `).join('');
                        } else {
                            monthlyStatisticsBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No monthly data available</td></tr>';
                        }
                    }

                    // OFFER DETAILS
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
                    const positionStatisticsBody = document.getElementById('positionStatisticsBody');
                    
                    if (positionStatisticsBody) {
                        if (data.position_statistics && data.position_statistics.length > 0) {
                            const tableHTML = data.position_statistics.map(item => `
                                <tr>
                                    <td>${item.position || 'N/A'}</td>
                                    <td class="text-center">${item.applied || 0}</td>
                                    <td class="text-center">${item.joined || 0}</td>
                                </tr>
                            `).join('');
                            positionStatisticsBody.innerHTML = tableHTML;
                        } else {
                            positionStatisticsBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No position data available</td></tr>';
                        }
                    }
                    
                    // Reinitialize the dropdown after data is loaded to ensure it's working
                    initializeDropdown();
                })
                .catch(error => {
                    console.error('Error loading analytics data:', error);
                    // Error handling...
                });
        }"""

# Use regex to find the corrupted function and replace it
# We'll look for the start of the function and the end (which seems to be around line 466 in the corrupted file)
# Since the file is corrupted, we might need to be careful with the regex.
# Let's try to find the block from "function fetchAnalyticsData() {" to the closing brace before "// Handler for year filter change"

pattern = r"function fetchAnalyticsData\(\) \{[\s\S]*?\}\s*// Handler for year filter change"
match = re.search(pattern, content)

if match:
    # We found the block, now replace it
    # Note: The pattern includes the comment "// Handler for year filter change", so we need to include it in the replacement or append it
    replacement = correct_function + "\n        \n        // Handler for year filter change"
    new_content = content.replace(match.group(0), replacement)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("✅ Successfully fixed fetchAnalyticsData function")
else:
    print("❌ Could not find the corrupted function block")
    # Fallback: try to find just the function start and replace until a known marker
    start_marker = "function fetchAnalyticsData() {"
    end_marker = "document.addEventListener('DOMContentLoaded', function () {"
    
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)
    
    if start_idx != -1 and end_idx != -1:
        # We found the range
        # We need to preserve the end_marker
        pre_content = content[:start_idx]
        post_content = content[end_idx:]
        
        # There might be some comments between the function end and the event listener
        # But our correct_function includes the comment "// Handler for year filter change" if we add it
        
        new_content = pre_content + correct_function + "\n        \n        // Handler for year filter change\n        // Year filter functionality removed as requested\n        \n        " + post_content
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("✅ Successfully fixed fetchAnalyticsData function (fallback method)")
    else:
        print("❌ Could not find start or end markers")
