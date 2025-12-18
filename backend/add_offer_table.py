#!/usr/bin/env python3
"""
Script to add Offer Details table to analytics.html
"""

file_path = r"d:\jagadeesh\hr portal project\29-11\RecurimentPortal\templates\analytics.html"

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the position to insert the new table (after the Hiring Funnel Status card)
insert_marker = """        </div>

        <div class="card mb-3">"""

# The new Offer Details table HTML
offer_details_table = """        </div>

        <!-- Offer Details Table -->
        <div class="card mb-4">
            <div class="card-body">
                <h5 class="card-title mb-3">Offer Details</h5>
                <div class="table-responsive">
                    <table class="table table-bordered table-hover mb-0">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Offered CTC</th>
                                <th>Joining Date</th>
                            </tr>
                        </thead>
                        <tbody id="offerDetailsBody">
                            <tr>
                                <td colspan="3" class="text-center text-muted">Loading offer details...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="card mb-3">"""

# Replace the marker with the new content
if insert_marker in content:
    content = content.replace(insert_marker, offer_details_table, 1)
    
    # Write the file back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Successfully added Offer Details table to analytics.html")
else:
    print("❌ Could not find the insertion point in analytics.html")
