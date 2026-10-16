// Internal persisted contract, independent of public DTOs. JSON values only.
type Id = string;
type EpochMs = number;
type Sha256 = string;
type Choice = 0 | 1 | 2 | 3;
type RecoveryStatus =
  | 'pending'
  | 'approved'
  | 'denied'
  | 'expired'
  | 'cancelled'
  | 'superseded'
  | 'closed';
type PauseReason =
  | 'manual'
  | 'host_disconnected'
  | 'players_disconnected'
  | 'api_restarted'
  | 'storage_unavailable';

export interface RecoveryProfileV1 {
  version: 1;
  hostGraceSeconds: number;
  hostRetentionMinutes: number;
  allowLocalSelectionWhilePaused: boolean;
  hideQuestionWhilePaused: boolean;
  resumeCountdownSeconds: number;
  skipAbsentSelector: boolean;
  absentSelectorSeconds: number;
  autoReplaceCaptain: boolean;
  captainGraceSeconds: number;
  pauseWhenAllDisconnected: boolean;
  allDisconnectedGraceSeconds: number;
  deviceRecoveryMinutes: number;
  allowConnectedDeviceRecovery: boolean;
  allowDeviceRecoveryDuringQuestion: boolean;
}

export interface MemberSnapshotV1 {
  id: Id;
  capabilityHash: Sha256;
  nickname: string;
  groupId: 'team-1' | 'team-2' | null;
  seenAtMs: EpochMs;
  lostAtMs: EpochMs | null;
}

export interface EntitySnapshotV1 {
  id: Id;
  label: string;
  memberIds: Id[];
  score: number;
  captainId: Id | null;
  captainRevision: number;
  temporaryCaptain: boolean;
}

export interface QuestionSnapshotV1 {
  id: Id;
  category: string;
  prompt: string;
  choices: [string, string, string, string];
  correctIndex: Choice;
  seconds: number;
  points: number;
  phaseIndex: number;
  phaseTitle: string;
}

export interface DeviceRecoverySnapshotV1 {
  id: Id;
  applicantHash: Sha256;
  memberId: Id;
  nickname: string;
  verificationCode: string;
  status: RecoveryStatus;
  createdAtMs: EpochMs;
  expiresAtMs: EpochMs;
  terminalAtMs: EpochMs | null;
}

export interface CategoryGameSnapshotV1 {
  stage: 'board' | 'question' | 'result' | 'finished';
  roundId: number;
  entities: EntitySnapshotV1[];
  questions: QuestionSnapshotV1[];
  selectorIndex: number;
  usedQuestionIds: Id[];
  currentQuestionId: Id | null;
  answers: { entityId: Id; choice: Choice }[];
  proposals: { memberId: Id; choice: Choice }[];
  // Keep the normal rotation cursor even if a temporary captain is acting.
  captainSeats: { entityId: Id; seatIndex: number }[];
  selectionRevision: number;
  controlRevision: number;
  lastControl: {
    action: 'pause' | 'resume';
    revision: number;
    roundId: number;
  } | null;
  // Absolute millisecond values at the checkpoint; never resumed blindly.
  clock: {
    deadlineAtMs: EpochMs | null;
    advanceAtMs: EpochMs | null;
    pausedAtMs: EpochMs | null;
    resumeAtMs: EpochMs | null;
    pauseReason: PauseReason | null;
    selectionNotBeforeMs: EpochMs;
    selectionWaitAtMs: EpochMs | null;
    selectionSkipAtMs: EpochMs | null;
  };
}

export interface ConcursosRoomSnapshotV1 {
  version: 1;
  // Logical times; separate from DB audit created_at/updated_at timestamps.
  createdAtMs: EpochMs;
  checkpointAtMs: EpochMs;
  hostSeenAtMs: EpochMs;
  hostLostAtMs: EpochMs | null;
  config: {
    mode: 'individual' | 'teams';
    pacing: 'automatic' | 'directed';
    resultSeconds: number;
    recovery: RecoveryProfileV1;
  };
  // Array order preserves member insertion and team rotation semantics.
  members: MemberSnapshotV1[];
  revokedCapabilityHashes: Sha256[];
  recoveries: DeviceRecoverySnapshotV1[];
  game: CategoryGameSnapshotV1 | null;
  // Bounded by repository policy. No raw capabilities or full reply snapshots.
  appliedOperations: {
    actorHash: Sha256;
    operationId: string;
    commandHash: Sha256;
    appliedRevision: string; // Decimal representation of SQL BIGINT.
  }[];
}
