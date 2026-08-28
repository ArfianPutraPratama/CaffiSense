import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

def train():
    # 1. Load CSV
    data_path = '../data/caffeine_intake_tracker.csv'
    if not os.path.exists(data_path):
        print(f"Error: Dataset not found at {data_path}")
        return

    print("Loading dataset...")
    df = pd.read_csv(data_path)
    
    # 2. Validate columns
    expected_columns = [
        'caffeine_mg', 'age', 'focus_level', 'sleep_quality', 'sleep_impacted',
        'beverage_coffee', 'beverage_energy_drink', 'beverage_tea',
        'time_of_day_afternoon', 'time_of_day_evening', 'time_of_day_morning',
        'gender_female', 'gender_male'
    ]
    
    missing_cols = [col for col in expected_columns if col not in df.columns]
    if missing_cols:
        print(f"Error: Missing columns in dataset: {missing_cols}")
        return
        
    print("Columns validated.")

    # 3. Check missing values
    missing_values = df.isnull().sum().sum()
    if missing_values > 0:
        print(f"Warning: Found {missing_values} missing values. Dropping rows with missing values.")
        df = df.dropna()
    else:
        print("No missing values found.")

    # 4. Check duplicate rows
    duplicate_rows = df.duplicated().sum()
    if duplicate_rows > 0:
        print(f"Warning: Found {duplicate_rows} duplicate rows. Dropping duplicates.")
        df = df.drop_duplicates()
    else:
        print("No duplicate rows found.")

    # 5. Separate X and y
    target_col = 'sleep_impacted'
    feature_cols = [col for col in expected_columns if col != target_col]
    
    X = df[feature_cols]
    y = df[target_col]

    # 6. Encode/prepare data
    # The boolean columns need to be converted to integer or boolean types properly if they aren't already.
    # We will ensure boolean columns are converted to int (0/1) for scikit-learn.
    bool_cols = [
        'beverage_coffee', 'beverage_energy_drink', 'beverage_tea',
        'time_of_day_afternoon', 'time_of_day_evening', 'time_of_day_morning',
        'gender_female', 'gender_male'
    ]
    
    for col in bool_cols:
        if X[col].dtype == bool or X[col].dtype == object:
            X.loc[:, col] = X[col].astype(int)

    # 7. Train/test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"Dataset split into {len(X_train)} training and {len(X_test)} testing samples.")

    # 8. Train RandomForestClassifier
    print("Training RandomForestClassifier...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # 9. Evaluate model
    print("Evaluating model...")
    y_pred = model.predict(X_test)
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred)

    # 10. Print metrics
    print("\n--- Model Evaluation ---")
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1-score:  {f1:.4f}")
    print("Confusion Matrix:")
    print(cm)
    
    # Also print Feature Importances
    print("\n--- Feature Importances ---")
    importances = model.feature_importances_
    feature_importance_df = pd.DataFrame({
        'Feature': feature_cols,
        'Importance': importances
    }).sort_values(by='Importance', ascending=False)
    print(feature_importance_df.to_string(index=False))

    # 11. Save model menggunakan joblib
    models_dir = 'models'
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)
        
    model_path = os.path.join(models_dir, 'random_forest_model.joblib')
    joblib.dump(model, model_path)
    print(f"\nModel successfully saved to {model_path}")
    
    # 12. Save feature columns for validation during inference
    features_path = os.path.join(models_dir, 'model_features.joblib')
    joblib.dump(feature_cols, features_path)

if __name__ == "__main__":
    train()
