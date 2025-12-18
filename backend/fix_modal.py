import re

# Read the file
with open('templates/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the Add Data Modal section and replace it
pattern = r'(<!-- Add Data Modal -->\s+<div class="modal fade" id="addDataModal" tabindex="-1">\s+<div class="modal-dialog modal-lg modal-dialog-scrollable">\s+<div class="modal-content">\s+<div class="modal-header">\s+<h5 class="modal-title" id="addDataModalLabel">\s+<i class="bi bi-person-plus-fill me-2"></i>\s+Add New Candidate\s+</h5>\s+<button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"\s+aria-label="Close"></button>\s+</div>\s+</div>\s+</div>\s+</div>)'

replacement = '''<!-- Add Data Modal -->
        <div class="modal fade" id="addDataModal" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="addDataModalLabel">
                            <i class="bi bi-person-plus-fill me-2"></i>
                            Add New Candidate
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"
                            aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="addDataForm">
                            <!-- Form fields will be dynamically populated by JavaScript -->
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-2"></i>Cancel
                        </button>
                        <button type="button" class="btn btn-primary" id="saveDataBtn">
                            <i class="bi bi-check-circle me-2"></i>Save
                        </button>
                    </div>
                </div>
            </div>
        </div>'''

# Replace the pattern
content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Write back
with open('templates/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully fixed the Add Data Modal!")
