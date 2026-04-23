export const horizontalDragRadians = Math.PI * 1.2;
export const verticalDragRadians = Math.PI * 0.7;
export const autoRotationSpeed = 0.0035;
export const rotationEase = 0.09;
export const thetaMin = -0.45;
export const thetaMax = 0.75;
export const inertiaVelocityBlend = 0.35;
export const phiInertiaFriction = 0.93;
export const thetaInertiaFriction = 0.9;
export const minInertiaVelocity = 0.000_08;
export const maxPhiReleaseVelocity = 0.09;
export const maxThetaReleaseVelocity = 0.05;
export const idleBlendVelocity = 0.012;
export const nominalFrameTime = 16.67;
export const maxFrameScale = 2;
export const releaseVelocityIdleWindow = 80;

export interface InertiaMotionState {
  readonly angularVelocityPhi: number;
  readonly angularVelocityTheta: number;
  readonly phi: number;
  readonly theta: number;
}

export interface ReleaseAngularVelocityState {
  readonly angularVelocityPhi: number;
  readonly angularVelocityTheta: number;
}

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const snapVelocity = (velocity: number) =>
  Math.abs(velocity) < minInertiaVelocity ? 0 : velocity;

const easeInOut = (value: number) => value * value * (3 - 2 * value);

export const getFrameScale = ({
  lastFrameTime,
  now,
}: {
  readonly lastFrameTime: number | null;
  readonly now: number;
}) => {
  if (lastFrameTime === null) {
    return 1;
  }

  return clamp((now - lastFrameTime) / nominalFrameTime, 0, maxFrameScale);
};

export const applyInertiaMotion = ({
  angularVelocityPhi,
  angularVelocityTheta,
  frameScale,
  isDragging,
  shouldPause,
  phi,
  theta,
}: {
  readonly angularVelocityPhi: number;
  readonly angularVelocityTheta: number;
  readonly frameScale: number;
  readonly isDragging: boolean;
  readonly phi: number;
  readonly shouldPause: boolean;
  readonly theta: number;
}): InertiaMotionState => {
  if (isDragging) {
    return {
      angularVelocityPhi,
      angularVelocityTheta,
      phi,
      theta,
    };
  }

  if (shouldPause) {
    return {
      angularVelocityPhi: 0,
      angularVelocityTheta: 0,
      phi,
      theta,
    };
  }

  const nextPhi = phi + angularVelocityPhi * frameScale;
  const unclampedTheta = theta + angularVelocityTheta * frameScale;
  const nextTheta = clamp(unclampedTheta, thetaMin, thetaMax);
  const nextAngularVelocityPhi = snapVelocity(
    angularVelocityPhi * phiInertiaFriction ** frameScale
  );
  const nextAngularVelocityTheta =
    nextTheta === unclampedTheta
      ? snapVelocity(angularVelocityTheta * thetaInertiaFriction ** frameScale)
      : 0;

  return {
    angularVelocityPhi: nextAngularVelocityPhi,
    angularVelocityTheta: nextAngularVelocityTheta,
    phi: nextPhi,
    theta: nextTheta,
  };
};

export const getReleaseAngularVelocity = ({
  angularVelocityPhi,
  angularVelocityTheta,
  idleTime,
  isReducedMotion,
  isTagOpen,
}: {
  readonly angularVelocityPhi: number;
  readonly angularVelocityTheta: number;
  readonly idleTime: number;
  readonly isReducedMotion: boolean;
  readonly isTagOpen: boolean;
}): ReleaseAngularVelocityState => {
  if (isReducedMotion || isTagOpen || idleTime >= releaseVelocityIdleWindow) {
    return {
      angularVelocityPhi: 0,
      angularVelocityTheta: 0,
    };
  }

  const idleDecay = clamp(1 - idleTime / releaseVelocityIdleWindow, 0, 1);

  return {
    angularVelocityPhi: snapVelocity(angularVelocityPhi * idleDecay),
    angularVelocityTheta: snapVelocity(angularVelocityTheta * idleDecay),
  };
};

export const getTargetRotationSpeed = ({
  angularVelocityPhi,
  isDragging,
  isReducedMotion,
  isTagOpen,
}: {
  readonly angularVelocityPhi: number;
  readonly isDragging: boolean;
  readonly isReducedMotion: boolean;
  readonly isTagOpen: boolean;
}) => {
  if (isReducedMotion || isDragging || isTagOpen) {
    return 0;
  }

  const idleBlend = clamp(
    1 - Math.abs(angularVelocityPhi) / idleBlendVelocity,
    0,
    1
  );
  const easedIdleBlend = easeInOut(idleBlend);

  return autoRotationSpeed * easedIdleBlend;
};

export const getMotionMode = ({
  angularVelocityPhi,
  angularVelocityTheta,
  isDragging,
  isReducedMotion,
  isTagOpen,
  rotationSpeed,
}: {
  readonly angularVelocityPhi: number;
  readonly angularVelocityTheta: number;
  readonly isDragging: boolean;
  readonly isReducedMotion: boolean;
  readonly isTagOpen: boolean;
  readonly rotationSpeed: number;
}) => {
  if (isDragging) {
    return "dragging";
  }

  if (isReducedMotion || isTagOpen) {
    return "paused";
  }

  if (Math.abs(angularVelocityPhi) > 0 || Math.abs(angularVelocityTheta) > 0) {
    return "inertia";
  }

  if (Math.abs(rotationSpeed) > 0) {
    return "autoplay";
  }

  return "paused";
};
