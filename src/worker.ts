import { VibraniumCore } from "./services/vibranium-core";

const core = new VibraniumCore();

async function main() {
  console.log("VIBRANIUM Worker starting...");
  await core.startMonitoring();
  
  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down...");
    process.exit(0);
  });
  
  process.on("SIGINT", () => {
    console.log("SIGINT received, shutting down...");
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("VIBRANIUM Worker failed to start:", error);
  process.exit(1);
});
