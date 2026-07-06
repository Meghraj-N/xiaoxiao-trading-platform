import pandas as pd
import numpy as np
from backend.engine.ml_features import FeatureGenerator

def test_feature_generation():
    # 1. Create a dummy OHLCV DataFrame
    dates = pd.date_range(start='2026-01-01', periods=100, freq='h')
    
    # Generate somewhat realistic price walk
    np.random.seed(42)
    returns = np.random.normal(0, 0.01, 100)
    prices = 100 * np.exp(np.cumsum(returns))
    
    df = pd.DataFrame({
        'timestamp': dates,
        'open': prices * (1 + np.random.uniform(-0.005, 0.005, 100)),
        'high': prices * (1 + np.random.uniform(0.005, 0.015, 100)),
        'low': prices * (1 - np.random.uniform(0.005, 0.015, 100)),
        'close': prices,
        'volume': np.random.randint(100, 1000, 100)
    })
    
    print("Initial Data Shape:", df.shape)
    
    # 2. Generate Features
    df_features = FeatureGenerator.generate_features(df, drop_nan=True)
    
    print("Features Data Shape after drop_nan:", df_features.shape)
    assert len(df_features) < len(df), "Rows with NaNs were not dropped"
    
    # Check if expected columns are present
    expected_cols = [
        'ret_1', 'ret_3', 'ret_5', 'rsi_14', 'macd_line', 'macd_signal', 'macd_hist',
        'bb_upper', 'bb_lower', 'bb_width', 'bb_pb', 'atr_14', 'dist_sma50'
    ]
    for col in expected_cols:
        assert col in df_features.columns, f"Missing column: {col}"
    
    print("All ML feature columns successfully generated!")
    
    # 3. Test Normalization
    features_to_norm = ['rsi_14', 'dist_sma50']
    df_norm = FeatureGenerator.normalize(df_features, features_to_norm)
    
    for col in features_to_norm:
        norm_col = f"{col}_norm"
        assert norm_col in df_norm.columns
        # Mean should be close to 0, std close to 1
        mean = df_norm[norm_col].mean()
        std = df_norm[norm_col].std(ddof=0)
        print(f"Norm {col} - Mean: {mean:.4f}, Std: {std:.4f}")
        assert abs(mean) < 1e-4, f"Mean for {col} not 0"
        assert abs(std - 1.0) < 1e-4, f"Std for {col} not 1"
        
    print("Normalization working perfectly!")

if __name__ == "__main__":
    test_feature_generation()
