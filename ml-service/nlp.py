def extract_nlp_features(text: str) -> dict:
    if not text:
        text = ""
        
    text = text.lower()
    
    features = {
        "drowsiness": 0,
        "focus_problem": 0,
        "headache": 0,
        "fatigue": 0
    }
    
    # DROWSINESS keywords
    if any(keyword in text for keyword in ["mengantuk", "ngantuk", "mata berat"]):
        features["drowsiness"] = 1
        
    # FOCUS keywords
    if any(keyword in text for keyword in ["sulit fokus", "susah fokus", "tidak fokus", "susah konsentrasi", "sulit konsentrasi"]):
        features["focus_problem"] = 1
        
    # HEADACHE keywords
    if any(keyword in text for keyword in ["sakit kepala", "pusing", "kepala berat"]):
        features["headache"] = 1
        
    # FATIGUE keywords
    if any(keyword in text for keyword in ["lelah", "capek", "kelelahan"]):
        features["fatigue"] = 1
        
    return features
