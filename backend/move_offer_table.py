#!/usr/bin/env python3
"""
Script to move Offer Details table to the top and force visibility
"""
import re

file_path = r"d:\jagadeesh\hr portal project\29-11\RecurimentPortal\templates\analytics.html"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove existing Offer Details table if present
# Look for the start and end comments
pattern = r"<!-- =+ -->\s*<!-- OFFER DETAILS TABLE STARTS HERE -->[\s\S]*?<!-- OFFER DETAILS TABLE ENDS HERE -->\s*<!-- =+ -->"
content = re.sub(pattern, "", content)

# Also remove it if it doesn't have the comments (fallback)
# pattern2 = r'<div class="row justify-content-center mt-4">[\s\S]*?<h5 class="card-title mb-3">Offer Details</h5>[\s\S]*?</div>\s*</div>\s*</div>\s*</div>'
# content = re.sub(pattern2, "", content)

# 2. Prepare the new HTML block
# We'll put it in a row with the Overall Application Status if possible, or just below it.
# Overall Application Status is in a card.
# Let's insert it AFTER the Overall Application Status card.

new_table_html = """
        <!-- ============================================= -->
        <!-- OFFER DETAILS TABLE (MOVED UP)               -->
        <!-- ============================================= -->
        <div class="card mb-4" style="border: 2px solid #5b5fef;">
            <div class="card-header" style="background: linear-gradient(135deg, #5b5fef 0%, #7276f3 100%); color: white;">
                <h5 class="card-title mb-0">Offer Details</h5>
            </div>
            <div class="card-body">
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
                            <!-- Default content to show before JS loads -->
                            <tr>
                                <td colspan="3" class="text-center text-muted">Loading offer details...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <!-- ============================================= -->
"""

# 3. Insert after Overall Application Status
# Find the closing div of the Overall Application Status card
# It starts with <h5 class="card-title">Overall Application Status</h5>
# And ends with </div></div> (nested)

# Let's find the Overall Application Status block
search_str = '<h5 class="card-title">Overall Application Status</h5>'
idx = content.find(search_str)

if idx != -1:
    # Find the next "card" or "row" or specific marker to know where the current card ends
    # The next card is "Hiring Funnel Status"
    next_card_idx = content.find('<h5 class="card-title">Hiring Funnel Status</h5>')
    
    if next_card_idx != -1:
        # We want to insert BEFORE the parent div of Hiring Funnel
        # The Hiring Funnel is inside <div class="card">
        # So we search backwards from next_card_idx to find <div class="card">
        card_start = content.rfind('<div class="card"', 0, next_card_idx)
        
        if card_start != -1:
            # Insert before this card
            new_content = content[:card_start] + new_table_html + "\n" + content[card_start:]
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print("✅ Successfully moved Offer Details table to top (before Hiring Funnel)")
        else:
            print("❌ Could not find start of Hiring Funnel card")
    else:
        print("❌ Could not find Hiring Funnel Status")
else:
    print("❌ Could not find Overall Application Status")
