# 🎯 Automatic Pronunciation Mistake Detector

An intelligent web-based NLP system that helps users improve their grammar, pronunciation, and fluency through advanced speech recognition and natural language processing.

## 🚀 Features

- **Grammar & Spell Checker**: Real-time text correction using advanced NLP algorithms
- **Pronunciation Practice**: Speech-to-text analysis with detailed scoring and feedback
- **Fluency Assessment**: Comprehensive rate and feedback on speaking fluency
- **User Authentication**: Secure registration and login system with email validation
- **Voice Assistant**: Navigate the app hands-free using voice commands
- **Progress Tracking**: Personal dashboard with statistics and improvement metrics
- **Profile Management**: Complete user profile with data export capabilities
- **Speech Recognition**: Real-time voice processing with Web Speech API
- **Interactive Dashboard**: Visual progress charts and performance analytics
- **Multi-level Practice**: Beginner to advanced pronunciation exercises

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap
- **Backend**: Python Flask
- **Database**: SQLite
- **NLP Libraries**: spaCy, language-tool-python
- **Speech Processing**: Web Speech API, SpeechRecognition
- **Scoring**: Levenshtein distance, Word Error Rate (WER)

## 📁 Project Structure

```
pronunciation-detector/
├── app.py                  # Main Flask application
├── requirements.txt        # Python dependencies
├── templates/             # HTML templates
├── static/               # CSS, JS, images
├── models/               # Database models
├── speech_utils/         # Speech processing utilities
└── database/            # SQLite database files
```

## 🔧 Installation

1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Download spaCy model: `python -m spacy download en_core_web_sm`
4. Run the application: `python app.py`

## 🎓 Educational Impact

This project demonstrates practical applications of:
- Natural Language Processing (NLP)
- Speech Recognition Technology
- Web Development with Flask
- Database Management
- User Interface Design

## 🎮 Getting Started

### 1. **Create Your Own Account**
- Navigate to http://localhost:5000/register
- Fill in your real information for personalized experience
- Use a valid email address for account verification
- Create a strong password (8+ characters with mixed case, numbers)
- Complete the registration process

### 2. **Test All Features**

#### **📝 Grammar Checking**
- Go to the Grammar Checker section
- Input text with intentional errors
- Get real-time corrections and suggestions
- View detailed error analysis and accuracy scores
- Learn from comprehensive feedback

#### **🎤 Pronunciation Practice**
- Access the Practice section
- Choose difficulty level (Beginner/Intermediate/Advanced)
- Select text type (Sentences/Paragraphs/Stories/Tongue Twisters)
- Record your speech using the microphone
- Receive detailed pronunciation scoring and feedback

### 3. **Explore the Dashboard**
- View your personal statistics and progress
- Track grammar checks and practice sessions
- Monitor your average scores and improvement
- See your learning streak and achievements
- Access quick actions for immediate practice

### 4. **Use Voice Features**
- Try pronunciation practice with speech recognition
- Use the voice assistant for hands-free navigation
- Record and analyze your speech patterns
- Get real-time feedback on pronunciation accuracy
- Practice with various difficulty levels

### 5. **Manage Your Profile**
- Update your personal information
- Change your password securely
- View detailed progress analytics
- Export your learning data
- Provide feedback and suggestions
- Manage account settings and preferences

## 🎯 Demo Account

For quick testing, use the demo account:
- **Username:** `demo`
- **Password:** `demo123`

## 🔧 Advanced Features

### **Voice Assistant Commands**
- Say "grammar" to open Grammar Checker
- Say "practice" to start Pronunciation Practice
- Say "profile" to view your Profile
- Say "home" to return to Dashboard

### **Progress Tracking**
- Grammar check accuracy over time
- Pronunciation improvement metrics
- Session frequency and consistency
- Personalized learning insights

### **Data Management**
- Export your complete learning history
- Download progress reports
- Backup your profile data
- Share feedback with developers

## 📝 License

This project is for educational purposes and language learning enhancement.
