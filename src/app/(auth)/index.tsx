import { EmailEntryScreen } from "@/modules/auth";

// Route files stay thin on purpose — they wire a URL to a module's screen
// and nothing else. All real logic lives in the module.
export default function Index() {
  return <EmailEntryScreen />;
}
