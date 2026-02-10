import {
  checkDatabaseConnection,
  closeDatabaseConnection,
} from "../infrastructure/db/connection.js";

const run = async () => {
  try {
    await checkDatabaseConnection();
    console.log("DB_CONNECTION_OK");
  } catch (error) {
    console.error("DB_CONNECTION_FAIL");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await closeDatabaseConnection();
  }
};

await run();
