import numpy as np
import pandas as pd
from scipy import stats
from arch import arch_model
import time
import warnings

# Suppress arch warnings in production
warnings.filterwarnings("ignore", category=UserWarning, module="arch")

# --- 1. Global Cache for FIGARCH ---
_FIGARCH_CACHE = {
    "res": None,
    "last_fit_time": 0,
    "refresh_interval": 3600  # 1 hour
}

def get_figarch_vol(returns_scaled: pd.Series):
    """
    Get FIGARCH conditional volatility. 
    Fits once per hour and reuses the result for conditional volatility calculation.
    """
    global _FIGARCH_CACHE
    current_time = time.time()
    
    if (_FIGARCH_CACHE["res"] is None or 
        (current_time - _FIGARCH_CACHE["last_fit_time"]) > _FIGARCH_CACHE["refresh_interval"]):
        
        # Fit model
        am = arch_model(returns_scaled, vol='FIGARCH', p=1, o=0, q=1, dist='studentst')
        try:
            res = am.fit(disp="off", show_warning=False)
            _FIGARCH_CACHE["res"] = res
            _FIGARCH_CACHE["last_fit_time"] = current_time
        except Exception:
            if _FIGARCH_CACHE["res"] is None:
                raise
    
    res = _FIGARCH_CACHE["res"]
    return res.conditional_volatility / 100, res.params

def rolling_entropy(x, window=60, bins=20):
    """Compute Shannon entropy on a rolling window."""
    def ent(v):
        p, _ = np.histogram(v, bins=bins, density=True)
        p = p[p > 0]
        return -np.sum(p * np.log(p))
    return x.rolling(window).apply(ent, raw=True)

def simulate_mc_one_step(S0, mu, sigma_last, sigma_bar, H_val, M_val,
                         redundancy_val, info_filter_val, params, nu, n_sims):
    """Vectorised single-step MC: returns array of S_{t+1} of length n_sims."""
    sigma2 = sigma_last ** 2
    crisis  = (H_val > 0.8) or (M_val > 0.8)
    delta_t = params['delta'] if crisis else 0.0
    
    sigma2 = (sigma_last**2 * (1 + params['alpha'] * H_val + delta_t * M_val)
              + params['gamma'] * (sigma_bar - sigma2))
              
    sigma2 *= max(1e-12, redundancy_val)
    sigma2 *= 1 + 0.5 * info_filter_val
    sigma2 = float(np.clip(sigma2, 1e-12, 0.5))
    
    Z   = np.random.standard_t(nu, size=n_sims) * np.sqrt((nu - 2) / nu)
    return S0 * np.exp((mu - 0.5 * sigma2) + np.sqrt(sigma2) * Z)

def predict_next_range(
    df: pd.DataFrame,
    n_sims: int = 10000,
    seed: int = 42
) -> dict:
    """
    Generate a 95% price range prediction using vectorised Cyber-GBM.
    """
    np.random.seed(seed)
    
    # 1. Extract inputs
    S0 = float(df["close"].iloc[-1])
    returns = df["log_return"]
    
    # Needs at least 100 rows for stable modeling
    if len(returns.dropna()) < 100:
        return {"lower": round(S0 * 0.99, 2), "upper": round(S0 * 1.01, 2)}
    
    # 2. FIGARCH Volatility (Cached)
    sigma_fig, arch_params = get_figarch_vol(returns.dropna() * 100)
    
    # 3. Residuals and Student-t degrees of freedom
    mu_arch = float(arch_params.get('mu', returns.mean() * 100)) / 100
    residuals = (returns - mu_arch) / sigma_fig
    
    try:
        # Fit nu to residuals
        nu = max(4.0, float(stats.t.fit(residuals.dropna(), floc=0, fscale=1)[0]))
    except:
        nu = 5.0
        
    # 4. Entropy and Magnitude
    H_series = rolling_entropy(residuals, window=60).dropna()
    M_series = returns.abs().rolling(60).mean().dropna()
    
    if len(H_series) == 0 or len(M_series) == 0:
        return {"lower": round(S0 * 0.99, 2), "upper": round(S0 * 1.01, 2)}
        
    H_max = max(H_series.max(), 1e-9)
    M_max = max(M_series.max(), 1e-9)
    
    H_val = float(min(H_series.iloc[-1] / H_max, 1.0))
    M_val = float(min(M_series.iloc[-1] / M_max, 1.0))

    # 5. Redundancy and Info Filter
    redundancy_series = 1 + 0.1 * np.log1p(
        df["close"].rolling(5).var() / df["close"].rolling(20).var()
    )
    redundancy_val = float(redundancy_series.dropna().iloc[-1]) if redundancy_series.dropna().size > 0 else 1.0
    
    info_filter_val = 1.0 if float(H_series.iloc[-1]) > float(H_series.mean()) else 0.0
    
    # 6. Volatility Components
    sigma_last = float(sigma_fig.iloc[-1])
    sigma_bar = float((sigma_fig ** 2).mean())
    
    # 7. Adaptive Base Parameters
    alpha0, delta0 = 0.5, 0.3
    if alpha0 * H_max + delta0 * M_max >= 1:
        fac = 0.95 / (alpha0 * H_max + delta0 * M_max)
        alpha0 *= fac
        delta0 *= fac
    
    params = {
        'alpha': alpha0, 
        'delta': delta0, 
        'gamma': 0.2, 
        'kappa': 0.1, 
        'eta': 1e-3
    }

    # 8. Run Vectorised Simulation
    S_t1 = simulate_mc_one_step(
        S0=S0, 
        mu=mu_arch, 
        sigma_last=sigma_last, 
        sigma_bar=sigma_bar, 
        H_val=H_val, 
        M_val=M_val, 
        redundancy_val=redundancy_val, 
        info_filter_val=info_filter_val, 
        params=params, 
        nu=nu, 
        n_sims=n_sims
    )
    
    # 9. Extract 95% prediction range
    lower = float(np.percentile(S_t1, 2.5))
    upper = float(np.percentile(S_t1, 97.5))
    
    return {
        "lower": round(lower, 2),
        "upper": round(upper, 2)
    }
