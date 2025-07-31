#!/usr/bin/env node

/**
 * Test script untuk memverifikasi setup Clerk dan Supabase
 * Jalankan: node test-setup.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const tests = {
  environment: () => {
    console.log('🔍 Testing Environment Variables...');
    
    const required = [
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    const missing = [];
    const demo = [];
    
    for (const key of required) {
      const value = process.env[key];
      if (!value) {
        missing.push(key);
      } else if (value.includes('demo')) {
        demo.push(key);
      }
    }
    
    if (missing.length > 0) {
      console.log('❌ Missing environment variables:', missing);
      return false;
    }
    
    if (demo.length > 0) {
      console.log('⚠️  Demo values detected:', demo);
      console.log('   Please replace with real API keys');
      return false;
    }
    
    console.log('✅ All environment variables are set');
    return true;
  },
  
  supabase: async () => {
    console.log('🔍 Testing Supabase Connection...');
    
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.log('❌ Supabase environment variables not set');
        return false;
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Test connection by querying a table
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) {
        console.log('❌ Supabase connection failed:', error.message);
        return false;
      }
      
      console.log('✅ Supabase connection successful');
      return true;
    } catch (error) {
      console.log('❌ Supabase test failed:', error.message);
      return false;
    }
  },
  
  clerk: async () => {
    console.log('🔍 Testing Clerk Configuration...');
    
    try {
      const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      const secretKey = process.env.CLERK_SECRET_KEY;
      
      if (!publishableKey || !secretKey) {
        console.log('❌ Clerk environment variables not set');
        return false;
      }
      
      // Test Clerk API (basic validation)
      if (!publishableKey.startsWith('pk_') || !secretKey.startsWith('sk_')) {
        console.log('❌ Invalid Clerk API key format');
        return false;
      }
      
      console.log('✅ Clerk configuration looks valid');
      return true;
    } catch (error) {
      console.log('❌ Clerk test failed:', error.message);
      return false;
    }
  },
  
  health: async () => {
    console.log('🔍 Testing Health Endpoint...');
    
    try {
      const response = await fetch('http://localhost:3000/api/health');
      const data = await response.json();
      
      if (response.ok && data.status === 'healthy') {
        console.log('✅ Health endpoint working');
        return true;
      } else {
        console.log('❌ Health endpoint failed:', data);
        return false;
      }
    } catch (error) {
      console.log('❌ Health endpoint test failed:', error.message);
      console.log('   Make sure the development server is running (npm run dev)');
      return false;
    }
  }
};

async function runTests() {
  console.log('🚀 Starting Setup Tests...\n');
  
  const results = {};
  
  // Run all tests
  for (const [name, test] of Object.entries(tests)) {
    try {
      results[name] = await test();
    } catch (error) {
      console.log(`❌ Test ${name} failed:`, error.message);
      results[name] = false;
    }
    console.log('');
  }
  
  // Summary
  console.log('📊 Test Results:');
  console.log('================');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  for (const [name, passed] of Object.entries(results)) {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${name}`);
  }
  
  console.log(`\n${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Your setup is ready.');
    console.log('\nNext steps:');
    console.log('1. Open http://localhost:3000');
    console.log('2. Test authentication flow');
    console.log('3. Create your first trading bot');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the setup guide.');
    console.log('\nTroubleshooting:');
    console.log('1. Check SETUP_CLERK_SUPABASE.md');
    console.log('2. Verify environment variables');
    console.log('3. Restart development server');
  }
}

// Run tests
runTests().catch(console.error);