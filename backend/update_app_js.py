import os

file_path = r"d:\jagadeesh\hr portal project\29-11\RecurimentPortal\static\js\app.js"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Append the new function definition
new_function = """
// Function to update Offer Details table
function updateOfferDetails(data) {
    console.log('Updating Offer Details table...', data.length);
    const tbody = document.getElementById('offerDetailsBodyIndex');
    if (!tbody) {
        console.warn('offerDetailsBodyIndex not found');
        return;
    }

    tbody.innerHTML = '';

    // Filter candidates with Offered CTC
    const offers = data.filter(item => item['Offered CTC'] && item['Offered CTC'] !== '' && item['Offered CTC'] !== 'Nil' && item['Offered CTC'] !== 'No' && item['Offered CTC'] !== '0');
    
    console.log('Found offers:', offers.length);

    if (offers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No offer details available</td></tr>';
        return;
    }

    offers.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item['Name'] || 'N/A'}</td>
            <td>${item['Offered CTC']}</td>
            <td>${item['Joining Date'] || 'N/A'}</td>
        `;
        tbody.appendChild(row);
    });
}
"""

if "function updateOfferDetails" not in content:
    content += new_function
    print("✅ Appended updateOfferDetails function")
else:
    print("ℹ️ updateOfferDetails function already exists")

# 2. Add the function call
call_target = "updateMonthlyStats(data);"
new_call = "updateMonthlyStats(data);\n        updateOfferDetails(data);"

if call_target in content and "updateOfferDetails(data)" not in content:
    content = content.replace(call_target, new_call)
    print("✅ Added updateOfferDetails call")
else:
    print("ℹ️ Function call already exists or target not found")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
