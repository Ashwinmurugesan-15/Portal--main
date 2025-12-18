#!/usr/bin/env python3
"""
Script to add offer_details to the analytics API response
"""

file_path = r"d:\jagadeesh\hr portal project\29-11\RecurimentPortal\app.py"

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find where to insert the offer details code (before the return statement in get_analytics_data)
insert_marker = """        return jsonify({
            'total_applicant': total_applicant,"""

# The code to add offer details
offer_details_code = """        # Offer Details - candidates with offered CTC
        offer_details = []
        for item in data:
            if item.get('Offered CTC'):
                offer_details.append({
                    'name': item.get('Name', 'N/A'),
                    'offered_ctc': item.get('Offered CTC', 'N/A'),
                    'joining_date': item.get('Joining Date', 'N/A')  # Will be N/A for now
                })
        
        return jsonify({
            'total_applicant': total_applicant,"""

# Replace the marker
if insert_marker in content:
    content = content.replace(insert_marker, offer_details_code, 1)
    
    # Also need to add offer_details to the return statement
    return_marker = """            'position_statistics': sorted_position_stats
        })"""
    
    return_replacement = """            'position_statistics': sorted_position_stats,
            'offer_details': offer_details
        })"""
    
    if return_marker in content:
        content = content.replace(return_marker, return_replacement, 1)
        
        # Write back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ Successfully added offer_details to analytics API")
    else:
        print("❌ Could not find return statement")
else:
    print("❌ Could not find the insertion point")
