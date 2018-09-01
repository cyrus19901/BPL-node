/* Create Schema
 *
 */

BEGIN;

/* Tables */
CREATE TABLE IF NOT EXISTS "autoupdates"(
  "transactionId" VARCHAR(64) NOT NULL,
  "versionLabel" VARCHAR(100) NOT NULL,
  "triggerHeight" INT NOT NULL,
  "ipfsHash" VARCHAR(46) NOT NULL,
  "verifyingTransactionId" VARCHAR(64) DEFAULT NULL,
  "cancellationStatus" BOOLEAN DEFAULT FALSE,
  FOREIGN KEY("transactionId") REFERENCES "transactions"("id"),
  FOREIGN KEY("verifyingTransactionId") REFERENCES "transactions"("id") ON DELETE CASCADE
);

COMMIT;
