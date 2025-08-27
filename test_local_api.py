#!/usr/bin/env python3
import requests
import json

# Configuration
BASE_URL = "http://localhost:9002"
CLASSIFY_ENDPOINT = f"{BASE_URL}/api/classify"

# Use API Key authentication instead of JWT to avoid database issues
API_KEY = "qris_admin_default_key_change_this"  # From database

def test_business_name_comparison_with_api_key():
    """Test business name comparison feature using API Key authentication"""
    
    # Valid base64 image from sepatu3.jpeg
    test_image = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    
    test_cases = [
        {
            "name": "Exact Match",
            "businessName": "Warung Makan Sederhana",
            "expected_match": True
        },
        {
            "name": "Partial Match", 
            "businessName": "Warung Sederhana",
            "expected_match": True
        },
        {
            "name": "Different Business",
            "businessName": "Toko Elektronik Modern", 
            "expected_match": False
        },
        {
            "name": "Similar Keywords",
            "businessName": "Warung Makan Bahagia",
            "expected_match": True
        }
    ]
    
    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }
    
    print("\n=== Testing Business Name Comparison Feature (API Key Auth) ===")
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test_case['name']}")
        print(f"Business Name: {test_case['businessName']}")
        
        data = {
            "images": {
                "image1": test_image
            },
            "businessName": test_case['businessName'],
            "metadata": {
                "requestId": f"test_req_{i}",
                "clientVersion": "1.0.0"
            }
        }
        
        try:
            response = requests.post(CLASSIFY_ENDPOINT, json=data, headers=headers)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"Response: {json.dumps(result, indent=2)}")
                
                # Check business name comparison results
                if 'businessNameComparison' in result:
                    comparison = result['businessNameComparison']
                    print(f"✓ Business Name Match: {comparison.get('isMatch', 'N/A')}")
                    print(f"✓ Match Score: {comparison.get('matchScore', 'N/A')}")
                    print(f"✓ Match Reason: {comparison.get('matchReason', 'N/A')}")
                else:
                    print("⚠️  No business name comparison in response")
            else:
                print(f"❌ Request failed: {response.text}")
                
        except Exception as e:
            print(f"❌ Error: {e}")
        
        print("-" * 50)

if __name__ == "__main__":
    print("QRIS Classifier - Business Name Comparison Test")
    print("=" * 50)
    
    # Test business name comparison with API Key
    test_business_name_comparison_with_api_key()
    
    print("\n=== Test Complete ===")