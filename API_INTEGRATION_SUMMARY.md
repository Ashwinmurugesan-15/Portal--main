# Guhatek API Integration - Implementation Summary

## ✅ What Was Implemented

### 1. **Backend (Flask - `app.py`)**

#### TokenManager Class
- **Location**: Lines 84-131 in `app.py`
- **Features**:
  - Automatically fetches JWT token from Guhatek API
  - Caches token for 10 minutes (600 seconds)
  - Auto-refreshes token 30 seconds before expiry
  - Reuses valid tokens to minimize API calls

#### New API Endpoint: `/api/applicants`
- **Location**: Lines 676-782 in `app.py`
- **Method**: GET
- **Features**:
  - Fetches applicants from `https://api-dev.guhatek.org/api/applications`
  - Filters out records with null values (only includes complete records)
  - Transforms API response to match Excel format
  - Returns valid applicant count and total count
  - Handles timeouts (15 seconds) - suitable for slow dev cluster
  - Comprehensive error handling

#### Null Value Filtering
Records are only included if they have:
- `full_name` (not null/empty)
- `email` (not null/empty)
- `contact_number` (not null/empty)

### 2. **Frontend Updates**

#### New Button: `#fetchApiBtn`  
- **Location**: Line 945-947 in `index.html`
- **Style**: Green button with download cloud icon
- **Text**: "Fetch from API"

#### JavaScript Event Handler
- **Location**: Lines 182-217 in `app.js`
- **Features**:
  - Shows loading spinner while fetching
  - Disables button during fetch
  - Merges API data with existing table data
  - Displays success toast with count
  - Shows error toast on failure
  - Restores button state after completion

---

## 🔧 API Flow

```
User Clicks "Fetch from API"
    ↓
Frontend calls: GET /api/applicants
    ↓
Backend: TokenManager.get_token()
    ├─→ Token cached & valid? → Use it
    └─→ Token expired/missing? → Fetch new token
    ↓
Backend calls: GET https://api-dev.guhatek.org/api/applications
    ↓
Filter out null records
    ↓
Transform to Excel format
    ↓
Return to Frontend
    ↓
Merge with existing data & refresh table
```

---

## 📊 API Response Format

### From Guhatek API (Raw):
```json
{
  "data": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "contact_number": "9999999999",
      "interested_position": "SRE",
      "total_experience": 5,
      ...
    }
  ]
}
```

### Transformed to Excel Format:
```json
{
  "Date": "2025-12-23T00:00:00.000Z",
  "Name": "John Doe",
  "Email ID": "john@example.com",
  "Contact Number": "9999999999",
  "Interested Position": "SRE",
  "Total Years of Experience": "5",
  ...
}
```

---

## 🎯 Key Features

| Feature | Description |
|---------|-------------|
| **Token Reuse** | Token cached for 10 minutes, minimizing API calls |
| **Auto-Refresh** | Token refreshes 30 seconds before expiry |
| **Null Filtering** | Only valid, complete records are returned |
| **Error Handling** | Timeout, network errors, and API errors handled gracefully |
| **Loading State** | Button shows spinner and "Fetching..." during API call |
| **Data Merge** | New applicants added to existing table data |
| **Toast Notifications** | Success/error messages shown to user |

---

## 🧪 Testing

### Test the Integration:
1. **Run the application**: `python app.py`
2. **Login** to the portal
3. **Click "Fetch from API"** button
4. **Expected Result**:
   - Button shows loading spinner
   - Success toast: "Fetched X valid applicants from API (Y total)"
   - Table updates with new applicants
   - Only complete records (no nulls) are displayed

### Error Scenarios Handled:
- ❌ **API timeout** → Shows "Request timed out" message
- ❌ **Network error** → Shows "Failed to fetch applicants" message
- ❌ **Token fetch failure** → Logged to console, error returned to user

---

## 📝 Notes

1. **Dev Cluster is Slow**: The 15-second timeout accounts for this
2. **No Frontend Timeout**: As instructed, no frontend timeout is set
3. **Complete Records Only**: Filters out the many null/incomplete submissions from the API
4. **Non-Destructive Merge**: API data is merged with existing Excel data (doesn't replace it)

---

## 🔐 Security

- API key is stored in backend (`guhatek-job-applicant`)
- Token is managed server-side
- Frontend never sees API credentials
- Authentication required to call `/api/applicants`

---

## 🔄 UPDATE Integration (PATCH API) - Added January 8, 2026

### What Was Implemented

#### Backend Updates (`app.py`)

1. **Field Mapping (Lines 133-172)**
   - `PORTAL_TO_API_FIELD_MAP`: Maps portal field names to API camelCase format
   - Handles conversions: strings, booleans (Yes/No → true/false), numbers

2. **Helper Functions (Lines 174-265)**
   - `convert_portal_to_api_payload()`: Converts portal data to API format
   - `update_applicant_via_api()`: Calls PATCH endpoint with proper auth

3. **Enhanced GET `/api/data` (Lines 605-650)**
   - Now includes `_api_id` field in response for each applicant
   - Maps additional fields from API response (screening data, etc.)

4. **Enhanced PUT `/api/data/<index>` (Lines 824-932)**
   - Extracts `_api_id` from request payload
   - Calls Guhatek PATCH API when `_api_id` is available
   - Falls back to Excel-only storage if API fails
   - Returns `api_synced` status in response

#### Frontend Updates (`app.js`)

1. **New Helper Function (Lines 13-52)**
   - `updateCandidateData()`: Automatically includes `_api_id` in all update requests
   - Logs API sync status for debugging

2. **Updated Functions to Use Helper**:
   - `saveOfferDetailsBtn` click handler
   - `saveRound1RemarksBtn` click handler  
   - `saveRound2RemarksBtn` click handler
   - `saveFinalRemarksFromModal()`
   - `updateRecordStatus()`
   - `updateRecord()`

### 🔧 PATCH API Flow

```
User Edits Candidate Data (e.g., Initial Screening, Round 1 Remarks)
    ↓
Frontend includes _api_id in PUT request
    ↓
Backend: Extracts _api_id from payload
    ↓
Backend: convert_portal_to_api_payload()
    ↓
Backend: TokenManager.get_token()
    ↓
Backend calls: PATCH https://api-dev.guhatek.org/api/applications/{id}
    ├─→ Success? → Return {api_synced: true}
    └─→ Fail? → Save to Excel only, return {api_synced: false}
    ↓
Frontend: Shows toast with sync status
```

### Field Mappings (Portal → API)

| Portal Field | API Field (PATCH) |
|--------------|-------------------|
| Initial Screening | `initialScreening` |
| Round 1 D and T | `round1Dt` |
| Round 1 Remarks | `round1Feedback` |
| Round 2 D and T | `round2Dt` |
| Round 2 Remarks | `round2Feedback` |
| Offered Position | `offeredPosition` |
| Joining Date | `joiningDate` |
| Reject Mail Sent | `rejectMailSent` |
| Screened By | `screenedBy` |
| Interview Status | `interviewStatus` |
| Application Status | `applicationStatus` |
| Remarks | `additionalInfo` |

### Response Format

```json
{
  "status": "success",
  "message": "Data synced to API and saved locally",
  "api_synced": true,
  "api_message": "Applicant updated via API",
  "excel_saved": true
}
```

### Key Features

| Feature | Description |
|---------|-------------|
| **API ID Tracking** | Each applicant's UUID stored as `_api_id` |
| **Automatic Sync** | Updates auto-sync to Guhatek API when possible |
| **Fallback Storage** | Excel backup used if API fails |
| **Field Conversion** | Yes/No → boolean, strings cleaned |
| **User Feedback** | Toast shows "(synced to API)" when successful |
| **Screened By Tracking** | Automatically sets current user as screener |

---

**Last Updated**: January 8, 2026  
**Developer**: Antigravity AI Assistant  
**Status**: ✅ PATCH Integration Complete and Ready for Testing
