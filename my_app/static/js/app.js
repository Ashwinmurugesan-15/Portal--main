// Global variables
let tableData = [];
let originalTableData = []; // Store original unfiltered data
let tableColumns = [];
let groupChart = null;
let distributionChart = null;
let dropdownOptions = {};
let currentIsAdmin = false; // Store admin status for filtering
let currentPage = 1;
const rowsPerPage = 50;
const API_BASE_URL = window.API_BASE_URL || '';

/**
 * Helper function to update candidate data via API
 * Automatically includes the _api_id for Guhatek API sync
 * 
 * @param {number} candidateIndex - Index of the candidate in tableData
 * @param {object} updatePayload - Object containing fields to update
 * @returns {Promise<object>} - API response
 */
async function updateCandidateData(candidateIndex, updatePayload) {
    // Get the candidate's API ID from tableData for API sync
    const candidate = tableData[candidateIndex];
    const apiId = candidate ? candidate['_api_id'] : null;

    // Include the API ID in the payload for backend API sync
    const payloadWithApiId = {
        ...updatePayload,
        '_api_id': apiId
    };

    console.log(`Updating candidate ${candidateIndex} with API ID: ${apiId}`);
    console.log('Payload:', payloadWithApiId);

    const response = await fetch(API_BASE_URL + `/api/data/${candidateIndex}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payloadWithApiId),
    });

    const result = await response.json();

    // Log API sync status for debugging
    if (result.api_synced) {
        console.log('✅ Data synced to Guhatek API');
    } else {
        console.log('⚠️ API sync pending:', result.api_message);
    }

    return result;
}

// Global function to populate the year filter
function populateYearFilter() {


    const yearFilter = document.getElementById('yearFilter');
    if (!yearFilter) {

        return;
    }


    yearFilter.innerHTML = '<option value="">All Years</option>'; // Add default option


    const years = new Set();

    originalTableData.forEach(candidate => {
        let dateStr = candidate['Date'] || candidate['Date of Application'] || candidate['Timestamp'] || candidate['Application Date'];
        if (dateStr) {
            let date;
            if (dateStr.includes(' ')) {
                dateStr = dateStr.split(' ')[0]; // Take only date part
            }
            date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                years.add(date.getFullYear().toString());
            }
        }
    });


    const sortedYears = Array.from(years).sort((a, b) => parseInt(b) - parseInt(a)); // Sort descending


    sortedYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);

    });

}

function applyYearFilter() {
    const yearFilter = document.getElementById('yearFilter');
    const selectedYear = yearFilter ? yearFilter.value : '';

    let filteredData = originalTableData; // Start with original data

    if (selectedYear) {
        filteredData = originalTableData.filter(candidate => {
            let dateStr = candidate['Date'] || candidate['Date of Application'] || candidate['Timestamp'] || candidate['Application Date'];
            if (dateStr) {
                let date;
                if (dateStr.includes(' ')) {
                    dateStr = dateStr.split(' ')[0];
                }
                date = new Date(dateStr);
                return !isNaN(date.getTime()) && date.getFullYear().toString() === selectedYear;
            }
            return false;
        });
    }
    updateMonthlyStats(filteredData);
}

function updateAdminControls(isAdmin) {
    const addCandidateBtn = document.getElementById('addCandidateBtn');
    if (addCandidateBtn) {
        addCandidateBtn.style.display = isAdmin ? 'inline-block' : 'none';
    }
}

// Desired field order for candidate management UI
const FIELD_ORDER = [
    'Date', 'Name', 'Email ID', 'Contact Number', 'LinkedIn Profile', 'Resume',
    'Interested Position', 'Current Role', 'Current Organization', 'Total Years of Experience',
    'Current Location', 'Location Preference', 'Current CTC per Annum', 'Expected CTC per Annum',
    'Notice Period', 'In Notice', 'Immediate Joiner', 'Offers in Hand', 'Offered CTC',
    'Certifications', 'Referred By',
    'Interview Status', 'Application Status', 'Remarks',
    'Initial Screening', 'Round 1 D and T', 'Round 1 Remarks', 'Round 2 D and T', 'Round 2 Remarks',
    'Offered Position', 'Joining Date', 'Reject Mail Sent'
];

// Predefined dropdown options
const PREDEFINED_DROPDOWNS = {
    'Interview Status': [
        'Applied',
        'Profile Screening Comp',
        'Voice Screening Comp',
        'Tech Inter Sched',
        'Tech Inter Comp',
        'Code Inter Sched',
        'Code Inter Comp',
        'HR Inter Sched',
        'HR Inter Comp',
        'Offer',
        'Pending Final Noti',
        'References',
        'All Completed'
    ],
    'Application Status': [
        'Proceed Further',
        'On Hold',
        'No Resp Call/Email',
        'Did Not Join',
        'Sent',
        'Recieved',
        'In Notice',
        'Accepted',
        'Rejected',
        'Joined'
    ],
    'Reject Mail Sent': ['Yes', 'No']
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    // Only fetch analytics data if on the analytics page
    if (window.location.pathname === '/analytics') {
        fetchAnalyticsData();
    }
    // Load dropdown options first
    fetchDropdownOptions().then(() => {
        populateStatusFilterOptions();
        // Then load data
        fetchData().then(() => {
            populateYearFilter(); // Populate year filter after data is fetched
        });
    });

    // Log that DOM is loaded and check for elements

    const monthlyStatsBody = document.getElementById('monthlyStatsBody');
    const monthlyStatsTotals = document.getElementById('monthlyStatsTotals');



    // Set up event listeners
    const saveBtn = document.getElementById('saveDataBtn');
    const updateBtn = document.getElementById('updateDataBtn');
    const positionFilter = document.getElementById('positionFilter');
    const statusFilter = document.getElementById('statusFilter');
    const locationFilter = document.getElementById('locationFilter');
    const experienceFilter = document.getElementById('experienceFilter');
    const noticePeriodFilter = document.getElementById('noticePeriodFilter');
    const yearFilter = document.getElementById('yearFilter');

    if (saveBtn) saveBtn.addEventListener('click', saveNewRecord);
    if (updateBtn) updateBtn.addEventListener('click', updateRecord);
    if (positionFilter) positionFilter.addEventListener('change', applyTableFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyTableFilters);
    if (locationFilter) locationFilter.addEventListener('change', applyTableFilters);
    if (experienceFilter) experienceFilter.addEventListener('change', applyTableFilters);
    if (noticePeriodFilter) noticePeriodFilter.addEventListener('change', applyTableFilters);

    if (yearFilter) {
        yearFilter.addEventListener('change', applyYearFilter);
    }

    const toggleFiltersBtn = document.getElementById('toggleFiltersBtn');
    if (toggleFiltersBtn) {
        toggleFiltersBtn.style.display = 'inline-block'; // Make the button visible
        toggleFiltersBtn.addEventListener('click', toggleFilterVisibility);
    }

    // Update sticky column positions on window resize
    let resizeTimeout;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateStickyColumnPositions();
        }, 100);
    });

    // Set up tab navigation (only for links that target tabs)
    document.querySelectorAll('.nav-link[data-bs-target]').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-bs-target');
            if (!tabId) {
                return;
            }

            // Hide all tab panes
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('show', 'active');
            });

            // Show the selected tab pane
            const targetPane = document.querySelector(tabId);
            if (targetPane) {
                targetPane.classList.add('show', 'active');
            }

            // Update active state on nav links
            document.querySelectorAll('.nav-link[data-bs-target]').forEach(navLink => {
                navLink.classList.remove('active');
            });
            this.classList.add('active');

            // Load analysis data when switching to analysis tab
            if (tabId === '#analysisTab') {
                // Summary removed: skip fetchSummary()
                // Update all analytics charts when switching to analytics tab
                if (tableData && tableData.length > 0) {

                    updateMonthlyStats(tableData);
                    updateApplicationStatusChart(tableData);
                    // updatePositionChart(tableData); // Removed

                    // Trigger view update based on current dropdown selection
                    const viewType = document.getElementById('viewType').value;
                    toggleView(viewType);
                }
            }
        });
    });

    // View Type Dropdown Listener
    const viewTypeSelect = document.getElementById('viewType');
    if (viewTypeSelect) {
        viewTypeSelect.addEventListener('change', function () {
            toggleView(this.value);
        });
    }

    function toggleFilterVisibility() {
        const filterContainer = document.getElementById('filterContainer');
        if (filterContainer) {
            // Check if it's currently hidden
            const isHidden = filterContainer.style.display === 'none' ||
                filterContainer.style.display === '' ||
                window.getComputedStyle(filterContainer).display === 'none';

            if (isHidden) {
                // Show the filter container with flex display for row layout
                filterContainer.style.display = 'flex';
            } else {
                // Remove the year filter event listener
                // Hide the filter container
                filterContainer.style.display = 'none';
            }
        }
    }

    const candidateDetailModalElement = document.getElementById('candidateDetailModal');
    if (candidateDetailModalElement) {
        candidateDetailModalElement.addEventListener('hidden.bs.modal', function () {
            document.body.focus(); // Return focus to the document body
        });
    }

    const saveOfferDetailsBtn = document.getElementById('saveOfferDetails');
    if (saveOfferDetailsBtn) {
        saveOfferDetailsBtn.addEventListener('click', async () => {
            const candidateIndex = saveOfferDetailsBtn.dataset.candidateIndex;
            if (candidateIndex === undefined) {
                showToast('Error: Candidate index not found.', 'danger');
                return;
            }

            const offeredCTC = document.getElementById('offeredCTC').value;
            const joiningDate = document.getElementById('joiningDate').value;
            const offeredPosition = document.getElementById('offeredPosition').value;

            // Client-side validation
            if (!offeredPosition) {
                showToast('Offered Position cannot be empty.', 'danger');
                return;
            }
            if (!joiningDate) {
                showToast('Joining Date cannot be empty.', 'danger');
                return;
            }
            // Validate Offered CTC as a number
            if (offeredCTC && !/^[0-9]+(\.[0-9]+)?$/.test(offeredCTC)) {
                showToast('Offered CTC must be a valid number.', 'danger');
                return;
            }

            const updatedData = {
                'Offered CTC': offeredCTC,
                'Joining Date': joiningDate,
                'Offered Position': offeredPosition,
            };


            try {
                const result = await updateCandidateData(parseInt(candidateIndex), updatedData);
                if (result.status === 'success') {
                    const syncMsg = result.api_synced ? ' (synced to API)' : '';
                    showToast('Offer Details updated successfully!' + syncMsg, 'success');
                    bootstrap.Modal.getInstance(document.getElementById('offerDetailsModal')).hide();
                    refreshData(); // Refresh table to show updated offer details
                } else {
                    showToast(`Error updating offer details: ${result.message}`, 'danger');
                }
            } catch (error) {
                console.error('Error saving Offer Details:', error);
                showToast('Error saving Offer Details.', 'danger');
            }
        });
    }
});

// Toggle View Function
function toggleView(viewType) {
    const numericElements = document.querySelectorAll('.numeric-view');
    const chartElements = document.querySelectorAll('.chart-view');

    if (viewType === 'chart') {
        numericElements.forEach(el => el.style.display = 'none');
        chartElements.forEach(el => el.style.display = 'block');

        // Re-render charts if data is available
        if (tableData && tableData.length > 0) {
            // Ensure charts are rendered properly (resize/update)

            updateMonthlyStats(tableData);
            updateApplicationStatusChart(tableData);
        }
    } else {
        numericElements.forEach(el => {
            if (el.tagName === 'TABLE') {
                el.style.display = 'table';
            } else {
                el.style.display = 'block';
            }
        });
        chartElements.forEach(el => el.style.display = 'none');
    }
}

// Helper to calculate totals (extracted from updateMonthlyStats logic)
function calculateTotals(data) {
    const totals = {
        applicants: data.length,
        accepted: 0,
        rejected: 0,
        inNotice: 0,
        joined: 0
    };

    data.forEach(candidate => {
        switch (candidate['Application Status']) {
            case 'Accepted': totals.accepted++; break;
            case 'Rejected': totals.rejected++; break;
            case 'In Notice': totals.inNotice++; break;
            case 'Joined': totals.joined++; break;
        }
        if (candidate['Reference Feedback']) {
            // We're not tracking feedbackGiven in totals anymore since it's not displayed
        }
    });
    return totals;
}

// Update distribution chart for numeric fields
function updateDistributionChart() {
    const numericColumns = ['Current CTC per Annum', 'Expected CTC per Annum', 'Offered CTC'];
    let selectedColumn = null;

    for (const column of numericColumns) {
        if (tableColumns.includes(column)) {
            selectedColumn = column;
            break;
        }
    }

    if (!selectedColumn || tableData.length === 0) {
        document.getElementById('distributionChartContainer').innerHTML =
            '<div class="alert alert-info">No numeric data available for distribution analysis</div>';
        return;
    }

    const values = tableData
        .map(item => parseFloat(item[selectedColumn]))
        .filter(value => !isNaN(value));

    if (values.length === 0) {
        document.getElementById('distributionChartContainer').innerHTML =
            '<div class="alert alert-info">No valid numeric data available for distribution analysis</div>';
        return;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = Math.min(10, values.length);
    const binSize = (max - min) / binCount;

    const bins = Array(binCount).fill(0);
    values.forEach(value => {
        const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
        bins[binIndex]++;
    });

    const binLabels = Array(binCount).fill(0).map((_, i) => {
        const start = min + i * binSize;
        const end = min + (i + 1) * binSize;
        return `${start.toFixed(1)}-${end.toFixed(1)}`;
    });

    const distCanvas = document.getElementById('distributionChart');
    if (!distCanvas) {
        const container = document.getElementById('distributionChartContainer');
        if (container) {
            container.innerHTML = '<div class="alert alert-warning">Distribution chart is unavailable.</div>';
        }
        return;
    }
    const ctx = distCanvas.getContext('2d');

    if (distributionChart) {
        distributionChart.destroy();
    }

    distributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: binLabels,
            datasets: [{
                label: `Distribution of ${selectedColumn}`,
                data: bins,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Distribution of ${selectedColumn}`
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Frequency'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: selectedColumn
                    }
                }
            }
        }
    });
}

// Global variables to track the current candidate being edited in Round 1 Remarks modal
let currentRound1CandidateIndex = null;
let currentRound1RemarksData = null;

function showRound1RemarksModal(candidate, index) {

    const modal = new bootstrap.Modal(document.getElementById('round1RemarksModal'));
    let remarks = {};
    try {
        remarks = JSON.parse(candidate['Round 1 Remarks'] || '{}');
    } catch (e) {
        console.error("Error parsing Round 1 Remarks JSON:", e);
        // Fallback to empty object if parsing fails
    }

    const r1Communication = document.getElementById('r1Communication');
    const r1TechnicalAssessment = document.getElementById('r1TechnicalAssessment');
    const r1ProblemSolving = document.getElementById('r1ProblemSolving');
    const r1OverallPotential = document.getElementById('r1OverallPotential');
    const r1Recommendation = document.getElementById('r1Recommendation');
    const saveRound1RemarksBtn = document.getElementById('saveRound1Remarks');

    r1Communication.value = remarks['Communication'] || '';
    r1TechnicalAssessment.value = remarks['Technical Assessment'] || '';
    r1ProblemSolving.value = remarks['Problem-Solving'] || '';
    r1OverallPotential.value = remarks['Overall Potential'] || '';
    r1Recommendation.value = remarks['Recommendation'] || '';

    r1Communication.disabled = false;
    r1TechnicalAssessment.disabled = false;
    r1ProblemSolving.disabled = false;
    r1OverallPotential.disabled = false;
    r1Recommendation.disabled = false;
    saveRound1RemarksBtn.style.display = 'block'; // Always show button and enable fields

    // Store the index of the candidate being edited
    saveRound1RemarksBtn.dataset.candidateIndex = index;

    modal.show();
}

function showRound2RemarksModal(candidate, index) {
    const modal = new bootstrap.Modal(document.getElementById('round2RemarksModal'));
    let remarks = {};
    try {
        remarks = JSON.parse(candidate['Round 2 Remarks'] || '{}');
    } catch (e) {
        console.error("Error parsing Round 2 Remarks JSON:", e);
        // Fallback to empty object if parsing fails
    }

    const r2Communication = document.getElementById('r2Communication');
    const r2TechnicalAssessment = document.getElementById('r2TechnicalAssessment');
    const r2ProblemSolving = document.getElementById('r2ProblemSolving');
    const r2OverallPotential = document.getElementById('r2OverallPotential');
    const r2Recommendation = document.getElementById('r2Recommendation');
    const r2CTC = document.getElementById('r2CTC');
    const saveRound2RemarksBtn = document.getElementById('saveRound2Remarks');

    r2Communication.value = remarks['Communication'] || '';
    r2TechnicalAssessment.value = remarks['Technical Assessment'] || '';
    r2ProblemSolving.value = remarks['Problem-Solving'] || '';
    r2OverallPotential.value = remarks['Overall Potential'] || '';
    r2Recommendation.value = remarks['Recommendation'] || '';
    r2CTC.value = remarks['CTC'] || '';

    if (currentIsAdmin) {
        r2Communication.disabled = false;
        r2TechnicalAssessment.disabled = false;
        r2ProblemSolving.disabled = false;
        r2OverallPotential.disabled = false;
        r2Recommendation.disabled = false;
        r2CTC.disabled = false;
        saveRound2RemarksBtn.style.display = 'block'; // Show button for admin
    } else {
        r2Communication.disabled = true;
        r2TechnicalAssessment.disabled = true;
        r2ProblemSolving.disabled = true;
        r2OverallPotential.disabled = true;
        r2Recommendation.disabled = true;
        r2CTC.disabled = true;
        saveRound2RemarksBtn.style.display = 'none'; // Hide button for non-admin
    }

    // Store the index of the candidate being edited
    saveRound2RemarksBtn.dataset.candidateIndex = index;
    modal.show();
}

function showOfferDetailsModal(candidate, index) {
    const modal = new bootstrap.Modal(document.getElementById('offerDetailsModal'));

    document.getElementById('offerCandidateName').value = candidate['Name'] || '';
    document.getElementById('offerInterestedPosition').value = candidate['Interested Position'] || '';
    document.getElementById('offeredPosition').value = candidate['Offered Position'] || '';
    document.getElementById('joiningDate').value = candidate['Joining Date'] || '';

    const saveOfferDetailsBtn = document.getElementById('saveOfferDetails');
    if (saveOfferDetailsBtn) {
        saveOfferDetailsBtn.dataset.candidateIndex = index;
    }
    modal.show();
}

// Event listener for saving Round 1 Remarks
document.addEventListener('DOMContentLoaded', function () {
    const saveRound1RemarksBtn = document.getElementById('saveRound1Remarks');
    if (saveRound1RemarksBtn) {
        saveRound1RemarksBtn.addEventListener('click', async () => {
            const candidateIndex = saveRound1RemarksBtn.dataset.candidateIndex;
            if (candidateIndex === undefined) {
                showToast('Error: Candidate index not found.', 'danger');
                return;
            }

            const updatedRemarks = {
                'Communication': document.getElementById('r1Communication').value,
                'Technical Assessment': document.getElementById('r1TechnicalAssessment').value,
                'Problem-Solving': document.getElementById('r1ProblemSolving').value,
                'Overall Potential': document.getElementById('r1OverallPotential').value,
                'Recommendation': document.getElementById('r1Recommendation').value,
            };


            // Update the main tableData array
            tableData[candidateIndex]['Round 1 Remarks'] = JSON.stringify(updatedRemarks); // Store as JSON string

            try {
                const result = await updateCandidateData(parseInt(candidateIndex), { 'Round 1 Remarks': JSON.stringify(updatedRemarks) });
                if (result.status === 'success') {
                    const syncMsg = result.api_synced ? ' (synced to API)' : '';
                    showToast('Round 1 Remarks updated successfully!' + syncMsg, 'success');
                    bootstrap.Modal.getInstance(document.getElementById('round1RemarksModal')).hide();
                    refreshData(); // Refresh table to show updated remarks
                } else {
                    showToast(`Error updating remarks: ${result.message}`, 'danger');
                }
            } catch (error) {
                console.error('Error saving Round 1 Remarks:', error);
                showToast('Error saving Round 1 Remarks.', 'danger');
            }
        });
    }

    const saveRound2RemarksBtn = document.getElementById('saveRound2Remarks');
    if (saveRound2RemarksBtn) {
        saveRound2RemarksBtn.addEventListener('click', async () => {
            const candidateIndex = saveRound2RemarksBtn.dataset.candidateIndex;
            if (candidateIndex === undefined) {
                showToast('Error: Candidate index not found.', 'danger');
                return;
            }

            const updatedRemarks = {
                'Communication': document.getElementById('r2Communication').value,
                'Technical Assessment': document.getElementById('r2TechnicalAssessment').value,
                'Problem-Solving': document.getElementById('r2ProblemSolving').value,
                'Overall Potential': document.getElementById('r2OverallPotential').value,
                'Recommendation': document.getElementById('r2Recommendation').value,
                'CTC': document.getElementById('r2CTC').value,
            };


            // Update the main tableData array
            tableData[candidateIndex]['Round 2 Remarks'] = JSON.stringify(updatedRemarks); // Store as JSON string

            try {
                const result = await updateCandidateData(parseInt(candidateIndex), { 'Round 2 Remarks': JSON.stringify(updatedRemarks) });
                if (result.status === 'success') {
                    const syncMsg = result.api_synced ? ' (synced to API)' : '';
                    showToast('Round 2 Remarks updated successfully!' + syncMsg, 'success');
                    bootstrap.Modal.getInstance(document.getElementById('round2RemarksModal')).hide();
                    refreshData(); // Refresh table to show updated remarks
                } else {
                    showToast(`Error updating remarks: ${result.message}`, 'danger');
                }
            } catch (error) {
                console.error('Error saving Round 2 Remarks:', error);
                showToast('Error saving Round 2 Remarks.', 'danger');
            }
        });
    }
});

// Function to get the original index of a record
function getRecordIndex(record) {
    return record._originalIndex;
}

// Function to show candidate details (vertical layout only)
function showCandidateDetails(candidate) {
    const modalContent = document.getElementById('candidateDetailContent');
    modalContent.innerHTML = '';

    // Render grouped stage remarks as cards at the top
    const remarksSection = document.createElement('div');
    remarksSection.className = 'mb-4';
    const remarksHeader = document.createElement('div');
    remarksHeader.className = 'fw-bold mb-2';
    remarksHeader.textContent = 'Remarks';
    remarksSection.appendChild(remarksHeader);

    const row = document.createElement('div');
    row.className = 'row g-3';

    const stages = [
        { key: 'Initial Screening', title: 'Initial Screening', color: 'primary' },
        { key: 'Round 1 Remarks', title: 'Round 1', color: 'success' },
        { key: 'Round 2 Remarks', title: 'Round 2', color: 'warning' }
    ];

    stages.forEach(stage => {
        const col = document.createElement('div');
        col.className = 'col-md-4';

        const card = document.createElement('div');
        card.className = `p-3 rounded border bg-${stage.color} bg-opacity-10`;

        const title = document.createElement('div');
        title.className = `fw-semibold mb-2 text-${stage.color}`;
        title.textContent = stage.title;

        const content = document.createElement('div');
        content.className = 'candidate-detail-value';
        let remarksData = candidate[stage.key] || '';

        if (stage.key === 'Round 1 Remarks' || stage.key === 'Round 2 Remarks') {
            try {
                const parsedRemarks = JSON.parse(remarksData);
                let remarksHtml = '';
                for (const field in parsedRemarks) {
                    remarksHtml += `<p><strong>${field}:</strong> ${parsedRemarks[field]}</p>`;
                }
                content.innerHTML = remarksHtml;
            } catch (e) {
                content.textContent = remarksData; // Fallback if not valid JSON
            }
        } else {
            content.textContent = remarksData;
        }

        card.appendChild(title);
        card.appendChild(content);
        col.appendChild(card);
        row.appendChild(col);
    });

    remarksSection.appendChild(row);
    modalContent.appendChild(remarksSection);

    // Use FIELD_ORDER to display fields in the specified order (skip remarks fields already shown)
    FIELD_ORDER.forEach(field => {
        if (field === 'Initial Screening' || field === 'Round 1 Remarks' || field === 'Round 2 Remarks' || field === 'Remarks') {
            return; // skip
        }
        if (candidate.hasOwnProperty(field) && candidate[field] !== null && candidate[field] !== '') {
            const detailItem = document.createElement('div');
            detailItem.className = 'mb-3';

            const label = document.createElement('div');
            label.className = 'text-muted small fw-semibold mb-1';
            label.textContent = field === 'Date' ? 'Date:' : field + ':';

            const value = document.createElement('div');
            value.className = 'candidate-detail-value';

            // Special handling for specific fields
            if (field === 'Resume' && candidate[field]) {
                const resumeValue = candidate[field].toString().trim();
                const linkHref = resumeValue.startsWith('http') ? resumeValue : `/uploads/${resumeValue}`;
                value.innerHTML = `<a href="${linkHref}" target="_blank" class="btn btn-outline-primary btn-sm">
                    <i class="bi bi-file-earmark-pdf me-1"></i>View Resume
                </a>`;
            } else if (field === 'LinkedIn Profile' && candidate[field]) {
                value.innerHTML = `<a href="${candidate[field]}" target="_blank" class="btn btn-outline-primary btn-sm">
                    <i class="bi bi-linkedin me-1"></i>View LinkedIn
                </a>`;
            } else if (field === 'Interview Status' || field === 'Application Status') {
                const badgeClass = getStatusBadgeClass(candidate[field]);
                value.innerHTML = `<span class="badge ${badgeClass}">${candidate[field]}</span>`;
            } else if (field === 'Timestamp' && candidate[field]) {
                // Format timestamp to show only date
                const date = new Date(candidate[field]);
                value.textContent = date.toLocaleDateString();
            } else {
                value.textContent = field === 'Date' && candidate[field] ? new Date(candidate[field]).toLocaleDateString() : candidate[field];
            }

            detailItem.appendChild(label);
            detailItem.appendChild(value);
            modalContent.appendChild(detailItem);
        }
    });

    // Display any remaining fields not in FIELD_ORDER
    const remainingFields = Object.keys(candidate).filter(field => !FIELD_ORDER.includes(field));
    remainingFields.forEach(field => {
        if (candidate.hasOwnProperty(field) && candidate[field] !== null && candidate[field] !== '') {
            const detailItem = document.createElement('div');
            detailItem.className = 'mb-3';

            const label = document.createElement('div');
            label.className = 'text-muted small fw-semibold mb-1';
            label.textContent = field === 'Timestamp' ? 'Date:' : field + ':';

            const value = document.createElement('div');
            value.className = 'candidate-detail-value';
            // Ensure Date shows only date in remaining fields as well
            if (field === 'Timestamp' && candidate[field]) {
                const date = new Date(candidate[field]);
                value.textContent = date.toLocaleDateString();
            } else {
                value.textContent = candidate[field];
            }

            detailItem.appendChild(label);
            detailItem.appendChild(value);
            modalContent.appendChild(detailItem);
        }
    });

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('candidateDetailModal'));
    modal.show();
}

// Function to get status badge class
function getStatusBadgeClass(status) {
    switch (status) {
        case 'Active': return 'bg-success';
        case 'Inactive': return 'bg-secondary';
        case 'Pending': return 'bg-warning';
        case 'Rejected': return 'bg-danger';
        case 'Selected': return 'bg-info';
        default: return 'bg-primary';
    }
}

// Function to get status class for Application Status cell coloring
function getStatusClass(status) {
    switch (status) {
        case 'Accepted': return 'status-accepted';
        case 'Rejected': return 'status-rejected';
        case 'On Hold': return 'status-onhold';
        case 'Proceed Further': return 'status-proceed';
        case 'Joined': return 'status-joined';
        default: return '';
    }
}

// Function to fetch dropdown options from the server
async function fetchDropdownOptions() {
    try {
        const response = await fetch(API_BASE_URL + '/api/dropdown-options');
        if (!response.ok) {
            throw new Error('Failed to fetch dropdown options');
        }
        const serverOptions = await response.json();

        // Merge server options with predefined options
        dropdownOptions = { ...serverOptions, ...PREDEFINED_DROPDOWNS };
        return dropdownOptions;

    } catch (error) {
        console.error('Error fetching dropdown options:', error);
        // Use predefined options if server fetch fails
        dropdownOptions = { ...PREDEFINED_DROPDOWNS };
        return dropdownOptions;
    }
}

// Populate application status filter options
function populateStatusFilterOptions() {
    const statusFilter = document.getElementById('statusFilter');
    if (!statusFilter) {
        return;
    }

    const previousValue = statusFilter.value;
    const statusOptions = dropdownOptions['Application Status'] || PREDEFINED_DROPDOWNS['Application Status'] || [];

    // Clear the dropdown and add a default "All Application Statuses" option
    statusFilter.innerHTML = '<option value=\"\">All Application Statuses</option>';

    // Add an empty option that appears as a blank selection
    const emptyOption = document.createElement('option');
    emptyOption.value = 'EMPTY';  // Distinct value for empty option
    emptyOption.textContent = '(Empty)';  // Label for the empty option
    statusFilter.appendChild(emptyOption);

    statusOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        statusFilter.appendChild(optionElement);
    });

    if (previousValue && statusOptions.includes(previousValue)) {
        statusFilter.value = previousValue;
    }
}

// Fetch data from the API
function fetchData() {

    // Add cache-busting parameter to prevent browser caching
    const cacheBuster = `?_t=${new Date().getTime()}`;
    fetch(API_BASE_URL + '/api/data' + cacheBuster)
        .then(response => {

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(responseData => {
            const { data, is_admin } = responseData;


            // Store original data when fetched from API
            originalTableData = JSON.parse(JSON.stringify(data)); // Deep copy

            currentIsAdmin = is_admin;
            updateAdminControls(is_admin);
            // Apply current filter if any
            const positionFilterElement = document.getElementById('positionFilter');
            const statusFilterElement = document.getElementById('statusFilter');
            const hasPositionFilter = positionFilterElement && positionFilterElement.value;
            const hasStatusFilter = statusFilterElement && statusFilterElement.value;
            if (hasPositionFilter || hasStatusFilter) {
                applyTableFilters();
            } else {
                populateTable(data, is_admin);
            }

            // Check for highlight candidate from Resume Filter
            const highlightInfo = sessionStorage.getItem('highlightCandidate');
            if (highlightInfo) {
                try {
                    const { index, name } = JSON.parse(highlightInfo);
                    // Clear the highlight info so it doesn't open again on refresh
                    sessionStorage.removeItem('highlightCandidate');

                    // Find candidate in originalTableData
                    let candidate = originalTableData[index];

                    // Verify candidate name matches (as index might change if data was deleted)
                    if (!candidate || candidate['Name'] !== name) {
                        candidate = originalTableData.find(c => c['Name'] === name);
                    }

                    if (candidate) {
                        // Small delay to ensure table is populated and modal can open correctly
                        setTimeout(() => {
                            showCandidateDetails(candidate);
                        }, 500);
                    }
                } catch (e) {
                    console.error('Error handling highlightCandidate:', e);
                }
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            showNotification('Failed to load data. Please try again later.', 'error');
        });
}

// Helper function to get the correct record index for API calls
function getRecordIndex(row) {
    // If row has _originalIndex (from filtering), use it
    if (row._originalIndex !== undefined) {
        return row._originalIndex;
    }
    // Otherwise, find the record in originalTableData
    const index = originalTableData.findIndex(originalRow => {
        // Use Email ID as unique identifier if available
        if (row['Email ID'] && originalRow['Email ID']) {
            return originalRow['Email ID'] === row['Email ID'];
        }
        // Fallback: compare all fields (excluding _originalIndex)
        const rowCopy = { ...row };
        delete rowCopy._originalIndex;
        return JSON.stringify(originalRow) === JSON.stringify(rowCopy);
    });
    // If found, return index; otherwise return -1
    return index !== -1 ? index : tableData.findIndex(r => r === row);
}

// Function to filter table by Interested Position
function filterTableByPosition() {
    applyTableFilters();
}

function applyTableFilters() {
    const positionFilter = document.getElementById('positionFilter');
    const statusFilter = document.getElementById('statusFilter');
    const locationFilter = document.getElementById('locationFilter');
    const experienceFilter = document.getElementById('experienceFilter');
    const noticePeriodFilter = document.getElementById('noticePeriodFilter');

    const selectedPosition = positionFilter ? positionFilter.value : '';
    const selectedStatus = statusFilter ? statusFilter.value : '';
    const selectedLocation = locationFilter ? locationFilter.value : '';
    const selectedExperience = experienceFilter ? experienceFilter.value : '';
    const selectedNoticePeriod = noticePeriodFilter ? noticePeriodFilter.value : '';

    const hasPositionFilter = selectedPosition !== '';
    const hasStatusFilter = selectedStatus !== '';
    const hasLocationFilter = selectedLocation !== '';
    const hasExperienceFilter = selectedExperience !== '';
    const hasNoticePeriodFilter = selectedNoticePeriod !== '';

    if (!hasPositionFilter && !hasStatusFilter && !hasLocationFilter && !hasExperienceFilter && !hasNoticePeriodFilter) {
        currentPage = 1; // Reset to first page when filter is cleared
        populateTable(originalTableData, currentIsAdmin);
        return;
    }

    const filteredData = originalTableData
        .map((row, originalIndex) => ({
            ...row,
            _originalIndex: originalIndex
        }))
        .filter(row => {
            const interestedPosition = row['Interested Position'] || '';
            const applicationStatus = row['Application Status'] || '';
            const candidateLocation = row['Location Preference'] || '';
            const totalYearsExperience = parseFloat(row['Total Years of Experience']) || 0;
            const candidateNoticePeriod = row['Notice Period'] || '';

            const matchesPosition = !hasPositionFilter || (interestedPosition.trim().toLowerCase() === selectedPosition.trim().toLowerCase());

            let matchesStatus = true;
            if (hasStatusFilter) {
                if (selectedStatus === 'EMPTY') {
                    matchesStatus = !applicationStatus || applicationStatus === '';
                } else {
                    matchesStatus = applicationStatus === selectedStatus;
                }
            }

            const matchesLocation = !hasLocationFilter || candidateLocation === selectedLocation;

            let matchesExperience = true;
            if (hasExperienceFilter) {
                if (selectedExperience === '10+') {
                    matchesExperience = totalYearsExperience >= 10;
                } else if (selectedExperience !== '') {
                    const [minExp, maxExp] = selectedExperience.split('-').map(Number);
                    matchesExperience = totalYearsExperience >= minExp && totalYearsExperience <= maxExp;
                }
            }

            const matchesNoticePeriod = !hasNoticePeriodFilter || (candidateNoticePeriod.replace(/ days?$/, '') === selectedNoticePeriod.replace(/days?$/, ''));

            return matchesPosition && matchesStatus && matchesLocation && matchesExperience && matchesNoticePeriod;
        });

    currentPage = 1; // Reset to first page when filter is applied
    populateTable(filteredData, currentIsAdmin);
}

// Function to update sticky column positions based on actual column widths
function updateStickyColumnPositions() {
    const table = document.getElementById('dataTable');
    if (!table) {

        return;
    }

    const headerRow = table.querySelector('thead tr');
    if (!headerRow) {

        return;
    }

    const stickyColumns = ['Date', 'Name', 'Email ID'];
    let cumulativeLeft = 0;

    stickyColumns.forEach((columnName, index) => {
        // Find the column index
        const headers = Array.from(headerRow.querySelectorAll('th'));
        const columnIndex = headers.findIndex(th => th.textContent.trim() === columnName);

        if (columnIndex !== -1) {
            const headerCell = headers[columnIndex];
            // Use getBoundingClientRect for more accurate width
            const actualWidth = headerCell.getBoundingClientRect().width || headerCell.offsetWidth;

            if (actualWidth > 0) {
                // Update header
                headerCell.style.left = `${cumulativeLeft}px`;

                // Update all body cells in this column
                const bodyRows = table.querySelectorAll('tbody tr');
                bodyRows.forEach(row => {
                    const cell = row.querySelector(`td:nth-child(${columnIndex + 1})`);
                    if (cell && cell.classList.contains('sticky-column')) {
                        cell.style.left = `${cumulativeLeft}px`;
                    }
                });

                cumulativeLeft += actualWidth;
            }
        }
    });
}

// Function to populate the data table
function populateTable(data, isAdmin) {
    if (currentPage === undefined) currentPage = 1;
    tableData = data;
    currentIsAdmin = isAdmin; // Store admin status

    const tableBody = document.getElementById('dataTableBody');
    const tableHead = document.getElementById('dataTableHead');

    // Also update analytics when table data is populated
    if (data && data.length > 0) {
        updateMonthlyStats(data);
        updateOfferDetails(data);
    }

    if (!tableBody || !tableHead) {
        console.error('Table elements not found in the DOM');
        return;
    }

    tableBody.innerHTML = '';
    tableHead.innerHTML = '';

    let columnsToShow = isAdmin ? FIELD_ORDER : ['Date', 'Name', 'Email ID', 'Interested Position', 'Current Role', 'Current Organization', 'Current Location', 'Total Years of Experience', 'Resume', 'Interview Status', 'Application Status', 'Remarks', 'Initial Screening', 'Round 1 D and T', 'Round 1 Remarks', 'Round 2 D and T', 'Round 2 Remarks'];

    if (data && data.length > 0) {
        // Filter out internal fields that should not be displayed
        const availableColumns = Object.keys(data[0]).filter(column =>
            column !== '_originalIndex' && column !== '_api_id'
        );
        const ordered = columnsToShow.filter(c => availableColumns.includes(c));
        const remaining = availableColumns.filter(c => !ordered.includes(c));

        tableColumns = isAdmin ? [...ordered, ...remaining] : columnsToShow;

        // Create table header
        const headerRow = document.createElement('tr');
        tableColumns.forEach((column, colIndex) => {
            const th = document.createElement('th');
            // Rename Round 1/2 Remarks to Feedback for display
            if (column === 'Round 1 Remarks') {
                th.textContent = 'Round 1 Feedback';
            } else if (column === 'Round 2 Remarks') {
                th.textContent = 'Round 2 Feedback';
            } else if (column === 'Round 1 D and T') {
                th.textContent = 'Round 1 D&T';
            } else if (column === 'Round 2 D and T') {
                th.textContent = 'Round 2 D&T';
            } else {
                th.textContent = column;
            }
            if (column === 'Final Remarks') {
                th.style.minWidth = '150px';
            }
            if (column === 'Offered Position') {
                th.style.minWidth = '150px';
            }
            if (column === 'Joining Date') {
                th.style.minWidth = '150px';
            }
            // Add sticky-column class to first three columns (Date, Name, Email ID)
            if (column === 'Date' || column === 'Name' || column === 'Email ID') {
                th.classList.add('sticky-column');
            }
            if (column === 'Interview Status') {
                th.style.minWidth = '200px';
            }
            if (column === 'Round 1 D and T' || column === 'Round 2 D and T') {
                th.style.minWidth = '200px';
            }
            if (column === 'Reject Mail Sent') {
                th.style.minWidth = '150px';
            }
            headerRow.appendChild(th);
        });

        // Add action column header (for both admin and non-admin users)
        const actionTh = document.createElement('th');
        actionTh.textContent = 'Actions';
        actionTh.style.minWidth = '120px';
        headerRow.appendChild(actionTh);

        tableHead.appendChild(headerRow);

        // Pagination Logic
        const totalRows = data.length;
        const totalPages = Math.ceil(totalRows / rowsPerPage);

        // Ensure currentPage is within bounds
        if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
        const pagedData = data.slice(startIndex, endIndex);

        // Update pagination info
        const paginationInfo = document.getElementById('paginationInfo');
        if (paginationInfo) {
            paginationInfo.textContent = totalRows > 0
                ? `Showing ${startIndex + 1} to ${endIndex} of ${totalRows} entries`
                : 'Showing 0 to 0 of 0 entries';
        }

        renderPagination(totalPages);

        // Create table rows for paged data
        pagedData.forEach((row, pagedIndex) => {
            const actualIndex = startIndex + pagedIndex;
            const tr = document.createElement('tr');
            tr.dataset.index = actualIndex;
            tr.style.cursor = 'pointer'; // Add pointer cursor to indicate clickable

            // Apply row color based on Application Status - REMOVED
            /*
            const applicationStatus = row['Application Status'] || '';
            if (applicationStatus === 'Accepted') {
                tr.classList.add('row-accepted');
            } else if (applicationStatus === 'Rejected') {
                tr.classList.add('row-rejected');
            } else if (applicationStatus === 'On Hold') {
                tr.classList.add('row-onhold');
            } else if (applicationStatus === 'Proceed Further') {
                tr.classList.add('row-proceed');
            }
            */

            // Add click event to show candidate details
            tr.addEventListener('click', (e) => {
                // Don't trigger if clicking on action buttons, dropdowns, links, or remarks triggers

                const clickedCell = e.target.closest('td');
                const columnName = clickedCell ? clickedCell.getAttribute('data-column') : null;

                if (columnName === 'Round 1 Remarks') {
                    const recordIndex = getRecordIndex(row);
                    showRound1RemarksModal(row, recordIndex);
                } else if (columnName === 'Round 2 Remarks') {
                    const recordIndex = getRecordIndex(row);
                    showRound2RemarksModal(row, recordIndex);
                } else if (columnName === 'Remarks') { // Handle general Remarks column
                    const recordIndex = getRecordIndex(row);
                    showRemarksDetail(row[columnName] || '', recordIndex, isAdmin);
                } else if (columnName === 'Initial Screening') { // Handle Initial Screening column
                    const recordIndex = getRecordIndex(row);
                    showInitialScreeningModal(row, recordIndex);
                } else if (!e.target.closest('button') && !e.target.closest('select') && !e.target.closest('a') && !e.target.closest('.remarks-trigger') && !e.target.closest('.general-remarks-trigger') && !e.target.closest('.initial-screening-trigger')) {
                    const recordIndex = getRecordIndex(row);
                    showCandidateDetails(row, recordIndex, isAdmin);
                }
            });

            tableColumns.forEach((column, colIndex) => {
                const td = document.createElement('td');
                let span; // Declare span once here

                // Add sticky-column class to first three columns (Date, Name, Email ID)
                if (column === 'Date' || column === 'Name' || column === 'Email ID') {
                    td.classList.add('sticky-column');
                }

                if (column === 'Candidate') {
                    // Display candidate name or a default identifier
                    const candidateName = row['Name'] || row['Name'] || 'Unknown Candidate';
                    td.textContent = candidateName;
                } else if (column === 'Date') {
                    const raw = row[column] || '';
                    if (raw) {
                        const datePart = raw.split(' ')[0];
                        try {
                            const formatted = new Date(datePart).toLocaleDateString();
                            td.textContent = formatted;
                        } catch (e) {
                            td.textContent = datePart;
                        }
                    } else {
                        td.textContent = '';
                    }
                } else if (column === 'Resume') {
                    const resumeValue = row[column] ? row[column].toString().trim() : '';
                    if (resumeValue && (resumeValue.toLowerCase().endsWith('.pdf') || resumeValue.startsWith('http'))) {
                        const link = document.createElement('a');
                        // Check if it's a legacy URL or a new filename
                        link.href = resumeValue.startsWith('http') ? resumeValue : `/uploads/${resumeValue}`;
                        link.textContent = 'View Resume';
                        link.target = '_blank';
                        link.className = 'text-decoration-none';
                        td.appendChild(link);
                    } else {
                        td.textContent = '';
                    }
                } else if (column === 'LinkedIn Profile') {
                    if (row[column] && row[column].toString().startsWith('http')) {
                        const link = document.createElement('a');
                        link.href = row[column];
                        link.textContent = 'View Profile';
                        link.target = '_blank';
                        link.className = 'text-decoration-none';
                        td.appendChild(link);
                    } else {
                        td.textContent = row[column] || '';
                    }
                } else if (column === 'Round 1 Remarks') {
                    let displayContent = '';
                    let r1Recommendation = '';
                    let remarks = {};
                    const remarksContent = row[column] || '';
                    if (remarksContent) { // Only parse/use remarksContent if it's not empty
                        if (remarksContent.startsWith('{') || remarksContent.startsWith('[')) {
                            try {
                                remarks = JSON.parse(remarksContent);
                                r1Recommendation = remarks['Recommendation'] || '';
                                if (r1Recommendation) {
                                    displayContent = r1Recommendation;
                                }
                            } catch (e) {
                                console.error("Error parsing Round 1 Remarks JSON:", e);
                                displayContent = remarksContent; // Display raw content if JSON fails
                            }
                        } else {
                            displayContent = remarksContent; // Treat as plain string
                        }
                    }

                    span = document.createElement('span'); // Changed from const to assignment
                    span.textContent = displayContent;

                    span.classList.add('remarks-trigger');
                    span.style.cursor = 'pointer';
                    span.onclick = (event) => { event.stopPropagation(); showRound1RemarksModal(row, index); };
                    td.appendChild(span);
                    td.style.minWidth = '250px'; // Shortened width
                    td.style.maxWidth = '250px'; // Shortened width
                    td.style.overflow = 'hidden';
                    td.style.textOverflow = 'ellipsis';
                    td.style.whiteSpace = 'nowrap';
                    td.title = r1Recommendation || row[column] || ''; // Show full text on hover
                } else if (column === 'Round 2 Remarks') {
                    let displayContent = '';
                    let r2Recommendation = '';
                    let remarks = {};
                    const remarksContent = row[column] || '';
                    if (remarksContent) { // Only parse/use remarksContent if it's not empty
                        if (remarksContent.startsWith('{') || remarksContent.startsWith('[')) {
                            try {
                                remarks = JSON.parse(remarksContent);
                                r2Recommendation = remarks['Recommendation'] || '';
                                if (r2Recommendation) {
                                    displayContent = r2Recommendation;
                                }
                            } catch (e) {
                                console.error("Error parsing Round 2 Remarks JSON:", e);
                                displayContent = remarksContent; // Display raw content if JSON fails
                            }
                        } else {
                            displayContent = remarksContent; // Treat as plain string
                        }
                    }

                    span = document.createElement('span'); // Changed from const to assignment
                    span.textContent = displayContent;

                    span.classList.add('remarks-trigger'); // Always add remarks-trigger class
                    span.style.cursor = 'pointer';
                    span.onclick = (event) => { event.stopPropagation(); showRound2RemarksModal(row, index); };
                    td.appendChild(span);
                    td.style.minWidth = '250px'; // Shortened width
                    td.style.maxWidth = '250px'; // Shortened width
                    td.style.overflow = 'hidden';
                    td.style.textOverflow = 'ellipsis';
                    td.style.whiteSpace = 'nowrap';
                    td.title = r2Recommendation || row[column] || ''; // Show full text on hover
                } else if (column === 'Remarks') {
                    const remarksContent = row[column] || '';
                    const displayContent = remarksContent.length > 50 ? remarksContent.substring(0, 47) + '...' : remarksContent;
                    span = document.createElement('span'); // Changed from const to assignment
                    span.textContent = displayContent;
                    span.style.cursor = 'pointer';
                    span.onclick = (event) => {
                        event.stopPropagation();
                        showRemarksDetail(remarksContent, index, isAdmin);
                    };
                    td.appendChild(span);
                    td.style.minWidth = '250px';
                    td.style.maxWidth = '250px';
                    td.style.overflow = 'hidden';
                    td.style.textOverflow = 'ellipsis';
                    td.style.whiteSpace = 'nowrap';
                    td.title = remarksContent; // Show full text on hover
                } else if (column === 'Interview Status' || column === 'Application Status' || column === 'Reject Mail Sent') {
                    td.dataset.column = column;
                    const currentStatus = row[column] || '';

                    const select = document.createElement('select');
                    select.className = 'form-select';

                    // Apply status-specific class for Application Status to the select element
                    // Only apply colors for specific statuses, others remain normal
                    if (column === 'Application Status') {
                        if (currentStatus === 'On Hold') {
                            select.classList.add('status-onhold');
                        } else if (currentStatus === 'Joined') {
                            select.classList.add('status-joined');
                        } else if (currentStatus === 'Proceed Further') {
                            select.classList.add('status-proceed');
                        } else if (currentStatus === 'Rejected') {
                            select.classList.add('status-rejected');
                        } else if (currentStatus === 'Accepted') {
                            select.classList.add('status-accepted');
                        }
                        // All other statuses will remain with default styling
                    }

                    const statusOptions = dropdownOptions[column] || [];

                    // Add empty/null option for Reject Mail Sent (always first)
                    if (column === 'Reject Mail Sent') {
                        const emptyOption = document.createElement('option');
                        emptyOption.value = '';
                        emptyOption.textContent = '';
                        // Select empty option if current status is empty or null
                        if (!currentStatus || currentStatus === '' || currentStatus === null) {
                            emptyOption.selected = true;
                        }
                        select.appendChild(emptyOption);
                    }

                    // Add empty option for Application Status
                    if (column === 'Application Status') {
                        const emptyOption = document.createElement('option');
                        emptyOption.value = '';
                        emptyOption.textContent = '(Empty)';
                        select.appendChild(emptyOption);
                    }

                    if (statusOptions.length > 0) {
                        statusOptions.forEach(option => {
                            const optionElement = document.createElement('option');
                            optionElement.value = option;
                            optionElement.textContent = option;
                            // Add data attribute for styling individual options
                            optionElement.setAttribute('data-status', option);
                            // Only select if it matches current status and current status is not empty
                            if (option === currentStatus && currentStatus && currentStatus !== '') {
                                optionElement.selected = true;
                            }
                            select.appendChild(optionElement);
                        });
                        // If current status exists but not in options, add it
                        if (currentStatus && currentStatus !== '' && !statusOptions.includes(currentStatus)) {
                            const optionElement = document.createElement('option');
                            optionElement.value = currentStatus;
                            optionElement.textContent = currentStatus;
                            optionElement.setAttribute('data-status', currentStatus);
                            optionElement.selected = true;
                            select.appendChild(optionElement);
                        }
                    } else {
                        // Fallback if no options available
                        const optionElement = document.createElement('option');
                        optionElement.value = currentStatus || '';
                        optionElement.textContent = currentStatus || 'Select status';
                        if (currentStatus) {
                            optionElement.setAttribute('data-status', currentStatus || '');
                            optionElement.selected = true;
                        }
                        select.appendChild(optionElement);
                    }

                    // Allow both admin and non-admin users to edit Interview Status, Application Status, and Reject Mail Sent
                    select.addEventListener('change', (e) => {
                        const newStatus = e.target.value;
                        const rowElement = select.closest('tr');
                        const oldStatus = row[column] || '';

                        // Find the correct index to use for update
                        const recordIndex = getRecordIndex(row);

                        // Update select element color immediately based on Application Status
                        // Only apply colors for specific statuses, others remain normal
                        if (column === 'Application Status') {
                            // Remove existing status classes
                            const statusClasses = ['status-onhold', 'status-joined', 'status-proceed', 'status-rejected', 'status-accepted'];
                            statusClasses.forEach(cls => select.classList.remove(cls));

                            // Add new status class for specific statuses
                            if (newStatus === 'On Hold') {
                                select.classList.add('status-onhold');
                            } else if (newStatus === 'Joined') {
                                select.classList.add('status-joined');
                            } else if (newStatus === 'Proceed Further') {
                                select.classList.add('status-proceed');
                            } else if (newStatus === 'Rejected') {
                                select.classList.add('status-rejected');

                                // AUTOMATION: Send rejection email and update "Reject Mail Sent"
                                const rejectMailCell = rowElement.querySelector('td[data-column="Reject Mail Sent"]');
                                if (rejectMailCell) {
                                    const rejectMailSelect = rejectMailCell.querySelector('select');
                                    if (rejectMailSelect && rejectMailSelect.value !== 'Yes') {
                                        // Get candidate details
                                        const candidateName = row['Name'] || 'Candidate';
                                        const candidateEmail = row['Email ID'];
                                        const position = row['Interested Position'] || 'the position';

                                        if (candidateEmail && candidateEmail.includes('@')) {
                                            // Show sending notification
                                            showNotification('Sending rejection email...', 'info');

                                            // Send rejection email
                                            fetch(API_BASE_URL + '/api/send-rejection-email', {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json'
                                                },
                                                body: JSON.stringify({
                                                    name: candidateName,
                                                    email: candidateEmail,
                                                    position: position
                                                })
                                            })
                                                .then(response => response.json())
                                                .then(emailData => {
                                                    if (emailData.status === 'success') {
                                                        // Update "Reject Mail Sent" to "Yes"
                                                        rejectMailSelect.value = 'Yes';

                                                        // Update the backend
                                                        updateRecordStatus(recordIndex, 'Reject Mail Sent', 'Yes', rowElement, '', 'Reject Mail Sent');

                                                        // Update local data
                                                        row['Reject Mail Sent'] = 'Yes';

                                                        // Show success notification
                                                        showNotification('✅ Rejection email sent to ' + candidateName, 'success');
                                                    } else {
                                                        showNotification('⚠️ Failed to send rejection email: ' + emailData.message, 'error');
                                                        console.error('Email sending failed:', emailData.message);
                                                    }
                                                })
                                                .catch(error => {
                                                    console.error('Error sending rejection email:', error);
                                                    showNotification('❌ Error sending rejection email', 'error');
                                                });
                                        } else {
                                            // No valid email address
                                            showNotification('⚠️ No valid email address found for ' + candidateName, 'warning');
                                            console.warn('Invalid or missing email for candidate:', row);
                                        }
                                    }
                                }
                            } else if (newStatus === 'Accepted') {
                                select.classList.add('status-accepted');
                            }
                            // All other statuses will remain with default styling
                        }

                        // Update status with error handling to revert color if update fails
                        updateRecordStatus(recordIndex, column, newStatus, rowElement, oldStatus, column);
                    });

                    td.appendChild(select);
                } else if (column === 'Timestamp') {
                    // Format date to show only date
                    const dateValue = row[column];
                    if (dateValue) {
                        const formattedDate = new Date(dateValue).toLocaleDateString();
                        td.textContent = formattedDate;
                    } else {
                        td.textContent = '';
                    }
                } else if (column === 'Initial Screening') {
                    const initialValue = row['Initial Screening'] || row['Initial Remarks'] || '';
                    span = document.createElement('span');
                    span.textContent = initialValue;
                    span.classList.add('initial-screening-trigger');
                    span.style.cursor = 'pointer';
                    span.onclick = (event) => { event.stopPropagation(); showInitialScreeningModal(row, index); };
                    td.appendChild(span);
                    td.style.maxWidth = '200px';
                    td.style.overflow = 'hidden';
                    td.style.textOverflow = 'ellipsis';
                    td.style.whiteSpace = 'nowrap';
                    td.style.cursor = 'pointer';
                    td.title = 'Click to view/edit initial screening';
                    // Add data attribute to easily find this cell later
                    const recordIndex = getRecordIndex(row);
                    td.setAttribute('data-initial-screening-index', recordIndex);
                    // Add click event to show initial screening in popup
                    td.onclick = (event) => {
                        event.stopPropagation();
                        showInitialScreeningDetail(initialValue, recordIndex);
                    };
                } else if (column === 'Round 1 D and T') {
                    const r1dandtContent = row[column] || '';
                    span = document.createElement('span');
                    span.innerHTML = r1dandtContent.replace(/\n/g, '<br>'); // Replace newlines with <br> for paragraph format
                    span.classList.add('remarks-trigger'); // Use remarks-trigger for consistent styling/behavior
                    span.style.cursor = 'pointer';
                    span.onclick = (event) => { event.stopPropagation(); showRound1DAndTModal(row, index); }; // New modal function
                    td.appendChild(span);
                    td.style.minWidth = '250px';
                    td.style.maxWidth = '300px'; // Adjust max-width to allow more content
                    td.style.overflow = 'hidden';
                    td.style.textOverflow = 'ellipsis';
                    td.style.whiteSpace = 'normal'; // Allow text to wrap
                    td.title = r1dandtContent; // Show full text on hover
                } else if (column === 'Round 1 Remarks') {
                    let displayContent = '';
                    let r1Recommendation = '';
                    let remarks = {};
                    const remarksContent = row[column] || '';
                    if (remarksContent) { // Only parse/use remarksContent if it's not empty
                        if (remarksContent.startsWith('{') || remarksContent.startsWith('[')) {
                            try {
                                remarks = JSON.parse(remarksContent);
                                r1Recommendation = remarks['Recommendation'] || '';
                                if (r1Recommendation) {
                                    displayContent = r1Recommendation;
                                }
                            } catch (e) {
                                console.error("Error parsing Round 1 Remarks JSON:", e);
                                displayContent = remarksContent; // Display raw content if JSON fails
                            }
                        } else {
                            displayContent = remarksContent; // Treat as plain string
                        }
                    }

                    span = document.createElement('span'); // Changed from const to assignment
                    span.textContent = displayContent;

                    span.classList.add('remarks-trigger');
                    span.style.cursor = 'pointer';
                    span.onclick = (event) => { event.stopPropagation(); showRound1RemarksModal(row, index); };
                    td.appendChild(span);
                    td.style.minWidth = '250px'; // Shortened width
                    td.style.maxWidth = '250px'; // Shortened width
                    td.style.overflow = 'hidden';
                    td.style.textOverflow = 'ellipsis';
                    td.style.whiteSpace = 'nowrap';
                    td.title = r1Recommendation || row[column] || ''; // Show full text on hover
                } else if (column === 'Round 2 D and T') {
                    const r2dandtContent = row[column] || '';
                    span = document.createElement('span');
                    span.innerHTML = r2dandtContent.replace(/\n/g, '<br>'); // Replace newlines with <br> for paragraph format
                    span.classList.add('remarks-trigger'); // Use remarks-trigger for consistent styling/behavior
                    span.style.cursor = 'pointer';
                    span.onclick = (event) => { event.stopPropagation(); showRound2DAndTModal(row, index); }; // New modal function
                    td.appendChild(span);
                    td.style.minWidth = '250px';
                    td.style.maxWidth = '300px'; // Adjust max-width to allow more content
                    td.style.overflow = 'hidden';
                    td.style.textOverflow = 'ellipsis';
                    td.style.whiteSpace = 'normal'; // Allow text to wrap
                    td.title = r2dandtContent; // Show full text on hover
                } else if (column === 'Round 2 Remarks') {
                    let displayContent = '';
                    let r2Recommendation = '';
                    let remarks = {};
                    const remarksContent = row[column] || '';
                    if (remarksContent) { // Only parse/use remarksContent if it's not empty
                        if (remarksContent.startsWith('{') || remarksContent.startsWith('[')) {
                            try {
                                remarks = JSON.parse(remarksContent);
                                r2Recommendation = remarks['Recommendation'] || '';
                                if (r2Recommendation) {
                                    displayContent = r2Recommendation;
                                }
                            } catch (e) {
                                console.error("Error parsing Round 2 Remarks JSON:", e);
                                displayContent = remarksContent; // Display raw content if JSON fails
                            }
                        } else {
                            displayContent = remarksContent; // Treat as plain string
                        }
                    }

                    span = document.createElement('span'); // Changed from const to assignment
                    span.textContent = displayContent;

                    span.classList.add('remarks-trigger'); // Always add remarks-trigger class
                    span.style.cursor = 'pointer';
                    span.onclick = (event) => { event.stopPropagation(); showRound2RemarksModal(row, index); };
                    td.appendChild(span);
                    td.style.minWidth = '250px'; // Shortened width
                    td.style.maxWidth = '250px'; // Shortened width
                    td.style.overflow = 'hidden';
                    td.style.textOverflow = 'ellipsis';
                    td.style.whiteSpace = 'nowrap';
                    td.title = r2Recommendation || row[column] || ''; // Show full text on hover
                } else if (column === 'Remarks') {
                    const remarksContent = row[column] || '';
                    const displayContent = remarksContent.length > 50 ? remarksContent.substring(0, 47) + '...' : remarksContent;
                    span = document.createElement('span'); // Changed from const to assignment
                    span.textContent = displayContent;
                    span.style.cursor = 'pointer';
                    span.onclick = (event) => {
                        event.stopPropagation();
                        showRemarksDetail(remarksContent, index, isAdmin);
                    };
                    td.appendChild(span);
                    td.style.minWidth = '250px';
                    td.style.maxWidth = '250px';
                    td.style.overflow = 'hidden';
                    td.style.textOverflow = 'ellipsis';
                    td.style.whiteSpace = 'nowrap';
                    td.title = remarksContent; // Show full text on hover
                } else if (column === 'Reject Mail Sent') {
                    const selectElement = document.createElement('select');
                    selectElement.className = 'form-select form-select-sm';
                    selectElement.innerHTML = `
                        <option value="No" ${row[column] === 'No' ? 'selected' : ''}>No</option>
                        <option value="Yes" ${row[column] === 'Yes' ? 'selected' : ''}>Yes</option>
                    `;
                    selectElement.disabled = true; // Should not be directly editable by user
                    td.appendChild(selectElement);
                } else {
                    td.textContent = row[column] || '';
                }
                td.setAttribute('data-column', column); // Add data-column attribute to all td elements
                tr.appendChild(td);
            });

            // Add action buttons (Edit, Delete)
            if (isAdmin) {
                const actionTd = document.createElement('td');

                // Find the correct index to use (handle filtering)
                const recordIndex = getRecordIndex(row);

                const editBtn = document.createElement('button');
                editBtn.className = 'btn btn-sm btn-primary edit-btn';
                editBtn.title = 'Edit';
                editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
                editBtn.onclick = (e) => {
                    e.stopPropagation(); // Prevent row click
                    openEditModal(recordIndex, isAdmin);
                };

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-sm btn-danger delete-btn';
                deleteBtn.title = 'Delete';
                deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation(); // Prevent row click
                    deleteRecord(recordIndex);
                };

                actionTd.appendChild(editBtn);
                actionTd.appendChild(deleteBtn);
                tr.appendChild(actionTd);
            } else {
                // For non-admin users, add Edit button that only shows Initial Screening and Round 1 Remarks
                const actionTd = document.createElement('td');

                // Find the correct index to use (handle filtering)
                const recordIndex = getRecordIndex(row);

                const editBtn = document.createElement('button');
                editBtn.className = 'btn btn-sm btn-primary edit-btn';
                editBtn.title = 'Edit';
                editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
                editBtn.onclick = (e) => {
                    e.stopPropagation(); // Prevent row click
                    openEditModal(recordIndex, isAdmin);
                };

                actionTd.appendChild(editBtn);
                tr.appendChild(actionTd);
            }

            tableBody.appendChild(tr);
        });

        // Update sticky column positions based on actual widths (after DOM update)
        setTimeout(() => {
            updateStickyColumnPositions();
        }, 0);

        // updateGroupByOptions(); // Removed as function is not defined
    } else {

        const paginationInfo = document.getElementById('paginationInfo');
        if (paginationInfo) paginationInfo.textContent = 'Showing 0 to 0 of 0 entries';
        const paginationControls = document.getElementById('paginationControls');
        if (paginationControls) paginationControls.innerHTML = '';

        tableHead.innerHTML = '<tr><th colspan="100%">No data available</th></tr>';
        tableBody.innerHTML = '<tr><td colspan="100%" class="text-center text-muted">No candidates found</td></tr>';
    }
}

// Function to render pagination controls
function renderPagination(totalPages) {
    const paginationControls = document.getElementById('paginationControls');
    if (!paginationControls) return;

    paginationControls.innerHTML = '';

    if (totalPages < 1) return;

    // Previous Button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`;
    prevLi.onclick = (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            populateTable(tableData, currentIsAdmin);
        }
    };
    paginationControls.appendChild(prevLi);

    // Page Numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.onclick = (e) => {
            e.preventDefault();
            currentPage = i;
            populateTable(tableData, currentIsAdmin);
        };
        paginationControls.appendChild(li);
    }

    // Next Button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>`;
    nextLi.onclick = (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            populateTable(tableData, currentIsAdmin);
        }
    };
    paginationControls.appendChild(nextLi);
}

// Function to update record status from the table
async function updateRecordStatus(index, column, newStatus, rowElement = null, oldStatus = null, statusColumn = null) {
    const record = tableData[index];

    // Include _api_id for Guhatek API sync
    const updatedRecord = {
        ...record,
        [column]: newStatus,
        '_api_id': record['_api_id'] || null
    };

    try {
        const response = await fetch(API_BASE_URL + `/api/data/${index}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedRecord),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        if (data.status === 'success') {
            const syncMsg = data.api_synced ? ' (synced to API)' : '';
            showNotification('Status updated successfully!' + syncMsg, 'success');
            tableData[index][column] = newStatus; // Update local data to avoid full refresh
        } else {
            showNotification(data.message || 'Failed to update status.', 'error');
            // Revert cell color if update failed and we have the cell element
            if (rowElement && statusColumn === 'Application Status' && oldStatus !== null) {
                // Find the Application Status cell and select element
                const statusCell = rowElement.querySelector("td[data-column='Application Status']");
                if (statusCell) {
                    const selectElement = statusCell.querySelector('select');
                    if (selectElement) {
                        // Remove existing status classes
                        const statusClasses = ['status-accepted', 'status-rejected', 'status-onhold', 'status-proceed', 'status-joined'];
                        statusClasses.forEach(cls => selectElement.classList.remove(cls));

                        // Add old status class
                        const oldStatusClass = getStatusClass(oldStatus);
                        if (oldStatusClass) {
                            selectElement.classList.add(oldStatusClass);
                        }
                    }
                }
            }
            fetchData(); // Revert change on failure
        }
    } catch (error) {
        console.error('Error updating record:', error);
        showNotification('Error updating record', 'error');
        // Revert cell color if update failed and we have the cell element
        if (rowElement && statusColumn === 'Application Status' && oldStatus !== null) {
            // Find the Application Status cell
            const statusCell = rowElement.querySelector("td[data-column='Application Status']");
            if (statusCell) {
                // Remove existing status classes
                const statusClasses = ['status-accepted', 'status-rejected', 'status-onhold', 'status-proceed', 'status-joined'];
                statusClasses.forEach(cls => statusCell.classList.remove(cls));

                // Add old status class
                const oldStatusClass = getStatusClass(oldStatus);
                if (oldStatusClass) {
                    statusCell.classList.add(oldStatusClass);
                }
            }
        }
        fetchData(); // Revert change on failure
    }
}



// Function to populate form fields for add/edit modals
function populateFormFields(formId, data = null) {
    const form = document.getElementById(formId);

    // For edit form, preserve the hidden input field
    if (formId === 'editDataForm') {
        const hiddenInput = form.querySelector('#editRecordIndex');
        form.innerHTML = '';
        if (hiddenInput) {
            form.appendChild(hiddenInput);
        } else {
            // Create hidden input if it doesn't exist
            const newHiddenInput = document.createElement('input');
            newHiddenInput.type = 'hidden';
            newHiddenInput.id = 'editRecordIndex';
            form.appendChild(newHiddenInput);
        }
    } else {
        // For add form, just clear everything
        form.innerHTML = '';
    }
    // Create form fields based on FIELD_ORDER (standard layout, no grouped cards)
    FIELD_ORDER.forEach(field => {
        if (field !== 'Date' && field !== 'Candidate') {
            const formGroup = document.createElement('div');
            formGroup.className = 'mb-3';

            const label = document.createElement('label');
            label.className = 'form-label';
            label.textContent = field;
            label.htmlFor = field.replace(/\s+/g, '');

            let input;

            if (dropdownOptions[field] && dropdownOptions[field].length > 0) {
                input = document.createElement('select');
                input.className = 'form-select';
                input.id = field.replace(/\s+/g, '');
                input.name = field.replace(/\s+/g, '');

                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                // Empty option for Reject Mail Sent, otherwise show "Select..."
                if (field === 'Reject Mail Sent') {
                    defaultOption.textContent = '';
                } else {
                    defaultOption.textContent = `Select ${field}...`;
                }
                input.appendChild(defaultOption);

                dropdownOptions[field].forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option;
                    optionElement.textContent = option;
                    input.appendChild(optionElement);
                });

                if (data && data[field]) {
                    input.value = data[field];
                }
            }
            else if (field === 'Comments' || field === 'Remarks' || field === 'Final Remarks' || field === 'Initial Screening' || field === 'Round 1 Remarks' || field === 'Round 2 Remarks') {
                input = document.createElement('textarea');
                input.className = 'form-control';
                input.id = field.replace(/\s+/g, '');
                input.name = field.replace(/\s+/g, '');
                input.rows = 3;
                input.maxLength = 120;

                if (data && data[field]) {
                    input.value = data[field];
                }
            }
            // Special handling for URL fields and Resume PDF upload
            else if (field === 'Resume') {
                input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf';
                input.className = 'form-control';
                input.id = field.replace(/\s+/g, '');
                input.name = field.replace(/\s+/g, '');

                // If editing and has existing resume, show link
                if (data && data[field]) {
                    const small = document.createElement('small');
                    small.className = 'text-muted d-block mt-1';
                    const resumeValue = data[field].toString().trim();
                    const linkHref = resumeValue.startsWith('http') ? resumeValue : `/uploads/${resumeValue}`;
                    small.innerHTML = `Current file: <a href="${linkHref}" target="_blank">View Resume</a>`;
                    // Note: input.parentNode might not exist yet if we are just creating it
                    // So we use a small timeout to append it after input is added to DOM
                    setTimeout(() => {
                        if (input.parentNode) {
                            input.parentNode.appendChild(small);
                        }
                    }, 0);
                }
            } else if (field === 'LinkedIn Profile') {
                input = document.createElement('input');
                input.type = 'url';
                input.className = 'form-control';
                input.id = field.replace(/\s+/g, '');
                input.name = field.replace(/\s+/g, '');
                input.placeholder = `Enter ${field} URL...`;
                input.maxLength = 120;

                if (data && data[field]) {
                    input.value = data[field];
                }
            }
            else if (field === 'Email ID') {
                input = document.createElement('input');
                input.type = 'email';
                input.className = 'form-control';
                input.id = field.replace(/\s+/g, '');
                input.name = field.replace(/\s+/g, '');
                input.placeholder = `Enter ${field}...`;
                input.required = true;
                input.maxLength = 120;

                if (data && data[field]) {
                    input.value = data[field];
                }
            }
            else if (field === 'Current CTC per Annum' || field === 'Expected CTC per Annum' || field === 'Offered CTC' || field === 'Contact Number') {
                input = document.createElement('input');
                input.type = 'number';
                input.className = 'form-control';
                input.id = field.replace(/\s+/g, '');
                input.name = field.replace(/\s+/g, '');
                input.placeholder = `Enter ${field}...`;
                input.maxLength = 120;

                if (data && data[field]) {
                    input.value = data[field];
                }
            }
            else {
                input = document.createElement('input');
                input.type = 'text';
                input.className = 'form-control';
                input.id = field.replace(/\s+/g, '');
                input.name = field.replace(/\s+/g, '');
                input.placeholder = `Enter ${field}...`;
                input.maxLength = 120;

                if (data && data[field]) {
                    input.value = data[field];
                }
            }

            formGroup.appendChild(label);
            formGroup.appendChild(input);
            form.appendChild(formGroup);
        }
    });
}

// Function to open add modal
function openAddModal() {
    populateFormFields('addDataForm');

    const modal = new bootstrap.Modal(document.getElementById('addDataModal'));
    modal.show();
}

// Function to open edit modal
function openEditModal(index, isAdmin) {
    // Use originalTableData since index is always from original data
    const record = originalTableData[index];
    if (!record) {
        console.error('Record not found at index:', index);
        showNotification('Record not found', 'error');
        return;
    }

    // Set the edit record index in the form
    const editRecordIndexInput = document.getElementById('editRecordIndex');
    if (editRecordIndexInput) {
        editRecordIndexInput.value = index;
    }

    const modal = new bootstrap.Modal(document.getElementById('editDataModal'));
    const formBody = document.getElementById('editFormBody');

    formBody.innerHTML = '';

    // Determine which fields to show based on admin status
    // For non-admin: show all visible columns but only allow editing Initial Screening and Round 1 Remarks
    let fieldsToShow = isAdmin ? FIELD_ORDER : ['Date', 'Name', 'Email ID', 'Interested Position', 'Current Role', 'Current Organization', 'Current Location', 'Resume', 'Referred By', 'Interview Status', 'Application Status', 'Initial Screening', 'Round 1 Remarks', 'Round 2 Remarks'];

    // Fields that are editable for non-admin users
    const editableFieldsForUser = ['Initial Screening', 'Round 1 Remarks'];

    // Create form fields for each column
    fieldsToShow.forEach(column => {
        if (column === 'Timestamp') return; // Skip timestamp

        const formGroup = document.createElement('div');
        formGroup.className = 'mb-3';

        const label = document.createElement('label');
        label.className = 'form-label';
        label.textContent = column;

        let input;
        const isEditable = isAdmin || editableFieldsForUser.includes(column);

        if (column === 'Interview Status' || column === 'Application Status' || column === 'Reject Mail Sent') {
            input = document.createElement('select');
            input.className = 'form-select';
            if (!isEditable) {
                input.disabled = true;
                input.style.backgroundColor = '#e9ecef';
                input.style.cursor = 'not-allowed';
            }

            // Add default/empty option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            if (column === 'Reject Mail Sent') {
                defaultOption.textContent = ''; // Empty option for Reject Mail Sent
            } else {
                defaultOption.textContent = 'Select ' + column;
            }
            if (!record[column] || record[column] === '') {
                defaultOption.selected = true;
            }
            input.appendChild(defaultOption);

            // Add dropdown options if available
            if (dropdownOptions[column]) {
                dropdownOptions[column].forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option;
                    optionElement.textContent = option;
                    if (record[column] === option) {
                        optionElement.selected = true;
                    }
                    input.appendChild(optionElement);
                });
            }
        } else if (column === 'Resume') {
            input = document.createElement('input');
            input.type = 'file';
            input.accept = '.pdf';
            input.className = 'form-control';
            if (!isEditable) {
                input.disabled = true;
                input.style.backgroundColor = '#e9ecef';
                input.style.cursor = 'not-allowed';
            }

            // If has existing resume, show link
            if (record[column]) {
                const small = document.createElement('small');
                small.className = 'text-muted d-block mt-1';
                const resumeValue = record[column].toString().trim();
                const linkHref = resumeValue.startsWith('http') ? resumeValue : `/uploads/${resumeValue}`;
                small.innerHTML = `Current file: <a href="${linkHref}" target="_blank">View Resume</a>`;
                // Append after input creation logic
                setTimeout(() => {
                    const parent = input.parentNode;
                    if (parent) parent.appendChild(small);
                }, 0);
            }
        } else if (column === 'LinkedIn Profile') {
            input = document.createElement('input');
            input.type = 'url';
            input.className = 'form-control';
            input.value = record[column] || '';
            input.maxLength = 120;
            if (!isEditable) {
                input.readOnly = true;
                input.style.backgroundColor = '#e9ecef';
                input.style.cursor = 'not-allowed';
            }
        } else {
            input = document.createElement('textarea');
            input.className = 'form-control';
            input.rows = column.includes('Remarks') || column.includes('Screening') ? 3 : 1;

            let displayValue = record[column] || '';

            // Format date fields for better readability
            if ((column === 'Date' || column === 'Round 1 D and T' || column === 'Round 2 D and T' || column === 'Joining Date') && displayValue) {
                try {
                    const date = new Date(displayValue);
                    if (!isNaN(date.getTime())) {
                        // Format as YYYY-MM-DD for input compatibility
                        displayValue = date.toISOString().split('T')[0];
                    }
                } catch (e) {
                    // Keep original value if parsing fails
                }
            }

            // Parse Round 1/Round 2 Remarks JSON for readable display
            if ((column === 'Round 1 Remarks' || column === 'Round 2 Remarks') && displayValue) {
                try {
                    const remarksObj = JSON.parse(displayValue);
                    if (typeof remarksObj === 'object') {
                        // Convert JSON to readable text format
                        const lines = [];
                        for (const [key, value] of Object.entries(remarksObj)) {
                            if (value && value.toString().trim()) {
                                lines.push(`${key}: ${value}`);
                            }
                        }
                        displayValue = lines.length > 0 ? lines.join('\n') : '';
                    }
                } catch (e) {
                    // Keep original value if not valid JSON
                }
            }

            input.value = displayValue;
            input.maxLength = 500; // Increased for remarks
            if (!isEditable) {
                input.readOnly = true;
                input.style.backgroundColor = '#e9ecef';
                input.style.cursor = 'not-allowed';
            }
        }

        input.id = 'edit_' + column;
        input.name = column;

        formGroup.appendChild(label);
        formGroup.appendChild(input);
        formBody.appendChild(formGroup);
    });

    modal.show();
}

// Function to show final remarks detail in popup modal
function showFinalRemarksDetail(finalValue, candidateIndex) {
    const textArea = document.getElementById('finalRemarksTextArea');
    const saveBtn = document.getElementById('saveFinalRemarks');

    if (textArea && saveBtn) {
        // Set the initial value in the text area
        textArea.value = finalValue || '';

        // Store the current candidate index
        textArea.setAttribute('data-candidate-index', candidateIndex);

        // Add event listener for save button
        saveBtn.onclick = saveFinalRemarksFromModal;

        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('finalRemarksModal'));
        modal.show();
    }
}

// Function to save final remarks from the modal
async function saveFinalRemarksFromModal() {
    const textArea = document.getElementById('finalRemarksTextArea');
    const newValue = textArea ? textArea.value : '';
    const candidateIndex = textArea ? textArea.getAttribute('data-candidate-index') : null;

    if (candidateIndex === null) return;

    try {
        const result = await updateCandidateData(parseInt(candidateIndex), { 'Final Remarks': newValue });
        if (result.status === 'success') {
            const syncMsg = result.api_synced ? ' (synced to API)' : '';
            showToast('Final Remarks updated successfully!' + syncMsg, 'success');
            // Update the table data
            if (tableData[candidateIndex]) {
                tableData[candidateIndex]['Final Remarks'] = newValue;
            }
            // Also update original data
            if (originalTableData[candidateIndex]) {
                originalTableData[candidateIndex]['Final Remarks'] = newValue;
            }

            // Update the table cell directly
            updateFinalRemarksTableCell(candidateIndex, newValue);

            // Close the modal
            const modalElement = document.getElementById('finalRemarksModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
        } else {
            showToast(`Error updating final remarks: ${result.message}`, 'danger');
        }
    } catch (error) {
        console.error('Error saving final remarks:', error);
        showToast('Error saving final remarks.', 'danger');
    }
}

// Function to update the Final Remarks table cell directly
function updateFinalRemarksTableCell(candidateIndex, newValue) {
    // Find the Final Remarks cell using the data attribute
    const remarksCell = document.querySelector(`td[data-final-remarks-index="${candidateIndex}"]`);
    if (remarksCell) {
        remarksCell.textContent = newValue || '';
    }
}

// Function to show initial screening detail in popup modal
function showInitialScreeningDetail(initialValue, candidateIndex) {
    const textArea = document.getElementById('initialScreeningTextArea');
    const saveBtn = document.getElementById('saveInitialScreening');

    if (textArea && saveBtn) {
        // Set the initial value in the text area
        textArea.value = initialValue || '';

        // Store the current candidate index
        textArea.setAttribute('data-candidate-index', candidateIndex);

        if (currentIsAdmin) {
            textArea.disabled = false;
            saveBtn.style.display = 'block'; // Show button for admin
            // Add event listener for save button only if admin
            saveBtn.onclick = () => saveInitialScreeningFromModal(candidateIndex);
        } else {
            textArea.disabled = true;
            saveBtn.style.display = 'none'; // Hide button for non-admin
            saveBtn.onclick = null; // Remove event listener for non-admin
        }

        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('initialScreeningModal'));
        modal.show();
    }
}

// Function to save initial screening from the modal


// Function to update the Initial Screening table cell directly
function updateInitialScreeningTableCell(candidateIndex, newValue) {
    // Find the Initial Screening cell using the data attribute
    const screeningCell = document.querySelector(`td[data-initial-screening-index="${candidateIndex}"]`);
    if (screeningCell) {
        screeningCell.textContent = newValue || '';
    }
}

// Function to save new record
function saveNewRecord() {
    const formData = new FormData(document.getElementById('addDataForm'));

    // Remove empty file if not selected
    const resumeFile = formData.get('Resume');
    if (resumeFile && resumeFile.size === 0) {
        formData.delete('Resume');
    }

    fetch(API_BASE_URL + '/api/data', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const syncMsg = data.api_synced ? ' (synced to API)' : ' (saved locally)';
                showNotification('Candidate added successfully!' + syncMsg, 'success');
                // Log API sync status
                console.log('Add candidate result:', data);
                // Close modal first
                bootstrap.Modal.getInstance(document.getElementById('addDataModal')).hide();
                // Add a small delay to ensure backend has finished writing to Excel file
                setTimeout(() => {
                    fetchData(); // Refresh table
                }, 300);
            } else {
                showNotification(data.message || 'Failed to add candidate.', 'error');
            }
        })
        .catch(error => {
            console.error('Error adding candidate:', error);
            showNotification('Error adding candidate', 'error');
        });
}

// Function to update record
function updateRecord() {
    const index = document.getElementById('editRecordIndex').value;
    const formData = new FormData(document.getElementById('editDataForm'));

    // Remove empty file if not selected
    const resumeFile = formData.get('Resume');
    if (resumeFile && resumeFile.size === 0) {
        formData.delete('Resume');
    }

    // Include _api_id for Guhatek API sync
    const candidate = tableData[index];
    if (candidate && candidate['_api_id']) {
        formData.append('_api_id', candidate['_api_id']);
    }

    fetch(API_BASE_URL + `/api/data/${index}`, {
        method: 'PUT',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const syncMsg = data.api_synced ? ' (synced to API)' : '';
                showNotification('Record updated successfully!' + syncMsg, 'success');
                // Close modal first
                bootstrap.Modal.getInstance(document.getElementById('editDataModal')).hide();
                // Add a small delay to ensure backend has finished writing to Excel file
                setTimeout(() => {
                    fetchData(); // Refresh table
                }, 300);
            } else {
                showNotification(data.message || 'Failed to update record.', 'error');
            }
        })
        .catch(error => {
            console.error('Error updating record:', error);
            showNotification('Error updating record', 'error');
        });
}

// Function to delete record
function deleteRecord(index) {
    if (confirm('Are you sure you want to delete this record?')) {
        fetch(API_BASE_URL + `/api/data/${index}`, {
            method: 'DELETE',
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    showNotification('Record deleted successfully!', 'success');
                    fetchData(); // Refresh table
                } else {
                    showNotification(data.message || 'Failed to delete record.', 'error');
                }
            })
            .catch(error => {
                console.error('Error deleting record:', error);
                showNotification('Error deleting record', 'error');
            });
    }
}

// Function to show notifications
function showNotification(message, type) {
    const notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) return;

    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`;
    notification.role = 'alert';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    notificationContainer.appendChild(notification);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Function to fetch summary data
function fetchSummary() {
    fetch(API_BASE_URL + '/api/analysis/summary')
        .then(response => response.json())
        .then(data => {
            displaySummary(data);
        })
        .catch(error => {
            console.error('Error fetching summary:', error);
        });
}

// Function to fetch analytics data
function fetchAnalyticsData() {
    fetch(API_BASE_URL + '/api/analytics')
        .then(response => response.json())
        .then(data => {
            displayAnalyticsData(data);
        })
        .catch(error => {
            console.error('Error fetching analytics data:', error);
        });
}

// Function to display analytics data
function displayAnalyticsData(data) {
    const overallAnalyticsBody = document.getElementById('overallAnalyticsBody');
    const hiringFunnelBody = document.getElementById('hiringFunnelBody');

    if (!overallAnalyticsBody || !hiringFunnelBody) {
        console.error('Analytics tables not found.');
        return;
    }

    // Clear existing content
    overallAnalyticsBody.innerHTML = '';
    hiringFunnelBody.innerHTML = '';

    // Populate Overall Analytics Table
    overallAnalyticsBody.innerHTML = `
        <tr>
            <td>Total Applicant</td>
            <td>${data.total_applicant}</td>
        </tr>
        <tr>
            <td>Total Rejected</td>
            <td>${data.total_rejected}</td>
        </tr>
        <tr>
            <td>No response</td>
            <td>${data.no_response}</td>
        </tr>
        <tr>
            <td>Not Interviewed</td>
            <td>${data.not_interviewed}</td>
        </tr>
    `;

    // Populate Hiring Funnel Table
    hiringFunnelBody.innerHTML = `
        <tr>
            <td>Total Round 2 Completed</td>
            <td>${data.total_round_2_completed}</td>
        </tr>
        <tr>
            <td>Didn't Join</td>
            <td>${data.did_not_join}</td>
        </tr>
        <tr>
            <td>On Hold</td>
            <td>${data.on_hold}</td>
        </tr>
        <tr>
            <td>Accepted waiting Reference</td>
            <td>${data.accepted_waiting_reference}</td>
        </tr>
        <tr>
            <td>Total In Notice/Yet to join</td>
            <td>${data.total_in_notice_yet_to_join}</td>
        </tr>
        <tr>
            <td>Total Joined</td>
            <td>${data.total_joined}</td>
        </tr>
        <tr>
            <td>Intern</td>
            <td>${data.intern}</td>
        </tr>
    `;
}

// Display summary data
function displaySummary(data) {
    const summaryContainer = document.getElementById('summaryContainer');
    // Guard: if the container is missing, avoid runtime errors
    if (!summaryContainer) {
        console.warn('Summary container not found in DOM. Skipping summary render.');
        return;
    }
    summaryContainer.innerHTML = '';

    for (const [column, stats] of Object.entries(data)) {
        const card = document.createElement('div');
        card.className = 'card mb-3 shadow-sm';

        const cardHeader = document.createElement('div');
        cardHeader.className = 'card-header bg-primary text-white';
        cardHeader.textContent = column;

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const statsList = document.createElement('ul');
        statsList.className = 'list-group list-group-flush';

        for (const [stat, value] of Object.entries(stats)) {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item d-flex justify-content-between align-items-center';

            const statName = document.createElement('span');
            statName.textContent = stat.charAt(0).toUpperCase() + stat.slice(1);

            const statValue = document.createElement('span');
            statValue.className = 'badge bg-primary rounded-pill';
            statValue.textContent = typeof value === 'number' ? value.toFixed(2) : value;

            listItem.appendChild(statName);
            listItem.appendChild(statValue);
            statsList.appendChild(listItem);
        }

        cardBody.appendChild(statsList);
        card.appendChild(cardHeader);
        card.appendChild(cardBody);
        summaryContainer.appendChild(card);
    }
}

// Fetch group analysis data
function fetchGroupAnalysis(column) {
    fetch(API_BASE_URL + `/api/analysis/group/${column}`)
        .then(response => response.json())
        .then(data => {
            updateGroupChart(data, column);
        })
        .catch(error => {
            console.error('Error fetching group analysis:', error);
        });
}

// Update group chart
function updateGroupChart(data, groupColumn) {
    const groupCanvas = document.getElementById('groupChart');
    if (!groupCanvas) {
        return;
    }
    const ctx = groupCanvas.getContext('2d');

    const labels = data.map(item => item[groupColumn] || 'Unknown');
    const counts = data.map(item => item.count || 0);

    if (groupChart) {
        groupChart.destroy();
    }

    groupChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Count',
                data: counts,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Candidates by ${groupColumn}`
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Count'
                    }
                }
            }
        }
    });
}



// Analytics Functions
function updateMonthlyStats(data) {



    if (data.length > 0) {




        // Check for alternative date field names
        const possibleDateFields = ['Date', 'Date of Application', 'Timestamp', 'Application Date'];
        for (const field of possibleDateFields) {
            if (data[0][field] !== undefined) {

            }
        }
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const monthlyStats = {};

    let validRecords = 0;
    let invalidDateRecords = 0;

    data.forEach((candidate, index) => {
        // Try different possible date field names
        let dateStr = candidate['Date of Application'];
        if (!dateStr) {
            // Try alternative field names
            const possibleDateFields = ['Date', 'Timestamp', 'Application Date'];
            for (const field of possibleDateFields) {
                if (candidate[field]) {
                    dateStr = candidate[field];

                    break;
                }
            }
        }

        if (!dateStr) {

            invalidDateRecords++;
            return;
        }



        // Parse date - handle different formats
        let processedDateStr = dateStr;


        // Handle various date formats
        if (dateStr.includes(' ')) {
            processedDateStr = dateStr.split(' ')[0]; // Take only date part
        }

        // Try different date parsing approaches
        let date = new Date(processedDateStr);

        // If that fails, try other formats
        if (isNaN(date.getTime())) {
            // Try parsing as MM/DD/YYYY format
            const parts = processedDateStr.split('/');
            if (parts.length === 3) {
                date = new Date(parts[2], parts[0] - 1, parts[1]); // YYYY, MM, DD
            }
        }

        if (isNaN(date.getTime())) {
            // Try parsing as DD/MM/YYYY format
            const parts = processedDateStr.split('/');
            if (parts.length === 3) {
                date = new Date(parts[2], parts[1] - 1, parts[0]); // YYYY, MM, DD
            }
        }

        if (isNaN(date.getTime())) {
            // Try parsing as YYYY-MM-DD format
            const parts = processedDateStr.split('-');
            if (parts.length === 3) {
                date = new Date(parts[0], parts[1] - 1, parts[2]); // YYYY, MM, DD
            }
        }

        if (isNaN(date.getTime())) {

            invalidDateRecords++;
            return;
        }

        validRecords++;
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;


        if (!monthlyStats[monthKey]) {
            monthlyStats[monthKey] = {
                applicants: 0,
                accepted: 0,
                rejected: 0,
                inNotice: 0,
                joined: 0,
                feedbackGiven: 0
            };
        }

        monthlyStats[monthKey].applicants++;

        switch (candidate['Application Status']) {
            case 'Accepted':
                monthlyStats[monthKey].accepted++;
                break;
            case 'Rejected':
                monthlyStats[monthKey].rejected++;
                break;
            case 'In Notice':
                monthlyStats[monthKey].inNotice++;
                break;
            case 'Joined':
                monthlyStats[monthKey].joined++;
                break;
        }

        if (candidate['Reference Feedback']) {
            monthlyStats[monthKey].feedbackGiven++;
        }
    });




    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyStats).sort((a, b) => {
        const [monthA, yearA] = a.split(' ');
        const [monthB, yearB] = b.split(' ');
        return new Date(`${monthA} 1, ${yearA}`) - new Date(`${monthB} 1, ${yearB}`);
    });



    // Update table
    const tbody = document.getElementById('monthlyStatsBody');
    const tfoot = document.getElementById('monthlyStatsTotals');




    if (!tbody || !tfoot) {
        console.error('Monthly stats table elements not found');
        // Try to find them in another way
        const allElements = document.querySelectorAll('*');

        allElements.forEach(el => {
            if (el.id && el.id.toLowerCase().includes('monthly')) {

            }
        });
        return;
    }

    tbody.innerHTML = '';

    const totals = {
        applicants: 0,
        accepted: 0,
        rejected: 0,
        inNotice: 0,
        joined: 0
    };

    const labels = [];
    const acceptedData = [];
    const rejectedData = [];
    const joinedData = [];

    sortedMonths.forEach(month => {
        const stats = monthlyStats[month];

        // Prepare chart data
        labels.push(month);
        acceptedData.push(stats.accepted);
        rejectedData.push(stats.rejected);
        joinedData.push(stats.joined);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${month}</td>
            <td class="text-center">${stats.applicants}</td>
            <td class="text-center">${stats.accepted}</td>
            <td class="text-center">${stats.rejected}</td>
            <td class="text-center">${stats.inNotice}</td>
            <td class="text-center">${stats.joined}</td>
        `;
        tbody.appendChild(row);

        // Update totals
        Object.keys(totals).forEach(key => {
            totals[key] += stats[key];
        });
    });

    // Add totals row
    tfoot.innerHTML = `
        <tr class="table-success fw-bold">
            <td>Total</td>
            <td class="text-center">${totals.applicants}</td>
            <td class="text-center">${totals.accepted}</td>
            <td class="text-center">${totals.rejected}</td>
            <td class="text-center">${totals.inNotice}</td>
            <td class="text-center">${totals.joined}</td>
        </tr>
    `;

    // Render Monthly Stats Chart
    const monthlyCtx = document.getElementById('monthlyStatsChart');
    if (monthlyCtx && document.getElementById('viewType').value === 'chart') {
        if (window.monthlyStatsChartInstance) {
            window.monthlyStatsChartInstance.destroy();
        }
        window.monthlyStatsChartInstance = new Chart(monthlyCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Accepted', data: acceptedData, backgroundColor: '#10b981', maxBarThickness: 40 },
                    { label: 'Rejected', data: rejectedData, backgroundColor: '#ef4444', maxBarThickness: 40 },
                    { label: 'Joined', data: joinedData, backgroundColor: '#3b82f6', maxBarThickness: 40 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // Update key metrics
    updateKeyMetrics(totals, data);

    // Update position statistics
    updatePositionStats(data);
}



// Update Position Statistics Table
function updatePositionStats(data) {
    const positionStats = {};

    // Count applicants and joined by position
    data.forEach(candidate => {
        const position = candidate['Interested Position'] || 'Not Specified';

        if (!positionStats[position]) {
            positionStats[position] = {
                applied: 0,
                joined: 0
            };
        }

        positionStats[position].applied++;

        if (candidate['Application Status'] === 'Joined') {
            positionStats[position].joined++;
        }
    });

    // Sort positions by number of applicants (descending)
    const sortedPositions = Object.keys(positionStats).sort((a, b) => {
        return positionStats[b].applied - positionStats[a].applied;
    });

    // Update table
    const tbody = document.getElementById('positionStatsBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (sortedPositions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No position data available</td></tr>';
        return;
    }

    const labels = [];
    const appliedData = [];
    const joinedData = [];

    sortedPositions.forEach(position => {
        const stats = positionStats[position];

        labels.push(position);
        appliedData.push(stats.applied);
        joinedData.push(stats.joined);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="font-weight: 500; color: #1f2937;">${position}</td>
            <td style="text-align: center; font-weight: 600; color: #5b5fef;">${stats.applied}</td>
            <td style="text-align: center; font-weight: 600; color: #10b981;">${stats.joined}</td>
        `;
        tbody.appendChild(row);
    });

    // Render Position Stats Chart
    const positionCtx = document.getElementById('positionStatsChart');
    if (positionCtx && document.getElementById('viewType').value === 'chart') {
        if (window.positionStatsChartInstance) {
            window.positionStatsChartInstance.destroy();
        }
        window.positionStatsChartInstance = new Chart(positionCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Applied', data: appliedData, backgroundColor: '#5b5fef', maxBarThickness: 40 },
                    { label: 'Joined', data: joinedData, backgroundColor: '#10b981', maxBarThickness: 40 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

function updateKeyMetrics(totals, data) {
    // Update old metrics container if it exists
    const metricsContainer = document.getElementById('keyMetricsContainer');
    if (metricsContainer) {
        const metrics = [
            { label: 'Total Applicants', value: totals.applicants },
            { label: 'Total Accepted', value: totals.accepted },
            { label: 'Total Rejected', value: totals.rejected },
            { label: 'Currently In Notice', value: totals.inNotice },
            { label: 'Total Joined', value: totals.joined }
        ];

        metricsContainer.innerHTML = metrics.map(metric => `
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <span class="text-muted">${metric.label}</span>
                    <span class="h5 mb-0">${metric.value}</span>
                </div>
                <div class="progress mt-2" style="height: 4px;">
                    <div class="progress-bar" style="width: ${(metric.value / totals.applicants * 100) || 0}%"></div>
                </div>
            </div>
        `).join('');
    }

    // Update new spreadsheet-style metrics panel
    const metricsPanel = document.getElementById('metricsPanel');
    if (metricsPanel) {
        // Calculate counts for each remarks column
        let initialScreeningCount = 0;
        let round1RemarksCount = 0;
        let round2RemarksCount = 0;
        let finalRemarksCount = 0;
        let remarksCount = 0;

        data.forEach(candidate => {
            if (candidate['Initial Screening'] && candidate['Initial Screening'].trim()) {
                initialScreeningCount++;
            }
            if (candidate['Round 1 Remarks'] && candidate['Round 1 Remarks'].trim()) {
                round1RemarksCount++;
            }
            if (candidate['Round 2 Remarks'] && candidate['Round 2 Remarks'].trim()) {
                round2RemarksCount++;
            }
            if (candidate['Final Remarks'] && candidate['Final Remarks'].trim()) {
                finalRemarksCount++;
            }
            if (candidate['Remarks'] && candidate['Remarks'].trim()) {
                remarksCount++;
            }
        });

        // Numeric View: Use Ordered List for simple stats (Overall & Remarks)
        metricsPanel.innerHTML = `
            <div class="mb-3">
                <h6 class="fw-bold">Overall Status</h6>
                <ol class="list-group list-group-numbered">
                    <li class="list-group-item d-flex justify-content-between align-items-start">
                        <div class="ms-2 me-auto"><div class="fw-bold">Total Applicants</div></div>
                        <span class="badge bg-primary rounded-pill">${totals.applicants}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-start">
                        <div class="ms-2 me-auto"><div class="fw-bold">Total Accepted</div></div>
                        <span class="badge bg-success rounded-pill">${totals.accepted}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-start">
                        <div class="ms-2 me-auto"><div class="fw-bold">Total Rejected</div></div>
                        <span class="badge bg-danger rounded-pill">${totals.rejected}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-start">
                        <div class="ms-2 me-auto"><div class="fw-bold">Total In Notice</div></div>
                        <span class="badge bg-warning text-dark rounded-pill">${totals.inNotice}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-start">
                        <div class="ms-2 me-auto"><div class="fw-bold">Total Joined</div></div>
                        <span class="badge bg-info text-dark rounded-pill">${totals.joined}</span>
                    </li>
                </ol>
            </div>
            <div>
                <h6 class="fw-bold">Remarks Count</h6>
                <ol class="list-group list-group-numbered">
                    <li class="list-group-item d-flex justify-content-between align-items-start">
                        <div class="ms-2 me-auto"><div class="fw-bold">Initial Screening</div></div>
                        <span class="badge bg-secondary rounded-pill">${initialScreeningCount}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-start">
                        <div class="ms-2 me-auto"><div class="fw-bold">Round 1 Feedback</div></div>
                        <span class="badge bg-secondary rounded-pill">${round1RemarksCount}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-start">
                        <div class="ms-2 me-auto"><div class="fw-bold">Round 2 Feedback</div></div>
                        <span class="badge bg-secondary rounded-pill">${round2RemarksCount}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-start">
                        <div class="ms-2 me-auto"><div class="fw-bold">Final Remarks</div></div>
                        <span class="badge bg-secondary rounded-pill">${finalRemarksCount}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-start">
                        <div class="ms-2 me-auto"><div class="fw-bold">Remarks</div></div>
                        <span class="badge bg-secondary rounded-pill">${remarksCount}</span>
                    </li>
                </ol>
            </div>
        `;

        // Chart View: Render Metrics Chart
        const metricsCtx = document.getElementById('metricsChart');
        if (metricsCtx && document.getElementById('viewType').value === 'chart') {
            // Check if Chart.js is available
            if (typeof Chart === 'undefined') {
                console.warn('Chart.js is not loaded, skipping metrics chart rendering');
                return;
            }

            if (window.metricsChartInstance) {
                window.metricsChartInstance.destroy();
            }
            window.metricsChartInstance = new Chart(metricsCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Accepted', 'Rejected', 'In Notice', 'Joined', 'Others'],
                    datasets: [{
                        data: [
                            totals.accepted,
                            totals.rejected,
                            totals.inNotice,
                            totals.joined,
                            totals.applicants - (totals.accepted + totals.rejected + totals.inNotice + totals.joined)
                        ],
                        backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#cbd5e1']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }
}

function updateApplicationStatusChart(data) {
    const statusCounts = {
        'Total Applicants': data.length,
        'Accepted': 0,
        'Rejected': 0,
        'In Notice': 0,
        'Joined': 0
    };

    data.forEach(candidate => {
        if (statusCounts.hasOwnProperty(candidate['Application Status'])) {
            statusCounts[candidate['Application Status']]++;
        }
    });

    // Populate Numeric View
    const numericContainer = document.getElementById('applicationStatusNumeric');
    if (numericContainer) {
        numericContainer.innerHTML = `
            <ol class="list-group list-group-numbered">
                <li class="list-group-item d-flex justify-content-between align-items-start">
                    <div class="ms-2 me-auto"><div class="fw-bold">Total Applicants</div></div>
                    <span class="badge bg-primary rounded-pill">${statusCounts['Total Applicants']}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-start">
                    <div class="ms-2 me-auto"><div class="fw-bold">Accepted</div></div>
                    <span class="badge bg-success rounded-pill">${statusCounts['Accepted']}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-start">
                    <div class="ms-2 me-auto"><div class="fw-bold">Rejected</div></div>
                    <span class="badge bg-danger rounded-pill">${statusCounts['Rejected']}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-start">
                    <div class="ms-2 me-auto"><div class="fw-bold">In Notice</div></div>
                    <span class="badge bg-warning text-dark rounded-pill">${statusCounts['In Notice']}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-start">
                    <div class="ms-2 me-auto"><div class="fw-bold">Joined</div></div>
                    <span class="badge bg-info text-dark rounded-pill">${statusCounts['Joined']}</span>
                </li>
            </ol>
        `;
    }

    // Render Chart if in Chart View
    const ctx = document.getElementById('applicationStatusChart');
    if (ctx && document.getElementById('viewType').value === 'chart') {
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js is not loaded, skipping application status chart rendering');
            return;
        }

        if (window.applicationStatusChartInstance) {
            window.applicationStatusChartInstance.destroy();
        }
        window.applicationStatusChartInstance = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: [
                        '#4f46e5',
                        '#10b981',
                        '#ef4444',
                        '#f59e0b',
                        '#3b82f6'
                    ],
                    maxBarThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
}

function updateReferenceFeedbackChart(data) {
    const feedbackCounts = {
        'All 3 Given': 0,
        '2 Given': 0,
        '1 Given': 0,
        '0 Given': 0
    };

    data.forEach(candidate => {
        const feedback = candidate['Reference Feedback'] || '';
        const count = feedback.split(',').filter(f => f.trim()).length;
        switch (count) {
            case 3:
                feedbackCounts['All 3 Given']++;
                break;
            case 2:
                feedbackCounts['2 Given']++;
                break;
            case 1:
                feedbackCounts['1 Given']++;
                break;
            default:
                feedbackCounts['0 Given']++;
        }
    });

    const ctx = document.getElementById('referenceFeedbackChart');
    if (!ctx) return;

    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js is not loaded, skipping reference feedback chart rendering');
        return;
    }

    // Destroy existing chart if it exists
    if (window.referenceFeedbackChartInstance) {
        window.referenceFeedbackChartInstance.destroy();
    }

    window.referenceFeedbackChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: Object.keys(feedbackCounts),
            datasets: [{
                data: Object.values(feedbackCounts),
                backgroundColor: [
                    '#10b981',
                    '#3b82f6',
                    '#f59e0b',
                    '#ef4444'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function updateOverallDistributionChart(data) {
    const months = {};
    data.forEach(candidate => {
        const date = new Date(candidate.Timestamp);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!months[monthKey]) {
            months[monthKey] = 0;
        }
        months[monthKey]++;
    });

    const ctx = document.getElementById('overallDistributionChart');
    if (!ctx) return;

    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js is not loaded, skipping overall distribution chart rendering');
        return;
    }

    // Destroy existing chart if it exists
    if (window.overallDistributionChartInstance) {
        window.overallDistributionChartInstance.destroy();
    }

    window.overallDistributionChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(months),
            datasets: [{
                data: Object.values(months),
                backgroundColor: [
                    '#4f46e5',
                    '#10b981',
                    '#ef4444',
                    '#f59e0b',
                    '#3b82f6',
                    '#8b5cf6',
                    '#ec4899',
                    '#14b8a6',
                    '#f43f5e',
                    '#84cc16',
                    '#06b6d4',
                    '#6366f1'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Chart instances for new analytics
let interviewStatusChart = null;
let locationPreferenceChart = null;
let experienceChart = null;
let referralSourceChart = null;
let noticePeriodChart = null;
let monthlyTrendsChart = null;

// Interview Status Pie Chart
function updateInterviewStatusChart(data) {
    const statusCounts = {};

    data.forEach(candidate => {
        const status = candidate['Interview Status'] || 'Not Specified';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const ctx = document.getElementById('interviewStatusChart');
    if (!ctx) return;

    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js is not loaded, skipping interview status chart rendering');
        return;
    }

    if (interviewStatusChart) {
        interviewStatusChart.destroy();
    }

    interviewStatusChart = new Chart(ctx.getContext('2d'), {
        type: 'pie',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: [
                    '#4f46e5', '#10b981', '#ef4444', '#f59e0b', '#3b82f6',
                    '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#84cc16'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}


// Experience Level Chart
function updateExperienceChart(data) {
    const experienceCounts = {};

    data.forEach(candidate => {
        const exp = candidate['Total Years of Experience'] || 'Not Specified';
        experienceCounts[exp] = (experienceCounts[exp] || 0) + 1;
    });

    const ctx = document.getElementById('experienceChart');
    if (!ctx) return;

    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js is not loaded, skipping experience chart rendering');
        return;
    }

    if (experienceChart) {
        experienceChart.destroy();
    }

    experienceChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: Object.keys(experienceCounts),
            datasets: [{
                label: 'Candidates',
                data: Object.values(experienceCounts),
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}



// Referral Source Chart
function updateReferralSourceChart(data) {
    const referralCounts = {};

    data.forEach(candidate => {
        const referral = candidate['Referred By'] || 'Not Specified';
        referralCounts[referral] = (referralCounts[referral] || 0) + 1;
    });

    const ctx = document.getElementById('referralSourceChart');
    if (!ctx) return;

    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js is not loaded, skipping referral source chart rendering');
        return;
    }

    if (referralSourceChart) {
        referralSourceChart.destroy();
    }

    referralSourceChart = new Chart(ctx.getContext('2d'), {
        type: 'pie',
        data: {
            labels: Object.keys(referralCounts),
            datasets: [{
                data: Object.values(referralCounts),
                backgroundColor: [
                    '#4f46e5', '#10b981', '#ef4444', '#f59e0b', '#3b82f6',
                    '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#84cc16'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Notice Period Chart
function updateNoticePeriodChart(data) {
    const noticeCounts = {};

    data.forEach(candidate => {
        const notice = candidate['Notice Period'] || 'Not Specified';
        noticeCounts[notice] = (noticeCounts[notice] || 0) + 1;
    });

    const ctx = document.getElementById('noticePeriodChart');
    if (!ctx) return;

    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js is not loaded, skipping notice period chart rendering');
        return;
    }

    if (noticePeriodChart) {
        noticePeriodChart.destroy();
    }

    noticePeriodChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: Object.keys(noticeCounts),
            datasets: [{
                label: 'Candidates',
                data: Object.values(noticeCounts),
                backgroundColor: 'rgba(245, 158, 11, 0.6)',
                borderColor: 'rgba(245, 158, 11, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Monthly Trends Line Chart
function updateMonthlyTrendsChart(data) {
    const monthlyData = {};

    data.forEach(candidate => {
        let dateStr = candidate['Date'] || candidate['Timestamp'] || '';
        if (!dateStr) return;

        // Parse date - handle different formats
        let date;
        if (dateStr.includes(' ')) {
            dateStr = dateStr.split(' ')[0]; // Take only date part
        }
        date = new Date(dateStr);

        if (isNaN(date.getTime())) return;

        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                total: 0,
                accepted: 0,
                rejected: 0
            };
        }

        monthlyData[monthKey].total++;
        const status = candidate['Application Status'];
        if (status === 'Accepted') {
            monthlyData[monthKey].accepted++;
        } else if (status === 'Rejected') {
            monthlyData[monthKey].rejected++;
        }
    });

    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA - dateB;
    });

    const ctx = document.getElementById('monthlyTrendsChart');
    if (!ctx) return;

    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js is not loaded, skipping monthly trends chart rendering');
        return;
    }

    if (monthlyTrendsChart) {
        monthlyTrendsChart.destroy();
    }

    monthlyTrendsChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: sortedMonths,
            datasets: [
                {
                    label: 'Total Applications',
                    data: sortedMonths.map(month => monthlyData[month].total),
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    fill: true
                },
                {
                    label: 'Accepted',
                    data: sortedMonths.map(month => monthlyData[month].accepted),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true
                },
                {
                    label: 'Rejected',
                    data: sortedMonths.map(month => monthlyData[month].rejected),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    refreshData();
});

// Update the existing refreshData function to include analytics updates
async function refreshData() {
    try {
        // Add cache-busting parameter to prevent browser caching
        const cacheBuster = `?_t=${new Date().getTime()}`;
        const response = await fetch(API_BASE_URL + '/api/data' + cacheBuster);
        const data = await response.json();



        // Store original data when refreshed
        originalTableData = JSON.parse(JSON.stringify(data.data)); // Deep copy
        currentIsAdmin = data.is_admin;
        updateAdminControls(data.is_admin);

        // Apply current filter if any
        const positionFilterElement = document.getElementById('positionFilter');
        const statusFilterElement = document.getElementById('statusFilter');
        const hasPositionFilter = positionFilterElement && positionFilterElement.value;
        const hasStatusFilter = statusFilterElement && statusFilterElement.value;
        if (hasPositionFilter || hasStatusFilter) {
            applyTableFilters();
        } else {
            // Update table
            populateTable(data.data, data.is_admin);
        }

        // Update analytics if on analytics tab
        if (document.getElementById('analysisTab') && document.getElementById('analysisTab').classList.contains('active')) {

            updateMonthlyStats(data.data);
            updateApplicationStatusChart(data.data);
            updateOfferDetails(data.data);
            // Update remaining analytics charts
            // updatePositionChart(data.data); // Removed
        }
    } catch (error) {
        console.error('Error refreshing data:', error);
        showToast('Error refreshing data', 'danger');
    }
}

// Update the existing showCandidateDetails function to format dates consistently
function showCandidateDetails(candidate, index, isAdmin) {
    const modal = document.getElementById('candidateDetailModal');
    const content = document.getElementById('candidateDetailContent');

    // Format the content with consistent date formatting
    let detailsHTML = '';

    // Show only user-visible columns for non-admin; full order for admin
    let fieldsToDisplay = isAdmin ? FIELD_ORDER : ['Date', 'Name', 'Email ID', 'Interested Position', 'Current Role', 'Current Organization', 'Current Location', 'Resume', 'Referred By', 'Interview Status', 'Application Status', 'Remarks', 'Initial Screening', 'Round 1 Remarks', 'Round 2 Remarks'];

    // Define editable fields based on user role
    // Non-admin users can edit only Initial Screening and Round 1 Remarks
    const editableFields = isAdmin ? null : ['Initial Screening', 'Round 1 Remarks']; // null means all fields editable for admin

    // Add primary fields first
    fieldsToDisplay.forEach(field => {
        if (candidate[field] !== undefined) {
            let value = candidate[field];
            let displayValue = formatFieldValue(field, value);
            let inputType = 'text'; // Default input type

            if (field === 'Timestamp') {
                displayValue = new Date(value).toLocaleDateString();
                // Date field is not directly editable as a text input in this context,
                // it's derived from the original data.
                // For now, we'll keep it as display only.
                // For now, we'll keep it as display only.
                let label = field;
                if (field === 'Round 1 D and T') label = 'Round 1 D&T';
                if (field === 'Round 2 D and T') label = 'Round 2 D&T';

                detailsHTML += `
                    <div class="candidate-detail-item">
                        <span class="candidate-detail-label">${label}:</span>
                        <span class="candidate-detail-value">${displayValue}</span>
                    </div>
                `;
            } else {
                // Special handling for Resume and LinkedIn Profile
                if (field === 'Resume') {
                    const resumeValue = candidate[field] ? candidate[field].toString() : '';
                    if (resumeValue && (resumeValue.startsWith('http') || resumeValue.toLowerCase().endsWith('.pdf'))) {
                        const isEditable = editableFields === null || editableFields.includes(field);
                        let label = field;
                        const linkHref = resumeValue.startsWith('http') ? resumeValue : `/uploads/${resumeValue}`;
                        detailsHTML += `
                            <div class="candidate-detail-item" data-candidate-index="${index}" data-field-name="${field}" data-editable="${isEditable}">
                                <span class="candidate-detail-label">${label}:</span>
                                <span class="candidate-detail-value display-mode" id="display-${field.replace(/\s/g, '')}">
                                    <a href="${linkHref}" target="_blank" class="btn btn-outline-primary btn-sm">
                                        <i class="bi bi-file-earmark-pdf me-1"></i>View Resume
                                    </a>
                                </span>
                                <input type="file" accept=".pdf" class="form-control edit-mode" id="input-${field.replace(/\s/g, '')}" style="display: none;" ${!isEditable ? 'disabled' : ''}>
                            </div>
                        `;
                    } else {
                        // Handle empty or non-link resume field
                        const isEditable = editableFields === null || editableFields.includes(field);
                        let label = field;
                        detailsHTML += `
                            <div class="candidate-detail-item" data-candidate-index="${index}" data-field-name="${field}" data-editable="${isEditable}">
                                <span class="candidate-detail-label">${label}:</span>
                                <span class="candidate-detail-value display-mode" id="display-${field.replace(/\s/g, '')}">
                                    ${displayValue}
                                </span>
                                <input type="file" accept=".pdf" class="form-control edit-mode" id="input-${field.replace(/\s/g, '')}" style="display: none;" ${!isEditable ? 'disabled' : ''}>
                            </div>
                        `;
                    }
                } else if (field === 'LinkedIn Profile' && candidate[field] && candidate[field].toString().startsWith('http')) {
                    const isEditable = editableFields === null || editableFields.includes(field);
                    let label = field;
                    detailsHTML += `
                        <div class="candidate-detail-item" data-candidate-index="${index}" data-field-name="${field}" data-editable="${isEditable}">
                            <span class="candidate-detail-label">${label}:</span>
                            <span class="candidate-detail-value display-mode" id="display-${field.replace(/\s/g, '')}">
                                <a href="${candidate[field]}" target="_blank" class="btn btn-outline-primary btn-sm">
                                    <i class="bi bi-linkedin me-1"></i>View LinkedIn
                                </a>
                            </span>
                            <input type="url" class="form-control edit-mode" id="input-${field.replace(/\s/g, '')}" value="${displayValue}" style="display: none;" ${!isEditable ? 'readonly' : ''} maxlength="120">
                        </div>
                    `;
                } else if (field === 'Interview Status' || field === 'Application Status' || field === 'Reject Mail Sent') {
                    const isEditable = editableFields === null || editableFields.includes(field);
                    // Always show as dropdown; disable for non-admin users
                    const statusOptions = dropdownOptions[field] || [];
                    let optionsHTML = '';

                    // Add empty/null option for Reject Mail Sent
                    if (field === 'Reject Mail Sent') {
                        const emptySelected = !candidate[field] || candidate[field] === '' ? 'selected' : '';
                        optionsHTML += `<option value="" ${emptySelected}></option>`;
                    }

                    statusOptions.forEach(option => {
                        const selected = candidate[field] === option ? 'selected' : '';
                        optionsHTML += `<option value="${option}" ${selected}>${option}</option>`;
                    });

                    detailsHTML += `
                        <div class="candidate-detail-item" data-candidate-index="${index}" data-field-name="${field}" data-editable="${isEditable}">
                            <span class="candidate-detail-label">${field}:</span>
                            <select class="form-select" id="input-${field.replace(/\s/g, '')}" ${!isEditable ? 'disabled style="background-color: #e9ecef; cursor: not-allowed;"' : ''}>
                                ${optionsHTML}
                            </select>
                        </div>
                    `;
                } else if (field === 'Round 1 Remarks') {
                    const isEditable = editableFields === null || editableFields.includes(field);
                    detailsHTML += `
                        <div class="candidate-detail-item" data-candidate-index="${index}" data-field-name="${field}" data-editable="${isEditable}">
                            <span class="candidate-detail-label">Round 1 Feedback:</span>
                            <span class="candidate-detail-value">
                                <button type="button" class="btn btn-sm" data-round="1">
                                    click here to fill feedback
                                </button>
                            </span>
                        </div>
                    `;
                } else if (field === 'Round 2 Remarks') {
                    const isEditable = editableFields === null || editableFields.includes(field);
                    const disabledAttribute = isAdmin ? '' : 'disabled';
                    const tooltipAttribute = isAdmin ? '' : 'title="Only administrators can edit Round 2 Remarks"';
                    detailsHTML += `
                        <div class="candidate-detail-item" data-candidate-index="${index}" data-field-name="${field}" data-editable="${isEditable}">
                            <span class="candidate-detail-label">Round 2 Feedback:</span>
                            <span class="candidate-detail-value">
                                <button type="button" class="btn btn-sm" ${disabledAttribute} ${tooltipAttribute} data-round="2">
                                    click here to fill feedback
                                </button>
                            </span>
                        </div>
                    `;
                } else {
                    // Determine input type for other fields
                    if (field.includes('CTC') || field.includes('Years') || field.includes('Notice')) {
                        inputType = 'number';
                    } else if (field === 'Resume' || field === 'LinkedIn Profile') {
                        inputType = 'url';
                    }

                    // Check if field is editable
                    const isEditable = editableFields === null || editableFields.includes(field);
                    const editableClass = isEditable ? 'editable-field' : 'readonly-field';
                    const cursorStyle = isEditable ? 'cursor: pointer;' : 'cursor: default;';

                    let label = field;
                    if (field === 'Round 1 D and T') label = 'Round 1 D&T';
                    if (field === 'Round 2 D and T') label = 'Round 2 D&T';

                    detailsHTML += `
                        <div class="candidate-detail-item" data-candidate-index="${index}" data-field-name="${field}" data-editable="${isEditable}">
                            <span class="candidate-detail-label">${label}:</span>
                            <span class="candidate-detail-value display-mode ${editableClass}" id="display-${field.replace(/\s/g, '')}" style="${cursorStyle}">${displayValue}</span>
                            <input type="${inputType}" class="form-control edit-mode" id="input-${field.replace(/\s/g, '')}" value="${displayValue}" style="display: none;" ${!isEditable ? 'readonly' : ''} maxlength="120">
                        </div>
                    `;
                }
            }
        }
    });

    // Add remaining fields (if any) for all users
    {
        Object.entries(candidate).forEach(([field, value]) => {
            if (!FIELD_ORDER.includes(field) && field !== 'Remarks') { // Exclude Remarks as it's handled separately
                let displayValue = formatFieldValue(field, value);
                let inputType = 'text';

                if (field === 'Timestamp') {
                    displayValue = new Date(value).toLocaleDateString();
                    detailsHTML += `
                        <div class="candidate-detail-item" data-candidate-index="${index}">
                            <span class="candidate-detail-label">${field}:</span>
                            <span class="candidate-detail-value">${displayValue}</span>
                        </div>
                    `;

                } else {
                    // Check if field is editable (for remaining fields, only editable if admin)
                    const isEditable = isAdmin;
                    const editableClass = isEditable ? 'editable-field' : 'readonly-field';
                    const cursorStyle = isEditable ? 'cursor: pointer;' : 'cursor: default;';

                    detailsHTML += `
                    <div class="candidate-detail-item" data-candidate-index="${index}" data-field-name="${field}" data-editable="${isEditable}">
                        <span class="candidate-detail-label">${field}:</span>
                        <span class="candidate-detail-value display-mode ${editableClass}" id="display-${field.replace(/\s/g, '')}" style="${cursorStyle}">${displayValue}</span>
                        <input type="${inputType}" class="form-control edit-mode" id="input-${field.replace(/\s/g, '')}" value="${displayValue}" style="display: none;" ${!isEditable ? 'readonly' : ''} maxlength="120">
                        </div>
                    `;
                }
            }
        });
    }

    content.innerHTML = detailsHTML;

    // Add event listeners for inline editing
    // Removed direct click and blur event listeners to prevent double-click editing issues
    // Editing now only happens through the main Edit/Save buttons
    document.querySelectorAll('.candidate-detail-item').forEach(item => {
        const displaySpan = item.querySelector('.candidate-detail-value');
        const editInput = item.querySelector('.edit-mode');
        const fieldName = item.querySelector('.candidate-detail-label').textContent.replace(':', '').trim();
        const isEditable = item.dataset.editable === 'true';
        const isStatusField = fieldName === 'Interview Status' || fieldName === 'Application Status';

        // Handle status fields (always visible as dropdowns)
        if (isStatusField) {
            const statusSelect = item.querySelector('select');
            if (statusSelect && isEditable) {
                statusSelect.addEventListener('change', function () {
                    if (this.value === 'Offer') {
                        showOfferDetailsModal(candidate, index);
                    }
                });
            }
        } else {
            // Handle other fields - editing only through the main Edit/Save buttons
            // All editing is now controlled by the main Edit/Save buttons only
            // Removed the direct click listener that was triggering edit mode on any click
            // Removed the editInput blur listener that was saving on blur
            // Editing now only happens through the main Edit/Save buttons
            if (displaySpan && editInput && isEditable) {
                // Event listeners removed:
                // 1. displaySpan click listener that was triggering edit mode on any click
                // 2. editInput blur listener that was saving on blur
                // Editing now only happens through the main Edit/Save buttons
            }
        }
    });


    // Attach event listeners to the remarks buttons
    document.querySelectorAll('.candidate-detail-item button[data-round]').forEach(button => {
        button.addEventListener('click', () => {
            const round = button.dataset.round;
            if (round === '1') {
                showRound1RemarksModal(candidate, index);
            } else if (round === '2') {
                showRound2RemarksModal(candidate, index);
            }
        });
    });

    // Add Remarks section only if admin or 'Remarks' is part of user-visible columns
    if (isAdmin || fieldsToDisplay.includes('Remarks')) {
        const remarksSection = document.createElement('div');
        remarksSection.className = 'candidate-detail-item';
        remarksSection.innerHTML = `
            <span class="candidate-detail-label">Remarks:</span>
            <textarea id="candidateRemarks" class="form-control edit-mode" rows="3" maxlength="120">${candidate.Remarks || ''}</textarea>
        `;
        content.appendChild(remarksSection);
    }

    // Get button references
    const editRemarksBtn = document.getElementById('editRemarksBtn');
    const saveRemarksBtn = document.getElementById('saveRemarksBtn');
    const candidateRemarks = document.getElementById('candidateRemarks');

    // Function to toggle edit mode for all fields
    function toggleEditMode(isEditing, isAdmin) {
        // Define editable fields for non-admin users
        const editableFieldsForUser = ['Initial Screening', 'Round 1 Remarks'];

        document.querySelectorAll('.candidate-detail-item').forEach(item => {
            const displaySpan = item.querySelector('.display-mode');
            const editInput = item.querySelector('.edit-mode');
            const selectInput = item.querySelector('select'); // For status dropdowns
            const isEditable = item.dataset.editable === 'true';
            const fieldLabel = item.querySelector('.candidate-detail-label');
            const fieldName = fieldLabel ? fieldLabel.textContent.replace(':', '').trim() : '';

            // For non-admin users, only allow editing of specific fields
            if (!isAdmin && !editableFieldsForUser.includes(fieldName)) {
                // Keep non-editable fields as read-only display
                if (displaySpan) {
                    displaySpan.style.display = 'block';
                }
                if (editInput) {
                    editInput.style.display = 'none';
                    editInput.setAttribute('readonly', true);
                }
                if (selectInput) {
                    selectInput.setAttribute('disabled', true);
                    selectInput.style.backgroundColor = '#e9ecef';
                    selectInput.style.cursor = 'not-allowed';
                }
                return; // Skip non-editable fields for non-admin users
            }

            // Handle editable fields
            if (displaySpan && editInput) {
                if (isEditing) {
                    displaySpan.style.display = 'none';
                    editInput.style.display = 'block';
                    editInput.removeAttribute('readonly');
                    editInput.removeAttribute('disabled');
                } else {
                    displaySpan.style.display = 'block';
                    editInput.style.display = 'none';
                    // Update display value based on field type
                    if (fieldName === 'Resume') {
                        // For resume, we don't update display from file input directly as we can't get path
                        // Ideally we should reload data, but for now we just show existing link if it exists
                        // The file upload happens on save
                    } else if (fieldName === 'LinkedIn Profile' && editInput.value && editInput.value.toString().startsWith('http')) {
                        displaySpan.innerHTML = `<a href="${editInput.value}" target="_blank" class="btn btn-outline-primary btn-sm">
                            <i class="bi bi-linkedin me-1"></i>View LinkedIn
                        </a>`;
                    } else {
                        displaySpan.textContent = editInput.value;
                    }
                }
            } else if (selectInput) {
                // Handle status dropdowns - only editable for admin or if field is in editableFieldsForUser
                if (isEditing && (isAdmin || editableFieldsForUser.includes(fieldName))) {
                    selectInput.removeAttribute('disabled');
                    selectInput.style.backgroundColor = '';
                    selectInput.style.cursor = '';
                } else {
                    if (!isAdmin && !editableFieldsForUser.includes(fieldName)) {
                        selectInput.setAttribute('disabled', true);
                        selectInput.style.backgroundColor = '#e9ecef';
                        selectInput.style.cursor = 'not-allowed';
                    }
                }
            }
        });

        // Handle Remarks field separately (only if present)
        if (isEditing) {
            editRemarksBtn.style.display = 'none';
            saveRemarksBtn.style.display = 'block';
            if (candidateRemarks) {
                candidateRemarks.removeAttribute('readonly');
                candidateRemarks.focus();
            }
        } else {
            editRemarksBtn.style.display = 'block';
            saveRemarksBtn.style.display = 'none';
            if (candidateRemarks) {
                candidateRemarks.setAttribute('readonly', true);
            }
            // Implement logic to save all updated fields to the backend
            const updatedCandidate = {};
            document.querySelectorAll('.candidate-detail-item').forEach(item => {
                const fieldNameElement = item.querySelector('.candidate-detail-label');
                if (fieldNameElement) {
                    let fieldName = fieldNameElement.textContent.replace(':', '').trim();

                    // Map display names back to data keys if needed
                    if (fieldName === 'Round 1 Feedback') fieldName = 'Round 1 Remarks';
                    if (fieldName === 'Round 2 Feedback') fieldName = 'Round 2 Remarks';
                    if (fieldName === 'Round 1 D&T') fieldName = 'Round 1 D and T';
                    if (fieldName === 'Round 2 D&T') fieldName = 'Round 2 D and T';

                    const editInput = item.querySelector('.edit-mode');
                    const selectInput = item.querySelector('select');

                    // Collect values from ALL inputs, not just visible ones
                    // (inputs are hidden when save is clicked, but we still need their values)
                    if (editInput) {
                        updatedCandidate[fieldName] = editInput.value;
                    } else if (selectInput) {
                        updatedCandidate[fieldName] = selectInput.value;
                    }
                }
            });
            if (candidateRemarks) {
                updatedCandidate.Remarks = candidateRemarks.value;
            }



            // Assuming the candidate object passed to showCandidateDetails has an 'originalIndex' or similar identifier
            // For now, we'll use the index from the global candidates array if available, or pass it from the table click event.
            // Let's assume for now that `candidate` object has an `id` or `index` property that can be used to identify it.
            // For this implementation, I'll assume the `candidate` object passed to `showCandidateDetails` has an `index` property.
            const candidateIndex = index; // This needs to be passed correctly from the table row click

            if (candidateIndex !== undefined) {
                fetch(API_BASE_URL + `/api/data/${candidateIndex}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedCandidate),
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'success') {
                            showToast('Candidate updated successfully!', 'success');

                            bootstrap.Modal.getInstance(modal).hide(); // Close the modal
                            // Add a small delay to ensure backend has finished writing to Excel file
                            setTimeout(() => {
                                refreshData(); // Refresh table
                            }, 300);
                        } else {
                            showToast(`Error updating candidate: ${data.message}`, 'danger');
                        }
                    })
                    .catch(error => {
                        console.error('Error saving candidate:', error);
                        showToast('Error saving candidate.', 'danger');
                    });
            } else {
                console.error('Candidate index not found for saving.');
                showToast('Error: Candidate index not found.', 'danger');
            }
        }
    }

    // Set initial button state
    editRemarksBtn.style.display = 'block';
    saveRemarksBtn.style.display = 'none';

    // Add event listeners for edit and save buttons
    editRemarksBtn.onclick = () => toggleEditMode(true, isAdmin);
    saveRemarksBtn.onclick = () => toggleEditMode(false, isAdmin);

    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Global variable to track the current candidate being edited in remarks modal
let currentRemarksCandidateIndex = null;
let currentRemarksValue = null;

// Function to show remarks detail in popup modal
function showRemarksDetail(remarks, candidateIndex, isAdmin) {
    const modalContent = document.getElementById('remarksDetailContent');
    const saveBtn = document.getElementById('saveRemarksInModal');

    if (modalContent && saveBtn) {
        // Store the current candidate index and remarks value
        currentRemarksCandidateIndex = candidateIndex;
        currentRemarksValue = remarks;

        // Display the remarks text field directly for editing
        modalContent.innerHTML = `
            <div class="mb-3">
                <label for="remarksTextArea" class="form-label">Remarks:</label>
                <textarea class="form-control" id="remarksTextArea" rows="5" ${isAdmin ? '' : 'readonly'} maxlength="120">${remarks || ''}</textarea>
            </div>
        `;

        // Add event listener for save button
        if (isAdmin) {
            saveBtn.onclick = saveRemarksFromModal;
            saveBtn.style.display = 'block';
        } else {
            saveBtn.style.display = 'none';
        }

        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('remarksDetailModal'));
        modal.show();
    }
}

// Function to show Initial Screening detail in popup modal
function showInitialScreeningModal(row, candidateIndex) {
    const modalContent = document.getElementById('initialScreeningDetailContent');
    const saveBtn = document.getElementById('saveInitialScreeningInModal');
    const initialScreeningValue = row['Initial Screening'] || row['Initial Remarks'] || '';

    if (modalContent && saveBtn) {
        // Display the initial screening text field directly for editing
        modalContent.innerHTML = `
            <div class="mb-3">
                <label for="initialScreeningTextArea" class="form-label">Initial Screening:</label>
                <textarea class="form-control" id="initialScreeningTextArea" rows="5" maxlength="120">${initialScreeningValue}</textarea>
            </div>
        `;

        // Add event listener for save button
        saveBtn.onclick = () => saveInitialScreeningFromModal(candidateIndex);
        saveBtn.style.display = 'block';

        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('initialScreeningDetailModal'));
        modal.show();
    }
}

// Placeholder for saveInitialScreeningFromModal - you'll need to implement this
function saveInitialScreeningFromModal(candidateIndex) {
    const initialScreeningTextArea = document.getElementById('initialScreeningTextArea');
    const newValue = initialScreeningTextArea ? initialScreeningTextArea.value : '';

    const updatedData = { 'Initial Screening': newValue };

    fetch(API_BASE_URL + `/api/data/${candidateIndex}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showToast('Initial Screening updated successfully!', 'success');
                // Update the table data locally
                if (tableData[candidateIndex]) {
                    tableData[candidateIndex]['Initial Screening'] = newValue;
                }
                // Also update original data
                if (originalTableData[candidateIndex]) {
                    originalTableData[candidateIndex]['Initial Screening'] = newValue;
                }

                // Update the table cell directly
                updateInitialScreeningTableCell(candidateIndex, newValue);

                const modalElement = document.getElementById('initialScreeningDetailModal');
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }
            } else {
                showToast(`Error updating initial screening: ${data.message}`, 'danger');
            }
        })
        .catch(error => {
            console.error('Error saving initial screening:', error);
            showToast('Error saving initial screening.', 'danger');
        });
}

// Function to show Round 1 D&T detail in popup modal
function showRound1DAndTModal(row, candidateIndex) {
    const modalContent = document.getElementById('round1DAndTDetailContent');
    const saveBtn = document.getElementById('saveRound1DAndTInModal');
    const r1dandtValue = row['Round 1 D and T'] || '';

    if (modalContent && saveBtn) {
        modalContent.innerHTML = `
            <div class="mb-3">
                <label for="round1DAndTTextArea" class="form-label">Round 1 D&T:</label>
                <textarea class="form-control" id="round1DAndTTextArea" rows="10" maxlength="120">${r1dandtValue}</textarea>
            </div>
        `;

        saveBtn.onclick = () => saveRoundDAndTFromModal(candidateIndex, 'Round 1 D and T', 'round1DAndTTextArea', 'round1DAndTDetailModal');
        saveBtn.style.display = 'block';

        const modal = new bootstrap.Modal(document.getElementById('round1DAndTDetailModal'));
        modal.show();
    }
}

// Function to show Round 2 D&T detail in popup modal
function showRound2DAndTModal(row, candidateIndex) {
    const modalContent = document.getElementById('round2DAndTDetailContent');
    const saveBtn = document.getElementById('saveRound2DAndTInModal');
    const r2dandtValue = row['Round 2 D and T'] || '';

    if (modalContent && saveBtn) {
        modalContent.innerHTML = `
            <div class="mb-3">
                <label for="round2DAndTTextArea" class="form-label">Round 2 D&T:</label>
                <textarea class="form-control" id="round2DAndTTextArea" rows="10" maxlength="120">${r2dandtValue}</textarea>
            </div>
        `;

        saveBtn.onclick = () => saveRoundDAndTFromModal(candidateIndex, 'Round 2 D and T', 'round2DAndTTextArea', 'round2DAndTDetailModal');
        saveBtn.style.display = 'block';

        const modal = new bootstrap.Modal(document.getElementById('round2DAndTDetailModal'));
        modal.show();
    }
}

// Generic function to save Round D&T data from the modal
function saveRoundDAndTFromModal(candidateIndex, columnName, textAreaId, modalId) {
    const textArea = document.getElementById(textAreaId);
    const newValue = textArea ? textArea.value : '';

    const updatedData = { [columnName]: newValue };

    fetch(API_BASE_URL + `/api/data/${candidateIndex}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showToast(`${columnName} updated successfully!`, 'success');
                // Update the table data locally
                if (tableData[candidateIndex]) {
                    tableData[candidateIndex][columnName] = newValue;
                }
                // Also update original data
                if (originalTableData[candidateIndex]) {
                    originalTableData[candidateIndex][columnName] = newValue;
                }

                // Re-populate the table to reflect changes (especially for paragraph formatting)
                populateTable(tableData, currentIsAdmin);

                const modalElement = document.getElementById(modalId);
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }
            } else {
                showToast(`Error updating ${columnName}: ${data.message}`, 'danger');
            }
        })
        .catch(error => {
            console.error(`Error saving ${columnName}:`, error);
            showToast(`Error saving ${columnName}.`, 'danger');
        });
}

// Function to save remarks from the modal
function saveRemarksFromModal() {
    const remarksTextArea = document.getElementById('remarksTextArea');
    const newRemarksValue = remarksTextArea ? remarksTextArea.value : '';

    if (currentRemarksCandidateIndex === null) return;

    const updatedData = { Remarks: newRemarksValue };

    fetch(API_BASE_URL + `/api/data/${currentRemarksCandidateIndex}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showToast('Remarks updated successfully!', 'success');
                // Update the table data
                if (tableData[currentRemarksCandidateIndex]) {
                    tableData[currentRemarksCandidateIndex].Remarks = newRemarksValue;
                }
                // Also update original data
                if (originalTableData[currentRemarksCandidateIndex]) {
                    originalTableData[currentRemarksCandidateIndex].Remarks = newRemarksValue;
                }

                // Update the table cell directly
                updateRemarksTableCell(currentRemarksCandidateIndex, newRemarksValue);

                // Close the modal
                const modalElement = document.getElementById('remarksDetailModal');
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }
            } else {
                showToast(`Error updating remarks: ${data.message}`, 'danger');
            }
        })
        .catch(error => {
            console.error('Error saving remarks:', error);
            showToast('Error saving remarks.', 'danger');
        });
}

// Function to update the Remarks table cell directly
function updateRemarksTableCell(candidateIndex, newRemarksValue) {
    // Find the Remarks cell using the data attribute
    const remarksCell = document.querySelector(`td[data-candidate-index="${candidateIndex}"]`);
    if (remarksCell) {
        remarksCell.textContent = newRemarksValue || '';
    }
}

// Helper function to show toast notifications
function showToast(message, type) {
    const toastContainer = document.createElement('div');
    toastContainer.className = `toast position-fixed top-0 end-0 m-3 text-white bg-${type} border-0`;
    toastContainer.role = 'alert';
    toastContainer.ariaLive = 'assertive';
    toastContainer.ariaAtomic = 'true';
    toastContainer.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    document.body.appendChild(toastContainer);
    const toast = new bootstrap.Toast(toastContainer);
    toast.show();
    // Remove toast after it hides
    toastContainer.addEventListener('hidden.bs.toast', () => {
        toastContainer.remove();
    });
}

// Helper to consistently format field values in candidate details
function formatFieldValue(field, value) {
    // Normalize date display for 'Date' and 'Timestamp' fields
    if ((field === 'Date' || field === 'Timestamp') && typeof value === 'string') {
        const datePart = value.split(' ')[0];
        try {
            return new Date(datePart).toLocaleDateString();
        } catch (e) {
            return datePart;
        }
    }
    if (value === null || value === undefined) return '—';
    if (Array.isArray(value)) {
        const joined = value.filter(Boolean).join(', ');
        return joined || '—';
    }
    if (typeof value === 'number') {
        if (!isFinite(value)) return '—';
        const currencyFields = ['Current CTC per Annum', 'Expected CTC per Annum', 'Offered CTC'];
        if (currencyFields.includes(field)) {
            return Number(value).toLocaleString('en-IN');
        }
        return String(value);
    }
    if (typeof value === 'string') {
        const v = value.trim();
        if (!v || ['nil', 'null', 'nan'].includes(v.toLowerCase())) return '—';
        return v;
    }
    try {
        return String(value);
    } catch (e) {
        return '—';
    }
}


// Function to update Offer Details table
function updateOfferDetails(data) {

    const tbody = document.getElementById('offerDetailsBodyIndex');
    if (!tbody) {
        console.warn('offerDetailsBodyIndex not found');
        return;
    }

    tbody.innerHTML = '';

    // Filter candidates with Interview Status as 'Offer'
    const offers = data.filter(item => item['Interview Status'] === 'Offer');



    if (offers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No offer details available</td></tr>';
        return;
    }

    offers.forEach((item, index) => {
        // Find the original index of this item in the main data array
        // This is crucial for saving back to the correct record
        const originalIndex = data.indexOf(item);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item['Name'] || 'N/A'}</td>
            <td>${item['Interested Position'] || 'N/A'}</td>
            <td>
                <input type="text" 
                                 class="form-control form-control-sm offered-position-input" 
                                 value="${item['Offered Position'] || ''}" 
                                 data-candidate-index="${originalIndex}"
                                 maxlength="120">
            </td>
            <td>
                <input type="number" 
                                 class="form-control form-control-sm offered-ctc-input" 
                                 value="${item['Offered CTC'] || ''}" 
                                 data-candidate-index="${originalIndex}"
                                 maxlength="120">
            </td>
            <td>
                <input type="date" 
                                 class="form-control form-control-sm joining-date-input" 
                                 value="${item['Joining Date'] || ''}" 
                                 data-candidate-index="${originalIndex}"
                                 maxlength="120">
            </td>
        `;
        tbody.appendChild(row);
    });

    // Add event listeners to the new inputs
    document.querySelectorAll('.joining-date-input').forEach(input => {
        input.addEventListener('change', function () {
            const index = this.dataset.candidateIndex;
            const newDate = this.value;
            saveJoiningDate(index, newDate);
        });
    });

    document.querySelectorAll('.offered-position-input').forEach(input => {
        input.addEventListener('change', function () {
            const index = this.dataset.candidateIndex;
            const newPosition = this.value;
            saveOfferedPosition(index, newPosition);
        });
    });

    document.querySelectorAll('.offered-ctc-input').forEach(input => {
        input.addEventListener('change', function () {
            const index = this.dataset.candidateIndex;
            const newCTC = this.value;
            saveOfferedCTC(index, newCTC);
        });
    });
}

function saveOfferedCTC(index, newCTC) {

    if (!newCTC || isNaN(newCTC)) {
        showToast('Offered CTC must be a valid number.', 'danger');
        return;
    }
    const updatedData = { 'Offered CTC': newCTC };
    fetch(API_BASE_URL + `/api/data/${index}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showToast('Offered CTC updated successfully!', 'success');
            } else {
                showToast(`Error updating Offered CTC: ${data.message}`, 'danger');
            }
        })
        .catch(error => {
            console.error('Error saving Offered CTC:', error);
            showToast('Error saving Offered CTC.', 'danger');
        });
}

// Function to save Offered Position
function saveOfferedPosition(index, newPosition) {


    // Client-side validation
    if (!newPosition) {
        showToast('Offered Position cannot be empty.', 'danger');
        return;
    }

    const updatedData = {
        'Offered Position': newPosition
    };

    fetch(API_BASE_URL + `/api/data/${index}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showToast('Offered Position updated successfully!', 'success');
            } else {
                showToast(`Error updating Offered Position: ${data.message}`, 'danger');
            }
        })
        .catch(error => {
            console.error('Error saving Offered Position:', error);
            showToast('Error saving Offered Position.', 'danger');
        });
}

// Function to save Joining Date
function saveJoiningDate(index, newDate) {


    // Client-side validation
    if (!newDate) {
        showToast('Joining Date cannot be empty.', 'danger');
        return;
    }

    // Create the update object
    // We only send the field we want to update
    const updatedData = {
        'Joining Date': newDate
    };

    fetch(API_BASE_URL + `/api/data/${index}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showToast('Joining Date updated successfully!', 'success');
                // Optional: Refresh data to ensure consistency, but might be disruptive if typing
                // For now, we rely on the input value staying there. 
                // If we wanted to be super safe, we could refresh in background.
            } else {
                showToast(`Error updating Joining Date: ${data.message}`, 'danger');
            }
        })
        .catch(error => {
            console.error('Error saving Joining Date:', error);
            showToast('Error saving Joining Date.', 'danger');
        });
}
