#!/usr/bin/env python3
"""
Automatic Pronunciation Mistake Detector
A Flask web application for grammar checking and pronunciation practice using NLP
"""

from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, BooleanField, DateField, TextAreaField
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError
from datetime import datetime, date
import os
import json
import secrets

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = secrets.token_hex(16)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///pronunciation_detector.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message_category = 'info'

# Create database directory if it doesn't exist
os.makedirs('database', exist_ok=True)

# User loader for Flask-Login
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Database Models
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    full_name = db.Column(db.String(100), nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=True)
    date_of_birth = db.Column(db.Date, nullable=True)
    password_hash = db.Column(db.String(60), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    grammar_checks = db.relationship('GrammarCheck', backref='user', lazy=True)
    practice_sessions = db.relationship('PracticeSession', backref='user', lazy=True)

class GrammarCheck(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    original_text = db.Column(db.Text, nullable=False)
    corrected_text = db.Column(db.Text, nullable=True)
    errors_found = db.Column(db.Integer, default=0)
    accuracy_score = db.Column(db.Float, default=100.0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

class PracticeSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    expected_text = db.Column(db.Text, nullable=False)
    recognized_text = db.Column(db.Text, nullable=True)
    pronunciation_score = db.Column(db.Float, default=0.0)
    fluency_score = db.Column(db.Float, default=0.0)
    completeness_score = db.Column(db.Float, default=0.0)
    overall_score = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

# Forms
class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=4, max=20)])
    full_name = StringField('Full Name', validators=[DataRequired(), Length(min=2, max=100)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    date_of_birth = DateField('Date of Birth', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=8)])
    confirm_password = PasswordField('Confirm Password', 
                                   validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Create Account')
    
    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('Username already exists. Please choose a different one.')
    
    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError('Email already registered. Please choose a different one.')

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember = BooleanField('Remember Me')
    submit = SubmitField('Sign In')

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    
    form = RegistrationForm()
    if form.validate_on_submit():
        hashed_password = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
        user = User(
            username=form.username.data,
            full_name=form.full_name.data,
            email=form.email.data,
            date_of_birth=form.date_of_birth.data,
            password_hash=hashed_password
        )
        db.session.add(user)
        db.session.commit()
        flash('Account created successfully! You can now log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html', form=form)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if not user:
            user = User.query.filter_by(email=form.username.data).first()
        
        if user and bcrypt.check_password_hash(user.password_hash, form.password.data):
            login_user(user, remember=form.remember.data)
            next_page = request.args.get('next')
            flash(f'Welcome back, {user.full_name or user.username}!', 'success')
            return redirect(next_page) if next_page else redirect(url_for('home'))
        else:
            flash('Login failed. Please check username and password.', 'danger')
    
    return render_template('login.html', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@app.route('/home')
@login_required
def home():
    # Get user statistics
    user_stats = get_user_statistics(current_user.id)
    recent_activities = get_recent_activities(current_user.id)
    
    return render_template('home.html', user_stats=user_stats, recent_activities=recent_activities)

@app.route('/grammar')
@login_required
def grammar():
    return render_template('grammar.html')

@app.route('/practice')
@login_required
def practice():
    return render_template('practice.html')

@app.route('/profile')
@login_required
def profile():
    user_stats = get_user_statistics(current_user.id)
    return render_template('profile.html', user_stats=user_stats)

# API Routes
@app.route('/api/check-grammar', methods=['POST'])
@login_required
def api_check_grammar():
    try:
        data = request.get_json()
        text = data.get('text', '').strip()

        if not text:
            return jsonify({'error': 'No text provided'}), 400

        # Import enhanced grammar checking module
        from speech_utils.grammar_checker import check_grammar_enhanced

        # Perform enhanced grammar check with highlighting and correction
        result = check_grammar_enhanced(text)

        # Save to database
        grammar_check = GrammarCheck(
            user_id=current_user.id,
            original_text=text,
            corrected_text=result.get('corrected_text'),
            errors_found=len(result.get('errors', [])),
            accuracy_score=result.get('accuracy_score', 100.0)
        )
        db.session.add(grammar_check)
        db.session.commit()

        return jsonify(result)

    except Exception as e:
        print(f"Grammar check error: {e}")
        import traceback
        traceback.print_exc()

        # Fallback to basic grammar check
        try:
            from speech_utils.grammar_checker import check_grammar
            result = check_grammar(text)
            return jsonify(result)
        except Exception as fallback_error:
            print(f"Fallback grammar check error: {fallback_error}")
            return jsonify({'error': 'Grammar check failed'}), 500

@app.route('/api/analyze-pronunciation', methods=['POST'])
@login_required
def api_analyze_pronunciation():
    try:
        # Check if it's a file upload (audio) or JSON data (text)
        if request.content_type and 'multipart/form-data' in request.content_type:
            # Handle audio file upload
            expected_text = request.form.get('expected_text', '').strip()
            audio_file = request.files.get('audio')

            if not expected_text:
                return jsonify({'error': 'Missing expected text'}), 400

            if not audio_file:
                return jsonify({'error': 'Missing audio file'}), 400

            # Read audio data
            audio_data = audio_file.read()

            # Import pronunciation analysis module
            from speech_utils.pronunciation_analyzer import analyze_pronunciation, process_audio_file, process_webm_audio

            # Process audio to get recognized text
            if audio_file.filename.endswith('.webm'):
                recognized_text = process_webm_audio(audio_data)
            else:
                recognized_text = process_audio_file(audio_data)

            if not recognized_text:
                return jsonify({
                    'error': 'Could not recognize speech from audio',
                    'recognized_text': '',
                    'suggestion': 'Please try speaking more clearly or check your microphone'
                }), 400

            # Perform analysis with audio data
            result = analyze_pronunciation(expected_text, recognized_text, audio_data)

        else:
            # Handle JSON data (text-based analysis)
            data = request.get_json()
            expected_text = data.get('expected_text', '').strip()
            recognized_text = data.get('recognized_text', '').strip()

            if not expected_text or not recognized_text:
                return jsonify({'error': 'Missing text data'}), 400

            # Import pronunciation analysis module
            from speech_utils.pronunciation_analyzer import analyze_pronunciation

            # Perform analysis
            result = analyze_pronunciation(expected_text, recognized_text)

        # Save to database
        practice_session = PracticeSession(
            user_id=current_user.id,
            expected_text=expected_text,
            recognized_text=result.get('recognized_text', recognized_text),
            pronunciation_score=result.get('pronunciation_score', 0),
            fluency_score=result.get('fluency_score', 0),
            completeness_score=result.get('completeness_score', 0),
            overall_score=result.get('overall_score', 0)
        )
        db.session.add(practice_session)
        db.session.commit()

        # Add recognized text to result for frontend
        result['recognized_text'] = result.get('recognized_text', recognized_text)

        return jsonify(result)

    except Exception as e:
        print(f"Pronunciation analysis error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Pronunciation analysis failed', 'details': str(e)}), 500

@app.route('/api/process-audio', methods=['POST'])
@login_required
def api_process_audio():
    """Process audio file and return recognized text"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({'error': 'No audio file selected'}), 400

        # Read audio data
        audio_data = audio_file.read()

        # Import speech processing functions
        from speech_utils.pronunciation_analyzer import process_audio_file, process_webm_audio

        # Process audio based on file type
        if audio_file.filename.endswith('.webm') or audio_file.content_type == 'audio/webm':
            recognized_text = process_webm_audio(audio_data)
        else:
            recognized_text = process_audio_file(audio_data)

        if not recognized_text:
            return jsonify({
                'success': False,
                'error': 'Could not recognize speech from audio',
                'suggestion': 'Please try speaking more clearly or check your microphone'
            }), 400

        return jsonify({
            'success': True,
            'recognized_text': recognized_text,
            'message': 'Speech recognized successfully'
        })

    except Exception as e:
        print(f"Audio processing error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Audio processing failed', 'details': str(e)}), 500

@app.route('/api/update-profile', methods=['POST'])
@login_required
def api_update_profile():
    try:
        data = request.get_json()

        # Update user profile
        current_user.full_name = data.get('full_name', current_user.full_name)
        current_user.email = data.get('email', current_user.email)

        if data.get('date_of_birth'):
            current_user.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()

        db.session.commit()

        return jsonify({'success': True, 'message': 'Profile updated successfully'})

    except Exception as e:
        print(f"Profile update error: {e}")
        return jsonify({'success': False, 'message': 'Failed to update profile'}), 500

@app.route('/api/change-password', methods=['POST'])
@login_required
def api_change_password():
    try:
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')

        if not bcrypt.check_password_hash(current_user.password_hash, current_password):
            return jsonify({'success': False, 'message': 'Current password is incorrect'}), 400

        # Update password
        hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
        current_user.password_hash = hashed_password
        db.session.commit()

        return jsonify({'success': True, 'message': 'Password changed successfully'})

    except Exception as e:
        print(f"Password change error: {e}")
        return jsonify({'success': False, 'message': 'Failed to change password'}), 500

@app.route('/api/submit-feedback', methods=['POST'])
@login_required
def api_submit_feedback():
    try:
        data = request.get_json()
        # In a real app, you'd save this to a feedback table
        print(f"Feedback from {current_user.username}: {data}")

        return jsonify({'success': True, 'message': 'Feedback submitted successfully'})

    except Exception as e:
        print(f"Feedback submission error: {e}")
        return jsonify({'success': False, 'message': 'Failed to submit feedback'}), 500

@app.route('/api/export-data', methods=['POST'])
@login_required
def api_export_data():
    try:
        data = request.get_json()
        export_data = {}

        if data.get('include_profile'):
            export_data['profile'] = {
                'username': current_user.username,
                'full_name': current_user.full_name,
                'email': current_user.email,
                'date_of_birth': current_user.date_of_birth.isoformat() if current_user.date_of_birth else None,
                'created_at': current_user.created_at.isoformat()
            }

        if data.get('include_stats'):
            export_data['statistics'] = get_user_statistics(current_user.id)

        if data.get('include_history'):
            grammar_checks = GrammarCheck.query.filter_by(user_id=current_user.id).all()
            practice_sessions = PracticeSession.query.filter_by(user_id=current_user.id).all()

            export_data['history'] = {
                'grammar_checks': [
                    {
                        'original_text': check.original_text,
                        'errors_found': check.errors_found,
                        'accuracy_score': check.accuracy_score,
                        'created_at': check.created_at.isoformat()
                    } for check in grammar_checks
                ],
                'practice_sessions': [
                    {
                        'expected_text': session.expected_text,
                        'pronunciation_score': session.pronunciation_score,
                        'fluency_score': session.fluency_score,
                        'completeness_score': session.completeness_score,
                        'overall_score': session.overall_score,
                        'created_at': session.created_at.isoformat()
                    } for session in practice_sessions
                ]
            }

        from flask import make_response
        response = make_response(json.dumps(export_data, indent=2))
        response.headers['Content-Type'] = 'application/json'
        response.headers['Content-Disposition'] = 'attachment; filename=pronunciation_detector_data.json'

        return response

    except Exception as e:
        print(f"Data export error: {e}")
        return jsonify({'success': False, 'message': 'Failed to export data'}), 500

@app.route('/api/delete-account', methods=['DELETE'])
@login_required
def api_delete_account():
    try:
        user_id = current_user.id

        # Delete user's data
        GrammarCheck.query.filter_by(user_id=user_id).delete()
        PracticeSession.query.filter_by(user_id=user_id).delete()

        # Delete user account
        db.session.delete(current_user)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Account deleted successfully'})

    except Exception as e:
        print(f"Account deletion error: {e}")
        return jsonify({'success': False, 'message': 'Failed to delete account'}), 500

# Additional API endpoints for better functionality
@app.route('/api/test-grammar', methods=['GET'])
def api_test_grammar():
    """Test endpoint for grammar checker without authentication"""
    try:
        test_text = "She don't like to go to school everyday. Your going to love this."
        from speech_utils.grammar_checker import check_grammar
        result = check_grammar(test_text)
        return jsonify({
            'success': True,
            'test_text': test_text,
            'result': result
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/test-pronunciation', methods=['GET'])
def api_test_pronunciation():
    """Test endpoint for pronunciation analyzer without authentication"""
    try:
        expected = "The quick brown fox jumps over the lazy dog"
        recognized = "The quick brown fox jumps over the lazy dog"
        from speech_utils.pronunciation_analyzer import analyze_pronunciation
        result = analyze_pronunciation(expected, recognized)
        return jsonify({
            'success': True,
            'expected': expected,
            'recognized': recognized,
            'result': result
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def api_health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Pronunciation Detector API is running',
        'features': {
            'grammar_checker': True,
            'pronunciation_analyzer': True,
            'user_management': True,
            'database': True
        }
    })

@app.route('/api/stats', methods=['GET'])
def api_stats():
    """Get application statistics"""
    try:
        total_users = User.query.count()
        total_grammar_checks = GrammarCheck.query.count()
        total_practice_sessions = PracticeSession.query.count()

        return jsonify({
            'total_users': total_users,
            'total_grammar_checks': total_grammar_checks,
            'total_practice_sessions': total_practice_sessions,
            'demo_available': True
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Helper Functions
def get_user_statistics(user_id):
    """Get comprehensive user statistics for dashboard"""
    grammar_checks = GrammarCheck.query.filter_by(user_id=user_id).count()
    practice_sessions = PracticeSession.query.filter_by(user_id=user_id).count()

    # Calculate average scores
    sessions = PracticeSession.query.filter_by(user_id=user_id).all()
    avg_score = 0
    best_score = 0
    if sessions:
        scores = [session.overall_score for session in sessions if session.overall_score]
        if scores:
            avg_score = round(sum(scores) / len(scores))
            best_score = round(max(scores))

    # Calculate grammar accuracy
    grammar_records = GrammarCheck.query.filter_by(user_id=user_id).all()
    avg_grammar_accuracy = 0
    if grammar_records:
        accuracies = [record.accuracy_score for record in grammar_records if record.accuracy_score]
        if accuracies:
            avg_grammar_accuracy = round(sum(accuracies) / len(accuracies))

    # Calculate streak and activity patterns
    streak_days = calculate_streak_days(user_id)
    most_active_day = get_most_active_day(user_id)
    improvement_rate = calculate_improvement_rate(user_id)

    # Recent performance trend
    recent_sessions = PracticeSession.query.filter_by(user_id=user_id)\
                                          .order_by(PracticeSession.created_at.desc())\
                                          .limit(5).all()

    return {
        'grammar_checks': grammar_checks,
        'practice_sessions': practice_sessions,
        'avg_score': avg_score,
        'best_score': best_score,
        'avg_grammar_accuracy': avg_grammar_accuracy,
        'streak_days': streak_days,
        'most_active_day': most_active_day,
        'improvement_rate': improvement_rate,
        'total_activities': grammar_checks + practice_sessions,
        'recent_performance': [s.overall_score for s in recent_sessions if s.overall_score]
    }

def get_recent_activities(user_id, limit=5):
    """Get recent user activities"""
    activities = []
    
    # Get recent grammar checks
    recent_grammar = GrammarCheck.query.filter_by(user_id=user_id)\
                                      .order_by(GrammarCheck.created_at.desc())\
                                      .limit(limit).all()
    
    for check in recent_grammar:
        activities.append({
            'icon': 'spell-check',
            'color': 'primary',
            'description': f'Checked grammar - {check.errors_found} errors found',
            'timestamp': check.created_at.strftime('%Y-%m-%d %H:%M')
        })
    
    # Get recent practice sessions
    recent_practice = PracticeSession.query.filter_by(user_id=user_id)\
                                          .order_by(PracticeSession.created_at.desc())\
                                          .limit(limit).all()
    
    for session in recent_practice:
        activities.append({
            'icon': 'microphone',
            'color': 'success',
            'description': f'Practice session - {session.overall_score}% score',
            'timestamp': session.created_at.strftime('%Y-%m-%d %H:%M')
        })
    
    # Sort by timestamp and return limited results
    activities.sort(key=lambda x: x['timestamp'], reverse=True)
    return activities[:limit]

def calculate_streak_days(user_id):
    """Calculate user's current streak days (simplified)"""
    # This is a simplified implementation
    # In a real app, you'd track daily activity more precisely
    recent_activity = db.session.query(
        db.func.date(GrammarCheck.created_at).label('date')
    ).filter_by(user_id=user_id).union(
        db.session.query(
            db.func.date(PracticeSession.created_at).label('date')
        ).filter_by(user_id=user_id)
    ).distinct().order_by(db.text('date DESC')).limit(30).all()
    
    if not recent_activity:
        return 0
    
    # Simple streak calculation
    streak = 0
    current_date = date.today()
    
    for activity_date in recent_activity:
        if isinstance(activity_date[0], str):
            activity_date = datetime.strptime(activity_date[0], '%Y-%m-%d').date()
        else:
            activity_date = activity_date[0]
        
        if activity_date == current_date:
            streak += 1
            current_date = current_date.replace(day=current_date.day - 1)
        else:
            break
    
    return streak

def get_most_active_day(user_id):
    """Get the most active day of the week for the user"""
    try:
        from sqlalchemy import func, extract

        # Get activity by day of week
        grammar_activity = db.session.query(
            extract('dow', GrammarCheck.created_at).label('day_of_week'),
            func.count(GrammarCheck.id).label('count')
        ).filter_by(user_id=user_id).group_by('day_of_week').all()

        practice_activity = db.session.query(
            extract('dow', PracticeSession.created_at).label('day_of_week'),
            func.count(PracticeSession.id).label('count')
        ).filter_by(user_id=user_id).group_by('day_of_week').all()

        # Combine activities
        day_counts = {}
        for day, count in grammar_activity:
            day_counts[int(day)] = day_counts.get(int(day), 0) + count

        for day, count in practice_activity:
            day_counts[int(day)] = day_counts.get(int(day), 0) + count

        if not day_counts:
            return "No data yet"

        # Find most active day
        most_active_day_num = max(day_counts, key=day_counts.get)
        days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

        return days[most_active_day_num]

    except Exception as e:
        print(f"Error calculating most active day: {e}")
        return "No data yet"

def calculate_improvement_rate(user_id):
    """Calculate improvement rate over the last week"""
    try:
        from datetime import datetime, timedelta

        # Get sessions from last two weeks
        two_weeks_ago = datetime.utcnow() - timedelta(days=14)
        one_week_ago = datetime.utcnow() - timedelta(days=7)

        # Last week's sessions
        last_week_sessions = PracticeSession.query.filter(
            PracticeSession.user_id == user_id,
            PracticeSession.created_at >= one_week_ago
        ).all()

        # Previous week's sessions
        prev_week_sessions = PracticeSession.query.filter(
            PracticeSession.user_id == user_id,
            PracticeSession.created_at >= two_weeks_ago,
            PracticeSession.created_at < one_week_ago
        ).all()

        # Calculate averages
        last_week_avg = 0
        prev_week_avg = 0

        if last_week_sessions:
            scores = [s.overall_score for s in last_week_sessions if s.overall_score]
            if scores:
                last_week_avg = sum(scores) / len(scores)

        if prev_week_sessions:
            scores = [s.overall_score for s in prev_week_sessions if s.overall_score]
            if scores:
                prev_week_avg = sum(scores) / len(scores)

        if prev_week_avg == 0:
            return "+0"

        improvement = ((last_week_avg - prev_week_avg) / prev_week_avg) * 100
        return f"+{improvement:.1f}" if improvement > 0 else f"{improvement:.1f}"

    except Exception as e:
        print(f"Error calculating improvement rate: {e}")
        return "+0"

# Create database tables
def create_tables():
    with app.app_context():
        db.create_all()

        # Create demo user if it doesn't exist
        demo_user = User.query.filter_by(username='demo').first()
        if not demo_user:
            hashed_password = bcrypt.generate_password_hash('demo123').decode('utf-8')
            demo_user = User(
                username='demo',
                full_name='Demo User',
                email='demo@example.com',
                date_of_birth=date(1990, 1, 1),
                password_hash=hashed_password
            )
            db.session.add(demo_user)
            db.session.commit()
            print("Demo user created: username='demo', password='demo123'")

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('500.html'), 500

if __name__ == '__main__':
    # Create tables on startup
    create_tables()
    app.run(debug=True, host='0.0.0.0', port=5000)
