// Data storage
let jds = [];
let cvs = [];
let currentView = 'list'; // 'list' or 'detail'
let selectedItem = null;
let idCounter = 0;

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
    
    // Initial view
    showTab('jds');
});

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

// Render JD list
function renderJDList() {
    const jdCards = document.getElementById('jd-cards');
    jdCards.innerHTML = '';
    jds.forEach(jd => {
        const card = document.createElement('div');
        card.className = 'job-card';
        card.dataset.jobId = jd.id;
        
        // Count number of preferred candidates
        const matchCount = jd.preferredCandidates?.length || 0;
        const matchText = matchCount === 1 ? '1 match' : `${matchCount} matches`;
        
        card.innerHTML = `
            <div class="list-item">
                <div class="job-card-header">
                    <h4>${jd.title}</h4>
                    ${matchCount > 0 ? `<span class="match-count">${matchText}</span>` : ''}
                </div>
                <p>${jd.summary || 'No summary available'}</p>
            </div>
        `;
        card.addEventListener('click', () => showJDDetail(jd.id));
        jdCards.appendChild(card);
    });
}

// Render CV list
function renderCVList() {
    const cvCards = document.getElementById('cv-cards');
    cvCards.innerHTML = '';
    cvs.forEach(cv => {
        const card = document.createElement('div');
        card.className = 'cv-card';
        card.dataset.cvId = cv.id;
        card.innerHTML = `
            <div class="list-item">
                <h4>${cv.name || cv.fileName}</h4>
                <p>${cv.skills ? cv.skills.substring(0, 100) + '...' : 'No skills information'}</p>
            </div>
        `;
        card.addEventListener('click', () => showCVDetail(cv.id));
        cvCards.appendChild(card);
    });
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
        const [personalInfoResponse, skillsResponse, educationResponse, experienceResponse] = await Promise.all([
            fetch('http://localhost:11434/api/chat', {
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
            fetch('http://localhost:11434/api/chat', {
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
            fetch('http://localhost:11434/api/chat', {
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
            fetch('http://localhost:11434/api/chat', {
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

        if (!personalInfoResponse.ok || !skillsResponse.ok || !educationResponse.ok || !experienceResponse.ok) {
            throw new Error('Failed to parse CV sections');
        }

        const [personalInfoData, skillsData, educationData, experienceData] = await Promise.all([
            personalInfoResponse.json(),
            skillsResponse.json(),
            educationResponse.json(),
            experienceResponse.json()
        ]);

        // Parse personal information
        const personalInfoText = personalInfoData.message?.content || '';
        const personalInfo = {
            name: extractValue(personalInfoText, 'Name:'),
            email: extractValue(personalInfoText, 'Email:'),
            phone: extractValue(personalInfoText, 'Phone:'),
            location: extractValue(personalInfoText, 'Location:')
        };

        const newCV = {
            id: cv.id,
            fileName: cv.file.name,
            url: cv.url,
            name: personalInfo.name,
            email: personalInfo.email,
            phone: personalInfo.phone,
            location: personalInfo.location,
            skills: skillsData.message?.content || 'Not available',
            education: educationData.message?.content || 'Not available',
            experience: experienceData.message?.content || 'Not available',
            fullParsedText: text
        };

        // Add CV to list immediately
        cvs.push(newCV);
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

// Handle CV upload
async function handleCVUpload(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    const loadingOverlay = createLoadingOverlay('Adding CVs to processing queue...');
    
    try {
        console.log('Starting to add CVs to processing queue');
        files.forEach(file => {
            if (file.type !== 'application/pdf') {
                console.warn(`Skipping non-PDF file: ${file.name}`);
                alert(`Please upload only PDF files. ${file.name} is not a PDF.`);
        return;
    }

    const id = generateUniqueId();
    const url = URL.createObjectURL(file);
            
            console.log(`Adding CV to queue: ${file.name}`);
            processingQueue.push({
                id,
                file,
                url
            });
        });

        console.log(`Added ${files.length} CV(s) to processing queue`);
        updateProcessingStatus();
        
        // Start processing queue
        processQueue();
        
        // Show initial success message
        loadingOverlay.querySelector('.loading-text').textContent = `Added ${files.length} CV(s) to processing queue`;
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

// Update matchCVsToJDs to handle real-time updates
async function matchCVsToJDs(cv) {
    console.log(`\nStarting to match CV "${cv.name}" with all JDs...`);
    let matchCount = 0;
    
    // Process JDs in batches to avoid overwhelming the API
    const batchSize = 3;
    for (let i = 0; i < jds.length; i += batchSize) {
        const batch = jds.slice(i, i + batchSize);
        console.log(`\nProcessing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(jds.length/batchSize)}`);
        
        // Update current match index
        processingQueue[0].currentMatchIndex = i;
        updateProcessingStatus();
        
        // Process batch in parallel
        await Promise.all(batch.map(async (jd) => {
            try {
                console.log(`Matching CV "${cv.name}" with JD "${jd.title}"...`);

    const response = await fetch('http://localhost:11434/api/chat', {
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

                if (!response.ok) {
                    throw new Error('Failed to get match score');
                }

    const data = await response.json();
                const scoreMatch = data.message?.content?.match(/(\d+)%?/);
                const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
                
                console.log(`Match score for "${jd.title}": ${score}%`);

                if (score >= 80) {
                    if (!jd.preferredCandidates) jd.preferredCandidates = [];
                    jd.preferredCandidates.push({ name: cv.name, matchScore: score });
                    matchCount++;
                    console.log(`✅ High match found for "${jd.title}" (${score}%)`);
                    // Update UI immediately when a match is found
                    renderJDList();
                    // If we're viewing a JD detail, update it too
                    if (selectedItem?.type === 'jd' && selectedItem.id === jd.id) {
                        updateView();
                    }
                } else {
                    console.log(`❌ No match for "${jd.title}" (${score}%)`);
                }
            } catch (e) {
                console.error(`Error matching CV with "${jd.title}":`, e);
                // Continue with next JD even if one fails
            }
        }));
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < jds.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.log(`\nMatching complete for CV "${cv.name}":`);
    console.log(`- Total JDs checked: ${jds.length}`);
    console.log(`- High matches found: ${matchCount}`);
    console.log(`- Match rate: ${((matchCount/jds.length)*100).toFixed(1)}%`);
}

// Handle CSV upload
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
            statusElement.querySelector('.status-stage').textContent = 'Converting CSV to Excel format...';
            const workbook = XLSX.read(e.target.result, { type: 'binary' });
            
            // Get the first sheet
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            
            // Convert sheet to JSON
            statusElement.querySelector('.status-stage').textContent = 'Parsing CSV data...';
            const data = XLSX.utils.sheet_to_json(firstSheet);
            
            if (data.length === 0) {
                alert('CSV file is empty.');
                return;
            }

            // Find the column indices for job title and description
            statusElement.querySelector('.status-stage').textContent = 'Analyzing CSV structure...';
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

            // Update status for batch processing
            statusElement.querySelector('.status-name').textContent = 'Processing Job Descriptions';
            statusElement.querySelector('.status-stage').textContent = `Preparing to process ${data.length} JDs...`;

            // Process JDs in parallel batches
            const batchSize = 5; // Process 5 JDs at a time
            const totalBatches = Math.ceil(data.length / batchSize);
            
            for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
                const startIndex = batchIndex * batchSize;
                const endIndex = Math.min(startIndex + batchSize, data.length);
                const batch = data.slice(startIndex, endIndex);
                
                // Update status for current batch
                statusElement.querySelector('.status-stage').textContent = 
                    `Processing batch ${batchIndex + 1}/${totalBatches} (${startIndex + 1}-${endIndex} of ${data.length} JDs)`;
                
                // Process current batch in parallel
                const batchPromises = batch.map(async (row, index) => {
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
                        jds.push(newJD);
                        
                        try {
                            // Update status for individual JD processing
                            const currentCount = startIndex + index + 1;
                            statusElement.querySelector('.status-stage').textContent = 
                                `Processing JD ${currentCount}/${data.length}: ${title.substring(0, 30)}${title.length > 30 ? '...' : ''}`;

                            // Add retry logic for API calls
                            let retries = 3;
                            let lastError = null;

                            while (retries > 0) {
                                try {
                                    const response = await fetch('http://localhost:11434/api/chat', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            model: 'gemma2:2b',
                                            messages: [
                                                { 
                                                    role: 'system', 
                                                    content: 'You are a job description summarizer. Create a concise summary (2-3 sentences) of the job description, focusing on key responsibilities and requirements. Keep it clear and professional.' 
                                                },
                                                { role: 'user', content: description }
                                            ],
                                            stream: false
                                        })
                                    });

                                    if (!response.ok) {
                                        throw new Error(`API request failed with status ${response.status}`);
                                    }

                                    const data = await response.json();
                                    
                                    // Validate API response
                                    if (!data || !data.message || !data.message.content) {
                                        throw new Error('Invalid API response format');
                                    }

                                    newJD.summary = data.message.content.trim();
                                    
                                    // Update the UI with the new summary
                                    renderJDList();
                                    
                                    return newJD;
                                } catch (error) {
                                    lastError = error;
                                    retries--;
                                    if (retries > 0) {
                                        // Wait before retrying (exponential backoff)
                                        await new Promise(resolve => setTimeout(resolve, Math.pow(2, 3 - retries) * 1000));
                                        continue;
                                    }
                                }
                            }

                            // If all retries failed, use a fallback summary
                            newJD.summary = `Summary unavailable. Original description: ${description.substring(0, 200)}...`;
                            console.error(`Failed to generate summary for JD "${title}" after 3 retries:`, lastError);
                            return newJD;

                        } catch (error) {
                            console.error('Error processing JD:', error);
                            newJD.summary = `Error generating summary: ${error.message}`;
                            return newJD;
                        }
                    }
                });

                // Wait for current batch to complete
                await Promise.all(batchPromises);
                
                // Update status after batch completion
                statusElement.querySelector('.status-stage').textContent = 
                    `Completed batch ${batchIndex + 1}/${totalBatches} (${endIndex} of ${data.length} JDs)`;
            }

            // Update status to completed
            statusElement.querySelector('.status-icon').classList.remove('processing');
            statusElement.querySelector('.status-icon').classList.add('completed');
            statusElement.querySelector('.status-name').textContent = 'Processing Complete';
            statusElement.querySelector('.status-stage').textContent = `Successfully processed ${data.length} JDs`;

            // Hide processing status after a delay
            setTimeout(() => {
                processingStatus.classList.add('hidden');
            }, 3000);

            renderJDList();
            showSuccess('JDs imported successfully');
        } catch (error) {
            console.error('Error processing CSV:', error);
            showError('Failed to process CSV file');
        }
    };

    reader.onerror = function() {
        showError('Error reading file');
    };

    reader.readAsBinaryString(file);
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

// Fetch JD summary from Ollama API
async function getSummary(id, description) {
    try {
        const response = await fetch('http://localhost:11434/api/chat', {
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

        if (!response.ok) throw new Error('API call failed');
        const data = await response.json();
        const jd = jds.find(jd => jd.id === id);
        if (jd) {
            jd.summary = data.message?.content || 'No summary returned';
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

// Initial render
renderJDList();
renderCVList();
