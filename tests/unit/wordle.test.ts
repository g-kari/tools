import { describe, it, expect } from "vite-plus/test";
import {
  evaluateGuess,
  getKeyboardStates,
  isValidGuess,
  pickRandomWord,
  VALID_WORDS,
} from "../../app/routes/wordle";

describe("evaluateGuess", () => {
  it("全文字が正しい位置にある場合はすべてcorrect", () => {
    const result = evaluateGuess("CRANE", "CRANE");
    expect(result).toEqual(["correct", "correct", "correct", "correct", "correct"]);
  });

  it("正解と全く異なる単語はすべてabsent", () => {
    const result = evaluateGuess("ZZZZZ", "CRANE");
    expect(result).toEqual(["absent", "absent", "absent", "absent", "absent"]);
  });

  it("正しい文字だが位置が違う場合はpresent", () => {
    // NACRE: N(0) A(1) C(2) R(3) E(4)
    // CRANE: C(0) R(1) A(2) N(3) E(4)
    const result = evaluateGuess("NACRE", "CRANE");
    expect(result[0]).toBe("present"); // N は CRANE の pos3 に存在
    expect(result[1]).toBe("present"); // A は CRANE の pos2 に存在
    expect(result[2]).toBe("present"); // C は CRANE の pos0 に存在
    expect(result[3]).toBe("present"); // R は CRANE の pos1 に存在
    expect(result[4]).toBe("correct"); // E は pos4 で一致
  });

  it("重複文字の処理: 単語に1つしかない文字を2つ推測した場合", () => {
    // AABBB vs ABCDE: A-B-C-D-E
    // 第1パス(correct): A[0]=A→correct, A[1]≠B, B[2]≠C, B[3]≠D, B[4]≠E
    // 第2パス(present): A[1]→残targetにAなし→absent, B[2]→残targetにBあり(pos1)→present, B[3]→Bもう消費→absent, B[4]→absent
    const result = evaluateGuess("AABBB", "ABCDE");
    expect(result[0]).toBe("correct"); // A は pos0 で一致
    expect(result[1]).toBe("absent"); // A は既に correct で消費済み
    expect(result[2]).toBe("present"); // B は ABCDE の pos1 に存在（位置違い）
    expect(result[3]).toBe("absent"); // B は既に present で消費済み
    expect(result[4]).toBe("absent");
  });

  it("重複文字: 正解に2つある文字を2つ推測した場合", () => {
    // LLAMA の L は2つ: positions 0, 1
    // guess LLBBB
    const result = evaluateGuess("LLBBB", "LLAMA");
    expect(result[0]).toBe("correct"); // L at 0 is correct
    expect(result[1]).toBe("correct"); // L at 1 is correct
    expect(result[2]).toBe("absent"); // B not in LLAMA
    expect(result[3]).toBe("absent");
    expect(result[4]).toBe("absent");
  });

  it("位置が違う文字は present になる", () => {
    // BREAK で正解は BAKER: B-A-K-E-R
    // B: guess[0]=B, target[0]=B → correct
    // R: guess[1]=R, target[4]=R → present
    // E: guess[2]=E, target[3]=E → present
    // A: guess[3]=A, target[1]=A → present
    // K: guess[4]=K, target[2]=K → present
    const result = evaluateGuess("BREAK", "BAKER");
    expect(result[0]).toBe("correct"); // B
    expect(result[1]).toBe("present"); // R in BAKER at pos 4
    expect(result[2]).toBe("present"); // E in BAKER at pos 3
    expect(result[3]).toBe("present"); // A in BAKER at pos 1
    expect(result[4]).toBe("present"); // K in BAKER at pos 2
  });

  it("5文字の結果配列を返す", () => {
    const result = evaluateGuess("HELLO", "WORLD");
    expect(result).toHaveLength(5);
  });
});

describe("isValidGuess", () => {
  it("5文字の英大文字はtrue", () => {
    expect(isValidGuess("CRANE")).toBe(true);
    expect(isValidGuess("AUDIO")).toBe(true);
  });

  it("4文字はfalse", () => {
    expect(isValidGuess("CRAN")).toBe(false);
  });

  it("6文字はfalse", () => {
    expect(isValidGuess("CRANES")).toBe(false);
  });

  it("空文字はfalse", () => {
    expect(isValidGuess("")).toBe(false);
  });

  it("数字を含む場合はfalse", () => {
    expect(isValidGuess("CR4NE")).toBe(false);
  });

  it("小文字を含む場合はfalse", () => {
    expect(isValidGuess("crane")).toBe(false);
  });

  it("記号を含む場合はfalse", () => {
    expect(isValidGuess("CR@NE")).toBe(false);
  });
});

describe("getKeyboardStates", () => {
  it("推測なしの場合はMap空", () => {
    const states = getKeyboardStates([], []);
    expect(states.size).toBe(0);
  });

  it("correct状態はpresentよりも優先される", () => {
    // 1回目: A が present
    // 2回目: A が correct
    const guesses = ["AXXXX", "YAAAA"];
    const results = [
      ["present", "absent", "absent", "absent", "absent"] as const,
      ["absent", "correct", "absent", "absent", "absent"] as const,
    ];
    const states = getKeyboardStates(
      guesses,
      results.map((r) => [...r]),
    );
    expect(states.get("A")).toBe("correct");
  });

  it("present状態はabsentよりも優先される", () => {
    const guesses = ["AXXXX", "BAAAA"];
    const results = [
      ["absent", "absent", "absent", "absent", "absent"] as const,
      ["absent", "present", "absent", "absent", "absent"] as const,
    ];
    const states = getKeyboardStates(
      guesses,
      results.map((r) => [...r]),
    );
    expect(states.get("A")).toBe("present");
  });

  it("複数の文字の状態が正しく計算される", () => {
    const guesses = ["CRANE"];
    const results = [["correct", "present", "absent", "absent", "correct"] as const];
    const states = getKeyboardStates(
      guesses,
      results.map((r) => [...r]),
    );
    expect(states.get("C")).toBe("correct");
    expect(states.get("R")).toBe("present");
    expect(states.get("A")).toBe("absent");
    expect(states.get("N")).toBe("absent");
    expect(states.get("E")).toBe("correct");
  });
});

describe("pickRandomWord", () => {
  it("VALID_WORDSから単語を返す", () => {
    const word = pickRandomWord();
    expect(VALID_WORDS).toContain(word);
  });

  it("5文字の単語を返す", () => {
    for (let i = 0; i < 10; i++) {
      const word = pickRandomWord();
      expect(word).toHaveLength(5);
    }
  });

  it("英大文字のみからなる単語を返す", () => {
    for (let i = 0; i < 10; i++) {
      const word = pickRandomWord();
      expect(word).toMatch(/^[A-Z]{5}$/);
    }
  });
});

describe("VALID_WORDS", () => {
  it("すべての単語が5文字", () => {
    for (const word of VALID_WORDS) {
      expect(word).toHaveLength(5);
    }
  });

  it("すべての単語が英大文字のみ", () => {
    for (const word of VALID_WORDS) {
      expect(word).toMatch(/^[A-Z]+$/);
    }
  });

  it("十分な数の単語が存在する", () => {
    expect(VALID_WORDS.length).toBeGreaterThanOrEqual(50);
  });
});
