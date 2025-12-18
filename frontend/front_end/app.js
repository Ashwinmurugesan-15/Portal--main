const RESUME_API_BASE_URL = window.RESUME_API_BASE_URL || '';

document.getElementById("submitBtn").addEventListener("click", async () => {
    const jobDescription = document.getElementById("jobDescription").value.trim();
    const resumeFiles = document.getElementById("resumeFiles").files;
    const resultsDiv = document.querySelector(".results");

    if (!jobDescription) {
        alert("Please enter job description.");
        return;
    }

    if (resumeFiles.length === 0) {
        alert("Please upload at least one resume file.");
        return;
    }

    const formData = new FormData();
    formData.append("job_description", jobDescription);
    for (let i = 0; i < resumeFiles.length; i++) {
        formData.append("resumes", resumeFiles[i]);
    }

    const startTime = performance.now();

    try {
        const response = await fetch(RESUME_API_BASE_URL + "/upload", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        document.getElementById("processingTime").innerText =
            `Processed in ${((performance.now() - startTime)/1000).toFixed(2)} seconds`;
        
        
        if (data.top_resume) {
            document.getElementById("topResumeName").innerText = data.top_resume.filename;
            document.getElementById("topResumeScore").innerText = `Score: ${(data.top_resume.score * 100).toFixed(2)}%`;
            document.getElementById("topResumeMatches").innerText = `Matched Keywords: ${data.top_resume.details.matches}`;
        } else {
            document.getElementById("topResumeName").innerText = "No resumes found";
        }

        const allResultsEl = document.getElementById("allResults");
        allResultsEl.innerHTML = "";
        data.all_results.forEach(r => {
            const li = document.createElement("li");
            li.textContent = `${r.filename} — ${(r.score * 100).toFixed(2)}%`;
            allResultsEl.appendChild(li);
        });

    } catch (error) {
        console.error(error);
        alert("Error connecting to backend. Make sure Flask server is running.");
    }
});
