// Test script to verify AI classification is working properly

const testCases = [
  "Building shaking violently",
  "Person collapsed and not breathing",
  "Heavy smoke coming from kitchen"
];

async function testAI() {
  console.log('🧪 Testing ResQdrant AI Classification System\n');
  
  for (const testCase of testCases) {
    console.log(`\n📝 Test: "${testCase}"`);
    console.log('─'.repeat(60));
    
    try {
      const response = await fetch('http://localhost:5000/api/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userDescription: testCase })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log(`✅ Emergency Type: ${data.emergencyType}`);
      console.log(`⚠️  Severity: ${data.severity}`);
      console.log(`🧠 Explanation: ${data.explanation}`);
      console.log(`📋 First Aid Steps:`);
      data.firstAidSteps.forEach((step, idx) => {
        console.log(`   ${idx + 1}. ${step}`);
      });
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Testing complete!');
}

testAI();
