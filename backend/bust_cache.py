#!/usr/bin/env python3
"""
Script to update fetchAnalyticsData to use cache busting
"""
import re

file_path = r"d:\jagadeesh\hr portal project\29-11\RecurimentPortal\templates\analytics.html"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the URL definition
old_code = "let url = '/api/analytics';"
new_code = "let url = '/api/analytics?t=' + new Date().getTime(); // Cache busting"

if old_code in content:
    content = content.replace(old_code, new_code)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Added cache busting to analytics API call")
else:
    print("❌ Could not find URL definition")
