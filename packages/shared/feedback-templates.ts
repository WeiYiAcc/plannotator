/**
 * Shared feedback templates for all agent integrations.
 *
 * The plan deny template was tuned in #224 / commit 3dca977 to use strong
 * directive framing — Claude was ignoring softer phrasing.
 */

export const planDenyFeedback = (
  feedback: string,
  toolName: string = "ExitPlanMode",
): string =>
  `YOUR PLAN WAS NOT APPROVED.\n\nYou MUST revise the plan to address ALL of the feedback below before calling ${toolName} again.\n\nRules:\n- Use the Edit tool to make targeted changes to the plan — do not resubmit the same plan unchanged.\n- Do NOT change the plan title (first # heading) unless the user explicitly asks you to.\n\n${feedback || "Plan changes requested"}`;
