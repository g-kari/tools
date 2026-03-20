import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";

export const Route = createFileRoute("/hangman")({
  head: () => ({
    meta: [
      { title: "ハングマン | Web ツール集" },
      { name: "description", content: "単語を推測するハングマンゲーム。英単語カテゴリを選んで挑戦しよう。" },
      { property: "og:title", content: "ハングマン | Web ツール集" },
      { property: "og:description", content: "単語を推測するハングマンゲーム。英単語カテゴリを選んで挑戦しよう。" },
      { property: "og:url", content: `${SITE_BASE_URL}/hangman` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "ハングマン | Web ツール集" },
      { name: "twitter:description", content: "単語を推測するハングマンゲーム。英単語カテゴリを選んで挑戦しよう。" },
    ],
  }),
  component: HangmanGame,
});

/** ゲームの最大ミス数 */
const MAX_MISTAKES = 6;

/** 単語カテゴリの型定義 */
interface WordCategory {
  /** カテゴリ名 */
  name: string;
  /** カテゴリ内の単語リスト */
  words: string[];
  /** カテゴリのヒント */
  hint: string;
}

/** ゲーム状態の型定義 */
type GameStatus = "playing" | "won" | "lost";

/** 単語カテゴリ一覧 */
const WORD_CATEGORIES: WordCategory[] = [
  {
    name: "プログラミング",
    hint: "プログラミング用語",
    words: [
      "ARRAY", "BINARY", "CLASS", "DEBUG", "ENUM", "FLOAT", "GRAPH",
      "HASH", "INDEX", "LOOP", "MERGE", "NODE", "OBJECT", "PARSE",
      "QUERY", "REGEX", "STACK", "TOKEN", "UNION", "VALUE",
    ],
  },
  {
    name: "動物",
    hint: "動物の名前（英語）",
    words: [
      "BEAR", "CRANE", "DOLPHIN", "EAGLE", "FALCON", "GIRAFFE", "HORSE",
      "IGUANA", "JAGUAR", "KOALA", "LEMUR", "MONKEY", "NARWHAL", "OCTOPUS",
      "PANDA", "RABBIT", "SALMON", "TIGER", "TURTLE", "WOLF",
    ],
  },
  {
    name: "国名",
    hint: "国の名前（英語）",
    words: [
      "BRAZIL", "CANADA", "DENMARK", "EGYPT", "FRANCE", "GERMANY", "GREECE",
      "INDIA", "ITALY", "JAPAN", "KENYA", "MEXICO", "NORWAY", "POLAND",
      "RUSSIA", "SPAIN", "SWEDEN", "TURKEY", "UKRAINE",
    ],
  },
  {
    name: "食べ物",
    hint: "食べ物の名前（英語）",
    words: [
      "APPLE", "BREAD", "CARROT", "DONUT", "EGGS", "FRIES", "GRAPE",
      "HONEY", "ICECREAM", "JUICE", "KIWI", "LEMON", "MANGO", "NOODLE",
      "ORANGE", "PIZZA", "QUICHE", "RICE", "SALAD", "TACO",
    ],
  },
];

/**
 * ランダムな単語とカテゴリを選択する
 * @param categoryIndex - カテゴリのインデックス（-1でランダム）
 * @returns 選択された単語とカテゴリのインデックス
 */
export function selectWord(categoryIndex: number): { word: string; catIndex: number } {
  const catIndex = categoryIndex >= 0
    ? categoryIndex
    : Math.floor(Math.random() * WORD_CATEGORIES.length);
  const category = WORD_CATEGORIES[catIndex];
  const word = category.words[Math.floor(Math.random() * category.words.length)];
  return { word, catIndex };
}

/**
 * 文字が単語に含まれているか判定する
 * @param word - 単語
 * @param letter - チェックする文字
 * @returns 含まれていればtrue
 */
export function isLetterInWord(word: string, letter: string): boolean {
  return word.includes(letter.toUpperCase());
}

/**
 * 単語のマスク表示を生成する
 * @param word - 単語
 * @param guessed - 推測済み文字のセット
 * @returns マスク済み文字の配列
 */
export function getMaskedWord(word: string, guessed: Set<string>): string[] {
  return word.split("").map((letter) => (guessed.has(letter) ? letter : "_"));
}

/**
 * ゲームの勝敗を判定する
 * @param word - 単語
 * @param guessed - 推測済み文字のセット
 * @param mistakes - ミス数
 * @returns ゲームの状態
 */
export function getGameStatus(
  word: string,
  guessed: Set<string>,
  mistakes: number
): GameStatus {
  if (mistakes >= MAX_MISTAKES) return "lost";
  if (word.split("").every((letter) => guessed.has(letter))) return "won";
  return "playing";
}

/** アルファベットのキーボード配列 */
const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

/**
 * ハングマンのSVG描画コンポーネント
 * @param mistakes - ミス数（0〜6）
 */
function HangmanDrawing({ mistakes }: { mistakes: number }) {
  return (
    <svg
      viewBox="0 0 200 220"
      className="hangman-svg"
      aria-label={`ハングマン図: ${mistakes}ミス`}
      role="img"
    >
      {/* 台座・絞首台の構造 */}
      {/* 底辺 */}
      <line x1="20" y1="210" x2="180" y2="210" className="hangman-line" />
      {/* 縦柱 */}
      <line x1="60" y1="210" x2="60" y2="20" className="hangman-line" />
      {/* 横梁 */}
      <line x1="60" y1="20" x2="130" y2="20" className="hangman-line" />
      {/* ロープ */}
      <line x1="130" y1="20" x2="130" y2="50" className="hangman-line" />

      {/* 頭（1ミス目） */}
      {mistakes >= 1 && (
        <circle cx="130" cy="65" r="15" className="hangman-body" />
      )}
      {/* 胴体（2ミス目） */}
      {mistakes >= 2 && (
        <line x1="130" y1="80" x2="130" y2="140" className="hangman-body" />
      )}
      {/* 左腕（3ミス目） */}
      {mistakes >= 3 && (
        <line x1="130" y1="95" x2="105" y2="120" className="hangman-body" />
      )}
      {/* 右腕（4ミス目） */}
      {mistakes >= 4 && (
        <line x1="130" y1="95" x2="155" y2="120" className="hangman-body" />
      )}
      {/* 左足（5ミス目） */}
      {mistakes >= 5 && (
        <line x1="130" y1="140" x2="105" y2="170" className="hangman-body" />
      )}
      {/* 右足（6ミス目） */}
      {mistakes >= 6 && (
        <line x1="130" y1="140" x2="155" y2="170" className="hangman-body" />
      )}
    </svg>
  );
}

function HangmanGame() {
  const [categoryIndex, setCategoryIndex] = useState(-1);
  const [word, setWord] = useState("");
  const [catIndex, setCatIndex] = useState(0);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const isInitialMount = useRef(true);

  const { statusRef, announceStatus } = useStatusAnnouncement();

  /** 新しいゲームを開始する */
  const startNewGame = useCallback(() => {
    const { word: newWord, catIndex: newCatIndex } = selectWord(categoryIndex);
    setWord(newWord);
    setCatIndex(newCatIndex);
    setGuessed(new Set());
    setMistakes(0);
    setGameStatus("playing");
    announceStatus(`新しいゲーム開始。カテゴリ: ${WORD_CATEGORIES[newCatIndex].name}。${newWord.length}文字の単語。`);
  }, [categoryIndex, announceStatus]);

  /** 初回マウント時にゲーム開始 */
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      const { word: newWord, catIndex: newCatIndex } = selectWord(-1);
      setWord(newWord);
      setCatIndex(newCatIndex);
    }
  }, []);

  /** カテゴリ変更時に新ゲーム開始 */
  useEffect(() => {
    if (!isInitialMount.current && word) {
      startNewGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryIndex]);

  /** 文字を推測する */
  const handleGuess = useCallback(
    (letter: string) => {
      if (gameStatus !== "playing" || guessed.has(letter)) return;

      const newGuessed = new Set(guessed).add(letter);
      const isCorrect = isLetterInWord(word, letter);

      let newMistakes = mistakes;
      if (!isCorrect) {
        newMistakes = mistakes + 1;
        setMistakes(newMistakes);
      }

      setGuessed(newGuessed);

      const newStatus = getGameStatus(word, newGuessed, newMistakes);
      setGameStatus(newStatus);

      if (newStatus === "won") {
        setWins((w) => w + 1);
        announceStatus("正解！ゲームクリア！");
      } else if (newStatus === "lost") {
        setLosses((l) => l + 1);
        announceStatus(`ゲームオーバー。正解は${word}でした。`);
      } else if (isCorrect) {
        announceStatus(`正解！${letter}は単語に含まれています。`);
      } else {
        announceStatus(`不正解。残り${MAX_MISTAKES - newMistakes}回。`);
      }
    },
    [gameStatus, guessed, word, mistakes, announceStatus]
  );

  /** キーボード入力のハンドラー */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const letter = e.key.toUpperCase();
      if (/^[A-Z]$/.test(letter)) {
        handleGuess(letter);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleGuess]);

  const maskedWord = getMaskedWord(word, guessed);
  const wrongLetters = [...guessed].filter((l) => !word.includes(l));
  const category = WORD_CATEGORIES[catIndex];

  return (
    <>
      <div className="tool-container">
        {/* ゲーム設定・スコア */}
        <div className="converter-section">
          <div className="hangman-header">
            <div className="hangman-score" aria-label="スコア">
              <span className="score-win">🏆 {wins}勝</span>
              <span className="score-lose">💀 {losses}敗</span>
            </div>
            <div className="hangman-category-select">
              <label htmlFor="category-select" className="sr-only">
                カテゴリを選択
              </label>
              <select
                id="category-select"
                value={categoryIndex}
                onChange={(e) => setCategoryIndex(Number(e.target.value))}
                className="hangman-select"
                aria-label="単語カテゴリ選択"
              >
                <option value={-1}>ランダム</option>
                {WORD_CATEGORIES.map((cat, i) => (
                  <option key={cat.name} value={i}>
                    {cat.name}
                  </option>
                ))}
              </select>
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

        {/* ゲームエリア */}
        <div className="hangman-game-area">
          {/* ハングマン図 */}
          <div className="hangman-drawing-area">
            <HangmanDrawing mistakes={mistakes} />
            <div className="hangman-mistake-counter" aria-live="polite">
              <span className={`mistake-count ${mistakes >= MAX_MISTAKES ? "mistake-max" : ""}`}>
                ミス: {mistakes} / {MAX_MISTAKES}
              </span>
            </div>
          </div>

          {/* 単語エリア */}
          <div className="hangman-word-area">
            {/* カテゴリヒント */}
            <div className="hangman-hint" aria-label={`ヒント: ${category?.hint}`}>
              <span className="hint-label">カテゴリ:</span>
              <span className="hint-value">{category?.name}</span>
            </div>

            {/* 単語表示 */}
            <div
              className="hangman-word"
              role="group"
              aria-label={`単語: ${maskedWord.join(" ")}`}
            >
              {maskedWord.map((letter, i) => (
                <div
                  key={i}
                  className={`hangman-letter-box ${letter !== "_" ? "revealed" : ""}`}
                  aria-label={letter === "_" ? "未推測" : letter}
                >
                  <span className="letter-char">{letter === "_" ? "" : letter}</span>
                </div>
              ))}
            </div>

            {/* ゲーム結果 */}
            {gameStatus !== "playing" && (
              <div
                className={`hangman-result ${gameStatus === "won" ? "result-won" : "result-lost"}`}
                role="alert"
                aria-live="assertive"
              >
                {gameStatus === "won" ? (
                  <>
                    <span className="result-emoji">🎉</span>
                    <span className="result-text">クリア！おめでとう！</span>
                  </>
                ) : (
                  <>
                    <span className="result-emoji">💀</span>
                    <span className="result-text">
                      ゲームオーバー。正解は <strong>{word}</strong>
                    </span>
                  </>
                )}
              </div>
            )}

            {/* 誤答文字 */}
            {wrongLetters.length > 0 && (
              <div className="hangman-wrong-letters" aria-label={`不正解の文字: ${wrongLetters.join(", ")}`}>
                <span className="wrong-label">不正解:</span>
                <span className="wrong-letters">{wrongLetters.join("  ")}</span>
              </div>
            )}
          </div>
        </div>

        {/* キーボード */}
        <div className="converter-section">
          <h2 className="section-title">キーボード</h2>
          <div className="hangman-keyboard" role="group" aria-label="文字を選択">
            {KEYBOARD_ROWS.map((row, rowIndex) => (
              <div key={rowIndex} className="keyboard-row">
                {row.map((letter) => {
                  const isGuessed = guessed.has(letter);
                  const isCorrect = isGuessed && word.includes(letter);
                  const isWrong = isGuessed && !word.includes(letter);
                  return (
                    <button
                      key={letter}
                      type="button"
                      className={`keyboard-key ${isCorrect ? "key-correct" : ""} ${isWrong ? "key-wrong" : ""}`}
                      onClick={() => handleGuess(letter)}
                      disabled={isGuessed || gameStatus !== "playing"}
                      aria-label={`${letter}${isCorrect ? " (正解)" : isWrong ? " (不正解)" : ""}`}
                      aria-pressed={isGuessed}
                    >
                      {letter}
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
                "カテゴリを選んで「新しいゲーム」で開始",
                "アルファベットボタンまたはキーボードで文字を入力",
                `${MAX_MISTAKES}回ミスするとゲームオーバー`,
                "単語をすべて当てればクリア！",
              ],
            },
            {
              title: "ヒント",
              items: [
                "まずは A, E, I, O, U などの母音から試してみよう",
                "T, N, S, R などの頻出子音もおすすめ",
                "カテゴリのヒントを参考に単語を絞り込もう",
                "キーボードの色: 緑=正解、赤=不正解",
              ],
            },
          ]}
        />
        <StatusAnnouncer statusRef={statusRef} />
      </div>
    </>
  );
}
