// Session config as data. Every session, in every mode, is described by one
// object covering all axes of the customization matrix (docs/SPEC.md §3).
// Stage 1's setup screen only asks for topic, position, AI role and
// difficulty; everything else takes the Debate defaults below.

import { z } from "zod";
import type {
  Activity,
  AiRoleType,
  Complexity,
  ConfrontationLevel,
  ConversationStyle,
  Difficulty,
  Interruptibility,
} from "@prisma/client";

export const ACTIVITIES = ["DEBATE", "LEARN", "REFLECT", "CHANGE_MY_MIND"] as const satisfies readonly Activity[];
export const AI_ROLE_TYPES = ["OPPONENT", "TEACHER", "COACH", "SOCRATIC_GUIDE"] as const satisfies readonly AiRoleType[];
export const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const satisfies readonly Difficulty[];
export const COMPLEXITIES = ["VERY_SIMPLE", "BASIC", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const satisfies readonly Complexity[];
export const CONFRONTATION_LEVELS = ["FRIENDLY", "CHALLENGING", "COMBATIVE"] as const satisfies readonly ConfrontationLevel[];
export const CONVERSATION_STYLES = ["STRUCTURED", "NATURAL", "CASUAL"] as const satisfies readonly ConversationStyle[];
export const INTERRUPTIBILITIES = ["STRICT_TURNS", "CONVERSATIONAL", "FULLY_INTERRUPTIBLE"] as const satisfies readonly Interruptibility[];

export const sessionConfigSchema = z.object({
  activity: z.enum(ACTIVITIES),
  topic: z.string().trim().min(1, "Add a topic").max(300),
  userPosition: z.string().trim().min(1, "Add your position").max(1000),
  aiRoleType: z.enum(AI_ROLE_TYPES),
  aiRole: z.string().trim().min(1, "Say who the AI plays").max(300),
  difficulty: z.enum(DIFFICULTIES),
  complexity: z.enum(COMPLEXITIES),
  confrontationLevel: z.enum(CONFRONTATION_LEVELS),
  conversationStyle: z.enum(CONVERSATION_STYLES),
  interruptibility: z.enum(INTERRUPTIBILITIES),
  adaptiveDifficulty: z.boolean(),
});

export type SessionConfig = z.infer<typeof sessionConfigSchema>;

// Stage 1 Debate defaults for the axes the UI doesn't expose yet.
export const DEBATE_DEFAULTS = {
  activity: "DEBATE",
  aiRoleType: "OPPONENT",
  complexity: "INTERMEDIATE",
  confrontationLevel: "CHALLENGING",
  conversationStyle: "NATURAL",
  interruptibility: "CONVERSATIONAL",
  adaptiveDifficulty: false,
} as const satisfies Partial<SessionConfig>;

// What the Stage 1 setup screen sends.
export const debateSetupSchema = sessionConfigSchema.pick({
  topic: true,
  userPosition: true,
  aiRole: true,
  difficulty: true,
});

export const DIFFICULTY_LABELS: Record<Difficulty, { label: string; blurb: string }> = {
  BEGINNER: { label: "Beginner", blurb: "Straightforward arguments, plain language." },
  INTERMEDIATE: { label: "Intermediate", blurb: "More nuanced counterarguments." },
  ADVANCED: { label: "Advanced", blurb: "Strong evidence, competing interpretations." },
  EXPERT: { label: "Expert", blurb: "Finds subtle weaknesses, makes you defend assumptions." },
};

export const AI_ROLE_EXAMPLES = [
  "An atheist philosopher",
  "A fellow Christian from a different tradition",
  "A free-market economist",
  "A progressive policy analyst",
  "A skeptical scientist",
];

// Pull the config fields out of a stored Session row.
export function configFromSession(s: SessionConfig): SessionConfig {
  return sessionConfigSchema.parse({
    activity: s.activity,
    topic: s.topic,
    userPosition: s.userPosition,
    aiRoleType: s.aiRoleType,
    aiRole: s.aiRole,
    difficulty: s.difficulty,
    complexity: s.complexity,
    confrontationLevel: s.confrontationLevel,
    conversationStyle: s.conversationStyle,
    interruptibility: s.interruptibility,
    adaptiveDifficulty: s.adaptiveDifficulty,
  });
}
