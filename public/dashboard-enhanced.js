/**
 * Enhanced Dashboard - Career Co-Pilot
 * Advanced UI with progress tracking, skill visualization, and AI features
 */

// Global state
let currentUser = null;
let userProfile = null;
let recommendations = [];
let learningPaths = [];
let skillRadarChart = null;
let chatHistory = [];

/**
 * Initialize enhanced dashboard
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Enhanced Dashboard...');
    
    // Initialize Firebase auth listener
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
            currentUser = user;
            if (user) {
                initializeDashboard(user);
            } else {
                redirectToHome();
            }
        });
    } else {
        // Fallback for demo mode
        initializeDashboard({ displayName: 'Demo User', uid: 'demo-user' });
    }
    
    setupEventListeners();
    initializeSkillChart();
});

/**
 * Initialize dashboard with user data
 */
async function initializeDashboard(user) {
    try {
        showLoadingOverlay('Loading Dashboard', 'Fetching your career data...');
        
        // Update user display
        document.getElementById('userDisplayName').textContent = user.displayName || 'User';
        document.getElementById('userName').textContent = user.displayName || 'User';
        
        // Load user profile and data
        await loadUserProfile();
        await loadRecommendations();
        await loadLearningPaths();
        await loadSkillAnalysis();
        await updateStats();
        
        hideLoadingOverlay();
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showError('Failed to load dashboard data', error.message);
    }
}

/**
 * Load user profile from localStorage or Firestore
 */
async function loadUserProfile() {
    try {
        // Try to load from Firestore first
        if (currentUser && typeof firebase !== 'undefined' && firebase.firestore) {
            const doc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
            if (doc.exists) {
                userProfile = doc.data();
                return;
            }
        }
        
        // Fallback to localStorage
        const stored = localStorage.getItem('userProfile');
        if (stored) {
            userProfile = JSON.parse(stored);
        } else {
            // Create demo profile
            userProfile = {
                name: 'Demo User',
                education: 'Bachelor\'s Degree',
                skills: ['JavaScript', 'HTML', 'CSS', 'Python', 'Excel'],
                interests: ['Web Development', 'Data Science'],
                weeklyTime: 10,
                budget: 'free',
                language: 'en',
                completedSkills: [],
                learningHours: 0,
                joinDate: new Date().toISOString()
            };
        }
        
        updateProfileCompletion();
        
    } catch (error) {
        console.error('Error loading user profile:', error);
        throw error;
    }
}

/**
 * Load recommendations from localStorage or generate new ones
 */
async function loadRecommendations() {
    try {
        const stored = localStorage.getItem('recommendations');
        if (stored) {
            const data = JSON.parse(stored);
            recommendations = data.recommendations || [];
        } else {
            // Generate demo recommendations
            recommendations = await generateDemoRecommendations();
        }
        
        displayRecommendations();
        
    } catch (error) {
        console.error('Error loading recommendations:', error);
        recommendations = [];
    }
}

/**
 * Load learning paths and progress
 */
async function loadLearningPaths() {
    try {
        const stored = localStorage.getItem('learningPaths');
        if (stored) {
            learningPaths = JSON.parse(stored);
        } else {
            // Generate demo learning paths
            learningPaths = generateDemoLearningPaths();
        }
        
        displayLearningPaths();
        
    } catch (error) {
        console.error('Error loading learning paths:', error);
        learningPaths = [];
    }
}

/**
 * Load and display skill analysis
 */
async function loadSkillAnalysis() {
    try {
        if (!userProfile) return;
        
        const skillData = analyzeUserSkills(userProfile);
        updateSkillChart(skillData);
        updateSkillGaps(skillData.gaps);
        
    } catch (error) {
        console.error('Error loading skill analysis:', error);
    }
}

/**
 * Update profile completion percentage
 */
function updateProfileCompletion() {
    if (!userProfile) return;
    
    const requiredFields = ['name', 'education', 'skills', 'interests', 'weeklyTime', 'budget'];
    const completedFields = requiredFields.filter(field => {
        const value = userProfile[field];
        return value && (Array.isArray(value) ? value.length > 0 : true);
    });
    
    const completionPercentage = Math.round((completedFields.length / requiredFields.length) * 100);
    
    // Update UI
    document.getElementById('completionPercentage').textContent = completionPercentage + '%';
    
    // Update circular progress
    const circle = document.getElementById('completionCircle');
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (completionPercentage / 100) * circumference;
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = offset;
    
    // Update color based on completion
    if (completionPercentage >= 80) {
        circle.style.stroke = '#4CAF50';
    } else if (completionPercentage >= 60) {
        circle.style.stroke = '#FF9800';
    } else {
        circle.style.stroke = '#F44336';
    }
}

/**
 * Update dashboard statistics
 */
function updateStats() {
    document.getElementById('recommendationsCount').textContent = recommendations.length;
    document.getElementById('learningPathsCount').textContent = learningPaths.length;
    document.getElementById('hoursInvested').textContent = userProfile?.learningHours || 0;
    document.getElementById('skillsLearned').textContent = userProfile?.completedSkills?.length || 0;
}

/**
 * Initialize skill radar chart
 */
function initializeSkillChart() {
    const ctx = document.getElementById('skillRadarChart').getContext('2d');
    
    skillRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Technical Skills', 'Soft Skills', 'Industry Knowledge', 'Tools & Software', 'Communication', 'Leadership'],
            datasets: [{
                label: 'Current Skills',
                data: [3, 4, 2, 3, 4, 2],
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                borderColor: 'rgba(76, 175, 80, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(76, 175, 80, 1)'
            }, {
                label: 'Target Skills',
                data: [5, 5, 5, 5, 5, 5],
                backgroundColor: 'rgba(33, 150, 243, 0.2)',
                borderColor: 'rgba(33, 150, 243, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(33, 150, 243, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

/**
 * Update skill chart with user data
 */
function updateSkillChart(skillData) {
    if (!skillRadarChart) return;
    
    skillRadarChart.data.datasets[0].data = skillData.current;
    skillRadarChart.data.datasets[1].data = skillData.target;
    skillRadarChart.update();
}

/**
 * Analyze user skills and return chart data
 */
function analyzeUserSkills(profile) {
    const skillCategories = {
        technical: ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'HTML', 'CSS'],
        soft: ['Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Time Management'],
        industry: ['Web Development', 'Data Science', 'AI/ML', 'Cybersecurity', 'Cloud Computing'],
        tools: ['Git', 'Docker', 'AWS', 'Azure', 'Figma', 'Slack', 'Jira'],
        communication: ['Writing', 'Presentation', 'Public Speaking', 'Negotiation'],
        leadership: ['Project Management', 'Team Leadership', 'Strategic Thinking', 'Decision Making']
    };
    
    const current = [];
    const gaps = [];
    
    Object.values(skillCategories).forEach((skills, index) => {
        const userSkills = profile.skills || [];
        const matchingSkills = skills.filter(skill => 
            userSkills.some(userSkill => 
                userSkill.toLowerCase().includes(skill.toLowerCase()) ||
                skill.toLowerCase().includes(userSkill.toLowerCase())
            )
        );
        
        const score = Math.min(5, Math.round((matchingSkills.length / skills.length) * 5));
        current.push(score);
        
        if (score < 3) {
            gaps.push(...skills.filter(skill => !matchingSkills.includes(skill)));
        }
    });
    
    return {
        current,
        target: [5, 5, 5, 5, 5, 5],
        gaps: [...new Set(gaps)].slice(0, 8) // Remove duplicates and limit to 8
    };
}

/**
 * Update skill gaps display
 */
function updateSkillGaps(gaps) {
    const container = document.getElementById('skillGapsList');
    container.innerHTML = '';
    
    gaps.forEach(skill => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag gap';
        tag.textContent = skill;
        container.appendChild(tag);
    });
}

/**
 * Display recommendations
 */
function displayRecommendations() {
    const container = document.getElementById('recommendationsList');
    container.innerHTML = '';
    
    recommendations.forEach((rec, index) => {
        const card = createRecommendationCard(rec, index);
        container.appendChild(card);
    });
}

/**
 * Create recommendation card
 */
function createRecommendationCard(rec, index) {
    const card = document.createElement('div');
    card.className = 'recommendation-card';
    card.innerHTML = `
        <div class="rec-header">
            <h3>${rec.title || rec.role}</h3>
            <div class="fit-score ${getFitScoreClass(rec.fitScore)}">
                ${rec.fitScore || 85}% Match
            </div>
        </div>
        <div class="rec-content">
            <p class="rec-description">${rec.why || rec.description}</p>
            <div class="rec-skills">
                <div class="skill-group">
                    <h4>Your Skills</h4>
                    <div class="skill-tags">
                        ${(rec.overlapSkills || rec.skills?.overlapping || []).map(skill => 
                            `<span class="skill-tag overlap">${skill}</span>`
                        ).join('')}
                    </div>
                </div>
                <div class="skill-group">
                    <h4>Skills to Learn</h4>
                    <div class="skill-tags">
                        ${(rec.gapSkills || rec.skills?.gaps || []).map(skill => 
                            `<span class="skill-tag gap">${skill}</span>`
                        ).join('')}
                    </div>
                </div>
            </div>
        </div>
        <div class="rec-actions">
            <button class="btn-outline" onclick="viewLearningPlan(${index})">
                <i class="fas fa-graduation-cap"></i> View Learning Plan
            </button>
            <button class="btn-primary" onclick="startLearningPath(${index})">
                <i class="fas fa-play"></i> Start Learning
            </button>
        </div>
    `;
    
    return card;
}

/**
 * Get fit score CSS class
 */
function getFitScoreClass(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    return 'fair';
}

/**
 * Display learning paths
 */
function displayLearningPaths() {
    const container = document.getElementById('learningPathsList');
    container.innerHTML = '';
    
    learningPaths.forEach((path, index) => {
        const card = createLearningPathCard(path, index);
        container.appendChild(card);
    });
}

/**
 * Create learning path card
 */
function createLearningPathCard(path, index) {
    const progress = calculatePathProgress(path);
    
    const card = document.createElement('div');
    card.className = 'learning-path-card';
    card.innerHTML = `
        <div class="path-header">
            <h3>${path.title}</h3>
            <div class="path-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress.percentage}%"></div>
                </div>
                <span class="progress-text">${progress.percentage}% Complete</span>
            </div>
        </div>
        <div class="path-content">
            <p class="path-description">${path.description}</p>
            <div class="path-stats">
                <div class="stat">
                    <i class="fas fa-clock"></i>
                    <span>${path.totalHours || 40} hours</span>
                </div>
                <div class="stat">
                    <i class="fas fa-calendar"></i>
                    <span>${path.weeks || 4} weeks</span>
                </div>
                <div class="stat">
                    <i class="fas fa-check-circle"></i>
                    <span>${progress.completed}/${progress.total} completed</span>
                </div>
            </div>
        </div>
        <div class="path-actions">
            <button class="btn-primary" onclick="continueLearningPath(${index})">
                <i class="fas fa-play"></i> Continue
            </button>
            <button class="btn-outline" onclick="viewPathDetails(${index})">
                <i class="fas fa-eye"></i> Details
            </button>
        </div>
    `;
    
    return card;
}

/**
 * Calculate learning path progress
 */
function calculatePathProgress(path) {
    const totalWeeks = path.weeks || 4;
    const completedWeeks = path.completedWeeks || 0;
    const percentage = Math.round((completedWeeks / totalWeeks) * 100);
    
    return {
        percentage,
        completed: completedWeeks,
        total: totalWeeks
    };
}

/**
 * Generate demo recommendations
 */
async function generateDemoRecommendations() {
    return [
        {
            title: "Frontend Developer",
            fitScore: 85,
            why: "Perfect match for your JavaScript and web development skills",
            overlapSkills: ["JavaScript", "HTML", "CSS"],
            gapSkills: ["React", "TypeScript", "State Management"],
            plan: {
                weeks: [
                    { week: 1, topics: ["React Fundamentals"], practice: "Build a todo app" },
                    { week: 2, topics: ["State Management"], practice: "Create shopping cart" },
                    { week: 3, topics: ["API Integration"], practice: "Build weather app" },
                    { week: 4, topics: ["Testing & Deployment"], practice: "Deploy your app" }
                ]
            }
        },
        {
            title: "Data Analyst",
            fitScore: 75,
            why: "Great match for your analytical and Excel skills",
            overlapSkills: ["Excel", "Data Analysis"],
            gapSkills: ["Python", "SQL", "Data Visualization"],
            plan: {
                weeks: [
                    { week: 1, topics: ["Python Basics"], practice: "Clean a dataset" },
                    { week: 2, topics: ["Data Visualization"], practice: "Create charts" },
                    { week: 3, topics: ["Statistics"], practice: "A/B testing" },
                    { week: 4, topics: ["Machine Learning"], practice: "Build ML model" }
                ]
            }
        },
        {
            title: "Product Manager",
            fitScore: 70,
            why: "Good fit for your communication and analytical skills",
            overlapSkills: ["Communication", "Analysis"],
            gapSkills: ["Product Strategy", "User Research", "Agile"],
            plan: {
                weeks: [
                    { week: 1, topics: ["Product Strategy"], practice: "Create user personas" },
                    { week: 2, topics: ["User Research"], practice: "Conduct interviews" },
                    { week: 3, topics: ["Agile Methodology"], practice: "Plan sprints" },
                    { week: 4, topics: ["Metrics & Analytics"], practice: "Design KPIs" }
                ]
            }
        }
    ];
}

/**
 * Generate demo learning paths
 */
function generateDemoLearningPaths() {
    return [
        {
            title: "Frontend Development Mastery",
            description: "Complete roadmap to become a professional frontend developer",
            weeks: 4,
            totalHours: 40,
            completedWeeks: 1,
            skills: ["React", "TypeScript", "CSS", "JavaScript"]
        },
        {
            title: "Data Science Fundamentals",
            description: "Learn data analysis, visualization, and basic machine learning",
            weeks: 6,
            totalHours: 60,
            completedWeeks: 0,
            skills: ["Python", "Pandas", "Matplotlib", "SQL"]
        },
        {
            title: "Product Management Essentials",
            description: "Master the core skills needed for product management roles",
            weeks: 4,
            totalHours: 32,
            completedWeeks: 2,
            skills: ["Strategy", "User Research", "Agile", "Analytics"]
        }
    ];
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Chat functionality
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendMessageBtn');
    
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendChatMessage);
    }
    
    // Resume upload
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('resumeInput');
    
    if (uploadArea) {
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('drop', handleFileDrop);
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    // Sign out
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', signOut);
    }
}

/**
 * Send chat message
 */
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addChatMessage(message, 'user');
    input.value = '';
    
    // Show typing indicator
    const typingId = addTypingIndicator();
    
    try {
        // Simulate AI response (replace with actual API call)
        const response = await generateAIResponse(message);
        
        // Remove typing indicator
        removeTypingIndicator(typingId);
        
        // Add bot response
        addChatMessage(response, 'bot');
        
    } catch (error) {
        removeTypingIndicator(typingId);
        addChatMessage("I'm sorry, I'm having trouble right now. Please try again later.", 'bot');
    }
}

/**
 * Add chat message to UI
 */
function addChatMessage(message, sender) {
    const container = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const avatar = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
    
    // Store in chat history
    chatHistory.push({ message, sender, timestamp: new Date() });
}

/**
 * Add typing indicator
 */
function addTypingIndicator() {
    const container = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    const id = 'typing-' + Date.now();
    typingDiv.id = id;
    typingDiv.className = 'message bot-message typing';
    
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;
    
    return id;
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}

/**
 * Generate AI response (mock)
 */
async function generateAIResponse(message) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const responses = [
        "That's a great question! Based on your profile, I'd recommend focusing on React and TypeScript for frontend development.",
        "I can see you're interested in data science. Python and SQL would be excellent next skills to learn.",
        "For product management, I suggest starting with user research methodologies and agile frameworks.",
        "Your current skill set shows strong technical foundations. Consider specializing in a specific domain.",
        "Based on market trends, full-stack development with cloud technologies is highly in demand.",
        "I notice you have good communication skills. This is valuable for any career path you choose."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Handle file upload
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processResumeUpload(file);
    }
}

/**
 * Handle drag and drop
 */
function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
}

function handleFileDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        processResumeUpload(files[0]);
    }
}

/**
 * Process resume upload
 */
async function processResumeUpload(file) {
    // Validate file
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
        showError('Invalid file type', 'Please upload a PDF, DOC, or DOCX file.');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showError('File too large', 'Please upload a file smaller than 5MB.');
        return;
    }
    
    // Show progress
    const progressContainer = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    progressContainer.style.display = 'block';
    
    try {
        // Simulate upload progress
        for (let i = 0; i <= 100; i += 10) {
            progressFill.style.width = i + '%';
            progressText.textContent = `Uploading... ${i}%`;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Simulate resume parsing
        progressText.textContent = 'Analyzing resume...';
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock extracted skills
        const extractedSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'MongoDB', 'Git'];
        
        // Update user profile with extracted skills
        if (userProfile) {
            userProfile.skills = [...new Set([...userProfile.skills, ...extractedSkills])];
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
        }
        
        progressText.textContent = 'Resume analyzed successfully!';
        
        // Hide progress after delay
        setTimeout(() => {
            progressContainer.style.display = 'none';
            showToast('Resume analyzed! New skills added to your profile.', 'success');
            
            // Refresh skill analysis
            loadSkillAnalysis();
        }, 1000);
        
    } catch (error) {
        progressContainer.style.display = 'none';
        showError('Upload failed', 'Failed to process your resume. Please try again.');
    }
}

/**
 * Action handlers
 */
function refreshSkillAnalysis() {
    showLoadingOverlay('Refreshing Analysis', 'Updating your skill assessment...');
    setTimeout(() => {
        loadSkillAnalysis();
        hideLoadingOverlay();
        showToast('Skill analysis updated!', 'success');
    }, 1500);
}

function generateNewRecommendations() {
    showLoadingOverlay('Generating Recommendations', 'AI is analyzing your profile...');
    setTimeout(() => {
        loadRecommendations();
        hideLoadingOverlay();
        showToast('New recommendations generated!', 'success');
    }, 2000);
}

function viewLearningPlan(index) {
    const rec = recommendations[index];
    if (rec && rec.plan) {
        // Open learning plan modal or navigate to detailed view
        showToast(`Opening learning plan for ${rec.title}`, 'info');
    }
}

function startLearningPath(index) {
    const rec = recommendations[index];
    if (rec) {
        // Add to learning paths
        const newPath = {
            title: rec.title + ' Learning Path',
            description: rec.why,
            weeks: 4,
            totalHours: 40,
            completedWeeks: 0,
            skills: rec.gapSkills || []
        };
        
        learningPaths.unshift(newPath);
        localStorage.setItem('learningPaths', JSON.stringify(learningPaths));
        displayLearningPaths();
        updateStats();
        
        showToast(`Started learning path for ${rec.title}!`, 'success');
    }
}

function continueLearningPath(index) {
    const path = learningPaths[index];
    if (path) {
        showToast(`Continuing ${path.title}`, 'info');
        // Navigate to learning path details
    }
}

function viewPathDetails(index) {
    const path = learningPaths[index];
    if (path) {
        showToast(`Viewing details for ${path.title}`, 'info');
        // Open detailed view
    }
}

function viewAllPaths() {
    showToast('Opening all learning paths', 'info');
    // Navigate to learning paths page
}

/**
 * Utility functions
 */
function showLoadingOverlay(title, message) {
    document.getElementById('loadingTitle').textContent = title;
    document.getElementById('loadingMessage').textContent = message;
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showError(title, message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorModal').style.display = 'flex';
}

function closeErrorModal() {
    document.getElementById('errorModal').style.display = 'none';
}

function retryAction() {
    closeErrorModal();
    // Implement retry logic based on context
}

function showToast(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Hide toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function redirectToHome() {
    window.location.href = '/';
}

async function signOut() {
    try {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            await firebase.auth().signOut();
        }
        localStorage.clear();
        redirectToHome();
    } catch (error) {
        console.error('Sign out error:', error);
        showError('Sign out failed', error.message);
    }
}
