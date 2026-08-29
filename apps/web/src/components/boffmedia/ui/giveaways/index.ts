// v3 «Señal» — Sorteos (giveaways) component library.
export { SrtStatusChip, SrtOrganizer, SrtSourceTag, SrtPrizeTag, SrtTicketMeter } from "./SrtAtoms"
export { SrtCard, SrtFeatured } from "./SrtCard"
export { SrtPrizeShowcase, SrtReqList, SrtSteps, SrtRules } from "./SrtDetail"
export { SrtDrawReel, SrtWinnerCard } from "./SrtDraw"
export * from "./giveaways-util"

// Page components (Writer B)
export { SrtNumberStepper, type SrtNumberStepperProps } from "./SrtNumberStepper"
export { SrtEntrantRow, type SrtEntrantRowProps } from "./SrtEntrantRow"
export { SrtWinnerList, type SrtWinnerListProps } from "./SrtWinnerList"
export { SrtSeedTag, type SrtSeedTagProps } from "./SrtSeedTag"
export { SrtConfetti, type SrtConfettiProps } from "./SrtConfetti"
export * from "./draw-util"
export { poolHash, historyToCsv, buildShareText } from "./draw-util"

// Shared draw contract & engine
export { type SrtDrawMode, type SrtDrawParticipant, type SrtDrawHandle, type SrtDrawStageProps, type SrtDrawPhase, type SrtWheelSegment, SRT_DRAW_MODES, WHEEL_LABEL_LIMIT, buildWheelSegments, normalizeDrawName, poolForStep } from "./draw-stage"
export { SrtDrawFrame, type SrtDrawFrameProps } from "./SrtDrawFrame"
export { useSrtDrawAudio, usePrefersReducedMotion, useSrtDrawRun, useSrtDrawSequence } from "./draw-engine"
export { SrtDrawHead, SrtDrawControls, type SrtDrawHeadProps, type SrtDrawControlsProps } from "./SrtDrawChrome"

// Reel components
export { SrtReelStage, type SrtReelStageHandle } from "./SrtReelStage"
export { SrtReelCard, type SrtReelCardProps } from "./SrtReelCard"
export { useSrtReel, type UseSrtReelOptions, type UseSrtReelResult, type SrtReelPhase } from "./useSrtReel"

// Wheel components
export { SrtWheelStage } from "./SrtWheelStage"
export { SrtWheelSvg, SRT_WHEEL_SIZES, type SrtWheelSvgProps } from "./SrtWheelSvg"
export { useSrtWheel } from "./useSrtWheel"

// Spotlight components
export { SrtSpotlightStage, SrtSpotlightCard, SRT_SPOTLIGHT_GRID, SPOTLIGHT_VISIBLE_CAP } from "./SrtSpotlightStage"
export { useSrtSpotlight } from "./useSrtSpotlight"
export { mergeParticipants } from "./draw-stage"
export { SrtWheelPreview, SrtReelPreview, SrtSpotlightPreview, type SrtDrawPreviewProps } from "./SrtPreviews"
