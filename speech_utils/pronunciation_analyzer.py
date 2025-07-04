"""
Pronunciation Analysis Module
Analyzes speech recognition results and provides pronunciation feedback
Uses advanced metrics including WER, BLEU, and Levenshtein distance
"""

import re
import difflib
from typing import Dict, List, Any, Tuple
import speech_recognition as sr
from io import BytesIO
import tempfile
import os

# Try to import advanced libraries with fallbacks
try:
    import jiwer
    HAS_JIWER = True
except ImportError:
    HAS_JIWER = False
    print("jiwer not available, using fallback WER calculation")

try:
    from pydub import AudioSegment
    HAS_PYDUB = True
except ImportError:
    HAS_PYDUB = False
    print("pydub not available, audio processing limited")

try:
    import Levenshtein
    HAS_LEVENSHTEIN = True
except ImportError:
    HAS_LEVENSHTEIN = False
    print("python-Levenshtein not available, using difflib fallback")

def process_audio_file(audio_data: bytes) -> str:
    """
    Process audio data and convert to text using speech recognition

    Args:
        audio_data (bytes): Raw audio data

    Returns:
        str: Recognized text from speech
    """
    try:
        # Initialize recognizer
        recognizer = sr.Recognizer()

        # Create temporary file for audio processing
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            temp_file.write(audio_data)
            temp_file_path = temp_file.name

        try:
            # Load audio file
            with sr.AudioFile(temp_file_path) as source:
                # Adjust for ambient noise
                recognizer.adjust_for_ambient_noise(source, duration=0.5)
                # Record the audio
                audio = recognizer.record(source)

            # Recognize speech using Google Speech Recognition
            try:
                text = recognizer.recognize_google(audio)
                print(f"Speech recognition successful: {text}")
                return text
            except sr.UnknownValueError:
                print("Speech recognition could not understand audio")
                return ""
            except sr.RequestError as e:
                print(f"Could not request results from speech recognition service: {e}")
                # Fallback to offline recognition if available
                try:
                    text = recognizer.recognize_sphinx(audio)
                    print(f"Offline recognition successful: {text}")
                    return text
                except:
                    return ""

        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)

    except Exception as e:
        print(f"Error processing audio: {e}")
        return ""

def process_webm_audio(audio_data: bytes) -> str:
    """
    Process WebM audio data from browser recording

    Args:
        audio_data (bytes): WebM audio data

    Returns:
        str: Recognized text from speech
    """
    if not HAS_PYDUB:
        print("pydub not available, cannot process WebM audio")
        return ""

    try:
        # Convert WebM to WAV using pydub
        audio_segment = AudioSegment.from_file(BytesIO(audio_data), format="webm")

        # Convert to WAV format for speech recognition
        wav_data = BytesIO()
        audio_segment.export(wav_data, format="wav")
        wav_data.seek(0)

        # Process the WAV data
        return process_audio_file(wav_data.read())

    except Exception as e:
        print(f"Error processing WebM audio: {e}")
        return ""

def analyze_pronunciation(expected_text: str, recognized_text: str, audio_data: bytes = None) -> Dict[str, Any]:
    """
    Comprehensive pronunciation analysis with advanced metrics

    Args:
        expected_text (str): The text that should have been spoken
        recognized_text (str): The text that was actually recognized
        audio_data (bytes): Optional raw audio data for processing

    Returns:
        Dict containing detailed pronunciation scores and feedback
    """
    # If audio data is provided, process it to get recognized text
    if audio_data and not recognized_text:
        recognized_text = process_audio_file(audio_data)

    if not expected_text or not recognized_text:
        return {
            'pronunciation_score': 0,
            'fluency_score': 0,
            'completeness_score': 0,
            'overall_score': 0,
            'wer': 1.0,
            'cer': 1.0,
            'feedback': ['No speech was recognized. Please try again.'],
            'word_analysis': [],
            'timing_analysis': {},
            'advanced_metrics': {},
            'error_details': []
        }

    # Normalize texts
    expected_normalized = normalize_text(expected_text)
    recognized_normalized = normalize_text(recognized_text)

    # Calculate advanced metrics
    advanced_metrics = calculate_advanced_metrics(expected_normalized, recognized_normalized)

    # Calculate individual scores using advanced metrics
    pronunciation_score = calculate_pronunciation_score_advanced(expected_normalized, recognized_normalized, advanced_metrics)
    fluency_score = calculate_fluency_score_advanced(expected_normalized, recognized_normalized, advanced_metrics)
    completeness_score = calculate_completeness_score_advanced(expected_normalized, recognized_normalized, advanced_metrics)

    # Calculate overall score (weighted average)
    overall_score = (pronunciation_score * 0.4 + fluency_score * 0.3 + completeness_score * 0.3)

    # Generate detailed feedback
    feedback = generate_comprehensive_feedback(pronunciation_score, fluency_score, completeness_score, advanced_metrics)

    # Word-level analysis with error detection
    word_analysis = analyze_words_advanced(expected_normalized, recognized_normalized)

    # Error details for specific feedback
    error_details = generate_error_details(expected_normalized, recognized_normalized, word_analysis)

    # Timing analysis
    timing_analysis = analyze_timing_advanced(expected_normalized, recognized_normalized)

    return {
        'pronunciation_score': round(pronunciation_score, 1),
        'fluency_score': round(fluency_score, 1),
        'completeness_score': round(completeness_score, 1),
        'overall_score': round(overall_score, 1),
        'wer': round(advanced_metrics['wer'], 3),
        'cer': round(advanced_metrics['cer'], 3),
        'bleu_score': round(advanced_metrics['bleu'], 3),
        'semantic_similarity': round(advanced_metrics['semantic_similarity'], 3),
        'feedback': feedback,
        'word_analysis': word_analysis,
        'timing_analysis': timing_analysis,
        'advanced_metrics': advanced_metrics,
        'error_details': error_details,
        'expected_words': len(expected_normalized.split()),
        'recognized_words': len(recognized_normalized.split()),
        'accuracy_percentage': round((1 - advanced_metrics['wer']) * 100, 1)
    }

def normalize_text(text: str) -> str:
    """Normalize text for comparison"""
    # Convert to lowercase
    text = text.lower()
    
    # Remove punctuation except apostrophes
    text = re.sub(r"[^\w\s']", '', text)
    
    # Normalize contractions
    contractions = {
        "don't": "do not",
        "won't": "will not",
        "can't": "cannot",
        "n't": " not",
        "'re": " are",
        "'ve": " have",
        "'ll": " will",
        "'d": " would",
        "'m": " am"
    }
    
    for contraction, expansion in contractions.items():
        text = text.replace(contraction, expansion)
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text.strip())
    
    return text

def calculate_pronunciation_score(expected: str, recognized: str) -> float:
    """Calculate pronunciation accuracy using string similarity"""
    if not expected or not recognized:
        return 0.0
    
    # Use difflib for sequence matching
    similarity = difflib.SequenceMatcher(None, expected, recognized).ratio()
    
    # Also calculate word-level similarity
    expected_words = expected.split()
    recognized_words = recognized.split()
    
    word_similarity = 0.0
    if expected_words:
        word_matches = 0
        for exp_word in expected_words:
            best_match = 0.0
            for rec_word in recognized_words:
                match_ratio = difflib.SequenceMatcher(None, exp_word, rec_word).ratio()
                best_match = max(best_match, match_ratio)
            word_matches += best_match
        word_similarity = word_matches / len(expected_words)
    
    # Combine character and word level similarities
    pronunciation_score = (similarity * 0.6 + word_similarity * 0.4) * 100
    
    return min(100.0, pronunciation_score)

def calculate_fluency_score(expected: str, recognized: str) -> float:
    """Calculate fluency based on speech patterns and completeness"""
    expected_words = expected.split()
    recognized_words = recognized.split()
    
    if not expected_words:
        return 100.0
    
    # Length ratio (penalize if too short or too long)
    length_ratio = len(recognized_words) / len(expected_words)
    length_penalty = 0
    
    if length_ratio < 0.7:  # Too short
        length_penalty = (0.7 - length_ratio) * 50
    elif length_ratio > 1.3:  # Too long
        length_penalty = (length_ratio - 1.3) * 30
    
    # Word order similarity
    order_score = calculate_word_order_similarity(expected_words, recognized_words)
    
    # Base fluency score
    fluency_score = 100 - length_penalty + (order_score * 20)
    
    return max(0.0, min(100.0, fluency_score))

def calculate_completeness_score(expected: str, recognized: str) -> float:
    """Calculate how complete the recognized speech is"""
    expected_words = set(expected.split())
    recognized_words = set(recognized.split())
    
    if not expected_words:
        return 100.0
    
    # Calculate word coverage
    matched_words = expected_words.intersection(recognized_words)
    completeness = len(matched_words) / len(expected_words) * 100
    
    # Bonus for getting the exact number of words
    expected_count = len(expected.split())
    recognized_count = len(recognized.split())
    
    if abs(expected_count - recognized_count) <= 1:
        completeness += 5  # Small bonus for correct length
    
    return min(100.0, completeness)

def calculate_word_error_rate(expected: str, recognized: str) -> float:
    """Calculate Word Error Rate (WER) using jiwer if available"""
    if not expected.strip() or not recognized.strip():
        return 1.0 if expected.strip() else 0.0

    if HAS_JIWER:
        try:
            # Use jiwer for more accurate WER calculation
            wer = jiwer.wer(expected, recognized)
            return wer
        except Exception as e:
            print(f"jiwer WER calculation failed: {e}")
            # Fall back to manual calculation

    # Fallback manual WER calculation
    expected_words = expected.split()
    recognized_words = recognized.split()

    if not expected_words:
        return 0.0 if not recognized_words else 1.0

    # Use dynamic programming to calculate edit distance
    d = [[0] * (len(recognized_words) + 1) for _ in range(len(expected_words) + 1)]

    for i in range(len(expected_words) + 1):
        d[i][0] = i
    for j in range(len(recognized_words) + 1):
        d[0][j] = j

    for i in range(1, len(expected_words) + 1):
        for j in range(1, len(recognized_words) + 1):
            if expected_words[i-1] == recognized_words[j-1]:
                d[i][j] = d[i-1][j-1]
            else:
                d[i][j] = min(
                    d[i-1][j] + 1,      # deletion
                    d[i][j-1] + 1,      # insertion
                    d[i-1][j-1] + 1     # substitution
                )

    return d[len(expected_words)][len(recognized_words)] / len(expected_words)

def calculate_advanced_metrics(expected: str, recognized: str) -> Dict[str, float]:
    """Calculate advanced pronunciation metrics"""
    metrics = {}

    # Word Error Rate
    metrics['wer'] = calculate_word_error_rate(expected, recognized)

    # Character Error Rate
    if HAS_LEVENSHTEIN:
        try:
            char_distance = Levenshtein.distance(expected, recognized)
            metrics['cer'] = char_distance / max(len(expected), 1)
        except:
            metrics['cer'] = 1.0 - difflib.SequenceMatcher(None, expected, recognized).ratio()
    else:
        metrics['cer'] = 1.0 - difflib.SequenceMatcher(None, expected, recognized).ratio()

    # BLEU-like score (simplified)
    if HAS_JIWER:
        try:
            # Calculate BLEU score using jiwer
            bleu = jiwer.compute_measures(expected, recognized)
            metrics['bleu'] = 1.0 - bleu['wer']  # Simplified BLEU approximation
        except:
            metrics['bleu'] = 1.0 - metrics['wer']
    else:
        metrics['bleu'] = 1.0 - metrics['wer']

    # Semantic similarity (word overlap)
    expected_words = set(expected.lower().split())
    recognized_words = set(recognized.lower().split())

    if expected_words:
        overlap = len(expected_words.intersection(recognized_words))
        metrics['semantic_similarity'] = overlap / len(expected_words)
    else:
        metrics['semantic_similarity'] = 1.0 if not recognized_words else 0.0

    return metrics

def calculate_pronunciation_score_advanced(expected: str, recognized: str, metrics: Dict[str, float]) -> float:
    """Calculate pronunciation score using advanced metrics"""
    # Base score from character-level similarity
    char_accuracy = 1.0 - metrics['cer']

    # Word-level accuracy
    word_accuracy = 1.0 - metrics['wer']

    # Semantic similarity bonus
    semantic_bonus = metrics['semantic_similarity'] * 10

    # Combined score
    pronunciation_score = (char_accuracy * 40 + word_accuracy * 50 + semantic_bonus) * 100 / 100

    return min(100.0, max(0.0, pronunciation_score * 100))

def calculate_fluency_score_advanced(expected: str, recognized: str, metrics: Dict[str, float]) -> float:
    """Calculate fluency score using advanced metrics"""
    expected_words = expected.split()
    recognized_words = recognized.split()

    if not expected_words:
        return 100.0

    # Length ratio penalty
    length_ratio = len(recognized_words) / len(expected_words)
    length_penalty = 0

    if length_ratio < 0.7:  # Too short
        length_penalty = (0.7 - length_ratio) * 40
    elif length_ratio > 1.3:  # Too long
        length_penalty = (length_ratio - 1.3) * 25

    # Word order and flow (using BLEU-like score)
    flow_score = metrics['bleu'] * 100

    # Base fluency score
    fluency_score = flow_score - length_penalty

    return max(0.0, min(100.0, fluency_score))

def calculate_completeness_score_advanced(expected: str, recognized: str, metrics: Dict[str, float]) -> float:
    """Calculate completeness score using advanced metrics"""
    # Base completeness from semantic similarity
    base_completeness = metrics['semantic_similarity'] * 100

    # Word coverage bonus
    expected_words = set(expected.split())
    recognized_words = set(recognized.split())

    if expected_words:
        coverage = len(expected_words.intersection(recognized_words)) / len(expected_words)
        coverage_bonus = coverage * 20
    else:
        coverage_bonus = 0

    # Length completeness
    expected_count = len(expected.split())
    recognized_count = len(recognized.split())

    if expected_count > 0:
        length_completeness = min(1.0, recognized_count / expected_count) * 30
    else:
        length_completeness = 30

    completeness_score = base_completeness + coverage_bonus + length_completeness

    return min(100.0, max(0.0, completeness_score))

def analyze_words_advanced(expected: str, recognized: str) -> List[Dict[str, Any]]:
    """Advanced word-by-word analysis with error classification"""
    expected_words = expected.split()
    recognized_words = recognized.split()

    word_analysis = []

    # Use sequence matching for alignment
    matcher = difflib.SequenceMatcher(None, expected_words, recognized_words)

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == 'equal':
            # Perfect matches
            for k in range(i2 - i1):
                word_analysis.append({
                    'expected': expected_words[i1 + k],
                    'recognized': recognized_words[j1 + k],
                    'status': 'correct',
                    'similarity': 1.0,
                    'error_type': None
                })
        elif tag == 'replace':
            # Substitutions with similarity analysis
            for k in range(max(i2 - i1, j2 - j1)):
                exp_word = expected_words[i1 + k] if i1 + k < i2 else ''
                rec_word = recognized_words[j1 + k] if j1 + k < j2 else ''

                if exp_word and rec_word:
                    if HAS_LEVENSHTEIN:
                        similarity = 1.0 - (Levenshtein.distance(exp_word, rec_word) / max(len(exp_word), len(rec_word)))
                    else:
                        similarity = difflib.SequenceMatcher(None, exp_word, rec_word).ratio()

                    # Classify error type
                    error_type = classify_word_error(exp_word, rec_word, similarity)

                    word_analysis.append({
                        'expected': exp_word,
                        'recognized': rec_word,
                        'status': 'substituted',
                        'similarity': similarity,
                        'error_type': error_type
                    })
        elif tag == 'delete':
            # Omitted words
            for k in range(i2 - i1):
                word_analysis.append({
                    'expected': expected_words[i1 + k],
                    'recognized': '',
                    'status': 'omitted',
                    'similarity': 0.0,
                    'error_type': 'omission'
                })
        elif tag == 'insert':
            # Extra words
            for k in range(j2 - j1):
                word_analysis.append({
                    'expected': '',
                    'recognized': recognized_words[j1 + k],
                    'status': 'extra',
                    'similarity': 0.0,
                    'error_type': 'insertion'
                })

    return word_analysis

def classify_word_error(expected: str, recognized: str, similarity: float) -> str:
    """Classify the type of pronunciation error"""
    if similarity > 0.8:
        return 'minor_mispronunciation'
    elif similarity > 0.5:
        return 'moderate_mispronunciation'
    elif similarity > 0.2:
        return 'major_mispronunciation'
    else:
        return 'word_substitution'

def generate_error_details(expected: str, recognized: str, word_analysis: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Generate detailed error analysis for feedback"""
    error_details = []

    for analysis in word_analysis:
        if analysis['status'] != 'correct':
            error_detail = {
                'type': analysis['error_type'],
                'expected': analysis['expected'],
                'recognized': analysis['recognized'],
                'similarity': analysis['similarity'],
                'suggestion': generate_word_suggestion(analysis)
            }
            error_details.append(error_detail)

    return error_details

def generate_word_suggestion(word_analysis: Dict[str, Any]) -> str:
    """Generate specific suggestions for word errors"""
    error_type = word_analysis['error_type']
    expected = word_analysis['expected']
    recognized = word_analysis['recognized']

    if error_type == 'omission':
        return f"Don't skip the word '{expected}'. Practice saying it slowly."
    elif error_type == 'insertion':
        return f"Avoid adding extra words like '{recognized}'. Stick to the text."
    elif error_type == 'minor_mispronunciation':
        return f"Good attempt at '{expected}'! Try to pronounce it more clearly."
    elif error_type == 'moderate_mispronunciation':
        return f"Practice the pronunciation of '{expected}'. You said '{recognized}'."
    elif error_type == 'major_mispronunciation':
        return f"Focus on '{expected}' - break it into syllables and practice slowly."
    else:
        return f"Try to say '{expected}' instead of '{recognized}'."

def analyze_timing_advanced(expected: str, recognized: str) -> Dict[str, Any]:
    """Advanced timing analysis"""
    expected_words = expected.split()
    recognized_words = recognized.split()

    # Estimate speaking rate
    estimated_duration = len(expected_words) * 0.6  # 0.6 seconds per word average
    actual_duration = len(recognized_words) * 0.6

    # Calculate speaking rate
    if estimated_duration > 0:
        rate_ratio = actual_duration / estimated_duration
    else:
        rate_ratio = 1.0

    # Determine pace rating
    if rate_ratio < 0.7:
        pace_rating = 'too_fast'
        pace_feedback = 'Try speaking more slowly for better clarity.'
    elif rate_ratio > 1.3:
        pace_rating = 'too_slow'
        pace_feedback = 'You can speak a bit faster while maintaining clarity.'
    else:
        pace_rating = 'good'
        pace_feedback = 'Your speaking pace is good!'

    return {
        'estimated_duration': round(estimated_duration, 1),
        'actual_duration': round(actual_duration, 1),
        'words_per_minute': round((len(recognized_words) / actual_duration) * 60, 1) if actual_duration > 0 else 0,
        'pace_rating': pace_rating,
        'pace_feedback': pace_feedback,
        'rate_ratio': round(rate_ratio, 2)
    }

def generate_comprehensive_feedback(pronunciation_score: float, fluency_score: float,
                                  completeness_score: float, metrics: Dict[str, float]) -> List[str]:
    """Generate comprehensive feedback using advanced metrics"""
    feedback = []

    # Overall performance
    overall = (pronunciation_score + fluency_score + completeness_score) / 3

    if overall >= 90:
        feedback.append("🎉 Outstanding performance! Your pronunciation is excellent.")
    elif overall >= 80:
        feedback.append("👍 Great job! Your pronunciation is very good with minor areas for improvement.")
    elif overall >= 70:
        feedback.append("👌 Good work! Keep practicing to enhance your pronunciation further.")
    elif overall >= 60:
        feedback.append("💪 You're making progress! Focus on clarity and accuracy.")
    else:
        feedback.append("🎯 Keep practicing! Take your time and speak clearly.")

    # Specific metric feedback
    wer = metrics['wer']
    if wer < 0.1:
        feedback.append("✨ Excellent word accuracy! Almost perfect recognition.")
    elif wer < 0.3:
        feedback.append("👏 Good word accuracy with room for minor improvements.")
    elif wer < 0.5:
        feedback.append("📈 Moderate accuracy. Focus on pronouncing each word clearly.")
    else:
        feedback.append("🔤 Work on word clarity. Practice difficult words separately.")

    # Character-level feedback
    cer = metrics['cer']
    if cer < 0.1:
        feedback.append("🎯 Excellent pronunciation clarity!")
    elif cer > 0.3:
        feedback.append("🗣️ Focus on articulating sounds more clearly.")

    # Semantic feedback
    semantic_sim = metrics['semantic_similarity']
    if semantic_sim > 0.8:
        feedback.append("💡 Great content understanding and delivery!")
    elif semantic_sim < 0.5:
        feedback.append("📖 Make sure to include all the key words from the text.")

    return feedback

def calculate_word_order_similarity(expected_words: List[str], recognized_words: List[str]) -> float:
    """Calculate similarity in word order"""
    if not expected_words or not recognized_words:
        return 0.0
    
    # Find common words and their positions
    common_words = set(expected_words).intersection(set(recognized_words))
    
    if not common_words:
        return 0.0
    
    # Calculate position correlation for common words
    expected_positions = {}
    recognized_positions = {}
    
    for i, word in enumerate(expected_words):
        if word in common_words:
            expected_positions[word] = i
    
    for i, word in enumerate(recognized_words):
        if word in common_words:
            recognized_positions[word] = i
    
    # Calculate correlation
    if len(common_words) < 2:
        return 1.0  # Perfect order for single word
    
    order_score = 0.0
    comparisons = 0
    
    common_list = list(common_words)
    for i in range(len(common_list)):
        for j in range(i + 1, len(common_list)):
            word1, word2 = common_list[i], common_list[j]
            
            expected_order = expected_positions[word1] < expected_positions[word2]
            recognized_order = recognized_positions[word1] < recognized_positions[word2]
            
            if expected_order == recognized_order:
                order_score += 1
            comparisons += 1
    
    return order_score / comparisons if comparisons > 0 else 0.0

def analyze_words(expected: str, recognized: str) -> List[Dict[str, Any]]:
    """Analyze individual words for detailed feedback"""
    expected_words = expected.split()
    recognized_words = recognized.split()
    
    word_analysis = []
    
    # Align words using sequence matching
    matcher = difflib.SequenceMatcher(None, expected_words, recognized_words)
    
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == 'equal':
            # Words match perfectly
            for k in range(i2 - i1):
                word_analysis.append({
                    'expected': expected_words[i1 + k],
                    'recognized': recognized_words[j1 + k],
                    'status': 'correct',
                    'similarity': 1.0
                })
        elif tag == 'replace':
            # Words were substituted
            for k in range(max(i2 - i1, j2 - j1)):
                exp_word = expected_words[i1 + k] if i1 + k < i2 else ''
                rec_word = recognized_words[j1 + k] if j1 + k < j2 else ''
                
                if exp_word and rec_word:
                    similarity = difflib.SequenceMatcher(None, exp_word, rec_word).ratio()
                    word_analysis.append({
                        'expected': exp_word,
                        'recognized': rec_word,
                        'status': 'substituted',
                        'similarity': similarity
                    })
        elif tag == 'delete':
            # Words were omitted
            for k in range(i2 - i1):
                word_analysis.append({
                    'expected': expected_words[i1 + k],
                    'recognized': '',
                    'status': 'omitted',
                    'similarity': 0.0
                })
        elif tag == 'insert':
            # Extra words were added
            for k in range(j2 - j1):
                word_analysis.append({
                    'expected': '',
                    'recognized': recognized_words[j1 + k],
                    'status': 'extra',
                    'similarity': 0.0
                })
    
    return word_analysis

def analyze_timing(expected: str, recognized: str) -> Dict[str, Any]:
    """Analyze timing aspects (simplified)"""
    expected_words = expected.split()
    recognized_words = recognized.split()
    
    # Estimate speaking rate (words per minute)
    # This is simplified - in a real app, you'd have actual timing data
    estimated_duration = len(expected_words) * 0.5  # Assume 0.5 seconds per word
    
    return {
        'estimated_duration': estimated_duration,
        'words_per_minute': (len(recognized_words) / estimated_duration) * 60 if estimated_duration > 0 else 0,
        'pace_rating': 'normal'  # This would be calculated based on actual timing
    }

def generate_feedback(pronunciation_score: float, fluency_score: float, completeness_score: float) -> List[str]:
    """Generate personalized feedback based on scores"""
    feedback = []
    
    # Overall performance feedback
    overall = (pronunciation_score + fluency_score + completeness_score) / 3
    
    if overall >= 90:
        feedback.append("🎉 Excellent work! Your pronunciation is very clear and accurate.")
    elif overall >= 80:
        feedback.append("👍 Great job! Your pronunciation is quite good with room for minor improvements.")
    elif overall >= 70:
        feedback.append("👌 Good effort! Keep practicing to improve your pronunciation further.")
    elif overall >= 60:
        feedback.append("💪 You're making progress! Focus on speaking more clearly and slowly.")
    else:
        feedback.append("🎯 Keep practicing! Try speaking more slowly and clearly.")
    
    # Specific feedback based on individual scores
    if pronunciation_score < 70:
        feedback.append("🔤 Focus on pronouncing each word clearly. Take your time with difficult sounds.")
    
    if fluency_score < 70:
        feedback.append("⏱️ Try to maintain a steady, natural pace while speaking.")
    
    if completeness_score < 80:
        feedback.append("📖 Make sure to read all the words in the text. Don't skip any parts.")
    
    # Positive reinforcement
    if pronunciation_score >= 85:
        feedback.append("✨ Your pronunciation accuracy is excellent!")
    
    if fluency_score >= 85:
        feedback.append("🌊 Your speech flow is very natural!")
    
    if completeness_score >= 90:
        feedback.append("✅ You covered the complete text accurately!")
    
    return feedback

def get_pronunciation_tips(word_analysis: List[Dict[str, Any]]) -> List[str]:
    """Generate specific pronunciation tips based on word analysis"""
    tips = []
    
    # Find commonly mispronounced words
    difficult_words = [
        analysis for analysis in word_analysis 
        if analysis['status'] in ['substituted', 'omitted'] and analysis['similarity'] < 0.7
    ]
    
    if difficult_words:
        tips.append("Focus on these challenging words:")
        for word_info in difficult_words[:3]:  # Limit to top 3
            if word_info['expected']:
                tips.append(f"• Practice saying '{word_info['expected']}' clearly")
    
    return tips
