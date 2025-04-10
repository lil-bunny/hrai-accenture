// Data storage
let jds = [];
let cvs = [];
let currentView = 'list'; // 'list' or 'detail'
let selectedItem = null;
let idCounter = 0;
let selectedJDs = [];
let selectedCVs = [];

// Hidden file inputs
const csvInput = document.createElement('input');
csvInput.type = 'file';
csvInput.accept = '.csv';
csvInput.style.display = 'none';
document.body.appendChild(csvInput);

const cvInput = document.createElement('input');
cvInput.type = 'file';
cvInput.accept = '.pdf';
cvInput.multiple = true;  // Enable multiple file selection
cvInput.style.display = 'none';
document.body.appendChild(cvInput);

// Event listeners for buttons
document.getElementById('upload-csv-btn').addEventListener('click', () => csvInput.click());
csvInput.addEventListener('change', handleCSVUpload);

document.getElementById('upload-cv-btn').addEventListener('click', () => cvInput.click());
cvInput.addEventListener('change', handleCVUpload);

// Tab Navigation
function showTab(tabId) {
    // Hide all sections
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show the selected section
    const selectedSection = document.getElementById(`${tabId}-section`);
    if (selectedSection) {
        selectedSection.classList.remove('hidden');
    }
    
    // Update active state of nav items
    document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Tab navigation
    document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.dataset.tab;
            showTab(tabId);
        });
    });
    
    // Back button in JD detail view
    document.getElementById('back-to-jds').addEventListener('click', () => {
        hideJDDetail();
        showTab('jds');
    });
    
    // Back button in CV detail view
    document.getElementById('back-to-cvs').addEventListener('click', () => {
        hideCVDetail();
        showTab('cvs');
    });
    
    // Selection and deletion controls
    const selectAllJDs = document.getElementById('select-all-jds');
    const deleteSelectedJDs = document.getElementById('delete-selected-jds');
    const selectAllCVs = document.getElementById('select-all-cvs');
    const deleteSelectedCVs = document.getElementById('delete-selected-cvs');
    
    // JD selection events
    selectAllJDs.addEventListener('change', () => {
        const isChecked = selectAllJDs.checked;
        toggleSelectAllJDs(isChecked);
    });
    
    deleteSelectedJDs.addEventListener('click', () => {
        deleteSelectedItems('jd');
    });
    
    // CV selection events
    selectAllCVs.addEventListener('change', () => {
        const isChecked = selectAllCVs.checked;
        toggleSelectAllCVs(isChecked);
    });
    
    deleteSelectedCVs.addEventListener('click', () => {
        deleteSelectedItems('cv');
    });
    
    // Initial view
    showTab('jds');
});

// Toggle selection of all JDs
function toggleSelectAllJDs(isChecked) {
    selectedJDs = isChecked ? jds.map(jd => jd.id) : [];
    renderJDList();
    updateDeleteJDsButton();
}

// Toggle selection of all CVs
function toggleSelectAllCVs(isChecked) {
    selectedCVs = isChecked ? cvs.map(cv => cv.id) : [];
    renderCVList();
    updateDeleteCVsButton();
}

// Toggle selection of a single JD
function toggleJDSelection(jdId, event) {
    event.stopPropagation(); // Prevent card click from opening detail view
    
    if (selectedJDs.includes(jdId)) {
        selectedJDs = selectedJDs.filter(id => id !== jdId);
    } else {
        selectedJDs.push(jdId);
    }
    
    renderJDList();
    updateDeleteJDsButton();
    
    // Update select all checkbox
    const selectAllJDs = document.getElementById('select-all-jds');
    selectAllJDs.checked = selectedJDs.length === jds.length && jds.length > 0;
}

// Toggle selection of a single CV
function toggleCVSelection(cvId, event) {
    event.stopPropagation(); // Prevent card click from opening detail view
    
    if (selectedCVs.includes(cvId)) {
        selectedCVs = selectedCVs.filter(id => id !== cvId);
    } else {
        selectedCVs.push(cvId);
    }
    
    renderCVList();
    updateDeleteCVsButton();
    
    // Update select all checkbox
    const selectAllCVs = document.getElementById('select-all-cvs');
    selectAllCVs.checked = selectedCVs.length === cvs.length && cvs.length > 0;
}

// Update delete buttons state
function updateDeleteJDsButton() {
    const deleteButton = document.getElementById('delete-selected-jds');
    deleteButton.disabled = selectedJDs.length === 0;
}

function updateDeleteCVsButton() {
    const deleteButton = document.getElementById('delete-selected-cvs');
    deleteButton.disabled = selectedCVs.length === 0;
}

// Delete selected items
async function deleteSelectedItems(type) {
    try {
        if (type === 'jd') {
            if (selectedJDs.length === 0) return;
            
            if (!confirm(`Are you sure you want to delete ${selectedJDs.length} selected job descriptions?`)) {
                return;
            }
            
            // Delete from database
            for (const jdId of selectedJDs) {
                await deleteJDFromDatabase(jdId);
            }
            
            // Update local data
            jds = jds.filter(jd => !selectedJDs.includes(jd.id));
            selectedJDs = [];
            
            // Update UI
            renderJDList();
            updateDeleteJDsButton();
            document.getElementById('select-all-jds').checked = false;
            
        } else if (type === 'cv') {
            if (selectedCVs.length === 0) return;
            
            if (!confirm(`Are you sure you want to delete ${selectedCVs.length} selected CVs?`)) {
                return;
            }
            
            // Delete from database
            for (const cvId of selectedCVs) {
                await deleteCVFromDatabase(cvId);
            }
            
            // Update local data
            cvs = cvs.filter(cv => !selectedCVs.includes(cv.id));
            selectedCVs = [];
            
            // Update UI
            renderCVList();
            updateDeleteCVsButton();
            document.getElementById('select-all-cvs').checked = false;
        }
        
        await window.saveDatabase();
    } catch (error) {
        console.error(`Error deleting ${type}s:`, error);
        showError(`Failed to delete selected ${type}s: ${error.message}`);
    }
}

// Delete a JD from the database
async function deleteJDFromDatabase(jdId) {
    if (!window.isDatabaseInitialized || !window.db) {
        console.error('Database not initialized');
        return;
    }
    
    // Delete the JD
    window.db.run("DELETE FROM job_descriptions WHERE id = ?;", [jdId]);
    
    // Delete related preferred candidates
    window.db.run("DELETE FROM preferred_candidates WHERE jd_id = ?;", [jdId]);
}

// Delete a CV from the database
async function deleteCVFromDatabase(cvId) {
    if (!window.isDatabaseInitialized || !window.db) {
        console.error('Database not initialized');
        return;
    }
    
    // Delete the CV
    window.db.run("DELETE FROM cvs WHERE id = ?;", [cvId]);
    
    // Delete related preferred candidates
    window.db.run("DELETE FROM preferred_candidates WHERE cv_id = ?;", [cvId]);
}

// Render JD list
function renderJDList() {
    const jdCards = document.getElementById('jd-cards');
    jdCards.innerHTML = '';
    jds.forEach(jd => {
        const card = document.createElement('div');
        card.className = 'job-card';
        if (selectedJDs.includes(jd.id)) {
            card.classList.add('selected');
        }
        card.dataset.jobId = jd.id;
        
        // Count number of preferred candidates
        const matchCount = jd.preferredCandidates?.length || 0;
        const matchText = matchCount === 1 ? '1 match' : `${matchCount} matches`;
        
        // Create checkbox for selection
        const checkboxId = `jd-checkbox-${jd.id}`;
        
        card.innerHTML = `
            <input type="checkbox" id="${checkboxId}" class="item-checkbox" ${selectedJDs.includes(jd.id) ? 'checked' : ''}>
            <label for="${checkboxId}"></label>
            <div class="list-item">
                <div class="job-card-header">
                    <h4>${jd.title}</h4>
                    ${matchCount > 0 ? `<span class="match-count">${matchText}</span>` : ''}
                </div>
                <p>${jd.summary || 'No summary available'}</p>
            </div>
        `;
        
        // Add event listener for card click (show detail)
        const listItem = card.querySelector('.list-item');
        listItem.addEventListener('click', () => {
            showJDDetail(jd.id);
        });
        
        // Add event listener for checkbox
        const checkbox = card.querySelector(`#${checkboxId}`);
        checkbox.addEventListener('change', (event) => {
            toggleJDSelection(jd.id, event);
        });
        
        jdCards.appendChild(card);
    });
    
    // Update delete button state
    updateDeleteJDsButton();
}

// Render CV list
function renderCVList() {
    const cvCards = document.getElementById('cv-cards');
    cvCards.innerHTML = '';
    cvs.forEach(cv => {
        const card = document.createElement('div');
        card.className = 'cv-card';
        if (selectedCVs.includes(cv.id)) {
            card.classList.add('selected');
        }
        card.dataset.cvId = cv.id;
        
        // Create checkbox for selection
        const checkboxId = `cv-checkbox-${cv.id}`;
        
        card.innerHTML = `
            <input type="checkbox" id="${checkboxId}" class="item-checkbox" ${selectedCVs.includes(cv.id) ? 'checked' : ''}>
            <label for="${checkboxId}"></label>
            <div class="list-item">
                <h4>${cv.name || cv.fileName}</h4>
                <p>${cv.skills ? cv.skills.substring(0, 100) + '...' : 'No skills information'}</p>
            </div>
        `;
        
        // Add event listener for card click (show detail)
        const listItem = card.querySelector('.list-item');
        listItem.addEventListener('click', () => {
            showCVDetail(cv.id);
        });
        
        // Add event listener for checkbox
        const checkbox = card.querySelector(`#${checkboxId}`);
        checkbox.addEventListener('change', (event) => {
            toggleCVSelection(cv.id, event);
        });
        
        cvCards.appendChild(card);
    });
    
    // Update delete button state
    updateDeleteCVsButton();
}

// Modal handling
const modal = document.getElementById('jd-form-modal');
const closeModal = document.querySelector('.close-modal');
const cancelJDBtn = document.getElementById('cancel-jd-btn');

function showJDModal() {
    modal.classList.remove('hidden');
    modal.classList.add('show');
    // Focus the first input field
    document.getElementById('title').focus();
}

function closeJDModal() {
    modal.classList.remove('show');
    // Add a small delay before hiding to allow the animation to complete
    setTimeout(() => {
        modal.classList.add('hidden');
        document.getElementById('manual-jd-form').reset();
    }, 300);
}

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeJDModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
        closeJDModal();
    }
});

document.getElementById('add-manual-jd-btn').addEventListener('click', showJDModal);
closeModal.addEventListener('click', closeJDModal);
cancelJDBtn.addEventListener('click', closeJDModal);

// Generate unique ID
function generateUniqueId() {
    idCounter++;
    return `id-${idCounter}`;
}

// JD Detail View Functions
function showJDDetail(jobId) {
    const mainContent = document.getElementById('main-content');
    const jdDetailView = document.getElementById('jd-detail-view');
    const jdDetailTitle = document.getElementById('jd-detail-title');
    const jdDetailContent = document.getElementById('jd-detail-content');
    const jdSummaryContent = document.getElementById('jd-summary-content');
    const preferredCandidatesContent = document.getElementById('preferred-candidates-content');
    
    if (!mainContent || !jdDetailView) {
        console.error('Required elements not found in the DOM');
        return;
    }
    
    // Hide main content and show detail view
    mainContent.classList.add('hidden');
    jdDetailView.classList.remove('hidden');
    
    // Find the job in our local data
    const job = jds.find(jd => jd.id === jobId);
    if (!job) {
        showError('Job not found');
        return;
    }
    
    // Update the detail view with job information
    jdDetailTitle.textContent = job.title;
    jdDetailContent.innerHTML = `<pre>${job.description}</pre>`;
    jdSummaryContent.innerHTML = `<pre>${job.summary || 'No summary available'}</pre>`;
    
    // Display preferred candidates with simplified view and click functionality
    const candidatesHtml = job.preferredCandidates?.map(candidate => {
        const cv = cvs.find(c => c.name === candidate.name);
        return `
            <div class="list-item preferred-candidate" data-cv-id="${cv?.id || ''}">
                <div class="candidate-info">
                    <span class="candidate-name">${candidate.name}</span>
                    <span class="match-score ${getMatchScoreClass(candidate.matchScore)}">
                        ${candidate.matchScore}% Match
                    </span>
                </div>
            </div>
        `;
    }).join('') || '<p>No preferred candidates found</p>';
    
    preferredCandidatesContent.innerHTML = candidatesHtml;

    // Add click event listeners to preferred candidates
    document.querySelectorAll('.preferred-candidate').forEach(candidate => {
        candidate.addEventListener('click', (e) => {
            const cvId = candidate.dataset.cvId;
            if (cvId) {
                showCVDetail(cvId);
            }
        });
    });
}

function hideJDDetail() {
    const mainContent = document.getElementById('main-content');
    const jdDetailView = document.getElementById('jd-detail-view');
    
    if (!mainContent || !jdDetailView) {
        console.error('Required elements not found in the DOM');
        return;
    }
    
    mainContent.classList.remove('hidden');
    jdDetailView.classList.add('hidden');
}

function getMatchScoreClass(score) {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
}

// CV Detail View Functions
function showCVDetail(cvId) {
    const mainContent = document.getElementById('main-content');
    const cvDetailView = document.getElementById('cv-detail-view');
    const cvDetailTitle = document.getElementById('cv-detail-title');
    const cvPersonalInfo = document.getElementById('cv-personal-info');
    const cvSkills = document.getElementById('cv-skills');
    const cvExperience = document.getElementById('cv-experience');
    const cvEducation = document.getElementById('cv-education');
    const cvFullText = document.getElementById('cv-full-text');
    
    if (!mainContent || !cvDetailView) {
        console.error('Required elements not found in the DOM');
        return;
    }
    
    // Hide main content and show detail view
    mainContent.classList.add('hidden');
    cvDetailView.classList.remove('hidden');
    
    // Find the CV in our local data
    const cv = cvs.find(cv => cv.id === cvId);
    if (!cv) {
        showError('CV not found');
        return;
    }
    
    // Update the detail view with CV information
    cvDetailTitle.textContent = cv.name || cv.fileName;
    
    // Personal Information - Display only values in a clean grid
    cvPersonalInfo.innerHTML = `
        <div class="info-grid">
            <div class="info-value">${cv.name || 'Not available'}</div>
            <div class="info-value">${cv.email || 'Not available'}</div>
            <div class="info-value">${cv.phone || 'Not available'}</div>
            <div class="info-value">${cv.location || 'Not available'}</div>
        </div>
    `;
    
    // Skills - Format as a list with bullet points
    const skillsList = cv.skills ? cv.skills.split('\n')
        .filter(skill => skill.trim())
        .map(skill => `<li class="skill-item">${skill.trim()}</li>`)
        .join('') : '<li>No skills information available</li>';
    cvSkills.innerHTML = `
        <div class="skills-list">
            <ul class="formatted-list">
                ${skillsList}
            </ul>
        </div>
    `;
    
    // Experience - Format as a timeline
    const experienceList = cv.experience ? cv.experience.split('\n')
        .filter(exp => exp.trim())
        .map(exp => {
            const [role, company, duration] = exp.split('|').map(item => item.trim());
            return `
                <div class="experience-item">
                    <div class="experience-header">
                        <span class="experience-role">${role || 'Not specified'}</span>
                        <span class="experience-company">${company || 'Not specified'}</span>
                    </div>
                    <div class="experience-duration">${duration || 'Not specified'}</div>
                </div>
            `;
        }).join('') : '<div class="experience-item">No experience information available</div>';
    cvExperience.innerHTML = `
        <div class="experience-list">
            ${experienceList}
        </div>
    `;
    
    // Education - Format as a timeline
    const educationList = cv.education ? cv.education.split('\n')
        .filter(edu => edu.trim())
        .map(edu => {
            const [degree, institution, year] = edu.split('|').map(item => item.trim());
            return `
                <div class="education-item">
                    <div class="education-header">
                        <span class="education-degree">${degree || 'Not specified'}</span>
                        <span class="education-institution">${institution || 'Not specified'}</span>
                    </div>
                    <div class="education-year">${year || 'Not specified'}</div>
                </div>
            `;
        }).join('') : '<div class="education-item">No education information available</div>';
    cvEducation.innerHTML = `
        <div class="education-list">
            ${educationList}
        </div>
    `;
    
    // Full Text
    cvFullText.innerHTML = `<pre class="formatted-text">${cv.fullParsedText || 'No extracted information available'}</pre>`;
}

function hideCVDetail() {
    const mainContent = document.getElementById('main-content');
    const cvDetailView = document.getElementById('cv-detail-view');
    
    if (!mainContent || !cvDetailView) {
        console.error('Required elements not found in the DOM');
        return;
    }
    
    mainContent.classList.remove('hidden');
    cvDetailView.classList.add('hidden');
}

// Update UI based on current view
function updateView() {
    const sections = document.querySelectorAll('section');
    sections.forEach(section => section.classList.add('hidden'));

    if (currentView === 'list') {
        document.getElementById('jds-section').classList.remove('hidden');
    } else {
        document.getElementById('detail-view').classList.remove('hidden');
        const detailContent = document.getElementById('detail-content');
        const detailTitle = document.getElementById('detail-title');

        if (selectedItem.type === 'jd') {
            const jd = jds.find(j => j.id === selectedItem.id);
            const preferred = jd?.preferredCandidates || [];
            const preferredHTML = preferred.map(cv => `
                <div class="list-item">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-semibold">${cv.name}</h4>
                            <span class="match-score high">${cv.matchScore}% match</span>
                        </div>
                        <a href="${cvs.find(c => c.name === cv.name)?.url}" target="_blank" class="btn btn-secondary text-sm">View CV</a>
                    </div>
                </div>
            `).join('');

            detailTitle.textContent = selectedItem.title;
            detailContent.innerHTML = `
                <div class="space-y-4">
                    <div>
                        <h3 class="font-semibold mb-2">Description</h3>
                        <p class="text-gray-600">${selectedItem.description}</p>
                    </div>
                    <div>
                        <h3 class="font-semibold mb-2">Summary</h3>
                        <p class="text-gray-600">${selectedItem.summary || 'Loading...'}</p>
                    </div>
                    ${preferred.length > 0 ? `
                        <div>
                            <h3 class="font-semibold mb-2">Preferred Candidates</h3>
                            <div class="space-y-2">${preferredHTML}</div>
                        </div>
                    ` : ''}
                </div>
            `;
        } else if (selectedItem.type === 'cv') {
            detailTitle.textContent = selectedItem.name || selectedItem.fileName;
            detailContent.innerHTML = `
                <div class="space-y-4">
                    <div>
                        <h3 class="font-semibold mb-2">Skills</h3>
                        <p class="text-gray-600">${selectedItem.skills || 'Not found'}</p>
                    </div>
                    <div>
                        <h3 class="font-semibold mb-2">Full Text</h3>
                        <div class="bg-gray-50 p-4 rounded whitespace-pre-wrap">
                    ${selectedItem.fullParsedText || 'No extracted information'}
                        </div>
                    </div>
                </div>
            `;
        }
    }
}

// Create loading overlay
function createLoadingOverlay(text = 'Processing...') {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="text-center">
            <div class="loading-spinner"></div>
            <div class="loading-text">${text}</div>
                    </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
}

// Show error message
function showError(message) {
    console.error(message);
    const errorOverlay = createLoadingOverlay('Error');
    errorOverlay.querySelector('.loading-text').textContent = message;
    errorOverlay.querySelector('.loading-spinner').style.display = 'none';
    
    // Add a red color to indicate error
    errorOverlay.querySelector('.loading-text').style.color = 'red';
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        errorOverlay.remove();
    }, 5000);
}

// Background processing queue
let processingQueue = [];
let isProcessing = false;

// Update processing status UI
function updateProcessingStatus() {
    const statusContainer = document.getElementById('processing-status');
    const queueContainer = document.getElementById('processing-queue');
    
    if (processingQueue.length === 0) {
        statusContainer.classList.add('hidden');
        return;
    }
    
    statusContainer.classList.remove('hidden');
    queueContainer.innerHTML = '';
    
    processingQueue.forEach((item, index) => {
        const status = index === 0 ? 'processing' : 'pending';
        const itemElement = document.createElement('div');
        itemElement.className = 'processing-item';
        
        // Get current processing stage
        let statusText = 'Waiting...';
        if (status === 'processing') {
            if (item.currentStage === 'extracting') {
                statusText = 'Extracting text from PDF...';
            } else if (item.currentStage === 'parsing') {
                statusText = 'Parsing CV data...';
            } else if (item.currentStage === 'matching') {
                statusText = `Matching with JDs (${item.currentMatchIndex || 0}/${jds.length})...`;
            }
        }
        
        itemElement.innerHTML = `
            <div class="status">
                <div class="status-icon ${status}"></div>
                <div class="status-details">
                    <div class="status-name">${item.file.name}</div>
                    <div class="status-stage">${statusText}</div>
                    </div>
            </div>
        `;
        queueContainer.appendChild(itemElement);
    });
}

// Check if app is running locally or deployed
const isRunningLocally = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';

// Determine the API base URL based on deployment environment
const apiBaseUrl = isRunningLocally 
    ? 'http://localhost:11434' 
    : 'http://localhost:11434'; // Will only work when using a proxy or browser extension for CORS

// Function to make API calls to Ollama (either directly or through proxy)
async function callOllamaAPI(endpoint, options) {
    try {
        console.log(`Calling API at ${apiBaseUrl}${endpoint}`);
        const response = await fetch(`${apiBaseUrl}${endpoint}`, options);
        return await response.json();
    } catch (error) {
        console.error(`Error calling API at ${apiBaseUrl}${endpoint}:`, error);
        throw error;
    }
}

// Process queue in background
async function processQueue() {
    if (isProcessing || processingQueue.length === 0) return;
    
    isProcessing = true;
    const cv = processingQueue[0];
    
    console.log(`Starting to process CV: ${cv.file.name}`);
    updateProcessingStatus();
    
    try {
        // Update stage to extracting
        cv.currentStage = 'extracting';
        updateProcessingStatus();
        
        console.log(`Extracting text from PDF: ${cv.file.name}`);
        const text = await extractTextFromPDF(cv.file);
        if (!text) {
            throw new Error('Failed to extract text from PDF');
        }
        console.log(`Successfully extracted text from ${cv.file.name}`);

        // Update stage to parsing
        cv.currentStage = 'parsing';
        updateProcessingStatus();
        
        // Make separate API calls for each section
        const responses = await Promise.all([
            callOllamaAPI('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gemma2:2b',
                    messages: [
                        { 
                            role: 'system', 
                            content: 'You are an expert CV parser. Extract ONLY the following personal information from the CV. Return the information in this exact format:\n\nName: [name]\nEmail: [email]\nPhone: [phone]\nLocation: [location]\n\nIf any information is not found, write "Not available" for that field. Do not include any other text or explanations.' 
                        },
                        { role: 'user', content: text }
                    ],
                    stream: false
                })
            }),
            callOllamaAPI('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gemma2:2b',
                    messages: [
                        { 
                            role: 'system', 
                            content: 'You are an expert CV parser. Extract ONLY the skills section from the CV. List each skill on a new line. Include both technical and soft skills. If no skills are found, return "Not available".' 
                        },
                        { role: 'user', content: text }
                    ],
                    stream: false
                })
            }),
            callOllamaAPI('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gemma2:2b',
                    messages: [
                        { 
                            role: 'system', 
                            content: 'You are an expert CV parser. Extract ONLY the education section from the CV. For each education entry, format as: Degree|Institution|Year. One entry per line. If no education is found, return "Not available".' 
                        },
                        { role: 'user', content: text }
                    ],
                    stream: false
                })
            }),
            callOllamaAPI('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gemma2:2b',
                    messages: [
                        { 
                            role: 'system', 
                            content: 'You are an expert CV parser. Extract ONLY the work experience section from the CV. For each experience entry, format as: Role|Company|Duration. One entry per line. If no experience is found, return "Not available".' 
                        },
                        { role: 'user', content: text }
                    ],
                    stream: false
                })
            })
        ]);

        // Improved validation for API responses
        const [personalInfoResponse, skillsResponse, educationResponse, experienceResponse] = responses;
        
        console.log('Response data:', {
            personalInfo: personalInfoResponse,
            skills: skillsResponse,
            education: educationResponse,
            experience: experienceResponse
        });
        
        // Check if we have valid responses and extract content
        if (!personalInfoResponse || !skillsResponse || !educationResponse || !experienceResponse) {
            throw new Error('One or more API responses were invalid');
        }
        
        // Extract message content with fallbacks
        const personalInfoContent = personalInfoResponse.message?.content || '';
        const skillsContent = skillsResponse.message?.content || 'Not available';
        const educationContent = educationResponse.message?.content || 'Not available';
        const experienceContent = experienceResponse.message?.content || 'Not available';

        // Parse personal information
        const personalInfo = {
            name: extractValue(personalInfoContent, 'Name:'),
            email: extractValue(personalInfoContent, 'Email:'),
            phone: extractValue(personalInfoContent, 'Phone:'),
            location: extractValue(personalInfoContent, 'Location:')
        };

        const newCV = {
            id: cv.id, // Use cv.id that was assigned when added to the queue
            fileName: cv.file.name,
            url: cv.url,
            name: personalInfo.name,
            email: personalInfo.email,
            phone: personalInfo.phone,
            location: personalInfo.location,
            skills: skillsContent,
            education: educationContent,
            experience: experienceContent,
            fullParsedText: text
        };

        // Log created CV for debugging
        console.log('Created CV object:', newCV);

        // Save to SQLite
        await saveCV(newCV);
        cvs.push(newCV);
        
        // IMPROVEMENT: Update CV list UI immediately after parsing
        renderCVList();
        
        // Update stage to matching
        cv.currentStage = 'matching';
        cv.currentMatchIndex = 0;
        updateProcessingStatus();
        
        console.log(`Starting to match CV with JDs: ${cv.file.name}`);
        await matchCVsToJDs(newCV);
        console.log(`Completed matching CV with JDs: ${cv.file.name}`);
        
        // Remove the processed CV from queue
        processingQueue.shift();
        updateProcessingStatus();

    } catch (error) {
        console.error(`Error processing CV ${cv.file.name}:`, error);
        console.error('Error details:', error.stack);
        showError(`Failed to process ${cv.file.name}: ${error.message}`);
        
        // Remove the failed CV from queue
        processingQueue.shift();
        updateProcessingStatus();
    } finally {
        isProcessing = false;
        // Process next item in queue
        setTimeout(processQueue, 0);
    }
}

// Helper function to extract value from formatted text
function extractValue(text, label) {
    const regex = new RegExp(`${label}\\s*([^\\n]+)`);
    const match = text.match(regex);
    return match ? match[1].trim() : 'Not available';
}

// Handle CV upload with improved batch processing
async function handleCVUpload(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    const loadingOverlay = createLoadingOverlay(`Adding ${files.length} CVs to processing queue...`);
    
    try {
        console.log('Starting to add CVs to processing queue');
        
        // IMPROVEMENT: Process CVs in parallel batches
        const maxConcurrentProcessing = 3; // Process 3 CVs at a time
        
        // Add all files to the queue with unique IDs
        for (const file of files) {
            if (file.type !== 'application/pdf') {
                console.warn(`Skipping non-PDF file: ${file.name}`);
                continue;
            }
            
            const id = generateUniqueId();
            const url = URL.createObjectURL(file);
            
            console.log(`Adding CV to queue: ${file.name}`);
            processingQueue.push({
                id,
                file,
                url,
                currentStage: 'waiting'
            });
        }
        
        console.log(`Added ${files.length} CV(s) to processing queue`);
        updateProcessingStatus();
        
        // IMPROVEMENT: Start multiple processing queues in parallel
        const processingPromises = [];
        for (let i = 0; i < maxConcurrentProcessing; i++) {
            processingPromises.push(processQueue());
        }
        
        // Show initial success message
        loadingOverlay.querySelector('.loading-text').textContent = `Processing ${files.length} CV(s) in batches of ${maxConcurrentProcessing}`;
        setTimeout(() => {
            loadingOverlay.remove();
        }, 2000);
        
    } catch (error) {
        console.error('Error adding CVs to queue:', error);
        loadingOverlay.querySelector('.loading-text').textContent = `Error: ${error.message}`;
        setTimeout(() => {
            loadingOverlay.remove();
        }, 3000);
    }
}

// Extract text from PDF
async function extractTextFromPDF(file) {
    try {
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(' ');
            text += pageText + '\n';
        }
        return text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('Failed to extract text from PDF');
    }
}

// Function to send email notification to matched candidate
async function sendMatchNotification(candidate, jd, matchScore) {
    try {
        if (!candidate.email || candidate.email === 'Not available') {
            console.log(`Cannot send email notification: No email found for candidate ${candidate.name}`);
            return;
        }

        console.log(`Generating personalized email content for ${candidate.name}...`);
        
        // Generate personalized message using Gemma API
        const personalizedMessage = await generatePersonalizedMessage(candidate, jd);
        
        // Generate interview format using Gemma API
        const interviewFormat = await generateInterviewFormat(jd);
        
        // Combine all content into email body
        const emailText = `
Dear ${candidate.name},

Congratulations! You have been shortlisted for the position of "${jd.title}" based on your impressive qualifications and experience. Your profile scored a ${matchScore}% match with our requirements.

${personalizedMessage}

Here's a brief description of the role:
${jd.description.substring(0, 500)}${jd.description.length > 500 ? '...' : ''}

Interview Process:
${interviewFormat}

Please reply to this email to confirm your interest and schedule an interview at your earliest convenience.

Best regards,
HR Team
`;

        // Email metadata
        const emailSubject = `Congratulations! You've been shortlisted for ${jd.title}`;
        
        // Construct the email data for Mailtrap
        const emailData = {
            "from": {
                "email": "hr@example.com",
                "name": "HR AI Recruitment"
            },
            "to": [
                {"email": candidate.email}
            ],
            "subject": emailSubject,
            "text": emailText,
            "category": "Candidate Notification"
        };

        console.log('Sending email with data:', emailData);
        
        // Directly call the Mailtrap API
        try {
            const response = await fetch('https://test-112028648234.us-central1.run.app', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer cccaaa5723088f0085d04d0f741b071e'
                },
                body: JSON.stringify(emailData)
            });
            
            const result = await response.json();
            console.log('Email send result:', result);
            
            if (response.ok) {
                // Show success notification
                showSuccess(`Email notification sent to ${candidate.email} successfully!`);
                return true;
            } else {
                console.error('Failed to send email:', result);
                showError(`Failed to send email: ${result?.message || 'Unknown error'}`);
                // Show the preview as fallback
                showEmailPreview(candidate.email, emailSubject, emailText);
                return false;
            }
        } catch (error) {
            console.error('Error sending email via Mailtrap API:', error);
            // Show the preview as fallback
            showEmailPreview(candidate.email, emailSubject, emailText);
            return false;
        }
    } catch (error) {
        console.error('Error with email notification:', error);
        showError(`Email notification could not be processed: ${error.message}`);
        return false;
    }
}

// Function to show success message
function showSuccess(message) {
    console.log(message);
    const successOverlay = createLoadingOverlay('Success');
    successOverlay.querySelector('.loading-text').textContent = message;
    successOverlay.querySelector('.loading-spinner').style.display = 'none';
    
    // Add a green color to indicate success
    successOverlay.querySelector('.loading-text').style.color = 'green';
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        successOverlay.remove();
    }, 5000);
}

// Function to show email preview (fallback if sending fails)
function showEmailPreview(recipientEmail, subject, emailText) {
    // Show notification about email
    const emailInfo = document.createElement('div');
    emailInfo.className = 'email-notification';
    emailInfo.innerHTML = `
        <div class="email-card">
            <div class="email-header">
                <strong>Email Preview (to: ${recipientEmail})</strong>
                <button class="close-notification">×</button>
            </div>
            <div class="email-content">
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Body:</strong></p>
                <pre>${emailText}</pre>
                <p class="note">Email sending failed. This is a preview of what would have been sent.</p>
            </div>
        </div>
    `;
    document.body.appendChild(emailInfo);
    
    // Add event listener to close button
    const closeButton = emailInfo.querySelector('.close-notification');
    closeButton.addEventListener('click', () => {
        emailInfo.remove();
    });
    
    // Auto-remove after 20 seconds
    setTimeout(() => {
        if (document.body.contains(emailInfo)) {
            emailInfo.remove();
        }
    }, 20000);
}

// Generate personalized message using Gemma API
async function generatePersonalizedMessage(candidate, jd) {
    try {
        const response = await callOllamaAPI('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gemma2:2b',
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are a professional HR assistant. Generate a personalized and encouraging message for a candidate who has been shortlisted for a job position. Keep it brief (2-3 sentences), professional, and enthusiastic.' 
                    },
                    { 
                        role: 'user', 
                        content: `Generate a personalized message for a candidate named ${candidate.name} who has been shortlisted for the position of ${jd.title}. 
                        Candidate skills: ${candidate.skills}
                        Job description: ${jd.description.substring(0, 300)}` 
                    }
                ],
                stream: false
            })
        });

        if (response.message?.content) {
            return response.message.content;
        } else {
            console.error('Error generating personalized message');
            return 'Your CV stood out to us, and we believe your skills and experience make you an excellent candidate for this position.';
        }
    } catch (error) {
        console.error('Error calling Gemma API for personalized message:', error);
        return 'Your CV stood out to us, and we believe your skills and experience make you an excellent candidate for this position.';
    }
}

// Generate interview format using Gemma API
async function generateInterviewFormat(jd) {
    try {
        const response = await callOllamaAPI('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gemma2:2b',
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are a professional HR assistant. Generate a brief interview format for a job position based on the job description. Include 3-4 stages of the interview process, keeping it concise and informative.' 
                    },
                    { 
                        role: 'user', 
                        content: `Generate a brief interview format for this job: ${jd.title}
                        Job description: ${jd.description.substring(0, 500)}` 
                    }
                ],
                stream: false
            })
        });

        if (response.message?.content) {
            return response.message.content;
        } else {
            console.error('Error generating interview format');
            return `
1. Initial Phone Screening (15-20 minutes)
2. Technical Assessment (45-60 minutes)
3. Panel Interview with the Team (1 hour)
4. Final Interview with Management (30 minutes)`;
        }
    } catch (error) {
        console.error('Error calling Gemma API for interview format:', error);
        return `
1. Initial Phone Screening (15-20 minutes)
2. Technical Assessment (45-60 minutes)
3. Panel Interview with the Team (1 hour)
4. Final Interview with Management (30 minutes)`;
    }
}

// Update matchCVsToJDs to use the proxy service
async function matchCVsToJDs(cv) {
    console.log(`\nStarting to match CV "${cv.name}" with all JDs...`);
    let matchCount = 0;
    
    // IMPROVEMENT: Process JDs in larger batches for better performance
    const batchSize = 5; // Increased from 3 to 5
    for (let i = 0; i < jds.length; i += batchSize) {
        const batch = jds.slice(i, i + batchSize);
        console.log(`\nProcessing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(jds.length/batchSize)}`);
        
        // Update current match index in UI
        const queueItem = processingQueue.find(item => item.id === cv.id);
        if (queueItem) {
            queueItem.currentMatchIndex = i;
            updateProcessingStatus();
        }
        
        // Process batch in parallel
        const matchResults = await Promise.all(batch.map(async (jd) => {
            try {
                console.log(`Matching CV "${cv.name}" with JD "${jd.title}"...`);

                const response = await callOllamaAPI('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'gemma2:2b',
                        messages: [
                            { role: 'user', content: `Rate between 0 to 100 only based on JD summary and CV skills of the candindate.\nCV: ${cv.fullParsedText}\nJD Summary: ${jd.summary}.Give rating between 0 to 100 only` }
                        ],
                        stream: false
                    })
                });

                if (!response.message) {
                    throw new Error('Failed to get match score');
                }

                const scoreMatch = response.message.content.match(/(\d+)%?/);
                const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
                
                console.log(`Match score for "${jd.title}": ${score}%`);

                if (score >= 80) {
                    if (!jd.preferredCandidates) jd.preferredCandidates = [];
                    jd.preferredCandidates.push({ name: cv.name, matchScore: score });
                    matchCount++;
                    console.log(`✅ High match found for "${jd.title}" (${score}%)`);
                    
                    // IMPROVEMENT: Save match to database immediately
                    await savePreferredCandidate(jd.id, cv.id, score);
                    
                    // Update UI immediately when a match is found
                    renderJDList();
                    
                    // If we're viewing a JD detail, update it too
                    if (selectedItem?.type === 'jd' && selectedItem.id === jd.id) {
                        updateView();
                    }
                    
                    // Send email notification to candidate
                    await sendMatchNotification(cv, jd, score);
                    
                    return { jdId: jd.id, matched: true, score };
                } else {
                    console.log(`❌ No match for "${jd.title}" (${score}%)`);
                    return { jdId: jd.id, matched: false, score };
                }
            } catch (e) {
                console.error(`Error matching CV with "${jd.title}":`, e);
                return { jdId: jd.id, matched: false, error: e.message };
            }
        }));
        
        // Update database with all matches from this batch
        for (const result of matchResults) {
            if (result.matched) {
                // Already saved in the loop above
            }
        }
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < jds.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    console.log(`\nMatching complete for CV "${cv.name}":`);
    console.log(`- Total JDs checked: ${jds.length}`);
    console.log(`- High matches found: ${matchCount}`);
    console.log(`- Match rate: ${((matchCount/jds.length)*100).toFixed(1)}%`);
}

// Handle CSV upload with improved error handling and database saving
async function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file || !file.name.endsWith('.csv')) {
        alert('Please upload a valid CSV file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            // Show processing status
            const processingStatus = document.getElementById('processing-status');
            const processingQueue = document.getElementById('processing-queue');
            processingStatus.classList.remove('hidden');
            
            // Create processing status element
            const statusElement = document.createElement('div');
            statusElement.className = 'processing-item';
            statusElement.innerHTML = `
                <div class="status">
                    <div class="status-icon processing"></div>
                    <div class="status-details">
                        <div class="status-name">Initializing JD Processing</div>
                        <div class="status-stage">Reading CSV file...</div>
                    </div>
                </div>
            `;
            processingQueue.innerHTML = '';
            processingQueue.appendChild(statusElement);

            // Convert CSV to Excel workbook
            const workbook = XLSX.read(e.target.result, { type: 'binary' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(firstSheet);
            
            if (data.length === 0) {
                alert('CSV file is empty.');
            return;
        }

            // Find column indices
            const headers = Object.keys(data[0]);
            const titleIndex = headers.findIndex(h => 
                h.toLowerCase().includes('title') || 
                h.toLowerCase().includes('job title') ||
                h.toLowerCase().includes('position')
            );
            
            const descriptionIndex = headers.findIndex(h => 
                h.toLowerCase().includes('description') || 
                h.toLowerCase().includes('job description') ||
                h.toLowerCase().includes('details')
            );

        if (titleIndex === -1 || descriptionIndex === -1) {
                alert('Required columns (Job Title and Job Description) not found in the CSV file.');
            return;
        }

            // Process JDs
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const title = row[headers[titleIndex]];
                const description = row[headers[descriptionIndex]];
                
            if (title && description) {
                const id = generateUniqueId();
                    const newJD = { 
                        id, 
                        title, 
                        description, 
                        summary: null 
                    };
                    
                    // Save to database first
                    await saveJD(newJD);
                    jds.push(newJD);
                    
                    // Update status
                    statusElement.querySelector('.status-stage').textContent = 
                        `Processing JD ${i + 1}/${data.length}: ${title.substring(0, 30)}...`;
                    
                    try {
                        // Generate summary
                        const response = await callOllamaAPI('/api/chat', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                model: 'gemma2:2b',
                                messages: [
                                    { 
                                        role: 'system', 
                                        content: 'Create a concise summary (2-3 sentences) of the job description, focusing on key responsibilities and requirements.' 
                                    },
                                    { role: 'user', content: description }
                                ],
                                stream: false
                            })
                        });

                        if (response && response.message && response.message.content) {
                            newJD.summary = response.message.content.trim();
                            // Save updated JD with summary
                            await saveJD(newJD);
                        }
                    } catch (error) {
                        console.error('Error generating summary:', error);
                        newJD.summary = 'Error generating summary';
                        await saveJD(newJD);
                    }
                    
                    // Update UI
                    renderJDList();
                }
            }

            // Final save and update
            await window.saveDatabase();
            renderJDList();
            
            // Update status to completed
            statusElement.querySelector('.status-icon').classList.remove('processing');
            statusElement.querySelector('.status-icon').classList.add('completed');
            statusElement.querySelector('.status-name').textContent = 'Processing Complete';
            statusElement.querySelector('.status-stage').textContent = 
                `Successfully processed ${data.length} JDs`;

            setTimeout(() => {
                processingStatus.classList.add('hidden');
            }, 3000);

        } catch (error) {
            console.error('Error processing CSV:', error);
            alert('Error processing CSV file: ' + error.message);
        }
    };

    reader.onerror = function() {
        alert('Error reading file');
    };

    reader.readAsBinaryString(file);
}

// Fetch JD summary from Ollama API
async function getSummary(id, description) {
    try {
        const response = await callOllamaAPI('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gemma2:2b',
                messages: [
                    { role: 'system', content: 'you are a job summarizer' },
                    { role: 'user', content: `Summarize this: ${description}` }
                ],
                stream: false
            })
        });

        if (!response.message) throw new Error('API call failed');
        const jd = jds.find(jd => jd.id === id);
        if (jd) {
            jd.summary = response.message?.content || 'No summary returned';
            renderJDList();
            if (selectedItem && selectedItem.id === id) updateView();
        }
    } catch (error) {
        console.error('Error fetching summary:', error);
        const jd = jds.find(jd => jd.id === id);
        if (jd) {
            jd.summary = 'Error generating summary';
            renderJDList();
            if (selectedItem && selectedItem.id === id) updateView();
        }
    }
}

// Handle manual JD submission
function handleManualJDSubmit(event) {
    event.preventDefault();
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    
    if (!title || !description) {
        alert('Please fill in both Job Title and Job Description.');
        return;
    }

    const id = generateUniqueId();
    jds.push({ id, title, description, summary: null });

    closeJDModal();
    renderJDList();
    getSummary(id, description);
}

document.getElementById('manual-jd-form').addEventListener('submit', handleManualJDSubmit);

// Load existing data from SQLite
async function loadExistingData() {
    try {
        if (!window.isDatabaseInitialized) {
            console.error('Database not initialized');
            return;
        }

        if (!window.db) {
            console.error('Database not initialized');
            return;
        }

        console.log('Loading existing data from database...');

        // Load JDs
        const jdResult = window.db.exec("SELECT * FROM job_descriptions;");
        console.log('JD query result:', jdResult);
        
        if (jdResult && jdResult.length > 0) {
            jds = jdResult[0].values.map(row => ({
                id: row[0],
                title: row[1],
                description: row[2],
                summary: row[3]
            }));
            console.log('Loaded JDs:', jds);
        }

        // Load CVs
        const cvResult = window.db.exec("SELECT * FROM cvs;");
        if (cvResult && cvResult.length > 0) {
            cvs = cvResult[0].values.map(row => ({
                id: row[0],
                name: row[1],
                email: row[2],
                phone: row[3],
                location: row[4],
                skills: row[5],
                education: row[6],
                experience: row[7],
                fullParsedText: row[8]
            }));
        }

        // Load preferred candidates
        const pcResult = window.db.exec("SELECT * FROM preferred_candidates;");
        if (pcResult && pcResult.length > 0) {
            pcResult[0].values.forEach(row => {
                const jd = jds.find(j => j.id === row[0]);
                const cv = cvs.find(c => c.id === row[1]);
                if (jd && cv) {
                    if (!jd.preferredCandidates) jd.preferredCandidates = [];
                    jd.preferredCandidates.push({
                        name: cv.name,
                        matchScore: row[2]
                    });
                }
            });
        }

        // Update UI
        renderJDList();
        renderCVList();
    } catch (error) {
        console.error('Error loading existing data:', error);
    }
}

// Save JD to SQLite with immediate database save
async function saveJD(jd) {
    try {
        if (!window.isDatabaseInitialized) {
            console.error('Database not initialized');
            return;
        }

        if (!window.db) {
            console.error('Database not initialized');
            return;
        }

        console.log('Saving JD to database:', jd);

        window.db.run(
            "INSERT OR REPLACE INTO job_descriptions (id, title, description, summary) VALUES (?, ?, ?, ?);",
            [jd.id, jd.title, jd.description, jd.summary]
        );
        
        // Immediately save the database to IndexedDB
        if (window.saveDatabase) {
            await window.saveDatabase();
            console.log('Database saved after JD update');
        } else {
            console.error('saveDatabase function not available');
        }
    } catch (error) {
        console.error('Error saving JD:', error);
    }
}

// Save CV to SQLite
async function saveCV(cv) {
    try {
        if (!window.isDatabaseInitialized) {
            console.error('Database not initialized');
            return;
        }

        if (!window.db) {
            console.error('Database not initialized');
            return;
        }

        window.db.run(
            "INSERT OR REPLACE INTO cvs (id, name, email, phone, location, skills, education, experience, full_parsed_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);",
            [cv.id, cv.name, cv.email, cv.phone, cv.location, cv.skills, cv.education, cv.experience, cv.fullParsedText]
        );
        await window.saveDatabase();
    } catch (error) {
        console.error('Error saving CV:', error);
    }
}

// Save preferred candidate to SQLite
async function savePreferredCandidate(jdId, cvId, matchScore) {
    try {
        if (!window.isDatabaseInitialized) {
            console.error('Database not initialized');
            return;
        }

        if (!window.db) {
            console.error('Database not initialized');
            return;
        }

        window.db.run(
            "INSERT OR REPLACE INTO preferred_candidates (jd_id, cv_id, match_score) VALUES (?, ?, ?);",
            [jdId, cvId, matchScore]
        );
        await window.saveDatabase();
    } catch (error) {
        console.error('Error saving preferred candidate:', error);
    }
}

// Save database to IndexedDB
async function saveDatabase() {
    try {
        const binaryArray = window.db.export();
        const dbBlob = new Blob([binaryArray], { type: 'application/x-sqlite3' });
        
        // Save to IndexedDB
        const dbName = 'hr_ai_database';
        const storeName = 'sqlite_db';
        
        const request = indexedDB.open(dbName, 1);
        
        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName);
            }
        };
        
        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            store.put(dbBlob, 'database');
        };
    } catch (error) {
        console.error('Error saving database:', error);
    }
}

// Load database from IndexedDB
async function loadDatabase() {
    return new Promise((resolve, reject) => {
        const dbName = 'hr_ai_database';
        const storeName = 'sqlite_db';
        
        const request = indexedDB.open(dbName, 1);
        
        request.onerror = function(event) {
            console.error('Error opening IndexedDB:', event.target.error);
            reject(event.target.error);
        };
        
        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const getRequest = store.get('database');
            
            getRequest.onsuccess = function(event) {
                if (event.target.result) {
                    const reader = new FileReader();
                    reader.onload = function() {
                        const arrayBuffer = reader.result;
                        const bytes = new Uint8Array(arrayBuffer);
                        window.db = new SQL.Database(bytes);
                        resolve(window.db);
                    };
                    reader.readAsArrayBuffer(event.target.result);
                } else {
                    // If no database exists, create a new one
                    window.db = new SQL.Database();
                    resolve(window.db);
                }
            };
            
            getRequest.onerror = function(event) {
                console.error('Error loading database:', event.target.error);
                reject(event.target.error);
            };
        };
    });
}

// Modify the initialization code in index.html
async function initializeDatabase() {
    try {
        await loadDatabase();
        
        // Create tables if they don't exist
        window.db.run(`
            CREATE TABLE IF NOT EXISTS job_descriptions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                summary TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        window.db.run(`
            CREATE TABLE IF NOT EXISTS cvs (
                id TEXT PRIMARY KEY,
                name TEXT,
                email TEXT,
                phone TEXT,
                location TEXT,
                skills TEXT,
                education TEXT,
                experience TEXT,
                full_parsed_text TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        window.db.run(`
            CREATE TABLE IF NOT EXISTS preferred_candidates (
                jd_id TEXT,
                cv_id TEXT,
                match_score INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (jd_id, cv_id),
                FOREIGN KEY (jd_id) REFERENCES job_descriptions(id),
                FOREIGN KEY (cv_id) REFERENCES cvs(id)
            );
        `);
        
        // Load existing data
        await loadExistingData();
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Initial render
renderJDList();
renderCVList();
