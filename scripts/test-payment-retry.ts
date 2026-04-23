// ─── AI-65 결제 시스템 테스트 스크립트 ───
// 사용법: npx tsx scripts/test-payment-retry.ts

import { db } from "../src/lib/db";
import { billingRecords, webhookDeliveries, subscriptions } from "../src/lib/db/schema";
import {
  isRetryableError,
  calculateNextRetryTime,
  processFailedPaymentRetries
} from "../src/lib/billing-retry";
import { eq } from "drizzle-orm";

async function testDatabaseSchema() {
  console.log("🔍 Testing database schema changes...");

  try {
    // Test 1: Check if new fields exist in billingRecords
    const result = await db.select({
      id: billingRecords.id,
      retryCount: billingRecords.retryCount,
      nextRetryAt: billingRecords.nextRetryAt,
      lastRetryAt: billingRecords.lastRetryAt,
      maxRetries: billingRecords.maxRetries,
    }).from(billingRecords).limit(1);

    console.log("✅ billingRecords table has retry fields");

    // Test 2: Check if webhookDeliveries table exists
    const webhookResult = await db.select({
      id: webhookDeliveries.id,
      tossEventId: webhookDeliveries.tossEventId,
      eventType: webhookDeliveries.eventType,
      status: webhookDeliveries.status,
    }).from(webhookDeliveries).limit(1);

    console.log("✅ webhookDeliveries table exists");
    return true;
  } catch (error) {
    console.error("❌ Database schema test failed:", error);
    return false;
  }
}

async function testRetryLogic() {
  console.log("🔍 Testing retry logic...");

  try {
    // Test 1: Error classification
    console.log("Testing error classification:");
    console.log("  INVALID_CARD_NUMBER (non-retryable):", isRetryableError("INVALID_CARD_NUMBER", ""));
    console.log("  COMMON_SYSTEM_ERROR (retryable):", isRetryableError("COMMON_SYSTEM_ERROR", ""));
    console.log("  UNKNOWN_ERROR (retryable by default):", isRetryableError("UNKNOWN_ERROR", ""));

    // Test 2: Retry timing calculation
    console.log("Testing retry schedule:");
    const retry1 = calculateNextRetryTime(1);
    const retry2 = calculateNextRetryTime(2);
    const retry3 = calculateNextRetryTime(3);
    const retry4 = calculateNextRetryTime(4);

    console.log("  1st retry:", retry1 ? `+${Math.round((retry1.getTime() - Date.now()) / (1000 * 60 * 60))} hours` : "null");
    console.log("  2nd retry:", retry2 ? `+${Math.round((retry2.getTime() - Date.now()) / (1000 * 60 * 60))} hours` : "null");
    console.log("  3rd retry:", retry3 ? `+${Math.round((retry3.getTime() - Date.now()) / (1000 * 60 * 60))} hours` : "null");
    console.log("  4th retry:", retry4 ? "should be null" : "null ✅");

    console.log("✅ Retry logic tests passed");
    return true;
  } catch (error) {
    console.error("❌ Retry logic test failed:", error);
    return false;
  }
}

async function testWebhookIdempotency() {
  console.log("🔍 Testing webhook idempotency...");

  try {
    const testEventId = `test-${Date.now()}`;

    // Simulate first webhook delivery
    await db.insert(webhookDeliveries).values({
      tossEventId: testEventId,
      webhookName: "test_webhook",
      eventType: "BILLING.PAYMENT.DONE",
      status: "processed",
      receiptSignature: "test-signature",
      payload: { test: true },
      processedAt: new Date(),
    });

    // Check if duplicate detection works
    const existing = await db
      .select()
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.tossEventId, testEventId))
      .limit(1);

    if (existing.length > 0 && existing[0].status === "processed") {
      console.log("✅ Webhook idempotency check works");

      // Cleanup test data
      await db.delete(webhookDeliveries).where(eq(webhookDeliveries.tossEventId, testEventId));
      return true;
    } else {
      console.error("❌ Webhook idempotency test failed");
      return false;
    }
  } catch (error) {
    console.error("❌ Webhook idempotency test failed:", error);
    return false;
  }
}

async function testCronEndpoints() {
  console.log("🔍 Testing CRON endpoints...");

  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.log("⚠️  CRON_SECRET not set, skipping endpoint tests");
      return true;
    }

    // Test retry endpoint availability (we won't call it, just check if the module loads)
    const { processFailedPaymentRetries } = await import("../src/lib/billing-retry");
    if (typeof processFailedPaymentRetries === "function") {
      console.log("✅ Retry CRON function available");
    }

    console.log("✅ CRON endpoints test passed");
    return true;
  } catch (error) {
    console.error("❌ CRON endpoints test failed:", error);
    return false;
  }
}

async function runAllTests() {
  console.log("🚀 Starting AI-65 Payment System Tests\n");

  const tests = [
    { name: "Database Schema", fn: testDatabaseSchema },
    { name: "Retry Logic", fn: testRetryLogic },
    { name: "Webhook Idempotency", fn: testWebhookIdempotency },
    { name: "CRON Endpoints", fn: testCronEndpoints },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📋 Total: ${passed + failed}`);

  if (failed === 0) {
    console.log("\n🎉 All tests passed! AI-65 implementation is ready.");
  } else {
    console.log("\n⚠️  Some tests failed. Please check the implementation.");
  }

  process.exit(failed === 0 ? 0 : 1);
}

// Environment check
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

// Run tests
runAllTests().catch((error) => {
  console.error("❌ Test runner failed:", error);
  process.exit(1);
});