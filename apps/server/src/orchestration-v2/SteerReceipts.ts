import type { MessageId, OrchestrationV2TurnItem } from "@t3tools/contracts";

type UserTurnItem = Extract<OrchestrationV2TurnItem, { readonly type: "user_message" }>;

/** A steer the provider holds but the model has not read yet. */
export function findUnreadSteer(
  turnItems: ReadonlyArray<OrchestrationV2TurnItem>,
  messageId: MessageId,
): UserTurnItem | undefined {
  return turnItems.find(
    (item): item is UserTurnItem =>
      item.type === "user_message" &&
      item.messageId === messageId &&
      item.status === "pending" &&
      (item.inputIntent === "steer" || item.inputIntent === "promoted_queued_to_steer"),
  );
}
