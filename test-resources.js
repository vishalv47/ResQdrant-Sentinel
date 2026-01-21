// Test script to verify nearby resources are included in API response

const testCases = [
  { desc: "Fire in building", expectedType: "fire" },
  { desc: "Building shaking violently", expectedType: "earthquake" },
  { desc: "Person collapsed and not breathing", expectedType: "medical" },
];

async function testResources() {
  console.log('🧪 Testing Nearby Resources Feature\n');
  
  for (const testCase of testCases) {
    console.log(`\n📝 Test: "${testCase.desc}"`);
    console.log('─'.repeat(60));
    
    try {
      const response = await fetch('http://localhost:5000/api/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userDescription: testCase.desc })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log(`✅ Emergency Type: ${data.emergencyType}`);
      console.log(`⚠️  Severity: ${data.severity}`);
      
      if (data.nearbyResources && data.nearbyResources.length > 0) {
        console.log(`\n📍 Nearby Resources (${data.nearbyResources.length} found):`);
        data.nearbyResources.forEach((resource, idx) => {
          const status = resource.status ? ` [${resource.status}]` : '';
          console.log(`   ${idx + 1}. ${resource.type}: ${resource.name}${status}`);
          console.log(`      📍 ${resource.distance} km | ⏱️ ETA ${resource.eta} min`);
        });
      } else {
        console.log('❌ No nearby resources found!');
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Testing complete!');
}

testResources();
