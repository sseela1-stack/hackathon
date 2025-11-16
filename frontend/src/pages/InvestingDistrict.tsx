import React, { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { LineChart } from '../components/LineChart';
import { BandChart } from '../components/BandChart';
import {
  simulatePortfolio,
  runMonteCarlo,
  SimulationResult,
  MonteCarloResult,
} from '../api/investingApi';
import styles from './InvestingDistrict.module.css';

type Profile = 'conservative' | 'balanced' | 'aggressive';
type Tab = 'planner' | 'contributions' | 'risk' | 'results';

/**
 * Investing District - Comprehensive portfolio simulation and education
 */
const InvestingDistrict: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('planner');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Planner tab state
  const [profile, setProfile] = useState<Profile>('balanced');
  const [startValue, setStartValue] = useState(10000);
  const [years, setYears] = useState(10);

  // Contributions tab state
  const [contribMonthly, setContribMonthly] = useState(0);
  const [feesBps, setFeesBps] = useState(50);

  // Risk tab state
  const [rebalance, setRebalance] = useState<'none' | 'annual' | 'threshold'>('annual');
  const [sequencePreset, setSequencePreset] = useState<
    'normal' | 'badFirstYears' | 'goodFirstYears'
  >('normal');
  const [enableCrash, setEnableCrash] = useState(false);
  const [crashMonth, setCrashMonth] = useState(60);
  const [crashPct, setCrashPct] = useState(30);

  // Results
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [monteCarlo, setMonteCarlo] = useState<MonteCarloResult | null>(null);
  const [showMonteCarlo, setShowMonteCarlo] = useState(false);

  const handleRunSimulation = async () => {
    setIsLoading(true);
    setError(null);
    setSimulation(null);
    setMonteCarlo(null);

    try {
      const result = await simulatePortfolio({
        profile,
        startValue,
        years,
        contribMonthly,
        feesBps,
        rebalance,
        sequencePreset,
        shocks: enableCrash
          ? {
              crashAtMonth: crashMonth,
              crashPct: crashPct / 100,
            }
          : undefined,
      });

      setSimulation(result);
      setActiveTab('results');
    } catch (err: any) {
      setError(err.message || 'Failed to run simulation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunMonteCarlo = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await runMonteCarlo({
        profile,
        startValue,
        years,
        runs: 100,
        targetAmount: startValue * 2,
        contribMonthly,
        feesBps,
        rebalance,
      });

      setMonteCarlo(result);
      setShowMonteCarlo(true);
    } catch (err: any) {
      setError(err.message || 'Failed to run Monte Carlo simulation');
    } finally {
      setIsLoading(false);
    }
  };

  const tradeMonths = simulation?.trades.map((t) => t.month) || [];

  return (
    <AppShell>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>📈 Investing District</h1>
          <p className={styles.subtitle}>
            Educational portfolio simulator - Explore strategies, fees, and market dynamics
          </p>
        </header>

        {/* Tabs */}
        <div className={styles.tabs} role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'planner'}
            className={`${styles.tab} ${activeTab === 'planner' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('planner')}
          >
            📋 Planner
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'contributions'}
            className={`${styles.tab} ${activeTab === 'contributions' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('contributions')}
          >
            💰 Contributions
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'risk'}
            className={`${styles.tab} ${activeTab === 'risk' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('risk')}
          >
            ⚠️ Risk & Rebalancing
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'results'}
            className={`${styles.tab} ${activeTab === 'results' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('results')}
            disabled={!simulation}
          >
            📊 Results
          </button>
        </div>

        {/* Tab Panels */}
        <div className={styles.tabContent}>
          {/* Planner Tab */}
          {activeTab === 'planner' && (
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Investment Profile & Timeline</h2>

              <div className={styles.profileGrid}>
                <button
                  className={`${styles.profileCard} ${profile === 'conservative' ? styles.profileCardSelected : ''}`}
                  onClick={() => setProfile('conservative')}
                >
                  <h3>🛡️ Conservative</h3>
                  <p className={styles.profileAllocation}>30% stocks, 60% bonds, 10% cash</p>
                  <p className={styles.profileDesc}>Lower risk, steady growth</p>
                </button>

                <button
                  className={`${styles.profileCard} ${profile === 'balanced' ? styles.profileCardSelected : ''}`}
                  onClick={() => setProfile('balanced')}
                >
                  <h3>⚖️ Balanced</h3>
                  <p className={styles.profileAllocation}>60% stocks, 35% bonds, 5% cash</p>
                  <p className={styles.profileDesc}>Moderate risk, balanced growth</p>
                </button>

                <button
                  className={`${styles.profileCard} ${profile === 'aggressive' ? styles.profileCardSelected : ''}`}
                  onClick={() => setProfile('aggressive')}
                >
                  <h3>🚀 Aggressive</h3>
                  <p className={styles.profileAllocation}>90% stocks, 10% bonds</p>
                  <p className={styles.profileDesc}>Higher risk, maximum potential</p>
                </button>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Starting Amount: ${startValue.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={startValue}
                  onChange={(e) => setStartValue(Number(e.target.value))}
                  className={styles.slider}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Investment Duration: {years} years</label>
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className={styles.slider}
                />
              </div>

              <button className={styles.buttonNext} onClick={() => setActiveTab('contributions')}>
                Next: Contributions →
              </button>
            </div>
          )}

          {/* Contributions Tab */}
          {activeTab === 'contributions' && (
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Monthly Contributions & Fees</h2>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Monthly Contribution: ${contribMonthly.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="50"
                  value={contribMonthly}
                  onChange={(e) => setContribMonthly(Number(e.target.value))}
                  className={styles.slider}
                />
                <p className={styles.hint}>
                  Dollar-cost averaging: Invest a fixed amount each month regardless of market
                  conditions
                </p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Annual Fees: {(feesBps / 100).toFixed(2)}% ({feesBps} basis points)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={feesBps}
                  onChange={(e) => setFeesBps(Number(e.target.value))}
                  className={styles.slider}
                />
                <p className={styles.hint}>
                  Typical expense ratios: Index funds 0.05-0.20%, Active funds 0.50-1.00%
                </p>
              </div>

              <div className={styles.infoBox}>
                <h3>💡 Fee Impact</h3>
                <p>
                  Over {years} years, a {(feesBps / 100).toFixed(2)}% fee on a $
                  {startValue.toLocaleString()} portfolio could cost you thousands. Lower fees mean
                  more money working for you!
                </p>
              </div>

              <div className={styles.buttonGroup}>
                <button className={styles.buttonSecondary} onClick={() => setActiveTab('planner')}>
                  ← Back
                </button>
                <button className={styles.buttonNext} onClick={() => setActiveTab('risk')}>
                  Next: Risk Settings →
                </button>
              </div>
            </div>
          )}

          {/* Risk Tab */}
          {activeTab === 'risk' && (
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Risk Management & Market Scenarios</h2>

              <div className={styles.formGroup}>
                <label className={styles.label}>Rebalancing Strategy</label>
                <select
                  value={rebalance}
                  onChange={(e) => setRebalance(e.target.value as any)}
                  className={styles.select}
                >
                  <option value="none">None - Let it drift</option>
                  <option value="annual">Annual - Rebalance yearly</option>
                  <option value="threshold">Threshold - Rebalance when drift exceeds 5%</option>
                </select>
                <p className={styles.hint}>
                  Rebalancing maintains your target allocation and can reduce risk
                </p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Return Sequence</label>
                <select
                  value={sequencePreset}
                  onChange={(e) => setSequencePreset(e.target.value as any)}
                  className={styles.select}
                >
                  <option value="normal">Normal - Random returns</option>
                  <option value="badFirstYears">Bad Start - Poor early returns</option>
                  <option value="goodFirstYears">Good Start - Strong early returns</option>
                </select>
                <p className={styles.hint}>
                  Sequence-of-returns risk: Early losses can significantly impact long-term wealth
                </p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={enableCrash}
                    onChange={(e) => setEnableCrash(e.target.checked)}
                    className={styles.checkbox}
                  />
                  Simulate Market Crash
                </label>

                {enableCrash && (
                  <>
                    <label className={styles.label}>
                      Crash at Month: {crashMonth} ({Math.floor(crashMonth / 12)}y{' '}
                      {crashMonth % 12}m)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max={years * 12}
                      value={crashMonth}
                      onChange={(e) => setCrashMonth(Number(e.target.value))}
                      className={styles.slider}
                    />

                    <label className={styles.label}>Crash Severity: -{crashPct}%</label>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      step="5"
                      value={crashPct}
                      onChange={(e) => setCrashPct(Number(e.target.value))}
                      className={styles.slider}
                    />
                  </>
                )}
              </div>

              <div className={styles.buttonGroup}>
                <button
                  className={styles.buttonSecondary}
                  onClick={() => setActiveTab('contributions')}
                >
                  ← Back
                </button>
                <button
                  className={styles.buttonPrimary}
                  onClick={handleRunSimulation}
                  disabled={isLoading}
                >
                  {isLoading ? 'Simulating...' : 'Run Simulation 🚀'}
                </button>
              </div>
            </div>
          )}

          {/* Results Tab */}
          {activeTab === 'results' && simulation && (
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Simulation Results</h2>

              {error && <div className={styles.error}>{error}</div>}

              {/* Summary Stats */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>End Value</div>
                  <div className={styles.statValue}>
                    ${Math.round(simulation.stats.endValue).toLocaleString()}
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>CAGR</div>
                  <div className={styles.statValue}>
                    {(simulation.stats.cagr * 100).toFixed(2)}%
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Max Drawdown</div>
                  <div className={styles.statValue}>
                    {(simulation.stats.maxDrawdown * 100).toFixed(1)}%
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Fees Paid</div>
                  <div className={styles.statValue}>
                    ${Math.round(simulation.stats.feeTotal).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Chart Toggle */}
              <div className={styles.chartToggle}>
                <button
                  className={`${styles.toggleButton} ${!showMonteCarlo ? styles.toggleActive : ''}`}
                  onClick={() => setShowMonteCarlo(false)}
                >
                  📈 Single Path
                </button>
                <button
                  className={`${styles.toggleButton} ${showMonteCarlo ? styles.toggleActive : ''}`}
                  onClick={() => {
                    if (!monteCarlo) {
                      handleRunMonteCarlo();
                    } else {
                      setShowMonteCarlo(true);
                    }
                  }}
                  disabled={isLoading}
                >
                  📊 Monte Carlo
                </button>
              </div>

              {/* Charts */}
              <div className={styles.chartCard}>
                {!showMonteCarlo ? (
                  <>
                    <h3 className={styles.chartTitle}>Portfolio Performance Over Time</h3>
                    <LineChart data={simulation.path} highlightTrades={tradeMonths} />
                    {simulation.trades.length > 0 && (
                      <p className={styles.chartNote}>
                        🟠 Orange dots indicate rebalancing events ({simulation.trades.length}{' '}
                        total)
                      </p>
                    )}
                  </>
                ) : monteCarlo ? (
                  <>
                    <h3 className={styles.chartTitle}>
                      Monte Carlo Analysis (100 simulations)
                    </h3>
                    <BandChart bands={monteCarlo.bands} targetAmount={startValue * 2} />
                    <div className={styles.monteCarloStats}>
                      <p>
                        <strong>Success Probability:</strong>{' '}
                        {(monteCarlo.successProb * 100).toFixed(1)}% of simulations reached $
                        {(startValue * 2).toLocaleString()}
                      </p>
                      <p className={styles.hint}>
                        The shaded areas show where 50% (darker) and 80% (lighter) of outcomes fell
                      </p>
                    </div>
                  </>
                ) : (
                  <div className={styles.loading}>Loading Monte Carlo...</div>
                )}
              </div>

              {/* Disclaimer */}
              <div className={styles.disclaimer}>
                ⚠️ {simulation.meta.disclaimer}
              </div>

              <div className={styles.buttonGroup}>
                <button className={styles.buttonSecondary} onClick={() => setActiveTab('planner')}>
                  Start New Simulation
                </button>
              </div>
            </div>
          )}

          {activeTab === 'results' && !simulation && (
            <div className={styles.panel}>
              <p className={styles.emptyState}>
                Run a simulation from the other tabs to see results here!
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default InvestingDistrict;
