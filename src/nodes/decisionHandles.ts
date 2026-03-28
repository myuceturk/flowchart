export const DECISION_SOURCE_HANDLES = {
  yes: 'decision-yes',
  no: 'decision-no',
} as const;

export const DECISION_TARGET_HANDLES = {
  top: 'decision-top',
  left: 'decision-left',
} as const;

export type DecisionSourceHandleId =
  (typeof DECISION_SOURCE_HANDLES)[keyof typeof DECISION_SOURCE_HANDLES];

export function isDecisionSourceHandle(
  handleId: string | null | undefined,
): handleId is DecisionSourceHandleId {
  return (
    handleId === DECISION_SOURCE_HANDLES.yes ||
    handleId === DECISION_SOURCE_HANDLES.no
  );
}

export function getDecisionLabelForHandle(handleId: DecisionSourceHandleId) {
  return handleId === DECISION_SOURCE_HANDLES.yes ? 'YES' : 'NO';
}
