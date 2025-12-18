import os

file_path = r"d:\jagadeesh\hr portal project\29-11\RecurimentPortal\static\js\app.js"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Check if function call exists
has_call = False
for line in lines:
    if "updateOfferDetails(data)" in line:
        has_call = True
        break

if not has_call:
    new_lines = []
    for line in lines:
        new_lines.append(line)
        if "updateMonthlyStats(data);" in line:
            # Add the new call with same indentation
            indent = line[:line.find("updateMonthlyStats")]
            new_lines.append(f"{indent}updateOfferDetails(data);\n")
            print("✅ Added updateOfferDetails call")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
else:
    print("ℹ️ Function call already exists")
