$file = "templates\index.html"
$content = Get-Content $file -Raw

# Find the position to insert the modal body and footer
$searchPattern = '(\s+\u003cdiv class="modal-header"\u003e\s+\u003ch5 class="modal-title" id="addDataModalLabel"\u003e\s+\u003ci class="bi bi-person-plus-fill me-2"\u003e\u003c/i\u003e\s+Add New Candidate\s+\u003c/h5\u003e\s+\u003cbutton type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"\s+aria-label="Close"\u003e\u003c/button\u003e\s+\u003c/div\u003e)'

$replacement = '$1
                    \u003cdiv class="modal-body"\u003e
                        \u003cform id="addDataForm"\u003e
                            \u003c!-- Form fields will be dynamically populated by JavaScript --\u003e
                        \u003c/form\u003e
                    \u003c/div\u003e
                    \u003cdiv class="modal-footer"\u003e
                        \u003cbutton type="button" class="btn btn-secondary" data-bs-dismiss="modal"\u003e
                            \u003ci class="bi bi-x-circle me-2"\u003e\u003c/i\u003eCancel
                        \u003c/button\u003e
                        \u003cbutton type="button" class="btn btn-primary" id="saveDataBtn"\u003e
                            \u003ci class="bi bi-check-circle me-2"\u003e\u003c/i\u003eSave
                        \u003c/button\u003e
                    \u003c/div\u003e'

$content = $content -replace $searchPattern, $replacement

Set-Content $file $content -NoNewline

Write-Host "Fixed index.html - Added modal body and footer to Add Data Modal"
