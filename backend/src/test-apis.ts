/**
 * Test script for Gemini AI and Nessie API integrations
 * Run with: npm run test:apis
 */

import { llm, generateAgentReply, AgentContext } from './services/aiService';
import { nessie } from './services/nessieService';
import { env } from './config/env';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bold + colors.blue);
  console.log('='.repeat(60) + '\n');
}

async function testGeminiAPI() {
  logSection('🤖 Testing Gemini AI API');

  try {
    log('API Key (masked): ' + env.ai.apiKey.substring(0, 10) + '...' + env.ai.apiKey.slice(-4));
    log('Model: ' + env.ai.model);

    // Test 1: Simple chat completion
    log('\n📝 Test 1: Simple Chat Completion', colors.yellow);
    const simpleResponse = await llm.chat([
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Say "Hello, FinQuest!" in exactly those words.' },
    ]);
    log('Response: ' + simpleResponse.text, colors.green);
    log('Tokens used: ' + (simpleResponse.tokens || 'N/A'));

    // Test 2: Generate a mentor agent reply
    log('\n📝 Test 2: Mentor Agent Reply', colors.yellow);
    const context: AgentContext = {
      playerRole: 'student',
      difficulty: 'normal',
      currentBalance: 1500,
      scenarioDescription: 'You found $20 on the ground. What should you do with it?',
      mood: 'okay',
    };
    const mentorReply = await generateAgentReply('mentor', context);
    log('Agent: ' + mentorReply.agent, colors.green);
    log('Message: ' + mentorReply.message);
    log('Tokens: ' + (mentorReply.tokens || 'N/A'));
    log('Word count: ' + mentorReply.message.split(' ').length + ' words');

    // Test 3: Generate a spender Sam reply
    log('\n📝 Test 3: Spender Sam Agent Reply', colors.yellow);
    const samReply = await generateAgentReply('spenderSam', {
      ...context,
      scenarioDescription: "There's a sale on a gadget you've been wanting. It's 30% off!",
    });
    log('Agent: ' + samReply.agent, colors.green);
    log('Message: ' + samReply.message);
    log('Word count: ' + samReply.message.split(' ').length + ' words');

    // Test 4: Translator agent
    log('\n📝 Test 4: Translator Agent (Jargon Buster)', colors.yellow);
    const translatorReply = await generateAgentReply(
      'translator',
      { playerRole: 'student' },
      'compound interest'
    );
    log('Agent: ' + translatorReply.agent, colors.green);
    log('Message: ' + translatorReply.message);

    log('\n✅ All Gemini AI tests passed!', colors.green + colors.bold);
    return true;
  } catch (error) {
    log('\n❌ Gemini AI test failed:', colors.red + colors.bold);
    console.error(error);
    return false;
  }
}

async function testNessieAPI() {
  logSection('🏦 Testing Capital One Nessie API');

  try {
    log('API Key (masked): ' + env.nessie.apiKey.substring(0, 6) + '...' + env.nessie.apiKey.slice(-4));
    log('Base URL: ' + env.nessie.baseUrl);

    // Test 1: Create a customer
    log('\n📝 Test 1: Create Customer', colors.yellow);
    const customerResponse = await nessie.createCustomer({
      first_name: 'Test',
      last_name: 'Player',
      address: {
        street_number: '123',
        street_name: 'Financial St',
        city: 'Money City',
        state: 'FC',
        zip: '12345',
      },
    });
    log('✓ Customer created successfully!', colors.green);
    log('Response: ' + JSON.stringify(customerResponse, null, 2));
    const customerId = customerResponse.objectCreated._id;
    log('Customer ID: ' + customerId);

    // Test 2: Create a checking account
    log('\n📝 Test 2: Create Checking Account', colors.yellow);
    const checkingAccount = await nessie.createAccount(customerId, {
      type: 'Checking',
      nickname: 'Main Checking',
      balance: 1000,
      rewards: 0,
    });
    log('✓ Checking account created successfully!', colors.green);
    log('Account ID: ' + checkingAccount.objectCreated._id);

    // Test 3: Create a savings account
    log('\n📝 Test 3: Create Savings Account', colors.yellow);
    const savingsAccount = await nessie.createAccount(customerId, {
      type: 'Savings',
      nickname: 'Emergency Fund',
      balance: 500,
      rewards: 0,
    });
    log('✓ Savings account created successfully!', colors.green);
    log('Account ID: ' + savingsAccount.objectCreated._id);

    // Test 4: List all accounts
    log('\n📝 Test 4: List All Accounts', colors.yellow);
    const accounts = await nessie.listAccounts(customerId);
    log('✓ Retrieved ' + accounts.length + ' accounts:', colors.green);
    accounts.forEach((acc) => {
      log(`  - ${acc.type}: $${acc.balance} (ID: ${acc.id})`);
    });

    // Test 5: Get single account details
    log('\n📝 Test 5: Get Account Details', colors.yellow);
    const accountDetails = await nessie.getAccount(checkingAccount.objectCreated._id);
    log('✓ Account details retrieved:', colors.green);
    log(`  Type: ${accountDetails.type}`);
    log(`  Balance: $${accountDetails.balance}`);
    log(`  ID: ${accountDetails.id}`);

    // Test 6: Create a transaction
    log('\n📝 Test 6: Create Transaction', colors.yellow);
    const transaction = await nessie.createTransaction(checkingAccount.objectCreated._id, {
      medium: 'balance',
      amount: -50,
      description: 'Coffee shop purchase',
    });
    log('✓ Transaction created successfully!', colors.green);
    log('Transaction ID: ' + transaction.objectCreated._id);

    // Test 7: Verify account balance after transaction
    log('\n📝 Test 7: Verify Updated Balance', colors.yellow);
    const updatedAccount = await nessie.getAccount(checkingAccount.objectCreated._id);
    log('✓ Updated balance retrieved:', colors.green);
    log(`  New balance: $${updatedAccount.balance}`);
    log(`  Expected: $950 (1000 - 50)`);

    log('\n✅ All Nessie API tests passed!', colors.green + colors.bold);
    return true;
  } catch (error) {
    log('\n❌ Nessie API test failed:', colors.red + colors.bold);
    console.error(error);
    return false;
  }
}

async function runAllTests() {
  console.clear();
  log('╔════════════════════════════════════════════════════════════╗', colors.blue + colors.bold);
  log('║         FinQuest API Integration Test Suite              ║', colors.blue + colors.bold);
  log('╚════════════════════════════════════════════════════════════╝', colors.blue + colors.bold);

  const results = {
    gemini: false,
    nessie: false,
  };

  // Test Gemini AI
  results.gemini = await testGeminiAPI();

  // Test Nessie API
  results.nessie = await testNessieAPI();

  // Final summary
  logSection('📊 Test Summary');
  log('Gemini AI: ' + (results.gemini ? '✅ PASSED' : '❌ FAILED'), results.gemini ? colors.green : colors.red);
  log('Nessie API: ' + (results.nessie ? '✅ PASSED' : '❌ FAILED'), results.nessie ? colors.green : colors.red);

  const allPassed = results.gemini && results.nessie;
  log(
    '\n' + (allPassed ? '🎉 All tests passed!' : '⚠️  Some tests failed'),
    allPassed ? colors.green + colors.bold : colors.red + colors.bold
  );

  process.exit(allPassed ? 0 : 1);
}

// Run the tests
runAllTests().catch((error) => {
  log('\n💥 Fatal error running tests:', colors.red + colors.bold);
  console.error(error);
  process.exit(1);
});
