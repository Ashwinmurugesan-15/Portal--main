import os

file_path = r"d:\jagadeesh\hr portal project\29-11\RecurimentPortal\templates\index.html"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target_str = '<canvas id="applicationStatusChart"></canvas>'
if target_str in content:
    # Find the closing divs after this
    # We want to insert after the closing div of col-md-6
    # Structure:
    # <div class="col-md-6 mb-4"> ... <canvas ...> ... </div> </div> </div>
    
    # Let's find the location of target_str
    idx = content.find(target_str)
    
    # Find the next 3 closing divs
    # This is risky with string search.
    
    # Better approach: Find the specific block of text
    block_end = """                        </div>
                    </div>
                </div>"""
    
    # Try to find this block
    if block_end in content:
        new_content = """                        </div>
                    </div>

                    <!-- Offer Details Table -->
                    <div class="col-md-6 mb-4">
                        <div class="card shadow-sm">
                            <div class="card-header bg-light">
                                <h5 class="mb-0">
                                    <i class="bi bi-table me-2"></i>
                                    Offer Details
                                </h5>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                                    <table class="table table-bordered table-hover mb-0">
                                        <thead class="table-light">
                                            <tr>
                                                <th>Name</th>
                                                <th>Offered CTC</th>
                                                <th>Joining Date</th>
                                            </tr>
                                        </thead>
                                        <tbody id="offerDetailsBodyIndex">
                                            <tr>
                                                <td colspan="3" class="text-center text-muted">Loading offer details...</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>"""
        
        updated_content = content.replace(block_end, new_content)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        print("✅ Successfully inserted Offer Details table into index.html")
    else:
        print("❌ Could not find the closing block to replace.")
        # Print the area around the target to debug
        start = idx
        end = min(len(content), idx + 500)
        print("Context around target:")
        print(content[start:end])

else:
    print("❌ Could not find applicationStatusChart canvas")
