/**
 * Integration test for agent controller endpoints
 * Tests AI agent message generation with various contexts
 */

import { Request, Response } from 'express';
import { postAgentMessage } from './controllers/agentController';

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Mock Express Request object
 */
function mockRequest(
  params: Record<string, string> = {},
  body: any = {},
  headers: Record<string, string> = {}
): Partial<Request> {
  return {
    params,
    body,
    headers,
  } as Partial<Request>;
}

/**
 * Mock Express Response object
 */
function mockResponse(): any {
  const res: any = {
    statusCode: 200,
    jsonData: null,
  };

  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };

  res.json = (data: any) => {
    res.jsonData = data;
    return res;
  };

  return res;
}

/**
 * Test 1: Mentor Agent - General advice
 */
async function testMentorAgent() {
  log('\n🧙 Test 1: Mentor Agent - General advice', 'blue');

  const req = mockRequest(
    { agentName: 'mentor' },
    {
      context: {
        playerRole: 'student',
        currentBalance: 500,
        healthScore: 45,
        scenarioDescription: 'Unexpected car repair bill of $300',
      },
    },
    { 'x-player-id': 'test-player-1' }
  );
  const res = mockResponse();

  await postAgentMessage(req as Request, res as Response);

  if (res.statusCode === 200 && res.jsonData?.success) {
    log(`  ✅ Mentor response received`, 'green');
    log(`  Agent: ${res.jsonData.agent}`, 'reset');
    log(`  Message: ${res.jsonData.message.substring(0, 100)}...`, 'reset');
    return { success: true };
  } else {
    log(`  ❌ Failed: ${JSON.stringify(res.jsonData)}`, 'red');
    return { success: false };
  }
}

/**
 * Test 2: Spender Sam - Fun-first perspective
 */
async function testSpenderSamAgent() {
  log('\n💸 Test 2: Spender Sam - Fun-first perspective', 'blue');

  const req = mockRequest(
    { agentName: 'spenderSam' },
    {
      context: {
        scenario: 'Friends inviting you to a concert',
        ticketPrice: 150,
        currentBalance: 800,
      },
    }
  );
  const res = mockResponse();

  await postAgentMessage(req as Request, res as Response);

  if (res.statusCode === 200 && res.jsonData?.success) {
    log(`  ✅ Spender Sam response received`, 'green');
    log(`  Message: ${res.jsonData.message.substring(0, 100)}...`, 'reset');
    return { success: true };
  } else {
    log(`  ❌ Failed`, 'red');
    return { success: false };
  }
}

/**
 * Test 3: Saver Siya - Conservative approach
 */
async function testSaverSiyaAgent() {
  log('\n💰 Test 3: Saver Siya - Conservative approach', 'blue');

  const req = mockRequest(
    { agentName: 'saverSiya' },
    {
      context: {
        scenario: 'Should I buy a new laptop or save?',
        currentSavings: 2000,
        emergencyFund: 1500,
      },
    }
  );
  const res = mockResponse();

  await postAgentMessage(req as Request, res as Response);

  if (res.statusCode === 200 && res.jsonData?.success) {
    log(`  ✅ Saver Siya response received`, 'green');
    log(`  Message: ${res.jsonData.message.substring(0, 100)}...`, 'reset');
    return { success: true };
  } else {
    log(`  ❌ Failed`, 'red');
    return { success: false };
  }
}

/**
 * Test 4: Crisis Coach - Triage mode
 */
async function testCrisisAgent() {
  log('\n🚨 Test 4: Crisis Coach - Triage mode', 'blue');

  const req = mockRequest(
    { agentName: 'crisisCoach' },
    {
      context: {
        situation: 'Lost job, rent due in 5 days',
        currentBalance: 200,
        monthlyRent: 900,
        healthScore: 30,
      },
    }
  );
  const res = mockResponse();

  await postAgentMessage(req as Request, res as Response);

  if (res.statusCode === 200 && res.jsonData?.success) {
    log(`  ✅ Crisis Coach response received`, 'green');
    log(`  Message: ${res.jsonData.message.substring(0, 100)}...`, 'reset');
    return { success: true };
  } else {
    log(`  ❌ Failed`, 'red');
    return { success: false };
  }
}

/**
 * Test 5: Future You - Long-term perspective
 */
async function testFutureYouAgent() {
  log('\n🔮 Test 5: Future You - Long-term perspective', 'blue');

  const req = mockRequest(
    { agentName: 'futureYou' },
    {
      context: {
        currentAge: 22,
        monthlyIncome: 2500,
        currentInvestments: 500,
        retirementGoal: 1000000,
      },
    }
  );
  const res = mockResponse();

  await postAgentMessage(req as Request, res as Response);

  if (res.statusCode === 200 && res.jsonData?.success) {
    log(`  ✅ Future You response received`, 'green');
    log(`  Message: ${res.jsonData.message.substring(0, 100)}...`, 'reset');
    return { success: true };
  } else {
    log(`  ❌ Failed`, 'red');
    return { success: false };
  }
}

/**
 * Test 6: Translator - Financial jargon explanation
 */
async function testTranslatorAgent() {
  log('\n📖 Test 6: Translator - Financial jargon explanation', 'blue');

  const req = mockRequest(
    { agentName: 'translator' },
    {
      term: 'compound interest',
      context: {
        playerLevel: 'beginner',
      },
    }
  );
  const res = mockResponse();

  await postAgentMessage(req as Request, res as Response);

  if (res.statusCode === 200 && res.jsonData?.success) {
    log(`  ✅ Translator response received`, 'green');
    log(`  Term explained: compound interest`, 'reset');
    log(`  Explanation: ${res.jsonData.message.substring(0, 100)}...`, 'reset');
    return { success: true };
  } else {
    log(`  ❌ Failed`, 'red');
    return { success: false };
  }
}

/**
 * Test 7: Invalid agent name
 */
async function testInvalidAgent() {
  log('\n⚠️  Test 7: Invalid agent name', 'blue');

  const req = mockRequest(
    { agentName: 'invalidAgent' },
    { context: {} }
  );
  const res = mockResponse();

  await postAgentMessage(req as Request, res as Response);

  if (res.statusCode === 400 && !res.jsonData?.success) {
    log(`  ✅ Correctly rejected invalid agent`, 'green');
    log(`  Error: ${res.jsonData.error}`, 'reset');
    log(`  Valid agents: ${res.jsonData.validAgents?.join(', ')}`, 'reset');
    return { success: true };
  } else {
    log(`  ❌ Should have rejected invalid agent`, 'red');
    return { success: false };
  }
}

/**
 * Test 8: Translator without term
 */
async function testTranslatorMissingTerm() {
  log('\n⚠️  Test 8: Translator without required term', 'blue');

  const req = mockRequest(
    { agentName: 'translator' },
    { context: {} } // Missing term
  );
  const res = mockResponse();

  await postAgentMessage(req as Request, res as Response);

  if (res.statusCode === 400 && !res.jsonData?.success) {
    log(`  ✅ Correctly rejected missing term`, 'green');
    log(`  Error: ${res.jsonData.error}`, 'reset');
    return { success: true };
  } else {
    log(`  ❌ Should have rejected missing term`, 'red');
    return { success: false };
  }
}

/**
 * Test 9: Multiple agents in sequence
 */
async function testMultipleAgents() {
  log('\n🔄 Test 9: Multiple agents in sequence', 'blue');

  const scenario = 'Should I invest $1000 in the stock market?';
  const agents = ['mentor', 'spenderSam', 'saverSiya', 'futureYou'];
  const results: Array<{ agent: string; success: boolean }> = [];

  for (const agent of agents) {
    const req = mockRequest(
      { agentName: agent },
      { context: { scenario } }
    );
    const res = mockResponse();

    await postAgentMessage(req as Request, res as Response);

    const success = res.statusCode === 200 && res.jsonData?.success;
    results.push({ agent, success });

    if (success) {
      log(`  ✅ ${agent}: Response received`, 'green');
    } else {
      log(`  ❌ ${agent}: Failed`, 'red');
    }
  }

  const allSucceeded = results.every((r) => r.success);
  if (allSucceeded) {
    log(`  ✅ All ${agents.length} agents responded successfully`, 'green');
  }

  return { success: allSucceeded };
}

/**
 * Test 10: Translator with multiple terms
 */
async function testTranslatorMultipleTerms() {
  log('\n📚 Test 10: Translator with multiple financial terms', 'blue');

  const terms = [
    'APR',
    'diversification',
  ];
  const results: Array<{ term: string; success: boolean }> = [];

  for (const term of terms) {
    const req = mockRequest(
      { agentName: 'translator' },
      { term, context: {} }
    );
    const res = mockResponse();

    await postAgentMessage(req as Request, res as Response);

    const success = res.statusCode === 200 && res.jsonData?.success;
    results.push({ term, success });

    if (success) {
      log(`  ✅ ${term}: Explained`, 'green');
    } else {
      log(`  ❌ ${term}: Failed (likely rate limited)`, 'yellow');
    }
    
    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const allSucceeded = results.every((r) => r.success);
  return { success: allSucceeded };
}

/**
 * Run all tests
 */
async function runAllTests() {
  log('\n' + '='.repeat(60), 'reset');
  log('🤖 Agent Controller Integration Tests', 'blue');
  log('='.repeat(60), 'reset');

  const results: Array<{ name: string; success: boolean }> = [];

  // Test individual agents
  results.push({
    name: 'Mentor agent',
    success: (await testMentorAgent()).success,
  });

  results.push({
    name: 'Spender Sam agent',
    success: (await testSpenderSamAgent()).success,
  });

  results.push({
    name: 'Saver Siya agent',
    success: (await testSaverSiyaAgent()).success,
  });

  results.push({
    name: 'Crisis coach agent',
    success: (await testCrisisAgent()).success,
  });

  results.push({
    name: 'Future You agent',
    success: (await testFutureYouAgent()).success,
  });

  results.push({
    name: 'Translator agent',
    success: (await testTranslatorAgent()).success,
  });

  // Test validation
  results.push({
    name: 'Invalid agent rejection',
    success: (await testInvalidAgent()).success,
  });

  results.push({
    name: 'Translator missing term',
    success: (await testTranslatorMissingTerm()).success,
  });

  // Test sequences
  results.push({
    name: 'Multiple agents sequence',
    success: (await testMultipleAgents()).success,
  });

  results.push({
    name: 'Translator multiple terms',
    success: (await testTranslatorMultipleTerms()).success,
  });

  // Summary
  log('\n' + '='.repeat(60), 'reset');
  log('📊 Test Results Summary', 'blue');
  log('='.repeat(60), 'reset');

  const passed = results.filter((r) => r.success).length;
  const total = results.length;

  results.forEach((result) => {
    const icon = result.success ? '✅' : '❌';
    const color = result.success ? 'green' : 'red';
    log(`  ${icon} ${result.name}`, color);
  });

  log('\n' + '='.repeat(60), 'reset');
  if (passed === total) {
    log(`✅ ALL TESTS PASSED (${passed}/${total})`, 'green');
  } else {
    log(`❌ SOME TESTS FAILED (${passed}/${total})`, 'red');
  }
  log('='.repeat(60) + '\n', 'reset');
}

// Run tests
runAllTests().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});
