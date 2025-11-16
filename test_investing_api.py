#!/usr/bin/env python3
import requests
import json
import time

# Wait for server to start
time.sleep(3)

BASE_URL = "http://localhost:4000/api/investing"

def test_simulate():
    """Test the /simulate endpoint"""
    print("Testing /simulate endpoint...")
    
    payload = {
        "profile": "balanced",
        "startValue": 10000,
        "years": 5,
        "contribMonthly": 500,
        "feesBps": 50,
        "rebalance": "annual"
    }
    
    headers = {
        "Content-Type": "application/json",
        "x-player-id": "test-player"
    }
    
    response = requests.post(f"{BASE_URL}/simulate", json=payload, headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        if result.get("success"):
            print(f"✓ Success!")
            print(f"  End Value: ${result['stats']['endValue']:.2f}")
            print(f"  CAGR: {result['stats']['cagr'] * 100:.2f}%")
            print(f"  Fees Total: ${result['stats']['feeTotal']:.2f}")
            print(f"  Max Drawdown: {result['stats']['maxDrawdown'] * 100:.2f}%")
            print(f"  Monthly snapshots: {len(result['path'])}")
            print(f"  Rebalancing trades: {len(result['trades'])}")
        else:
            print(f"✗ Unexpected response format: {result}")
    else:
        print(f"✗ Error: {response.status_code}")
        print(response.text)

def test_montecarlo():
    """Test the /montecarlo endpoint"""
    print("\nTesting /montecarlo endpoint...")
    
    payload = {
        "profile": "balanced",
        "startValue": 10000,
        "years": 10,
        "runs": 100,
        "targetAmount": 20000,
        "contribMonthly": 300
    }
    
    headers = {
        "Content-Type": "application/json",
        "x-player-id": "test-player"
    }
    
    response = requests.post(f"{BASE_URL}/montecarlo", json=payload, headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        if result.get("success"):
            print(f"✓ Success!")
            print(f"  Success Probability: {result['successProb'] * 100:.1f}%")
            print(f"  Band months: {len(result['bands'])}")
            print(f"  First month bands:")
            print(f"    p10: ${result['bands'][0]['p10']:.2f}")
            print(f"    p50: ${result['bands'][0]['p50']:.2f}")
            print(f"    p90: ${result['bands'][0]['p90']:.2f}")
        else:
            print(f"✗ Unexpected response format: {result}")
    else:
        print(f"✗ Error: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    print("=" * 60)
    print("Phase 1 Backend Testing - Investing District")
    print("=" * 60)
    test_simulate()
    test_montecarlo()
    print("\n" + "=" * 60)
    print("Phase 1 Complete! ✓")
    print("=" * 60)
