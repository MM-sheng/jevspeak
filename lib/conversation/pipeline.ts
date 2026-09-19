/**
 * The runtime pipeline. This is the whole product in one function:
 *
 *   message + state → Jev (decisions) → Semantic IR → language compiler → text
 *
 * There is no LLM call anywhere in this path.
 */
import { inferDecision, resolveJevConfig, type JevOverride } from "@/lib/jev";
import { compileResponse } from "@/lib/language";
import { advanceState, toJevState } from "./state";
import type { ConversationState, JevTurn, UserTurn } from "@/types/conversation";

let counter = 0;
const id = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`;

export async function runTurn(message: string, state: ConversationState, override?: JevOverride) {
  const user: UserTurn = { role: "user", id: id(), text: message, at: Date.now() };
  const { decision, semantic } = await inferDecision(toJevState(state, message), override);
  const compiled = compileResponse(semantic);
  const jev: JevTurn = {
    role: "jev",
    id: id(),
    text: compiled.text,
    at: Date.now(),
    semantic,
    decision,
    trace: compiled.trace,
  };
  const next = advanceState(state, message, semantic, compiled.text);
  return { user, jev, state: next, mode: resolveJevConfig(override).mode };
}
