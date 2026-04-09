/**
 * Brainfuck インタープリター
 *
 * Brainfuck は8つのコマンドのみからなる難解プログラミング言語です。
 * メモリは整数の配列で構成され、ポインタが現在のセルを指します。
 */

/** Brainfuck 実行結果 */
export interface BrainfuckResult {
  /** 標準出力 */
  output: string;
  /** エラーメッセージ（存在する場合） */
  error: string | null;
  /** 実行ステップ数 */
  steps: number;
  /** 最終的なメモリ状態（最初の20セル） */
  memory: number[];
  /** 最終的なメモリポインタ位置 */
  pointer: number;
}

/** 実行制限設定 */
export interface BrainfuckOptions {
  /** 最大実行ステップ数（無限ループ防止） */
  maxSteps?: number;
  /** メモリセル数 */
  memorySize?: number;
}

const DEFAULT_MAX_STEPS = 1_000_000;
const DEFAULT_MEMORY_SIZE = 30_000;

/**
 * Brainfuck コードを実行するインタープリター
 *
 * @param code - Brainfuck ソースコード
 * @param input - 標準入力文字列（, コマンドで使用）
 * @param options - 実行オプション
 * @returns 実行結果
 *
 * @example
 * // "Hello, World!" を出力する
 * const result = executeBrainfuck(
 *   '++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.',
 *   ''
 * );
 * console.log(result.output); // "Hello, World!"
 */
export function executeBrainfuck(
  code: string,
  input: string,
  options: BrainfuckOptions = {},
): BrainfuckResult {
  const maxSteps = options.maxSteps ?? DEFAULT_MAX_STEPS;
  const memorySize = options.memorySize ?? DEFAULT_MEMORY_SIZE;

  const memory = new Uint8Array(memorySize);
  let pointer = 0;
  let inputIndex = 0;
  let output = "";
  let steps = 0;

  // ブラケットのジャンプテーブルを事前計算（高速化）
  const jumpTable = buildJumpTable(code);
  if (jumpTable === null) {
    return {
      output: "",
      error: "ブラケットが対応していません（[ と ] の数が一致しません）",
      steps: 0,
      memory: Array.from(memory.slice(0, 20)),
      pointer: 0,
    };
  }

  let ip = 0; // instruction pointer

  while (ip < code.length) {
    if (steps >= maxSteps) {
      return {
        output,
        error: `実行ステップ数が上限（${maxSteps.toLocaleString()} ステップ）に達しました。無限ループの可能性があります。`,
        steps,
        memory: Array.from(memory.slice(0, 20)),
        pointer,
      };
    }

    const cmd = code[ip];

    switch (cmd) {
      case ">":
        pointer = (pointer + 1) % memorySize;
        break;
      case "<":
        pointer = (pointer - 1 + memorySize) % memorySize;
        break;
      case "+":
        memory[pointer] = (memory[pointer] + 1) & 0xff;
        break;
      case "-":
        memory[pointer] = (memory[pointer] - 1 + 256) & 0xff;
        break;
      case ".":
        output += String.fromCharCode(memory[pointer]);
        break;
      case ",":
        if (inputIndex < input.length) {
          memory[pointer] = input.charCodeAt(inputIndex++) & 0xff;
        } else {
          memory[pointer] = 0;
        }
        break;
      case "[":
        if (memory[pointer] === 0) {
          ip = jumpTable[ip];
        }
        break;
      case "]":
        if (memory[pointer] !== 0) {
          ip = jumpTable[ip];
        }
        break;
    }

    ip++;
    steps++;
  }

  return {
    output,
    error: null,
    steps,
    memory: Array.from(memory.slice(0, 20)),
    pointer,
  };
}

/**
 * ブラケットのジャンプテーブルを構築する
 *
 * @param code - Brainfuck ソースコード
 * @returns ジャンプテーブル（インデックス→対応するブラケットの位置）、無効な場合は null
 */
function buildJumpTable(code: string): Record<number, number> | null {
  const table: Record<number, number> = {};
  const stack: number[] = [];

  for (let i = 0; i < code.length; i++) {
    if (code[i] === "[") {
      stack.push(i);
    } else if (code[i] === "]") {
      if (stack.length === 0) return null;
      const open = stack.pop()!;
      table[open] = i;
      table[i] = open;
    }
  }

  return stack.length === 0 ? table : null;
}

/**
 * サンプルプログラムの一覧
 */
export const BRAINFUCK_SAMPLES: Array<{
  name: string;
  code: string;
  input: string;
  description: string;
}> = [
  {
    name: "Hello, World!",
    code: "++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.",
    input: "",
    description: "古典的な Hello, World! プログラム",
  },
  {
    name: "Cat プログラム",
    code: ",[.,]",
    input: "Hello!",
    description: "入力をそのまま出力する（Catプログラム）",
  },
  {
    name: "2+3 の計算",
    code: "++>+++[<+>-]<.",
    input: "",
    description: "2+3=5 を計算してASCIIコードとして出力",
  },
  {
    name: "ROT13 変換",
    code: "-,+[-[>>++++[>++++++++<-]<+<-[>+>[->]-[<<<]>>-]<[-<[>+<-]>>++++++[<++++++++>-]<-.[-]<<[-]<<[->]<]>[-]+>--[-[<->+++[-]]]<[++++++++++++<[>-[>+>>]>[+[<+>-]>+>>]<<<<<-]>[-]+>--[-[<->+++[-]]]<[>>+<[-]>>[<<+>>-]>>]<<]>>[-]<]<[->]<]",
    input: "Hello World",
    description: "ROT13 エンコード/デコード変換",
  },
  {
    name: "FizzBuzz (1-20)",
    code: "++++[>+++++<-]>[>+>+>+>+<<<<-]>>>>+++++>++++++++[-<++++<++++<++<---->>>>]<<<[->-[>+>>]>[[-]<[>+<-]>>[<<+>>-]>[-]]<<]>[-]<[-]>>[<+>-]<+<[>>-<<-]>[>>]<<[[-]<]<[<]>[.>]<[<]>[>]<<[-]<[-]>++++++[-<++++++++>]<-.[-]++++++++++.",
    input: "",
    description: "FizzBuzz (1〜20)",
  },
];
