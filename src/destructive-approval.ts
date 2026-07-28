import type { Scope } from "./repositories.js";

export interface DestructiveApproval {
  requiredConfirmation: string;
  approved: boolean;
  refusal: string;
}

export const scopedConfirmation = (scope: Scope): string =>
  `${scope.tenantId}/${scope.workspaceId}/${scope.userId}`;

export const timedScopedConfirmation = (scope: Scope, asOf: Date): string =>
  `${scopedConfirmation(scope)}/${asOf.toISOString()}`;

export const restoreOverwriteConfirmation = (scope: Scope, restorePath: string): string =>
  `${scopedConfirmation(scope)}/overwrite/${restorePath}`;

export const requireDestructiveConfirmation = (
  provided: string | undefined,
  requiredConfirmation: string,
  operation: string
): DestructiveApproval => ({
  requiredConfirmation,
  approved: provided === requiredConfirmation,
  refusal: `Refusing ${operation}. Re-run --confirm ${requiredConfirmation}`
});
