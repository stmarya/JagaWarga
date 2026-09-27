export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'learner';
export type WorkspaceKind = 'family' | 'class' | 'organization';
export type Workspace = {
  id: string;
  kind: WorkspaceKind;
  name: string;
  members: Array<{ userId: string; role: WorkspaceRole }>;
  policy: { leaderboard: 'off' | 'private'; shareIndividualScores: false };
};