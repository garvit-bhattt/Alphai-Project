import numpy as np
import pandas as pd
from scipy import stats
from arch import arch_model
import time

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
        res = am.fit(disp="off")
        _FIGARCH_CACHE["res"] = res
        _FIGARCH_CACHE["last_fit_time"] = current_time
    
    res = _FIGARCH_CACHE["res"]
    return res.conditional_volatility / 100, res.params

def rolling_entropy(x, window=60, bins=20):
    """Compute Shannon entropy on a rolling window."""
    def ent(v):
        p, _ = np.histogram(v, bins=bins, density=True)
        p = p[p > 0]
        return -np.sum(p * np.log(p))
    return x.rolling(window).apply(ent, raw=True)

def update_params(p, sigma2, bar_sigma2, t):
    """Update Cyber-GBM parameters dynamically."""
    err = sigma2 - bar_sigma2
    lr  = p['eta'] / (1 + t**0.55)
    p['gamma'] = np.clip(p['gamma'] + lr * err, 0.01, 0.5)
    return p

def simulate_cyber_gbm(S0, mu, sigma_fig, H, M, params, bar_sigma2, nu, n_steps, dt=1, eps=1e-6):
    """Simulate a single path using Cyber GBM."""
    S = np.zeros(n_steps + 1)
    S[0] = S0
    
    # Initial sigma2 from the last known FIGARCH volatility
    sigma2 = float(sigma_fig.iloc[-1]) ** 2
    
    H_max = float(H.max()) if H.max() > 0 else 1.0
    M_max = float(M.max()) if M.max() > 0 else 1.0
    
    for t in range(1, n_steps + 1):
        # Fix: Time indexing relative to end
        idx = -t
        
        H_val = min(float(H.iloc[idx]) / H_max, 1.0)
        M_val = min(float(M.iloc[idx]) / M_max, 1.0)
        
        crisis  = (H_val > 0.8) or (M_val > 0.8)
        delta_t = params['delta'] if crisis else 0.0
        
        # Volatility evolution
        sigma2 = (
            float(sigma_fig.iloc[idx])**2 * (1 + params['alpha'] * H_val + delta_t * M_val)
            + params['gamma'] * (bar_sigma2 - sigma2)
        )
        
        # Fix: Clamp volatility
        sigma2 = np.clip(sigma2, 1e-6, 0.1)
        
        # Random shock (Student-t)
        Z   = np.random.standard_t(nu) * np.sqrt((nu - 2) / nu)
        
        # Price update
        S[t]= S[t-1] * np.exp((mu - 0.5 * sigma2) * dt + np.sqrt(sigma2 * dt) * Z)
        
        # Parameter update
        params = update_params(params, sigma2, bar_sigma2, t)
        
    return S

def simulate_mc(S0, mu, sigma_fig, H, M, bar_sigma2, nu, base_params, n_sims=5000, n_days=1):
    """Run Monte Carlo simulation over multiple paths."""
    out = np.zeros((n_sims, n_days + 1))
    for i in range(n_sims):
        # Fix: Reset params per simulation
        path = simulate_cyber_gbm(
            S0, mu, sigma_fig, H, M,
            base_params.copy(),
            bar_sigma2, nu, n_days
        )
        out[i] = path
    return out

def predict_next_range(
    df: pd.DataFrame,
    n_sims: int = 5000,
    seed: int = 42
) -> dict:
    """
    Generate a 95% price range prediction using Cyber-GBM.
    """
    np.random.seed(seed)
    
    # 1. Extract inputs
    S0 = float(df["close"].iloc[-1])
    returns = df["log_return"]
    
    # 2. FIGARCH Volatility (Cached)
    sigma_fig, arch_params = get_figarch_vol(returns * 100)
    
    # 3. Residuals and Student-t degrees of freedom
    mu_arch = arch_params.get('mu', returns.mean() * 100) / 100
    residuals = (returns - mu_arch) / sigma_fig
    
    try:
        # Fit nu to residuals
        nu = max(4.0, stats.t.fit(residuals.dropna(), floc=0, fscale=1)[0])
    except:
        nu = 4.0
        
    # 4. Entropy and Magnitude (Precomputed once per request)
    H_series = rolling_entropy(residuals)
    M_series = returns.abs().rolling(60).mean()
    bar_sigma2 = float((sigma_fig**2).mean())
    
    # Drop NaNs for safety in max calculations
    H_clean = H_series.dropna()
    M_clean = M_series.dropna()
    
    # 5. Base Parameters
    H_max, M_max = float(H_clean.max()), float(M_clean.max())
    alpha0, delta0 = 0.5, 0.3
    if alpha0 * H_max + delta0 * M_max >= 1:
        fac = 0.95 / (alpha0 * H_max + delta0 * M_max)
        alpha0 *= fac
        delta0 *= fac
    
    base_params = {
        'alpha': alpha0, 
        'delta': delta0, 
        'gamma': 0.2, 
        'kappa': 0.1, 
        'eta': 1e-3
    }

    # 6. Run Simulation
    paths = simulate_mc(
        S0=S0,
        mu=float(returns.mean()),
        sigma_fig=sigma_fig,
        H=H_series,
        M=M_series,
        bar_sigma2=bar_sigma2,
        nu=nu,
        base_params=base_params,
        n_sims=n_sims,
        n_days=1
    )
    
    # 7. Extract 95% prediction range
    S_t1 = paths[:, 1]
    lower = float(np.percentile(S_t1, 2.5))
    upper = float(np.percentile(S_t1, 97.5))
    
    return {
        "lower": round(lower, 2),
        "upper": round(upper, 2)
    }
