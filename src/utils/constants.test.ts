import { describe, it, expect } from 'vitest';
import * as constants from './constants';

describe('Constants', () => {
  it('should have valid room configuration', () => {
    expect(constants.MAX_PLAYERS).toBe(20);
    expect(constants.ROOM_CODE_LENGTH).toBe(4);
  });

  it('should have valid combo configuration', () => {
    expect(constants.COMBO_TIME_WINDOW).toBe(3000);
    expect(constants.MIN_COMBO_CLICKS).toBe(2);
  });

  it('should have valid firework duration range', () => {
    expect(constants.MIN_FIREWORK_DURATION).toBeLessThanOrEqual(
      constants.DEFAULT_FIREWORK_DURATION
    );
    expect(constants.DEFAULT_FIREWORK_DURATION).toBeLessThanOrEqual(
      constants.MAX_FIREWORK_DURATION
    );
  });

  it('should have valid nickname length constraints', () => {
    expect(constants.MIN_NICKNAME_LENGTH).toBe(1);
    expect(constants.MAX_NICKNAME_LENGTH).toBe(8);
    expect(constants.MIN_NICKNAME_LENGTH).toBeLessThan(
      constants.MAX_NICKNAME_LENGTH
    );
  });
});
