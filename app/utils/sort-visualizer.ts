/**
 * ソートアルゴリズム可視化ユーティリティ
 *
 * 各ソートアルゴリズムのステップを記録して返します。
 */

/** 各ステップにおける配列の状態 */
export interface SortStep {
  /** 現在の配列の値 */
  array: number[];
  /** 比較中のインデックス */
  comparing: number[];
  /** 交換中のインデックス */
  swapping: number[];
  /** 確定済みのインデックス */
  sorted: number[];
}

/** ソートアルゴリズムの種類 */
export type SortAlgorithm = "bubble" | "selection" | "insertion" | "merge" | "quick";

/** アルゴリズムのラベル */
export const ALGORITHM_LABELS: Record<SortAlgorithm, string> = {
  bubble: "バブルソート",
  selection: "選択ソート",
  insertion: "挿入ソート",
  merge: "マージソート",
  quick: "クイックソート",
};

/** アルゴリズムの計算量情報 */
export const ALGORITHM_COMPLEXITY: Record<
  SortAlgorithm,
  { best: string; average: string; worst: string; space: string }
> = {
  bubble: { best: "O(n)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
  selection: {
    best: "O(n²)",
    average: "O(n²)",
    worst: "O(n²)",
    space: "O(1)",
  },
  insertion: { best: "O(n)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
  merge: {
    best: "O(n log n)",
    average: "O(n log n)",
    worst: "O(n log n)",
    space: "O(n)",
  },
  quick: {
    best: "O(n log n)",
    average: "O(n log n)",
    worst: "O(n²)",
    space: "O(log n)",
  },
};

/**
 * 1〜n のシャッフルされた配列を生成する
 * @param size 配列サイズ
 * @returns シャッフルされた配列
 */
export function generateArray(size: number): number[] {
  const arr = Array.from({ length: size }, (_, i) => i + 1);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * バブルソートのステップ列を生成する
 * @param input 入力配列
 * @returns ソートステップの配列
 */
export function bubbleSortSteps(input: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const arr = [...input];
  const n = arr.length;
  const sorted: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({
        array: [...arr],
        comparing: [j, j + 1],
        swapping: [],
        sorted: [...sorted],
      });
      if (arr[j] > arr[j + 1]) {
        steps.push({
          array: [...arr],
          comparing: [],
          swapping: [j, j + 1],
          sorted: [...sorted],
        });
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    sorted.unshift(n - 1 - i);
    if (!swapped) {
      for (let k = 0; k < n - i - 1; k++) sorted.push(k);
      break;
    }
  }

  steps.push({
    array: [...arr],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: n }, (_, i) => i),
  });
  return steps;
}

/**
 * 選択ソートのステップ列を生成する
 * @param input 入力配列
 * @returns ソートステップの配列
 */
export function selectionSortSteps(input: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const arr = [...input];
  const n = arr.length;
  const sorted: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      steps.push({
        array: [...arr],
        comparing: [minIdx, j],
        swapping: [],
        sorted: [...sorted],
      });
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      steps.push({
        array: [...arr],
        comparing: [],
        swapping: [i, minIdx],
        sorted: [...sorted],
      });
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
    }
    sorted.push(i);
  }

  steps.push({
    array: [...arr],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: n }, (_, i) => i),
  });
  return steps;
}

/**
 * 挿入ソートのステップ列を生成する
 * @param input 入力配列
 * @returns ソートステップの配列
 */
export function insertionSortSteps(input: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const arr = [...input];
  const n = arr.length;

  for (let i = 1; i < n; i++) {
    let j = i;
    while (j > 0) {
      steps.push({
        array: [...arr],
        comparing: [j - 1, j],
        swapping: [],
        sorted: Array.from({ length: i }, (_, k) => k),
      });
      if (arr[j - 1] > arr[j]) {
        steps.push({
          array: [...arr],
          comparing: [],
          swapping: [j - 1, j],
          sorted: Array.from({ length: i }, (_, k) => k),
        });
        [arr[j - 1], arr[j]] = [arr[j], arr[j - 1]];
        j--;
      } else {
        break;
      }
    }
  }

  steps.push({
    array: [...arr],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: n }, (_, i) => i),
  });
  return steps;
}

/**
 * マージソートのステップ列を生成する
 * @param input 入力配列
 * @returns ソートステップの配列
 */
export function mergeSortSteps(input: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const arr = [...input];

  function mergeSort(arr: number[], left: number, right: number): void {
    if (right - left <= 1) return;
    const mid = Math.floor((left + right) / 2);
    mergeSort(arr, left, mid);
    mergeSort(arr, mid, right);

    const leftArr = arr.slice(left, mid);
    const rightArr = arr.slice(mid, right);
    let i = 0,
      j = 0,
      k = left;

    while (i < leftArr.length && j < rightArr.length) {
      steps.push({
        array: [...arr],
        comparing: [left + i, mid + j],
        swapping: [],
        sorted: [],
      });
      if (leftArr[i] <= rightArr[j]) {
        arr[k++] = leftArr[i++];
      } else {
        arr[k++] = rightArr[j++];
      }
    }
    while (i < leftArr.length) arr[k++] = leftArr[i++];
    while (j < rightArr.length) arr[k++] = rightArr[j++];
  }

  mergeSort(arr, 0, arr.length);

  steps.push({
    array: [...arr],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: arr.length }, (_, i) => i),
  });
  return steps;
}

/**
 * クイックソートのステップ列を生成する
 * @param input 入力配列
 * @returns ソートステップの配列
 */
export function quickSortSteps(input: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const arr = [...input];

  function partition(arr: number[], low: number, high: number): number {
    const pivot = arr[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
      steps.push({
        array: [...arr],
        comparing: [j, high],
        swapping: [],
        sorted: [],
      });
      if (arr[j] <= pivot) {
        i++;
        if (i !== j) {
          steps.push({
            array: [...arr],
            comparing: [],
            swapping: [i, j],
            sorted: [],
          });
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
      }
    }
    if (i + 1 !== high) {
      steps.push({
        array: [...arr],
        comparing: [],
        swapping: [i + 1, high],
        sorted: [],
      });
      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    }
    return i + 1;
  }

  function quickSort(arr: number[], low: number, high: number): void {
    if (low < high) {
      const pi = partition(arr, low, high);
      quickSort(arr, low, pi - 1);
      quickSort(arr, pi + 1, high);
    }
  }

  quickSort(arr, 0, arr.length - 1);

  steps.push({
    array: [...arr],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: arr.length }, (_, i) => i),
  });
  return steps;
}

/**
 * アルゴリズムに対応するステップ生成関数を返す
 * @param algorithm アルゴリズムの種類
 * @returns ステップ生成関数
 */
export function getSortSteps(algorithm: SortAlgorithm, input: number[]): SortStep[] {
  switch (algorithm) {
    case "bubble":
      return bubbleSortSteps(input);
    case "selection":
      return selectionSortSteps(input);
    case "insertion":
      return insertionSortSteps(input);
    case "merge":
      return mergeSortSteps(input);
    case "quick":
      return quickSortSteps(input);
  }
}
