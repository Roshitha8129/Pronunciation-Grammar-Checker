"""
Grammar and Spell Checker Module
Uses language_tool_python and spaCy for comprehensive text analysis
"""

import re
import html
from typing import Dict, List, Any, Tuple

# Global variables for lazy loading
_language_tool = None
_nlp = None

def get_language_tool():
    """Lazy load LanguageTool to avoid startup delays"""
    global _language_tool
    if _language_tool is None:
        try:
            import language_tool_python
            _language_tool = language_tool_python.LanguageTool('en-US')
            print("LanguageTool initialized successfully")
        except Exception as e:
            print(f"Error initializing LanguageTool: {e}")
            _language_tool = None
    return _language_tool

def get_nlp():
    """Lazy load spaCy model to avoid startup delays"""
    global _nlp
    if _nlp is None:
        try:
            import spacy
            _nlp = spacy.load('en_core_web_sm')
            print("spaCy model loaded successfully")
        except OSError:
            print("spaCy model 'en_core_web_sm' not found. Using basic analysis instead.")
            _nlp = None
        except ImportError:
            print("spaCy not installed. Using basic analysis instead.")
            _nlp = None
        except Exception as e:
            print(f"Error loading spaCy model: {e}")
            _nlp = None
    return _nlp

def check_grammar(text: str) -> Dict[str, Any]:
    """
    Comprehensive grammar and spell checking
    
    Args:
        text (str): Text to check
        
    Returns:
        Dict containing errors, corrected text, and statistics
    """
    if not text or not text.strip():
        return {
            'errors': [],
            'corrected_text': '',
            'accuracy_score': 100.0,
            'word_count': 0,
            'error_count': 0
        }
    
    # Clean the text
    cleaned_text = clean_text(text)
    
    # Get word count for accuracy calculation
    word_count = len(cleaned_text.split())
    
    # Try LanguageTool first
    errors = []
    corrected_text = cleaned_text
    
    language_tool = get_language_tool()
    if language_tool:
        try:
            # Check with LanguageTool
            matches = language_tool.check(cleaned_text)
            errors = process_language_tool_errors(matches, cleaned_text)
            corrected_text = language_tool.correct(cleaned_text)
        except Exception as e:
            print(f"LanguageTool error: {e}")
            # Fallback to basic checking
            errors = perform_basic_grammar_check(cleaned_text)
    else:
        # Fallback to basic checking
        errors = perform_basic_grammar_check(cleaned_text)
    
    # Additional spaCy analysis
    nlp = get_nlp()
    if nlp:
        try:
            spacy_errors = analyze_with_spacy(cleaned_text, nlp)
            errors.extend(spacy_errors)
        except Exception as e:
            print(f"spaCy analysis error: {e}")
    
    # Remove duplicate errors
    errors = remove_duplicate_errors(errors)
    
    # Calculate accuracy score
    error_count = len(errors)
    accuracy_score = max(0, 100 - (error_count / max(word_count, 1)) * 100)
    
    return {
        'errors': errors,
        'corrected_text': corrected_text if corrected_text != cleaned_text else None,
        'accuracy_score': round(accuracy_score, 1),
        'word_count': word_count,
        'error_count': error_count,
        'suggestions_count': sum(len(error.get('suggestions', [])) for error in errors)
    }

def clean_text(text: str) -> str:
    """Clean and normalize text"""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text.strip())
    
    # Fix common formatting issues
    text = re.sub(r'\s+([.!?])', r'\1', text)  # Remove space before punctuation
    text = re.sub(r'([.!?])\s*([A-Z])', r'\1 \2', text)  # Ensure space after sentence end
    
    return text

def process_language_tool_errors(matches, text: str) -> List[Dict[str, Any]]:
    """Process LanguageTool matches into standardized error format"""
    errors = []
    
    for match in matches:
        error = {
            'rule_id': match.ruleId,
            'category': match.category,
            'message': match.message,
            'context': get_error_context(text, match.offset, match.errorLength),
            'offset': match.offset,
            'length': match.errorLength,
            'suggestions': match.replacements[:5],  # Limit to 5 suggestions
            'type': categorize_error(match.ruleId, match.category),
            'severity': get_error_severity(match.ruleId)
        }
        errors.append(error)
    
    return errors

def analyze_with_spacy(text: str, nlp) -> List[Dict[str, Any]]:
    """Additional analysis using spaCy"""
    errors = []
    
    try:
        doc = nlp(text)
        
        # Check for potential issues
        for sent in doc.sents:
            # Check sentence length (very long sentences might be hard to read)
            if len(sent.text.split()) > 30:
                errors.append({
                    'rule_id': 'LONG_SENTENCE',
                    'category': 'Style',
                    'message': 'This sentence is quite long and might be hard to read.',
                    'context': sent.text[:100] + '...' if len(sent.text) > 100 else sent.text,
                    'suggestions': ['Consider breaking this into shorter sentences.'],
                    'type': 'style',
                    'severity': 'low'
                })
            
            # Check for repeated words
            words = [token.text.lower() for token in sent if token.is_alpha]
            for i in range(len(words) - 1):
                if words[i] == words[i + 1]:
                    errors.append({
                        'rule_id': 'REPEATED_WORD',
                        'category': 'Grammar',
                        'message': f'Repeated word: "{words[i]}"',
                        'context': sent.text,
                        'suggestions': [f'Remove the duplicate "{words[i]}"'],
                        'type': 'grammar',
                        'severity': 'medium'
                    })
                    break
        
        # Check for passive voice (simplified)
        for token in doc:
            if token.dep_ == 'auxpass':
                sent = token.sent
                errors.append({
                    'rule_id': 'PASSIVE_VOICE',
                    'category': 'Style',
                    'message': 'Consider using active voice for clearer writing.',
                    'context': sent.text,
                    'suggestions': ['Rewrite in active voice'],
                    'type': 'style',
                    'severity': 'low'
                })
                break
    
    except Exception as e:
        print(f"spaCy analysis error: {e}")
    
    return errors

def perform_basic_grammar_check(text: str) -> List[Dict[str, Any]]:
    """Basic grammar checking using regex patterns (fallback)"""
    errors = []
    
    # Common grammar patterns
    patterns = [
        {
            'pattern': r'\b(there|their|they\'re)\b',
            'message': 'Check usage of "there", "their", or "they\'re"',
            'category': 'Grammar',
            'type': 'word_choice'
        },
        {
            'pattern': r'\b(your|you\'re)\b',
            'message': 'Check usage of "your" or "you\'re"',
            'category': 'Grammar',
            'type': 'word_choice'
        },
        {
            'pattern': r'\b(its|it\'s)\b',
            'message': 'Check usage of "its" or "it\'s"',
            'category': 'Grammar',
            'type': 'word_choice'
        },
        {
            'pattern': r'\b(\w+)\s+\1\b',
            'message': 'Possible repeated word',
            'category': 'Grammar',
            'type': 'repetition'
        },
        {
            'pattern': r'\b(alot)\b',
            'message': 'Should be "a lot" (two words)',
            'category': 'Spelling',
            'type': 'spelling',
            'suggestions': ['a lot']
        },
        {
            'pattern': r'\b(recieve)\b',
            'message': 'Incorrect spelling',
            'category': 'Spelling',
            'type': 'spelling',
            'suggestions': ['receive']
        }
    ]
    
    for pattern_info in patterns:
        matches = re.finditer(pattern_info['pattern'], text, re.IGNORECASE)
        for match in matches:
            errors.append({
                'rule_id': f"BASIC_{pattern_info['type'].upper()}",
                'category': pattern_info['category'],
                'message': pattern_info['message'],
                'context': get_error_context(text, match.start(), match.end() - match.start()),
                'offset': match.start(),
                'length': match.end() - match.start(),
                'suggestions': pattern_info.get('suggestions', []),
                'type': pattern_info['type'],
                'severity': 'medium'
            })
    
    return errors

def get_error_context(text: str, offset: int, length: int, context_size: int = 50) -> str:
    """Get context around an error"""
    start = max(0, offset - context_size)
    end = min(len(text), offset + length + context_size)
    
    context = text[start:end]
    
    # Mark the error in context
    error_start = offset - start
    error_end = error_start + length
    
    if error_start >= 0 and error_end <= len(context):
        context = (context[:error_start] + 
                  '**' + context[error_start:error_end] + '**' + 
                  context[error_end:])
    
    return context.strip()

def categorize_error(rule_id: str, category: str) -> str:
    """Categorize error type"""
    rule_id = rule_id.upper()
    
    if 'SPELL' in rule_id or 'MORFOLOGIK' in rule_id:
        return 'spelling'
    elif 'GRAMMAR' in rule_id or category == 'Grammar':
        return 'grammar'
    elif 'PUNCT' in rule_id:
        return 'punctuation'
    elif 'STYLE' in rule_id or category == 'Style':
        return 'style'
    else:
        return 'other'

def get_error_severity(rule_id: str) -> str:
    """Determine error severity"""
    rule_id = rule_id.upper()
    
    # High severity errors
    if any(keyword in rule_id for keyword in ['SPELL', 'GRAMMAR', 'AGREEMENT']):
        return 'high'
    
    # Medium severity errors
    if any(keyword in rule_id for keyword in ['PUNCT', 'WORD_ORDER']):
        return 'medium'
    
    # Low severity errors (style suggestions)
    return 'low'

def remove_duplicate_errors(errors: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Remove duplicate errors based on position and type"""
    seen = set()
    unique_errors = []
    
    for error in errors:
        # Create a unique key based on position and rule
        key = (error.get('offset', 0), error.get('rule_id', ''), error.get('message', ''))
        
        if key not in seen:
            seen.add(key)
            unique_errors.append(error)
    
    return unique_errors

# Test function
def test_grammar_checker():
    """Test the grammar checker with sample text"""
    test_texts = [
        "She don't like to go to school everyday.",
        "Your going to love this new restaurant. Its the best place in town.",
        "I have went to the store yesterday. The weather was very nice.",
        "There are many reasons why students struggle with there homework.",
        "The quick brown fox jumps over the lazy dog."
    ]
    
    for text in test_texts:
        print(f"\nTesting: {text}")
        result = check_grammar(text)
        print(f"Errors found: {result['error_count']}")
        print(f"Accuracy: {result['accuracy_score']}%")
        if result['corrected_text']:
            print(f"Corrected: {result['corrected_text']}")

def check_grammar_enhanced(text: str) -> Dict[str, Any]:
    """
    Enhanced grammar checking with text highlighting and full sentence correction
    """

    # Start with basic grammar check
    basic_result = check_grammar(text)

    # Initialize enhanced result with basic data
    result = {
        'original_text': text,
        'highlighted_text': '',
        'corrected_text': text,  # Default to original
        'errors': basic_result.get('errors', []),
        'error_count': basic_result.get('error_count', 0),
        'accuracy_score': basic_result.get('accuracy_score', 100),
        'word_count': len(text.split()),
        'sentence_count': len([s for s in text.split('.') if s.strip()]),
        'corrections_applied': []
    }

    try:
        # Try to get LanguageTool
        tool = get_language_tool()

        if tool:
            print(f"Using LanguageTool to check: '{text}'")
            matches = tool.check(text)
            print(f"LanguageTool found {len(matches)} matches")

            if matches:
                # Generate highlighted and corrected text
                highlighted_html, corrected_text, corrections = generate_highlighted_and_corrected_text(text, matches)

                result['highlighted_text'] = highlighted_html
                result['corrected_text'] = corrected_text
                result['corrections_applied'] = corrections

                # Enhanced error details
                enhanced_errors = []
                for match in matches:
                    error_info = {
                        'offset': match.offset,
                        'length': match.errorLength,
                        'message': match.message,
                        'category': match.category,
                        'rule_id': match.ruleId,
                        'context': getattr(match, 'context', ''),
                        'original_text': text[match.offset:match.offset + match.errorLength],
                        'suggestions': [r for r in match.replacements[:3]],
                        'error_type': categorize_error(match),
                        'severity': get_error_severity(match)
                    }
                    enhanced_errors.append(error_info)

                result['errors'] = enhanced_errors
                result['error_count'] = len(enhanced_errors)
                result['accuracy_score'] = max(0, 100 - (len(enhanced_errors) * 15))
            else:
                # No errors found by LanguageTool
                result['highlighted_text'] = html.escape(text)
                result['corrected_text'] = text
                result['error_count'] = 0
                result['errors'] = []
                result['accuracy_score'] = 100
        else:
            # Fallback: Create basic highlighting and correction
            print("LanguageTool not available, using fallback")
            result.update(create_fallback_enhanced_result(text, basic_result))

    except Exception as e:
        print(f"Enhanced grammar check error: {e}")
        # Fallback to basic enhanced result
        result.update(create_fallback_enhanced_result(text, basic_result))

    print(f"Enhanced result: errors={result['error_count']}, corrected='{result['corrected_text'][:50]}...'")
    return result

def create_fallback_enhanced_result(text: str, basic_result: Dict) -> Dict:
    """Create enhanced result when LanguageTool is not available"""

    # Comprehensive error detection patterns
    error_patterns = [
        # Subject-verb disagreement
        (r"\bShe don't\b", "She doesn't", "grammar"),
        (r"\bHe don't\b", "He doesn't", "grammar"),
        (r"\bIt don't\b", "It doesn't", "grammar"),
        (r"\bdon't\b", "doesn't", "grammar"),  # General case
        (r"\bI are\b", "I am", "grammar"),
        (r"\bHe have\b", "He has", "grammar"),
        (r"\bShe have\b", "She has", "grammar"),
        (r"\bIt have\b", "It has", "grammar"),
        (r"\bThey was\b", "They were", "grammar"),
        (r"\bWe was\b", "We were", "grammar"),
        (r"\bYou was\b", "You were", "grammar"),

        # Wrong word usage
        (r"\btheir\b(?=\s+going)", "they're", "grammar"),
        (r"\bTheir\b(?=\s+going)", "They're", "grammar"),
        (r"\byour\b(?=\s+going)", "you're", "grammar"),
        (r"\bYour\b(?=\s+going)", "You're", "grammar"),
        (r"\bits\b(?=\s+a\b)", "it's", "grammar"),
        (r"\bIts\b(?=\s+a\b)", "It's", "grammar"),

        # Wrong phrases
        (r"\bcould of\b", "could have", "grammar"),
        (r"\bwould of\b", "would have", "grammar"),
        (r"\bshould of\b", "should have", "grammar"),
        (r"\bmust of\b", "must have", "grammar"),

        # Wrong pronouns
        (r"\bBetween you and I\b", "Between you and me", "grammar"),
        (r"\bbetween you and I\b", "between you and me", "grammar"),
        (r"\bMe and him\b", "He and I", "grammar"),
        (r"\bme and him\b", "he and I", "grammar"),
        (r"\bMe and her\b", "She and I", "grammar"),
        (r"\bme and her\b", "she and I", "grammar"),

        # Wrong verb forms
        (r"\bI seen\b", "I saw", "grammar"),
        (r"\bWe seen\b", "We saw", "grammar"),
        (r"\bThey seen\b", "They saw", "grammar"),
        (r"\bhave went\b", "have gone", "grammar"),
        (r"\bhas went\b", "has gone", "grammar"),

        # Double comparatives
        (r"\bmore prettier\b", "prettier", "grammar"),
        (r"\bmore better\b", "better", "grammar"),
        (r"\bmore worse\b", "worse", "grammar"),
        (r"\bmost prettiest\b", "prettiest", "grammar"),

        # Common spelling errors
        (r"\bbeautifull\b", "beautiful", "spelling"),
        (r"\bgrammer\b", "grammar", "spelling"),
        (r"\brecieve\b", "receive", "spelling"),
        (r"\boccured\b", "occurred", "spelling"),
        (r"\bseperate\b", "separate", "spelling"),
        (r"\bdefinately\b", "definitely", "spelling"),
        (r"\baccommodate\b", "accommodate", "spelling"),
        (r"\bembarrass\b", "embarrass", "spelling"),

        # Additional common errors
        (r"\ba lot\b", "a lot", "spelling"),  # Catches "alot"
        (r"\balot\b", "a lot", "spelling"),
        (r"\bthere\b(?=\s+going)", "they're", "grammar"),
        (r"\bwhere\b(?=\s+going)", "they're", "grammar"),
    ]

    corrected_text = text
    highlighted_text = html.escape(text)
    errors = []
    corrections_applied = []

    # Apply pattern-based corrections and collect matches
    import re
    all_matches = []

    for pattern, replacement, error_type in error_patterns:
        matches = list(re.finditer(pattern, text, re.IGNORECASE))

        for match in matches:
            original = match.group()
            start, end = match.span()

            # Check for overlapping matches and keep the longer one
            overlaps = False
            for existing_match in all_matches:
                if (start < existing_match['end'] and end > existing_match['start']):
                    # If this match is longer, replace the existing one
                    if (end - start) > (existing_match['end'] - existing_match['start']):
                        all_matches.remove(existing_match)
                    else:
                        overlaps = True
                        break

            if not overlaps:
                all_matches.append({
                    'start': start,
                    'end': end,
                    'original': original,
                    'replacement': replacement,
                    'error_type': error_type,
                    'pattern': pattern
                })

    # Sort matches by position
    all_matches.sort(key=lambda x: x['start'])

    # Create errors and corrections from non-overlapping matches
    for match in all_matches:
        # Add error info
        errors.append({
            'offset': match['start'],
            'length': match['end'] - match['start'],
            'message': f"Possible {match['error_type']} error",
            'category': match['error_type'].title(),
            'original_text': match['original'],
            'suggestions': [match['replacement']],
            'error_type': match['error_type'],
            'severity': 'medium'
        })

        # Apply correction
        corrected_text = corrected_text.replace(match['original'], match['replacement'], 1)
        corrections_applied.append({
            'original': match['original'],
            'correction': match['replacement'],
            'position': match['start'],
            'rule': f'{match["error_type"]}_pattern',
            'message': f"Changed '{match['original']}' to '{match['replacement']}'"
        })

    # Create highlighted text without overlapping spans
    highlighted_text = html.escape(text)

    # Apply highlighting from right to left to preserve positions
    for match in reversed(all_matches):
        original_escaped = html.escape(match['original'])
        error_class = f"grammar-error-{match['error_type']}"
        highlighted_span = f'<span class="{error_class}" title="Possible {match["error_type"]} error">{original_escaped}</span>'

        # Find and replace the specific occurrence
        start_pos = highlighted_text.find(original_escaped, match['start'])
        if start_pos != -1:
            highlighted_text = (highlighted_text[:start_pos] +
                              highlighted_span +
                              highlighted_text[start_pos + len(original_escaped):])

    return {
        'highlighted_text': highlighted_text,
        'corrected_text': corrected_text,
        'errors': errors,
        'error_count': len(errors),
        'corrections_applied': corrections_applied,
        'accuracy_score': max(0, 100 - (len(errors) * 15))
    }

def generate_highlighted_and_corrected_text(text: str, matches: List) -> Tuple[str, str, List[Dict]]:
    """
    Generate highlighted HTML and corrected text from LanguageTool matches

    Args:
        text: Original text
        matches: LanguageTool matches

    Returns:
        Tuple of (highlighted_html, corrected_text, corrections_applied)
    """

    # Sort matches by offset (reverse order for text replacement)
    sorted_matches = sorted(matches, key=lambda x: x.offset, reverse=True)

    # Create corrected text by applying suggestions
    corrected_text = text
    corrections_applied = []

    for match in sorted_matches:
        if match.replacements:
            # Use the first (best) suggestion
            suggestion = match.replacements[0]
            original = corrected_text[match.offset:match.offset + match.errorLength]

            # Apply correction
            corrected_text = (
                corrected_text[:match.offset] +
                suggestion +
                corrected_text[match.offset + match.errorLength:]
            )

            corrections_applied.append({
                'original': original,
                'correction': suggestion,
                'position': match.offset,
                'rule': match.ruleId,
                'message': match.message
            })

    # Generate highlighted HTML
    highlighted_html = html.escape(text)

    # Sort matches by offset (forward order for HTML highlighting)
    forward_matches = sorted(matches, key=lambda x: x.offset)

    # Apply highlighting (work backwards to maintain offsets)
    offset_adjustment = 0

    for match in forward_matches:
        start_pos = match.offset + offset_adjustment
        end_pos = start_pos + match.errorLength

        # Get error text
        error_text = highlighted_html[start_pos:end_pos]

        # Determine highlight class based on error type
        error_class = get_highlight_class(match)

        # Create highlighted span with tooltip
        suggestion_text = match.replacements[0] if match.replacements else "No suggestion"
        highlighted_span = (
            f'<span class="{error_class}" '
            f'title="{html.escape(match.message)} | Suggestion: {html.escape(suggestion_text)}" '
            f'data-toggle="tooltip" data-placement="top">'
            f'{error_text}'
            f'</span>'
        )

        # Replace in highlighted text
        highlighted_html = (
            highlighted_html[:start_pos] +
            highlighted_span +
            highlighted_html[end_pos:]
        )

        # Adjust offset for next iteration
        offset_adjustment += len(highlighted_span) - len(error_text)

    return highlighted_html, corrected_text, corrections_applied

def categorize_error(match) -> str:
    """Categorize error type based on LanguageTool match"""
    category = match.category.lower()
    rule_id = match.ruleId.lower()

    if 'spell' in category or 'typo' in rule_id:
        return 'spelling'
    elif 'grammar' in category or 'agreement' in rule_id:
        return 'grammar'
    elif 'punctuation' in category:
        return 'punctuation'
    elif 'style' in category or 'redundancy' in rule_id:
        return 'style'
    elif 'capitalization' in category:
        return 'capitalization'
    else:
        return 'other'

def get_error_severity(match) -> str:
    """Determine error severity"""
    category = match.category.lower()

    if 'spell' in category:
        return 'high'
    elif 'grammar' in category:
        return 'high'
    elif 'punctuation' in category:
        return 'medium'
    elif 'style' in category:
        return 'low'
    else:
        return 'medium'

def get_highlight_class(match) -> str:
    """Get CSS class for highlighting based on error type"""
    error_type = categorize_error(match)

    class_map = {
        'spelling': 'grammar-error-spelling',
        'grammar': 'grammar-error-grammar',
        'punctuation': 'grammar-error-punctuation',
        'style': 'grammar-error-style',
        'capitalization': 'grammar-error-capitalization',
        'other': 'grammar-error-other'
    }

    return class_map.get(error_type, 'grammar-error-other')

if __name__ == "__main__":
    test_grammar_checker()
