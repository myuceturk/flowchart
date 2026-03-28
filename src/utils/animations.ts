export const animationDurations = {
  fast: 120,
  normal: 180,
  slow: 240,
} as const;

export const animationEasing = 'cubic-bezier(0.4, 0, 0.2, 1)';

export function createTransition(
  properties: string[],
  duration: keyof typeof animationDurations = 'normal',
  easing = animationEasing,
) {
  return properties
    .map((property) => `${property} ${animationDurations[duration]}ms ${easing}`)
    .join(', ');
}

export const animationCssVariables = {
  '--motion-duration-fast': `${animationDurations.fast}ms`,
  '--motion-duration-normal': `${animationDurations.normal}ms`,
  '--motion-duration-slow': `${animationDurations.slow}ms`,
  '--motion-easing-standard': animationEasing,
} as const;
