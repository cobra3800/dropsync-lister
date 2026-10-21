
const { DatabaseSync } = require("node:sqlite");

const paths = [
  "prisma/dev.db",
  "prisma/prisma/dev.db",
];

for (const path of paths) {
  console.log("\nChecking:", path);

  try {
    const db = new DatabaseSync(path, {
      readOnly: true,
    });

    const rows = db
      .prepare(
        'SELECT externalOrderId, status, shippingCarrier, trackingNumber, shippedAt FROM "Order" WHERE externalOrderId = ?'
      )
      .all("DROPSYNC-SHIPPING-TEST-001");

    console.log(rows);
    db.close();
  } catch (error) {
    console.log("Error:", error.message);
  }
}
