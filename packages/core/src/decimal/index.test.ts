import { describe, expect, it } from "vitest";
import Big from "big.js";
import {
  dec,
  decAdd,
  decSub,
  decMul,
  decDiv,
  decNeg,
  decCmp,
  decGte,
  decIsZero,
  decIsPositive,
  decIsNegative,
  decRoundToStep,
  decDecimalPlaces,
  decToString,
  decToFixed,
  decToNumber,
  type RoundMode,
} from "./index.js";

// big.js is the correctness oracle. Match the engine's division contract:
// 20 dp, half-up ties-away-from-zero (decimal/index.ts DIV_DP + divHalfUp).
Big.DP = 20;
Big.RM = Big.roundHalfUp; // 1 = ties away from zero
Big.PE = 1_000_000; // never switch to exponential across the fuzzed range
Big.NE = -1_000_000;

const RM_TO_BIG: Record<RoundMode, 0 | 1 | 3> = {
  down: Big.roundDown, // 0: toward zero
  up: Big.roundUp, // 3: away from zero
  nearest: Big.roundHalfUp, // 1: ties away from zero
};

function withDP<T>(dp: number, fn: () => T): T {
  const prev = Big.DP;
  Big.DP = dp;
  try {
    return fn();
  } finally {
    Big.DP = prev;
  }
}

// Deterministic PRNG (mulberry32) so any failure reproduces from a fixed seed.
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A random decimal string accepted by both `dec()` and `Big()`.
function randDecimal(r: () => number): string {
  const sign = r() < 0.5 ? "-" : "";
  const intLen = Math.floor(r() * 13); // 0..12
  const fracLen = Math.floor(r() * 13); // 0..12
  const digits = (n: number) => {
    let s = "";
    for (let i = 0; i < n; i++) s += Math.floor(r() * 10);
    return s;
  };
  const int = intLen === 0 ? "0" : digits(intLen); // Big rejects a bare ".5"
  const frac = fracLen > 0 ? "." + digits(fracLen) : "";
  return sign + int + frac;
}

const STEPS = ["0.01", "0.1", "0.25", "0.5", "1", "5", "10", "0.001", "0.0005"];
const ITERATIONS = 3000;

describe("scaled-bigint decimal engine vs big.js oracle", () => {
  const r = rng(0x9e3779b9);

  it("add / sub / mul / div match big.js", () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const as = randDecimal(r);
      const bs = randDecimal(r);
      const A = dec(as);
      const B = dec(bs);
      const bA = new Big(as);
      const bB = new Big(bs);

      expect(decToString(decAdd(A, B)), `add ${as}+${bs}`).toBe(bA.plus(bB).toString());
      expect(decToString(decSub(A, B)), `sub ${as}-${bs}`).toBe(bA.minus(bB).toString());
      expect(decToString(decMul(A, B)), `mul ${as}*${bs}`).toBe(bA.times(bB).toString());

      if (!decIsZero(B)) {
        const got = decToString(decDiv(A, B));
        const want = withDP(20, () => bA.div(bB)).toString();
        expect(got, `div ${as}/${bs}`).toBe(want);
      }
    }
  });

  it("neg / cmp / gte / sign predicates match big.js", () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const as = randDecimal(r);
      const bs = randDecimal(r);
      const A = dec(as);
      const B = dec(bs);
      const bA = new Big(as);
      const bB = new Big(bs);

      expect(decToString(decNeg(A)), `neg ${as}`).toBe(bA.times(-1).toString());
      expect(decCmp(A, B), `cmp ${as}?${bs}`).toBe(bA.cmp(bB));
      expect(decGte(A, B), `gte ${as}>=${bs}`).toBe(bA.gte(bB));
      expect(decIsZero(A), `isZero ${as}`).toBe(bA.eq(0));
      expect(decIsPositive(A), `isPos ${as}`).toBe(bA.gt(0));
      expect(decIsNegative(A), `isNeg ${as}`).toBe(bA.lt(0));
    }
  });

  it("toFixed matches big.js across dp", () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const as = randDecimal(r);
      const dp = Math.floor(r() * 10); // 0..9
      const got = decToFixed(dec(as), dp);
      // The engine never emits negative zero; normalize the oracle to match.
      const want = new Big(as).toFixed(dp).replace(/^-(0(\.0+)?)$/, "$1");
      expect(got, `toFixed ${as} @${dp}`).toBe(want);
    }
  });

  it("roundToStep matches big.js for every mode and step", () => {
    const modes: RoundMode[] = ["down", "up", "nearest"];
    for (let i = 0; i < ITERATIONS; i++) {
      const as = randDecimal(r);
      const step = STEPS[Math.floor(r() * STEPS.length)]!;
      const mode = modes[Math.floor(r() * modes.length)]!;
      const got = decToString(decRoundToStep(dec(as), dec(step), mode));
      const want = withDP(50, () => {
        const steps = new Big(as).div(new Big(step)).round(0, RM_TO_BIG[mode]);
        return steps.times(new Big(step));
      }).toString();
      expect(got, `roundToStep ${as} step=${step} ${mode}`).toBe(want);
    }
  });

  it("decimalPlaces matches big.js exact scale", () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const as = randDecimal(r);
      // Big strips trailing zeros just like the engine's normalized scale.
      const want = Math.max(0, new Big(as).c.length - new Big(as).e - 1);
      expect(decDecimalPlaces(dec(as)), `dp ${as}`).toBe(want);
    }
  });
});

describe("parsing edge cases", () => {
  it("accepts the decimal grammar the engine documents", () => {
    expect(decToString(dec("1."))).toBe("1");
    expect(decToString(dec(".5"))).toBe("0.5");
    expect(decToString(dec("+1.50"))).toBe("1.5");
    expect(decToString(dec("-0"))).toBe("0");
    expect(decToString(dec("1e3"))).toBe("1000");
    expect(decToString(dec("1.5e-2"))).toBe("0.015");
    expect(decToString(dec("  2.5  "))).toBe("2.5");
    expect(decToString(dec(42))).toBe("42");
  });

  it("rejects malformed input", () => {
    for (const bad of ["", "abc", "1.2.3", "--1", "1e", ".", "0x10", "1,000"]) {
      expect(() => dec(bad), bad).toThrow();
    }
  });

  it("dec() is idempotent on a Dec", () => {
    const d = dec("3.14");
    expect(dec(d)).toBe(d);
  });
});

describe("formatting invariants", () => {
  it("decToString never uses exponential notation", () => {
    expect(decToString(dec("1e-15"))).toBe("0.000000000000001");
    expect(decToString(dec("1e15"))).toBe("1000000000000000");
  });

  it("decToNumber round-trips small decimals", () => {
    expect(decToNumber(dec("0.1"))).toBe(0.1);
    expect(decToNumber(dec("-123.456"))).toBe(-123.456);
  });
});
