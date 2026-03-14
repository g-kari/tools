import { describe, it, expect } from "vitest";
import {
  formatTime,
  calculateProgress,
  getPhaseLabel,
  getNextPhase,
} from "../../app/routes/pomodoro";

describe("Pomodoro Timer", () => {
  describe("formatTime", () => {
    it("1500秒を '25:00' にフォーマットする", () => {
      expect(formatTime(1500)).toBe("25:00");
    });

    it("0秒を '00:00' にフォーマットする", () => {
      expect(formatTime(0)).toBe("00:00");
    });

    it("65秒を '01:05' にフォーマットする", () => {
      expect(formatTime(65)).toBe("01:05");
    });

    it("300秒を '05:00' にフォーマットする", () => {
      expect(formatTime(300)).toBe("05:00");
    });

    it("59秒を '00:59' にフォーマットする", () => {
      expect(formatTime(59)).toBe("00:59");
    });

    it("3661秒を '61:01' にフォーマットする", () => {
      expect(formatTime(3661)).toBe("61:01");
    });

    it("一桁の秒数を2桁にパディングする", () => {
      expect(formatTime(9)).toBe("00:09");
    });
  });

  describe("calculateProgress", () => {
    it("経過0秒は進捗0を返す", () => {
      expect(calculateProgress(0, 1500)).toBe(0);
    });

    it("経過と合計が等しい場合は100を返す", () => {
      expect(calculateProgress(1500, 1500)).toBe(100);
    });

    it("半分経過した場合は50を返す", () => {
      expect(calculateProgress(750, 1500)).toBe(50);
    });

    it("合計が0の場合は0を返す", () => {
      expect(calculateProgress(0, 0)).toBe(0);
    });

    it("経過が合計を超えた場合は100にクランプする", () => {
      expect(calculateProgress(2000, 1500)).toBe(100);
    });

    it("負の経過時間は0にクランプする", () => {
      expect(calculateProgress(-100, 1500)).toBe(0);
    });

    it("25%の進捗を正しく計算する", () => {
      expect(calculateProgress(375, 1500)).toBe(25);
    });
  });

  describe("getPhaseLabel", () => {
    it("'work' に対して '作業' を返す", () => {
      expect(getPhaseLabel("work")).toBe("作業");
    });

    it("'shortBreak' に対して '短い休憩' を返す", () => {
      expect(getPhaseLabel("shortBreak")).toBe("短い休憩");
    });

    it("'longBreak' に対して '長い休憩' を返す", () => {
      expect(getPhaseLabel("longBreak")).toBe("長い休憩");
    });
  });

  describe("getNextPhase", () => {
    it("work フェーズ後（1セッション）は shortBreak を返す", () => {
      expect(getNextPhase("work", 1)).toBe("shortBreak");
    });

    it("work フェーズ後（2セッション）は shortBreak を返す", () => {
      expect(getNextPhase("work", 2)).toBe("shortBreak");
    });

    it("work フェーズ後（3セッション）は shortBreak を返す", () => {
      expect(getNextPhase("work", 3)).toBe("shortBreak");
    });

    it("work フェーズ後（4セッション、4の倍数）は longBreak を返す", () => {
      expect(getNextPhase("work", 4)).toBe("longBreak");
    });

    it("work フェーズ後（8セッション、4の倍数）は longBreak を返す", () => {
      expect(getNextPhase("work", 8)).toBe("longBreak");
    });

    it("work フェーズ後（5セッション）は shortBreak を返す", () => {
      expect(getNextPhase("work", 5)).toBe("shortBreak");
    });

    it("shortBreak フェーズ後は work を返す", () => {
      expect(getNextPhase("shortBreak", 1)).toBe("work");
    });

    it("longBreak フェーズ後は work を返す", () => {
      expect(getNextPhase("longBreak", 4)).toBe("work");
    });
  });
});
