// ===== PRONUNCIATION PRACTICE JAVASCRIPT =====

// Global variables
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let audioBlob = null;
let recognition = null;
let timerInterval = null;
let startTime = null;
let currentText = '';
let recognizedText = '';
let audioContext = null;
let analyser = null;
let microphone = null;
let dataArray = null;

// Practice texts by category and type
const practiceTexts = {
    beginner: {
        sentences: [
            "The cat sits on the mat.",
            "I like to eat apples and oranges.",
            "The sun is shining brightly today.",
            "She reads books every evening.",
            "We go to school by bus.",
            "My family loves to cook together.",
            "The weather is nice and warm.",
            "I enjoy listening to music.",
            "We play games in the park.",
            "The flowers smell very sweet."
        ],
        paragraph: [
            "My name is John. I live in a small town. I have a dog named Max. Every morning, I take Max for a walk in the park. We both enjoy the fresh air and exercise.",
            "Today is a beautiful day. The sky is blue and clear. Birds are singing in the trees. Children are playing in the playground. Everyone seems happy and cheerful.",
            "I love to read books in my free time. My favorite place to read is under the big oak tree in our backyard. The shade keeps me cool while I explore new worlds through stories.",
            "Cooking is one of my favorite hobbies. I enjoy trying new recipes and sharing meals with my family. The kitchen is always filled with wonderful smells when I cook."
        ]
    },
    intermediate: {
        sentences: [
            "The weather forecast predicts heavy rainfall tomorrow.",
            "She successfully completed her university degree last year.",
            "The restaurant serves delicious Mediterranean cuisine.",
            "Technology has revolutionized the way we communicate.",
            "Environmental protection is everyone's responsibility.",
            "The conference will address sustainable development goals.",
            "Scientists are researching renewable energy solutions.",
            "International cooperation is essential for global peace.",
            "The museum exhibits fascinating historical artifacts.",
            "Educational opportunities should be accessible to everyone."
        ],
        paragraph: [
            "Climate change is one of the most pressing issues of our time. Scientists around the world are working together to find solutions. We must reduce carbon emissions and protect our natural resources for future generations.",
            "The digital revolution has transformed modern society. Smartphones, computers, and the internet have changed how we work, learn, and interact with each other. These technologies offer both opportunities and challenges.",
            "Artificial intelligence is rapidly advancing and changing various industries. From healthcare to transportation, AI systems are helping solve complex problems and improve efficiency. However, we must carefully consider the ethical implications of these technologies.",
            "Globalization has connected people and cultures like never before. International trade, communication, and travel have created a more interconnected world. This has brought both benefits and challenges that require thoughtful consideration."
        ]
    },
    advanced: {
        sentences: [
            "The pharmaceutical company's breakthrough research yielded unprecedented results.",
            "Quantum computing represents a paradigm shift in computational capabilities.",
            "The archaeological excavation revealed artifacts of immense historical significance.",
            "Sustainable development requires balancing economic growth with environmental conservation.",
            "The symphony orchestra's performance was both technically proficient and emotionally compelling."
        ],
        story: [
            "In the heart of the ancient forest stood a magnificent oak tree, its gnarled branches reaching toward the heavens like the arms of a wise old sage. For centuries, it had witnessed the changing seasons, the rise and fall of civilizations, and the endless cycle of life and death that defined the natural world.",
            "The laboratory was filled with the quiet hum of sophisticated equipment. Dr. Martinez carefully adjusted the microscope, her eyes focused intently on the specimen before her. After months of research, she was on the verge of a discovery that could revolutionize medical treatment for millions of patients worldwide."
        ]
    }
};

// Tongue twisters
const tongueTwisters = [
    "She sells seashells by the seashore.",
    "Peter Piper picked a peck of pickled peppers.",
    "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
    "Fuzzy Wuzzy was a bear. Fuzzy Wuzzy had no hair.",
    "Red leather, yellow leather, red leather, yellow leather.",
    "Six sick slick slim sycamore saplings.",
    "A proper copper coffee pot.",
    "The thirty-three thieves thought that they thrilled the throne throughout Thursday.",
    "Can you can a can as a canner can can a can?",
    "I saw Susie sitting in a shoeshine shop.",
    "Toy boat, toy boat, toy boat.",
    "Unique New York, unique New York, unique New York."
];

// DOM Elements
let textCategory, textType, loadTextBtn, practiceText, customTextArea, customText;
let startRecordBtn, stopRecordBtn, playbackBtn, analyzeBtn;
let recordingStatus, micIcon, statusText, recordingTimer, timerDisplay;
let resultsSection, pronunciationScore, fluencyScore, completenessScore;
let expectedText, recognizedTextEl, feedbackContainer;
let tryAgainBtn, nextTextBtn, saveResultBtn;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializePractice();
});

// Initialize practice page
function initializePractice() {
    // Get DOM elements
    getDOMElements();
    
    // Initialize speech recognition
    initializeSpeechRecognition();
    
    // Add event listeners
    addEventListeners();
    
    // Check microphone permissions
    checkMicrophonePermissions();
    
    console.log('Practice page initialized');
}

// Get DOM elements
function getDOMElements() {
    textCategory = document.getElementById('textCategory');
    textType = document.getElementById('textType');
    loadTextBtn = document.getElementById('loadTextBtn');
    practiceText = document.getElementById('practiceText');
    customTextArea = document.getElementById('customTextArea');
    customText = document.getElementById('customText');
    
    startRecordBtn = document.getElementById('startRecordBtn');
    stopRecordBtn = document.getElementById('stopRecordBtn');
    playbackBtn = document.getElementById('playbackBtn');
    analyzeBtn = document.getElementById('analyzeBtn');
    
    recordingStatus = document.getElementById('recordingStatus');
    micIcon = document.getElementById('micIcon');
    statusText = document.getElementById('statusText');
    recordingTimer = document.getElementById('recordingTimer');
    timerDisplay = document.getElementById('timerDisplay');
    
    resultsSection = document.getElementById('resultsSection');
    pronunciationScore = document.getElementById('pronunciationScore');
    fluencyScore = document.getElementById('fluencyScore');
    completenessScore = document.getElementById('completenessScore');
    
    expectedText = document.getElementById('expectedText');
    recognizedTextEl = document.getElementById('recognizedText');
    feedbackContainer = document.getElementById('feedbackContainer');
    
    tryAgainBtn = document.getElementById('tryAgainBtn');
    nextTextBtn = document.getElementById('nextTextBtn');
    saveResultBtn = document.getElementById('saveResultBtn');
}

// Add event listeners
function addEventListeners() {
    // Text selection
    textCategory.addEventListener('change', handleCategoryChange);
    loadTextBtn.addEventListener('click', loadNewText);
    
    // Recording controls
    startRecordBtn.addEventListener('click', startRecording);
    stopRecordBtn.addEventListener('click', stopRecording);
    playbackBtn.addEventListener('click', playRecording);
    analyzeBtn.addEventListener('click', analyzePronunciation);
    
    // Result actions
    tryAgainBtn.addEventListener('click', tryAgain);
    nextTextBtn.addEventListener('click', loadNewText);
    saveResultBtn.addEventListener('click', saveResult);
}

// Handle category change
function handleCategoryChange() {
    if (textCategory.value === 'custom') {
        customTextArea.style.display = 'block';
        practiceText.innerHTML = '<p class="text-muted">Enter your custom text below and start practicing.</p>';
    } else {
        customTextArea.style.display = 'none';
        loadNewText();
    }
}

// Load new practice text
function loadNewText() {
    const category = textCategory.value;
    const type = textType.value;
    
    if (category === 'custom') {
        const text = customText.value.trim();
        if (!text) {
            showNotification('Please enter some text to practice', 'warning');
            customText.focus();
            return;
        }
        currentText = text;
        practiceText.innerHTML = `<p class="lead">${text}</p>`;
    } else if (type === 'tongue-twister') {
        currentText = tongueTwisters[Math.floor(Math.random() * tongueTwisters.length)];
        practiceText.innerHTML = `<p class="lead text-primary">${currentText}</p>`;
    } else {
        const texts = practiceTexts[category] && practiceTexts[category][type];
        if (texts && texts.length > 0) {
            currentText = texts[Math.floor(Math.random() * texts.length)];
            practiceText.innerHTML = `<p class="lead">${currentText}</p>`;
        } else {
            currentText = "The quick brown fox jumps over the lazy dog.";
            practiceText.innerHTML = `<p class="lead">${currentText}</p>`;
        }
    }
    
    // Reset UI
    resetRecordingUI();
    hideResults();
    
    showNotification('New text loaded! Read it aloud when ready.', 'success');
}

// Initialize speech recognition
function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

        recognition.continuous = true;               // Keep recognizing speech continuously
        recognition.interimResults = false;          // Only final results
        recognition.lang = 'en-US';                  // Language of recognition

        // Triggered when recognition starts
        recognition.onstart = function () {
            console.log('🎙️ Speech recognition started');
        };

        // Triggered when speech is detected and then ends
        recognition.onspeechend = function () {
            console.log('🛑 Speech has stopped being detected');
        };

        // Triggered when recognition ends (manually or automatically)
        recognition.onend = function () {
            console.log('✅ Speech recognition ended');
            console.log('Final recognizedText:', recognizedText);
        };

        // Triggered when recognition returns result
        recognition.onresult = function (event) {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            recognizedText = transcript.trim();
            console.log('📝 Recognized text:', recognizedText);
        };

        // Triggered when an error occurs
        recognition.onerror = function (event) {
            console.error('❌ Speech recognition error:', event.error);
            showNotification('Speech recognition error: ' + event.error, 'error');
        };

    } else {
        showNotification('Speech recognition is not supported in this browser.', 'error');
        console.error('❌ Speech recognition not supported');
    }
}


// Check microphone permissions
async function checkMicrophonePermissions() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        console.log('Microphone access granted');
    } catch (error) {
        console.error('Microphone access denied:', error);
        showNotification('Microphone access is required for pronunciation practice', 'warning');
    }
}

// Start recording
async function startRecording() {
    if (!currentText) {
        showNotification('Please load a text to practice first', 'warning');
        return;
    }

    try {
        // Request microphone access with high quality settings
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 44100
            }
        });

        // Initialize audio context for visualization
        initializeAudioVisualization(stream);

        // Setup MediaRecorder with optimal settings
        const options = {
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 128000
        };

        // Fallback for browsers that don't support webm
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'audio/wav';
        }

        mediaRecorder = new MediaRecorder(stream, options);
        audioChunks = [];

        mediaRecorder.ondataavailable = function(event) {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = function() {
            audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
            console.log('Recording stopped, audio blob created:', audioBlob.size, 'bytes');

            // Stop all tracks to release microphone
            stream.getTracks().forEach(track => track.stop());
        };

        // Start recording
        mediaRecorder.start(100); // Collect data every 100ms
        isRecording = true;

        // Start speech recognition for real-time feedback
        if (recognition) {
            try {
                recognition.start();
                console.log('✅ recognition.start() called');

            } catch (e) {
                console.log('Speech recognition already started or not available');
            }
        }

        // Update UI
        updateRecordingUI(true);

        // Start timer
        startTimer();

        showNotification('Recording started! Read the text aloud clearly.', 'info');

    } catch (error) {
        console.error('Error starting recording:', error);
        if (error.name === 'NotAllowedError') {
            showNotification('Microphone access denied. Please allow microphone access and try again.', 'error');
        } else if (error.name === 'NotFoundError') {
            showNotification('No microphone found. Please connect a microphone and try again.', 'error');
        } else {
            showNotification('Error accessing microphone: ' + error.message, 'error');
        }
    }
}

// Stop recording
function stopRecording() {
    if (!isRecording) return;
    
    // Stop media recorder
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
    
    // Stop speech recognition
    if (recognition) {
        recognition.stop();
    }
    
    // Stop timer
    stopTimer();
    
    isRecording = false;
    updateRecordingUI(false);
    
    showNotification('Recording stopped! Click "Analyze Pronunciation" to get feedback.', 'success');
}

// Update recording UI
function updateRecordingUI(recording) {
    if (recording) {
        startRecordBtn.disabled = true;
        stopRecordBtn.disabled = false;
        micIcon.classList.remove('text-muted');
        micIcon.classList.add('text-danger');
        statusText.textContent = 'Recording... Speak clearly';
        recordingStatus.classList.add('recording');
        recordingTimer.style.display = 'block';
    } else {
        startRecordBtn.disabled = false;
        stopRecordBtn.disabled = true;
        playbackBtn.disabled = false;
        analyzeBtn.disabled = false;
        micIcon.classList.remove('text-danger');
        micIcon.classList.add('text-success');
        statusText.textContent = 'Recording complete';
        recordingStatus.classList.remove('recording');
        recordingTimer.style.display = 'none';
    }
}

// Reset recording UI
function resetRecordingUI() {
    startRecordBtn.disabled = false;
    stopRecordBtn.disabled = true;
    playbackBtn.disabled = true;
    analyzeBtn.disabled = true;
    micIcon.classList.remove('text-danger', 'text-success');
    micIcon.classList.add('text-muted');
    statusText.textContent = 'Ready to record';
    recordingStatus.classList.remove('recording');
    recordingTimer.style.display = 'none';
}

// Start timer
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 100);
}

// Stop timer
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Update timer display
function updateTimer() {
    if (startTime) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        timerDisplay.textContent = formatTime(elapsed);
    }
}

// Play recording (placeholder)
function playRecording() {
    if (!audioBlob) {
        showNotification('No audio available for playback.', 'warning');
        return;
    }

    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();

    showNotification('Playing your recorded audio.', 'info');
}


// Initialize audio visualization
function initializeAudioVisualization(stream) {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        microphone.connect(analyser);

        // Start visualization
        visualizeAudio();

    } catch (error) {
        console.error('Error initializing audio visualization:', error);
    }
}

// Visualize audio levels
function visualizeAudio() {
    if (!analyser || !isRecording) return;

    const canvas = document.getElementById('audioCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);

    const barWidth = (width / dataArray.length) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
        barHeight = (dataArray[i] / 255) * height;

        const r = barHeight + 25 * (i / dataArray.length);
        const g = 250 * (i / dataArray.length);
        const b = 50;

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
    }

    if (isRecording) {
        requestAnimationFrame(visualizeAudio);
    }
}

// Enhanced analyze pronunciation with audio upload
async function analyzePronunciation() {
    // Log all inputs before analysis
    console.log('Sending to analysis:', {
        audioBlob,
        recognizedText,
        currentText
    });

    if (!audioBlob) console.warn('⚠️ No audioBlob found');
    if (!recognizedText) console.warn('⚠️ No recognizedText found');

    // Show warning if nothing is available to analyze
    if (!audioBlob && !recognizedText) {
        showNotification('No audio recorded or speech recognized. Please try recording again.', 'warning');
        return;
    }

    // Show loading
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Analyzing...';

    try {
        let result;

        if (audioBlob) {
            // Send audio file for processing
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            formData.append('expected_text', currentText);

            const response = await fetch('/api/analyze-pronunciation', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            result = await response.json();

        } else {
            // Send text-based analysis
            const response = await fetch('/api/analyze-pronunciation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    expected_text: currentText,
                    recognized_text: recognizedText
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            result = await response.json();
        }

        // Update recognized text if we got it from audio processing
        if (result.recognized_text) {
            recognizedText = result.recognized_text;
        }

        displayResults(result);

    } catch (error) {
        console.error('Analysis error:', error);

        // Show error details to user
        if (error.message.includes('Could not recognize speech')) {
            showNotification('Could not recognize speech from audio. Please try speaking more clearly.', 'warning');
        } else {
            showNotification('Analysis failed. Using offline analysis.', 'warning');
            // Fallback to client-side analysis
            const result = performClientSideAnalysis();
            displayResults(result);
        }
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<i class="fas fa-chart-line me-2"></i>Analyze Pronunciation';
    }
}

// Perform client-side analysis (fallback)
function performClientSideAnalysis() {
    const expected = currentText.toLowerCase().replace(/[^\w\s]/g, '');
    const recognized = recognizedText.toLowerCase().replace(/[^\w\s]/g, '');
    
    const expectedWords = expected.split(/\s+/);
    const recognizedWords = recognized.split(/\s+/);
    
    // Calculate basic scores
    const pronunciationScore = calculateSimilarity(expected, recognized);
    const completenessScore = Math.min(100, (recognizedWords.length / expectedWords.length) * 100);
    const fluencyScore = Math.max(0, 100 - Math.abs(expectedWords.length - recognizedWords.length) * 10);
    
    return {
        pronunciation_score: Math.round(pronunciationScore),
        fluency_score: Math.round(fluencyScore),
        completeness_score: Math.round(completenessScore),
        feedback: generateFeedback(pronunciationScore, fluencyScore, completenessScore)
    };
}

// Calculate text similarity
function calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 100;
    
    const distance = levenshteinDistance(longer, shorter);
    return ((longer.length - distance) / longer.length) * 100;
}

// Levenshtein distance calculation
function levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

// Generate feedback
function generateFeedback(pronunciation, fluency, completeness) {
    let feedback = [];
    
    if (pronunciation >= 90) {
        feedback.push("🎉 Excellent pronunciation! Your speech is very clear and accurate.");
    } else if (pronunciation >= 70) {
        feedback.push("👍 Good pronunciation! Minor improvements could make it even better.");
    } else {
        feedback.push("💪 Keep practicing! Focus on pronouncing each word clearly.");
    }
    
    if (fluency >= 80) {
        feedback.push("🌟 Great fluency! Your speech rhythm is natural.");
    } else {
        feedback.push("⏱️ Try to maintain a steady pace while speaking.");
    }
    
    if (completeness >= 90) {
        feedback.push("✅ You read the complete text accurately!");
    } else {
        feedback.push("📖 Try to read all the words in the text.");
    }
    
    return feedback;
}

// Display enhanced results
function displayResults(result) {
    // Update main scores
    pronunciationScore.textContent = `${result.pronunciation_score}%`;
    fluencyScore.textContent = `${result.fluency_score}%`;
    completenessScore.textContent = `${result.completeness_score}%`;

    // Update text comparison
    expectedText.textContent = currentText;
    recognizedTextEl.textContent = result.recognized_text || recognizedText || 'No speech recognized';

    // Display advanced metrics if available
    if (result.wer !== undefined) {
        const metricsHtml = `
            <div class="row mt-3">
                <div class="col-md-3">
                    <div class="metric-card text-center p-2 border rounded">
                        <small class="text-muted">Word Error Rate</small>
                        <div class="h6 mb-0">${(result.wer * 100).toFixed(1)}%</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="metric-card text-center p-2 border rounded">
                        <small class="text-muted">Character Accuracy</small>
                        <div class="h6 mb-0">${((1 - result.cer) * 100).toFixed(1)}%</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="metric-card text-center p-2 border rounded">
                        <small class="text-muted">BLEU Score</small>
                        <div class="h6 mb-0">${(result.bleu_score * 100).toFixed(1)}%</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="metric-card text-center p-2 border rounded">
                        <small class="text-muted">Semantic Match</small>
                        <div class="h6 mb-0">${(result.semantic_similarity * 100).toFixed(1)}%</div>
                    </div>
                </div>
            </div>
        `;

        // Add metrics section if it doesn't exist
        let metricsSection = document.getElementById('advancedMetrics');
        if (!metricsSection) {
            metricsSection = document.createElement('div');
            metricsSection.id = 'advancedMetrics';
            metricsSection.innerHTML = '<h6 class="mt-3 mb-2">Advanced Metrics</h6>' + metricsHtml;
            document.querySelector('#resultsSection .card-body').appendChild(metricsSection);
        } else {
            metricsSection.innerHTML = '<h6 class="mt-3 mb-2">Advanced Metrics</h6>' + metricsHtml;
        }
    }

    // Display word-by-word analysis if available
    if (result.word_analysis && result.word_analysis.length > 0) {
        displayWordAnalysis(result.word_analysis);
    }

    // Display error details if available
    if (result.error_details && result.error_details.length > 0) {
        displayErrorDetails(result.error_details);
    }

    // Display feedback
    if (result.feedback && result.feedback.length > 0) {
        feedbackContainer.innerHTML = result.feedback.map(fb => `<p class="mb-2">${fb}</p>`).join('');
    } else {
        feedbackContainer.innerHTML = '<p class="mb-0">Keep practicing to improve your pronunciation!</p>';
    }

    // Display timing analysis if available
    if (result.timing_analysis) {
        displayTimingAnalysis(result.timing_analysis);
    }

    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Display word-by-word analysis
function displayWordAnalysis(wordAnalysis) {
    let analysisHtml = '<h6 class="mt-4 mb-2">Word Analysis</h6><div class="word-analysis">';

    wordAnalysis.forEach(analysis => {
        let statusClass = '';
        let statusIcon = '';

        switch (analysis.status) {
            case 'correct':
                statusClass = 'text-success';
                statusIcon = 'fas fa-check';
                break;
            case 'substituted':
                statusClass = 'text-warning';
                statusIcon = 'fas fa-exclamation-triangle';
                break;
            case 'omitted':
                statusClass = 'text-danger';
                statusIcon = 'fas fa-times';
                break;
            case 'extra':
                statusClass = 'text-info';
                statusIcon = 'fas fa-plus';
                break;
        }

        analysisHtml += `
            <span class="word-analysis-item badge bg-light text-dark me-1 mb-1" title="${analysis.error_type || analysis.status}">
                <i class="${statusIcon} ${statusClass} me-1"></i>
                ${analysis.expected || analysis.recognized}
                ${analysis.similarity !== undefined ? `(${(analysis.similarity * 100).toFixed(0)}%)` : ''}
            </span>
        `;
    });

    analysisHtml += '</div>';

    // Add to results section
    let wordSection = document.getElementById('wordAnalysis');
    if (!wordSection) {
        wordSection = document.createElement('div');
        wordSection.id = 'wordAnalysis';
        document.querySelector('#resultsSection .card-body').appendChild(wordSection);
    }
    wordSection.innerHTML = analysisHtml;
}

// Display error details
function displayErrorDetails(errorDetails) {
    if (errorDetails.length === 0) return;

    let errorsHtml = '<h6 class="mt-4 mb-2">Specific Errors & Suggestions</h6>';

    errorDetails.forEach(error => {
        errorsHtml += `
            <div class="alert alert-warning">
                <strong>${error.type.replace(/_/g, ' ').toUpperCase()}:</strong>
                Expected "${error.expected}" but got "${error.recognized}"
                <br><small class="text-muted">${error.suggestion}</small>
            </div>
        `;
    });

    // Add to results section
    let errorSection = document.getElementById('errorDetails');
    if (!errorSection) {
        errorSection = document.createElement('div');
        errorSection.id = 'errorDetails';
        document.querySelector('#resultsSection .card-body').appendChild(errorSection);
    }
    errorSection.innerHTML = errorsHtml;
}

// Display timing analysis
function displayTimingAnalysis(timingAnalysis) {
    const timingHtml = `
        <h6 class="mt-4 mb-2">Speaking Analysis</h6>
        <div class="row">
            <div class="col-md-4">
                <small class="text-muted">Speaking Rate</small>
                <div>${timingAnalysis.words_per_minute} WPM</div>
            </div>
            <div class="col-md-4">
                <small class="text-muted">Pace Rating</small>
                <div class="badge bg-${timingAnalysis.pace_rating === 'good' ? 'success' : 'warning'}">
                    ${timingAnalysis.pace_rating.replace('_', ' ').toUpperCase()}
                </div>
            </div>
            <div class="col-md-4">
                <small class="text-muted">Duration</small>
                <div>${timingAnalysis.actual_duration}s</div>
            </div>
        </div>
        <div class="mt-2">
            <small class="text-muted">${timingAnalysis.pace_feedback}</small>
        </div>
    `;

    // Add to results section
    let timingSection = document.getElementById('timingAnalysis');
    if (!timingSection) {
        timingSection = document.createElement('div');
        timingSection.id = 'timingAnalysis';
        document.querySelector('#resultsSection .card-body').appendChild(timingSection);
    }
    timingSection.innerHTML = timingHtml;
}

// Hide results
function hideResults() {
    resultsSection.style.display = 'none';
}

// Try again
function tryAgain() {
    resetRecordingUI();
    hideResults();
    recognizedText = '';
    showNotification('Ready to try again! Click "Start Recording" when ready.', 'info');
}

// Save result (placeholder)
function saveResult() {
    showNotification('Result saved to your profile!', 'success');
}

// Utility functions
function showNotification(message, type) {
    if (window.PronunciationDetector) {
        window.PronunciationDetector.showNotification(message, type);
    }
}

function formatTime(seconds) {
    if (window.PronunciationDetector) {
        return window.PronunciationDetector.formatTime(seconds);
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
