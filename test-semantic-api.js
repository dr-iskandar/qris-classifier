const axios = require('axios');

// Test data with a simple base64 image
const testData = {
  images: {
    image1: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
  },
  businessName: "Warung Makan Sederhana",
  metadata: {
    requestId: "test-semantic-comparison",
    clientVersion: "1.0.0"
  }
};

async function testSemanticComparison() {
  try {
    console.log('Testing AI Semantic Comparison Feature...');
    console.log('Business Name:', testData.businessName);
    console.log('\nSending request to API...');
    
    const response = await axios.post('http://localhost:9002/api/classify', testData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      timeout: 30000 // 30 second timeout
    });
    
    console.log('\n=== API Response ===');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    
    if (response.data.success && response.data.data) {
      const { businessType, comparison } = response.data.data;
      
      console.log('\n=== Classification Result ===');
      console.log('AI Classified Type:', businessType);
      
      if (comparison) {
        console.log('\n=== Semantic Comparison Result ===');
        console.log('User Business Name:', comparison.userBusinessName);
        console.log('Is Match:', comparison.isMatch);
        console.log('Match Score:', comparison.matchScore);
        console.log('Match Reason:', comparison.matchReason);
        
        if (comparison.semanticRelationship) {
          console.log('Semantic Relationship:', comparison.semanticRelationship);
        }
        
        if (comparison.recommendations && comparison.recommendations.length > 0) {
          console.log('Recommendations:');
          comparison.recommendations.forEach((rec, index) => {
            console.log(`  ${index + 1}. ${rec}`);
          });
        }
      }
    } else {
      console.log('\n=== Error ===');
      console.log('Error:', response.data.error);
    }
    
  } catch (error) {
    console.error('\n=== Request Failed ===');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Test different business name scenarios
async function runMultipleTests() {
  const testCases = [
    {
      businessName: "Warung Makan Sederhana",
      description: "Indonesian restaurant name"
    },
    {
      businessName: "Toko Sepatu Modern",
      description: "Shoe store name"
    },
    {
      businessName: "Apotek Sehat",
      description: "Pharmacy name"
    },
    {
      businessName: "Coffee Shop Kekinian",
      description: "Modern coffee shop"
    }
  ];
  
  for (const testCase of testCases) {
    console.log('\n' + '='.repeat(60));
    console.log(`Testing: ${testCase.description}`);
    console.log('='.repeat(60));
    
    // Update test data
    testData.businessName = testCase.businessName;
    testData.metadata.requestId = `test-${Date.now()}`;
    
    await testSemanticComparison();
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Run the test
if (require.main === module) {
  runMultipleTests().catch(console.error);
}

module.exports = { testSemanticComparison, runMultipleTests };