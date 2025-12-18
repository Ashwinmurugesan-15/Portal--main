#!/usr/bin/env python3
"""
Final script to add Offer Details table - using line insertion method
"""

file_path = r"d:\jagadeesh\hr portal project\29-11\RecurimentPortal\templates\analytics.html"

# Read all lines
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The HTML to insert (as a list of lines)
offer_details_html = [
    "\r\n",
    "        <!-- ============================================= -->\r\n",
    "        <!-- OFFER DETAILS TABLE STARTS HERE              -->\r\n",
    "        <!-- ============================================= -->\r\n",
    "        <div class=\"row justify-content-center mt-4\">\r\n",
    "            <div class=\"col-md-8\">\r\n",
    "                <div class=\"card mb-3\">\r\n",
    "                    <div class=\"card-body p-3\">\r\n",
    "                        <h5 class=\"card-title mb-3\">Offer Details</h5>\r\n",
    "                        <div class=\"table-responsive\">\r\n",
    "                            <table class=\"table table-bordered table-hover mb-0\">\r\n",
    "                                <thead>\r\n",
    "                                    <tr>\r\n",
    "                                        <th>Name</th>\r\n",
    "                                        <th>Offered CTC</th>\r\n",
    "                                        <th>Joining Date</th>\r\n",
    "                                    </tr>\r\n",
    "                                </thead>\r\n",
    "                                <tbody id=\"offerDetailsBody\">\r\n",
    "                                    <tr>\r\n",
    "                                        <td colspan=\"3\" class=\"text-center text-muted\">Loading offer details...</td>\r\n",
    "                                    </tr>\r\n",
    "                                </tbody>\r\n",
    "                            </table>\r\n",
    "                        </div>\r\n",
    "                    </div>\r\n",
    "                </div>\r\n",
    "            </div>\r\n",
    "        </div>\r\n",
    "        <!-- ============================================= -->\r\n",
    "        <!-- OFFER DETAILS TABLE ENDS HERE                -->\r\n",
    "        <!-- ============================================= -->\r\n",
]

# Insert after line 268 (which is index 268 in 0-indexed array)
# Line 269 is the closing </div>, so we insert before it
insert_position = 268  # This is after line 268, before line 269

# Insert the new lines
lines[insert_position:insert_position] = offer_details_html

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("✅ Successfully added Offer Details table to analytics.html")
print(f"   Inserted {len(offer_details_html)} lines at position {insert_position}")
