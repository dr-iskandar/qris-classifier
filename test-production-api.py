#!/usr/bin/env python3
"""
Production API Test Script for QRIS Classifier
Tests the business name comparison feature on production server

Usage:
    python3 test-production-api.py [--host HOST] [--port PORT] [--token TOKEN]

Example:
    python3 test-production-api.py --host localhost --port 3000
    python3 test-production-api.py --host your-domain.com --port 443 --token your_jwt_token
"""

import requests
import json
import base64
import argparse
import sys
from pathlib import Path

def test_api_endpoint(host, port, token=None, use_https=False):
    """Test the QRIS classifier API with business name comparison"""
    
    protocol = "https" if use_https else "http"
    base_url = f"{protocol}://{host}:{port}"
    
    print(f"Testing API at: {base_url}")
    print("-" * 50)
    
    # Test data
    test_cases = [
        {
            "name": "Retail Store Test",
            "businessName": "Toko Kelontong Bahagia",
            "expected_type": "retail"
        },
        {
            "name": "Restaurant Test", 
            "businessName": "Warung Makan Sederhana",
            "expected_type": "restaurant"
        },
        {
            "name": "Shoe Store Test",
            "businessName": "Toko Sepatu Sport", 
            "expected_type": "shoe_store"
        }
    ]
    
    # Headers
    headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'QRIS-Classifier-Test/1.0'
    }
    
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    # Test 1: Health check (if available)
    print("1. Testing health endpoint...")
    try:
        health_response = requests.get(f"{base_url}/api/health", 
                                     headers=headers, timeout=10)
        if health_response.status_code == 200:
            print("   ✅ Health check passed")
        else:
            print(f"   ⚠️  Health check returned: {health_response.status_code}")
    except Exception as e:
        print(f"   ⚠️  Health check failed: {e}")
    
    print()
    
    # Test 2: Business name comparison without image
    print("2. Testing business name comparison (without image)...")
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n   Test {i}: {test_case['name']}")
        print(f"   Business Name: {test_case['businessName']}")
        
        try:
            # Test data
            data = {
                'businessName': test_case['businessName']
            }
            
            response = requests.post(f"{base_url}/api/classify", 
                                   json=data, headers=headers, timeout=30)
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"   Response Keys: {list(result.keys())}")
                
                # Check for business name comparison feature
                if 'comparison' in result:
                    comparison = result['comparison']
                    print("   ✅ Business name comparison feature found!")
                    print(f"   - Is Match: {comparison.get('isMatch', 'N/A')}")
                    print(f"   - Match Score: {comparison.get('matchScore', 'N/A')}")
                    print(f"   - Match Reason: {comparison.get('matchReason', 'N/A')}")
                    
                    if 'businessType' in result:
                        print(f"   - AI Classification: {result['businessType']}")
                else:
                    print("   ❌ Business name comparison feature NOT found")
                    print(f"   Available fields: {list(result.keys())}")
                    
            elif response.status_code == 401:
                print("   ❌ Authentication required - please provide a valid token")
                return False
            elif response.status_code == 404:
                print("   ❌ API endpoint not found - check URL and deployment")
                return False
            else:
                print(f"   ❌ API error: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error details: {error_data}")
                except:
                    print(f"   Error text: {response.text[:200]}")
                    
        except requests.exceptions.ConnectionError:
            print("   ❌ Connection failed - is the server running?")
            return False
        except requests.exceptions.Timeout:
            print("   ❌ Request timeout - server may be overloaded")
            return False
        except Exception as e:
            print(f"   ❌ Unexpected error: {e}")
            return False
    
    print("\n" + "="*50)
    print("Test Summary:")
    print("- If you see 'Business name comparison feature found', the deployment is successful")
    print("- If you see 'Business name comparison feature NOT found', the feature may not be deployed")
    print("- Check the API response to verify the feature is working as expected")
    
    return True

def main():
    parser = argparse.ArgumentParser(description='Test QRIS Classifier API in production')
    parser.add_argument('--host', default='localhost', 
                       help='API host (default: localhost)')
    parser.add_argument('--port', type=int, default=3000,
                       help='API port (default: 3000)')
    parser.add_argument('--token', 
                       help='JWT token for authentication')
    parser.add_argument('--https', action='store_true',
                       help='Use HTTPS instead of HTTP')
    
    args = parser.parse_args()
    
    print("QRIS Classifier Production API Test")
    print("===================================")
    print(f"Host: {args.host}")
    print(f"Port: {args.port}")
    print(f"HTTPS: {args.https}")
    print(f"Token: {'Provided' if args.token else 'Not provided'}")
    print()
    
    success = test_api_endpoint(args.host, args.port, args.token, args.https)
    
    if success:
        print("\n✅ Test completed successfully")
        sys.exit(0)
    else:
        print("\n❌ Test failed")
        sys.exit(1)

if __name__ == '__main__':
    main()