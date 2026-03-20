import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";

export const Route = createFileRoute("/wordle")({
  head: () => ({
    meta: [
      { title: "Wordle | Web ツール集" },
      { name: "description", content: "5文字の英単語を6回以内に当てるワードルゲーム。緑・黄・灰色のヒントを手がかりに推理しよう。" },
      { property: "og:title", content: "Wordle | Web ツール集" },
      { property: "og:description", content: "5文字の英単語を6回以内に当てるワードルゲーム。緑・黄・灰色のヒントを手がかりに推理しよう。" },
      { property: "og:url", content: `${SITE_BASE_URL}/wordle` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "Wordle | Web ツール集" },
      { name: "twitter:description", content: "5文字の英単語を6回以内に当てるワードルゲーム。緑・黄・灰色のヒントを手がかりに推理しよう。" },
    ],
  }),
  component: WordleGame,
});

/** 最大推測回数 */
const MAX_GUESSES = 6;

/** 単語の文字数 */
const WORD_LENGTH = 5;

/** 各マスの状態 */
export type LetterState = "correct" | "present" | "absent" | "empty" | "input";

/** ゲームの状態 */
type GameStatus = "playing" | "won" | "lost";

/** 有効な5文字英単語リスト */
export const VALID_WORDS: string[] = [
  "ABOUT", "ABOVE", "ABUSE", "ACTOR", "ACUTE", "ADMIT", "ADOPT", "ADULT",
  "AFTER", "AGAIN", "AGENT", "AGREE", "AHEAD", "ALARM", "ALBUM", "ALERT",
  "ALIKE", "ALIGN", "ALIVE", "ALLEY", "ALLOW", "ALONE", "ALONG", "ANGEL",
  "ANGLE", "ANGRY", "ANIME", "ANKLE", "ANNEX", "ANNOY", "APPLE", "APPLY",
  "ARENA", "ARGUE", "ARISE", "ARMOR", "ARRAY", "ARROW", "AUDIO", "AUDIT",
  "AVOID", "AWARD", "AWARE", "AWFUL", "BADGE", "BAKER", "BASIC", "BATCH",
  "BEACH", "BEARD", "BEAST", "BEGIN", "BEING", "BELOW", "BENCH", "BERRY",
  "BIRTH", "BLACK", "BLADE", "BLAME", "BLAND", "BLANK", "BLAST", "BLAZE",
  "BLEED", "BLEND", "BLIND", "BLOCK", "BLOOD", "BLOOM", "BLOWN", "BOARD",
  "BONUS", "BOOST", "BOUND", "BRAIN", "BRAND", "BRAVE", "BREAD", "BREAK",
  "BREED", "BRICK", "BRIEF", "BRING", "BROAD", "BROKE", "BROOK", "BROWN",
  "BRUSH", "BUILD", "BURST", "BUYER", "CABIN", "CANDY", "CARRY", "CATCH",
  "CAUSE", "CHAIN", "CHAIR", "CHALK", "CHAOS", "CHART", "CHASE", "CHEAP",
  "CHECK", "CHESS", "CHEST", "CHIEF", "CHILD", "CHILL", "CHOIR", "CIVIL",
  "CLAIM", "CLASS", "CLEAN", "CLEAR", "CLERK", "CLICK", "CLIFF", "CLIMB",
  "CLING", "CLOCK", "CLONE", "CLOSE", "CLOUD", "COACH", "COAST", "COULD",
  "COUNT", "COURT", "COVER", "CRAFT", "CRANE", "CRASH", "CREAM", "CREEK",
  "CRIME", "CROSS", "CROWD", "CROWN", "CRUEL", "CRUSH", "CURVE", "CYCLE",
  "DAILY", "DANCE", "DATUM", "DEALT", "DEATH", "DECAY", "DEBUT", "DELAY",
  "DELTA", "DENSE", "DEPOT", "DEPTH", "DEVIL", "DIGIT", "DIRTY", "DISCO",
  "DOUBT", "DOUGH", "DRAFT", "DRAIN", "DRAMA", "DRANK", "DRAWN", "DREAM",
  "DRESS", "DRINK", "DRIVE", "DRONE", "DROVE", "DRYER", "EARLY", "EARTH",
  "EIGHT", "ELITE", "EMAIL", "EMOJI", "EMPTY", "ENTER", "ENTRY", "EQUAL",
  "ERROR", "EVENT", "EVERY", "EXACT", "EXCEL", "EXTRA", "FABLE", "FACTO",
  "FAITH", "FALSE", "FANCY", "FATAL", "FAULT", "FEAST", "FIELD", "FIFTH",
  "FIFTY", "FIGHT", "FINAL", "FIRST", "FIXED", "FLAME", "FLASK", "FLEET",
  "FLESH", "FLOAT", "FLOOD", "FLOOR", "FOCUS", "FORCE", "FORGE", "FORTH",
  "FOUND", "FRAME", "FRANK", "FRAUD", "FRESH", "FRONT", "FROST", "FRUIT",
  "FULLY", "GAMES", "GAMER", "GEEKS", "GHOST", "GIANT", "GIVEN", "GLAND",
  "GLASS", "GLOBE", "GLOOM", "GLORY", "GLOSS", "GLOVE", "GRACE", "GRADE",
  "GRAIN", "GRAND", "GRANT", "GRAPE", "GRASP", "GRASS", "GRAVE", "GREAT",
  "GREEN", "GRILL", "GRIND", "GROAN", "GROSS", "GROUP", "GROVE", "GROWN",
  "GUARD", "GUIDE", "GUILD", "GUISE", "GULCH", "GUSTS", "HABIT", "HAPPY",
  "HARSH", "HEART", "HEAVY", "HENCE", "HINGE", "HIPPO", "HOIST", "HOTEL",
  "HOUND", "HOUSE", "HUMAN", "HURRY", "IMAGE", "IMPLY", "INDEX", "INPUT",
  "INTER", "INTRO", "ISSUE", "JAPAN", "JELLY", "JEWEL", "JOINT", "JUDGE",
  "JUICE", "JUICY", "JELLY", "KEEPS", "KNIFE", "KNOCK", "KNOWN", "LABEL",
  "LANCE", "LARGE", "LATER", "LAUGH", "LAYER", "LEARN", "LEASE", "LEAST",
  "LEAVE", "LEDGE", "LEGAL", "LEMON", "LEVEL", "LIGHT", "LIMIT", "LINER",
  "LIONS", "LIVER", "LOCAL", "LODGE", "LOGIC", "LOOSE", "LOWER", "LOYAL",
  "LUCKY", "LUNAR", "MAJOR", "MAKER", "MANOR", "MAPLE", "MARCH", "MATCH",
  "MAYOR", "MEDIA", "MERCY", "MERGE", "METAL", "MIGHT", "MINOR", "MINUS",
  "MODAL", "MODEL", "MONEY", "MONTH", "MORAL", "MOTTO", "MOUNT", "MOUSE",
  "MOUTH", "MOVIE", "MUSIC", "NASAL", "NAVAL", "NERVE", "NEVER", "NIGHT",
  "NOBLE", "NOISE", "NORTH", "NOTED", "NOVEL", "NURSE", "NYLON", "OCCUR",
  "OFFER", "OFTEN", "OLIVE", "ONSET", "OPERA", "OUGHT", "OUTER", "OWNER",
  "OXIDE", "OZONE", "PAINT", "PANEL", "PANIC", "PAPER", "PARTS", "PARTY",
  "PASTA", "PATCH", "PAUSE", "PEACE", "PEARL", "PEDAL", "PENNY", "PERCH",
  "PHASE", "PHONE", "PHOTO", "PIECE", "PILOT", "PIXEL", "PIZZA", "PLACE",
  "PLAIN", "PLANE", "PLANT", "PLATE", "PLAZA", "PLEAD", "PLUMB", "POINT",
  "POLAR", "POWER", "PRESS", "PRICE", "PRIDE", "PRIME", "PRINT", "PRIOR",
  "PRIZE", "PROBE", "PRONE", "PROOF", "PROSE", "PROUD", "PROVE", "PULSE",
  "PUNCH", "PUPIL", "QUEEN", "QUERY", "QUEUE", "QUICK", "QUIET", "QUOTA",
  "QUOTE", "RADAR", "RADIO", "RAISE", "RANGE", "RAPID", "RATIO", "REACH",
  "READY", "REALM", "REBEL", "REIGN", "RELAY", "REMIX", "REPAY", "REPLY",
  "REUSE", "RIDER", "RIDGE", "RIFLE", "RIGHT", "RIGID", "RISKY", "RIVAL",
  "RIVER", "ROBOT", "ROCKY", "ROUGE", "ROUGH", "ROUND", "ROUTE", "ROYAL",
  "RULER", "RURAL", "SADLY", "SAINT", "SALAD", "SAUCE", "SCALE", "SCARY",
  "SCENE", "SCOPE", "SCORE", "SCREW", "SEDAN", "SENSE", "SERVE", "SEVEN",
  "SHAKE", "SHALL", "SHAME", "SHAPE", "SHARE", "SHARK", "SHARP", "SHEEP",
  "SHEER", "SHELF", "SHELL", "SHIFT", "SHINY", "SHIRT", "SHOCK", "SHORE",
  "SHORT", "SHOUT", "SHOVE", "SIGHT", "SIGMA", "SINCE", "SKILL", "SKULL",
  "SLANT", "SLASH", "SLAVE", "SLEEP", "SLICE", "SLIDE", "SLOPE", "SMALL",
  "SMART", "SMELL", "SMILE", "SMOKE", "SOLAR", "SOLID", "SOLVE", "SORRY",
  "SOUND", "SOUTH", "SPACE", "SPARE", "SPARK", "SPEAK", "SPEED", "SPEND",
  "SPICE", "SPINE", "SPOIL", "SQUAD", "STACK", "STAFF", "STAGE", "STAIN",
  "STAMP", "STAND", "STARK", "START", "STEEL", "STEEP", "STEER", "STEMS",
  "STERN", "STICK", "STILL", "STOCK", "STONE", "STOOD", "STORE", "STORM",
  "STORY", "STOUT", "STRAW", "STRIP", "STRUM", "STUCK", "STYLE", "SUGAR",
  "SUITE", "SUNNY", "SUPER", "SURGE", "SWORD", "TABLE", "TASTE", "TEACH",
  "TEARS", "THEME", "THICK", "THINK", "THIRD", "THORN", "THREW", "THROW",
  "TIGHT", "TIMER", "TIRED", "TITLE", "TOAST", "TOKEN", "TOPIC", "TOTAL",
  "TOUCH", "TOUGH", "TOWER", "TOXIC", "TRACK", "TRADE", "TRAIL", "TRAIN",
  "TRAIT", "TRASH", "TREAD", "TREAT", "TREND", "TRIAL", "TRICK", "TRIED",
  "TRULY", "TRUMP", "TRUST", "TRUTH", "TUBER", "TUMOR", "TULIP", "TWEAK",
  "TWICE", "TWIST", "ULTRA", "UNDER", "UNIFY", "UNION", "UNITE", "UNITY",
  "UNTIL", "UPSET", "URBAN", "USAGE", "USUAL", "UTTER", "VALID", "VALUE",
  "VALVE", "VAPOR", "VAULT", "VENOM", "VENUS", "VIRAL", "VIRUS", "VISIT",
  "VITAL", "VIVID", "VOCAL", "VOICE", "VOTER", "WAGON", "WASTE", "WATCH",
  "WATER", "WEARY", "WEAVE", "WEIRD", "WHALE", "WHEAT", "WHEEL", "WHERE",
  "WHILE", "WHITE", "WHOLE", "WHOSE", "WIDER", "WITCH", "WOMAN", "WOMEN",
  "WORLD", "WORRY", "WORSE", "WORST", "WORTH", "WOULD", "WOUND", "WRIST",
  "WRITE", "WRONG", "YACHT", "YIELD", "YOUNG", "YOUTH", "ZEBRA", "ZESTY",
];

/** キーボード配列 */
const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

/**
 * ランダムな正解単語を選択する
 * @returns ランダムに選ばれた5文字の英単語
 */
export function pickRandomWord(): string {
  return VALID_WORDS[Math.floor(Math.random() * VALID_WORDS.length)];
}

/**
 * 推測を評価して各文字の状態を返す
 * 重複文字は正確な位置一致を優先し、残りを位置違い一致とする
 * @param guess - 推測した5文字の単語（大文字）
 * @param target - 正解の5文字の単語（大文字）
 * @returns 各文字の評価結果
 */
export function evaluateGuess(
  guess: string,
  target: string
): Exclude<LetterState, "empty" | "input">[] {
  const result: Exclude<LetterState, "empty" | "input">[] = new Array(
    WORD_LENGTH
  ).fill("absent");
  const targetChars = target.split("");
  const guessChars = guess.split("");

  // 第1パス: 正確な位置一致（correct）を確認
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessChars[i] === targetChars[i]) {
      result[i] = "correct";
      targetChars[i] = "";
    }
  }

  // 第2パス: 位置違い一致（present）を確認
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === "correct") continue;
    const targetIdx = targetChars.indexOf(guessChars[i]);
    if (targetIdx !== -1) {
      result[i] = "present";
      targetChars[targetIdx] = "";
    }
  }

  return result;
}

/**
 * キーボードの各文字の最良の状態を計算する
 * correct > present > absent > unused の優先順位
 * @param guesses - 推測済みの単語リスト
 * @param allResults - 各推測の評価結果リスト
 * @returns 文字ごとの最良状態のMap
 */
export function getKeyboardStates(
  guesses: string[],
  allResults: Exclude<LetterState, "empty" | "input">[][]
): Map<string, LetterState> {
  const states = new Map<string, LetterState>();
  const priority: Record<string, number> = {
    correct: 3,
    present: 2,
    absent: 1,
    unused: 0,
  };

  for (let g = 0; g < guesses.length; g++) {
    for (let i = 0; i < WORD_LENGTH; i++) {
      const letter = guesses[g][i];
      const state = allResults[g][i];
      const current = states.get(letter) ?? "empty";
      if ((priority[state] ?? 0) > (priority[current] ?? -1)) {
        states.set(letter, state);
      }
    }
  }

  return states;
}

/**
 * 単語が有効な推測かどうか検証する
 * @param word - 検証する単語（大文字）
 * @returns 有効であれば true
 */
export function isValidGuess(word: string): boolean {
  return word.length === WORD_LENGTH && /^[A-Z]+$/.test(word);
}

/** Wordleゲームのメインコンポーネント */
function WordleGame() {
  const [targetWord, setTargetWord] = useState<string>(() => pickRandomWord());
  const [guesses, setGuesses] = useState<string[]>([]);
  const [allResults, setAllResults] = useState<
    Exclude<LetterState, "empty" | "input">[][]
  >([]);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const isInitialMount = useRef(true);

  const { statusRef, announceStatus } = useStatusAnnouncement();

  /** 新しいゲームを開始する */
  const startNewGame = useCallback(() => {
    const word = pickRandomWord();
    setTargetWord(word);
    setGuesses([]);
    setAllResults([]);
    setCurrentGuess("");
    setGameStatus("playing");
    setShakeRow(null);
    announceStatus("新しいゲームを開始しました。5文字の英単語を入力してください。");
  }, [announceStatus]);

  /** 初回マウント */
  useEffect(() => {
    isInitialMount.current = false;
  }, []);

  /** 推測を確定して評価する */
  const submitGuess = useCallback(() => {
    if (gameStatus !== "playing") return;
    if (currentGuess.length !== WORD_LENGTH) {
      const row = guesses.length;
      setShakeRow(row);
      setTimeout(() => setShakeRow(null), 600);
      announceStatus("5文字の単語を入力してください。");
      return;
    }

    const result = evaluateGuess(currentGuess, targetWord);
    const newGuesses = [...guesses, currentGuess];
    const newResults = [...allResults, result];

    setGuesses(newGuesses);
    setAllResults(newResults);
    setCurrentGuess("");

    const isWin = result.every((r) => r === "correct");
    if (isWin) {
      setGameStatus("won");
      setWins((w) => w + 1);
      const tryCount = newGuesses.length;
      announceStatus(`正解！${tryCount}回目で当たりました！正解は ${targetWord} です。`);
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameStatus("lost");
      setLosses((l) => l + 1);
      announceStatus(`ゲームオーバー。正解は ${targetWord} でした。`);
    } else {
      const remaining = MAX_GUESSES - newGuesses.length;
      announceStatus(`残り${remaining}回。`);
    }
  }, [
    gameStatus,
    currentGuess,
    guesses,
    allResults,
    targetWord,
    announceStatus,
  ]);

  /** キーボード入力ハンドラー */
  const handleKey = useCallback(
    (key: string) => {
      if (gameStatus !== "playing") return;

      if (key === "ENTER") {
        submitGuess();
      } else if (key === "⌫" || key === "BACKSPACE") {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (/^[A-Z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
        setCurrentGuess((prev) => prev + key);
      }
    },
    [gameStatus, currentGuess, submitGuess]
  );

  /** フィジカルキーボード対応 */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toUpperCase();
      if (key === "ENTER") {
        handleKey("ENTER");
      } else if (key === "BACKSPACE") {
        handleKey("⌫");
      } else if (/^[A-Z]$/.test(key)) {
        handleKey(key);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKey]);

  const keyboardStates = getKeyboardStates(guesses, allResults);

  /** グリッドの行データを生成する */
  const rows: { letters: string[]; states: LetterState[] }[] = [];
  for (let i = 0; i < MAX_GUESSES; i++) {
    if (i < guesses.length) {
      rows.push({
        letters: guesses[i].split(""),
        states: allResults[i],
      });
    } else if (i === guesses.length && gameStatus === "playing") {
      const letters = currentGuess.split("");
      const states: LetterState[] = [];
      for (let j = 0; j < WORD_LENGTH; j++) {
        states.push(letters[j] ? "input" : "empty");
      }
      rows.push({ letters, states });
    } else {
      rows.push({
        letters: new Array(WORD_LENGTH).fill(""),
        states: new Array(WORD_LENGTH).fill("empty"),
      });
    }
  }

  return (
    <>
      <div className="tool-container">
        {/* ヘッダー */}
        <div className="converter-section">
          <div className="wordle-header">
            <div className="wordle-score" aria-label="スコア">
              <span className="wordle-score-win">🏆 {wins}勝</span>
              <span className="wordle-score-lose">💀 {losses}敗</span>
            </div>
            <Button
              type="button"
              className="btn-primary"
              onClick={startNewGame}
              aria-label="新しいゲームを開始"
            >
              新しいゲーム
            </Button>
          </div>
        </div>

        {/* ゲームグリッド */}
        <div className="wordle-grid-container">
          <div
            className="wordle-grid"
            role="grid"
            aria-label="Wordleグリッド"
          >
            {rows.map((row, rowIdx) => (
              <div
                key={rowIdx}
                className={`wordle-row${shakeRow === rowIdx ? " wordle-row-shake" : ""}`}
                role="row"
              >
                {Array.from({ length: WORD_LENGTH }).map((_, colIdx) => (
                  <div
                    key={colIdx}
                    className={`wordle-cell wordle-cell-${row.states[colIdx]}`}
                    role="gridcell"
                    aria-label={
                      row.letters[colIdx]
                        ? `${row.letters[colIdx]}: ${
                            row.states[colIdx] === "correct"
                              ? "正しい位置"
                              : row.states[colIdx] === "present"
                                ? "別の位置に存在"
                                : row.states[colIdx] === "absent"
                                  ? "含まれない"
                                  : "入力中"
                          }`
                        : "空"
                    }
                  >
                    {row.letters[colIdx] ?? ""}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ゲーム結果 */}
        {gameStatus !== "playing" && (
          <div
            className={`wordle-result ${gameStatus === "won" ? "wordle-result-won" : "wordle-result-lost"}`}
            role="alert"
            aria-live="assertive"
          >
            {gameStatus === "won" ? (
              <>
                <span className="wordle-result-emoji">🎉</span>
                <span>クリア！正解は <strong>{targetWord}</strong></span>
              </>
            ) : (
              <>
                <span className="wordle-result-emoji">💀</span>
                <span>ゲームオーバー。正解は <strong>{targetWord}</strong></span>
              </>
            )}
          </div>
        )}

        {/* オンスクリーンキーボード */}
        <div className="converter-section">
          <div
            className="wordle-keyboard"
            role="group"
            aria-label="文字を入力"
          >
            {KEYBOARD_ROWS.map((row, rowIdx) => (
              <div key={rowIdx} className="wordle-keyboard-row">
                {row.map((key) => {
                  const state = keyboardStates.get(key) ?? "empty";
                  const isWide = key === "ENTER" || key === "⌫";
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`wordle-key wordle-key-${state}${isWide ? " wordle-key-wide" : ""}`}
                      onClick={() => handleKey(key)}
                      disabled={gameStatus !== "playing"}
                      aria-label={
                        key === "⌫"
                          ? "削除"
                          : key === "ENTER"
                            ? "送信"
                            : `${key}${state !== "empty" ? ` (${state === "correct" ? "正解" : state === "present" ? "位置違い" : "不正解"})` : ""}`
                      }
                    >
                      {key}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <TipsCard
          sections={[
            {
              title: "遊び方",
              items: [
                "5文字の英単語を入力してENTERで確定",
                "6回以内に正解を当てればクリア",
                "キーボード入力または画面のボタンで入力可能",
                "「新しいゲーム」で別の単語に挑戦",
              ],
            },
            {
              title: "色のヒント",
              items: [
                "🟩 緑: その位置に正しい文字",
                "🟨 黄: 単語に含まれるが位置が違う",
                "⬛ 灰: 単語に含まれない文字",
              ],
            },
          ]}
        />
        <StatusAnnouncer statusRef={statusRef} />
      </div>
    </>
  );
}
