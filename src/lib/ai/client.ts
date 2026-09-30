import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Reads ANTHROPIC_API_KEY from the server environment. The "server-only"
// import makes the build fail if this file is ever pulled into browser code.
export const anthropic = new Anthropic();
