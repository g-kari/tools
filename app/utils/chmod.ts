/**
 * @fileoverview Chmod（ファイルパーミッション）計算ユーティリティ
 * Unix/Linuxファイルシステムのパーミッションビットの変換・計算を提供する
 */

/**
 * パーミッションビット（読み取り/書き込み/実行）
 */
export interface PermissionBits {
  /** 読み取り権限 */
  read: boolean;
  /** 書き込み権限 */
  write: boolean;
  /** 実行権限 */
  execute: boolean;
}

/**
 * Chmodパーミッションセット
 * 特殊ビット、オーナー、グループ、その他のパーミッションを含む
 */
export interface ChmodPermissions {
  /** 特殊ビット（setuid, setgid, sticky bit） */
  special: {
    /** Set User ID ビット */
    setuid: boolean;
    /** Set Group ID ビット */
    setgid: boolean;
    /** スティッキービット */
    sticky: boolean;
  };
  /** オーナーのパーミッション */
  owner: PermissionBits;
  /** グループのパーミッション */
  group: PermissionBits;
  /** その他のパーミッション */
  others: PermissionBits;
}

/**
 * 3ビットの数値からPermissionBitsオブジェクトを生成する
 * @param value - 0〜7のパーミッション値
 * @returns PermissionBitsオブジェクト
 */
function octetToPermissionBits(value: number): PermissionBits {
  return {
    read: Boolean(value & 4),
    write: Boolean(value & 2),
    execute: Boolean(value & 1),
  };
}

/**
 * 8進数文字列（3〜4桁）をChmodPermissionsオブジェクトにパースする
 * @param octal - 8進数文字列（例: "755", "0755", "4755"）
 * @returns ChmodPermissionsオブジェクト、無効な場合はnull
 * @example
 * parseChmodOctal("755") // { owner: {r:true, w:true, x:true}, group: {r:true, w:false, x:true}, ... }
 * parseChmodOctal("0644") // 先頭0は無視される
 */
export function parseChmodOctal(octal: string): ChmodPermissions | null {
  const trimmed = octal.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > 4) return null;
  const stripped = trimmed.replace(/^0+/, "") || "0";
  if (!/^[0-7]{1,4}$/.test(stripped)) return null;

  const padded = stripped.padStart(4, "0");
  const specialVal = parseInt(padded[0], 8);
  const ownerVal = parseInt(padded[1], 8);
  const groupVal = parseInt(padded[2], 8);
  const othersVal = parseInt(padded[3], 8);

  return {
    special: {
      setuid: Boolean(specialVal & 4),
      setgid: Boolean(specialVal & 2),
      sticky: Boolean(specialVal & 1),
    },
    owner: octetToPermissionBits(ownerVal),
    group: octetToPermissionBits(groupVal),
    others: octetToPermissionBits(othersVal),
  };
}

/**
 * PermissionBitsオブジェクトから3ビットの8進数値を生成する
 * @param bits - PermissionBitsオブジェクト
 * @returns 0〜7の数値
 */
function permissionBitsToOctet(bits: PermissionBits): number {
  return (bits.read ? 4 : 0) + (bits.write ? 2 : 0) + (bits.execute ? 1 : 0);
}

/**
 * ChmodPermissionsオブジェクトから8進数文字列を生成する
 * 特殊ビットがすべて0の場合は3桁、それ以外は4桁で返す
 * @param perms - ChmodPermissionsオブジェクト
 * @returns 8進数文字列（例: "755", "4755"）
 * @example
 * buildChmodOctal({ owner: {r:true, w:true, x:true}, ... }) // "755"
 */
export function buildChmodOctal(perms: ChmodPermissions): string {
  const specialVal =
    (perms.special.setuid ? 4 : 0) +
    (perms.special.setgid ? 2 : 0) +
    (perms.special.sticky ? 1 : 0);
  const ownerVal = permissionBitsToOctet(perms.owner);
  const groupVal = permissionBitsToOctet(perms.group);
  const othersVal = permissionBitsToOctet(perms.others);

  if (specialVal === 0) {
    return `${ownerVal}${groupVal}${othersVal}`;
  }
  return `${specialVal}${ownerVal}${groupVal}${othersVal}`;
}

/**
 * パーミッションビットを1文字に変換する
 * @param bit - ビットが立っているかどうか
 * @param char - ビットが立っている場合に返す文字（"r", "w", "x"など）
 * @returns ビットが立っている場合はchar、そうでない場合は"-"
 */
export function bitToChar(bit: boolean, char: string): string {
  return bit ? char : "-";
}

/**
 * 8進数文字列からシンボリック表記（9文字）に変換する
 * 特殊ビットはsetuid/setgidが"s"/"S"、stickyが"t"/"T"として表現される
 * @param octal - 8進数文字列（例: "755"）
 * @returns シンボリック表記（例: "rwxr-xr-x"）
 * @example
 * octalToSymbolic("755") // "rwxr-xr-x"
 * octalToSymbolic("644") // "rw-r--r--"
 * octalToSymbolic("4755") // "rwsr-xr-x"
 */
export function octalToSymbolic(octal: string): string {
  const perms = parseChmodOctal(octal);
  if (!perms) return "---------";

  const ownerExec = perms.owner.execute;
  const groupExec = perms.group.execute;
  const othersExec = perms.others.execute;

  // オーナーの実行ビット文字（setuidが立っている場合）
  let ownerX: string;
  if (perms.special.setuid) {
    ownerX = ownerExec ? "s" : "S";
  } else {
    ownerX = ownerExec ? "x" : "-";
  }

  // グループの実行ビット文字（setgidが立っている場合）
  let groupX: string;
  if (perms.special.setgid) {
    groupX = groupExec ? "s" : "S";
  } else {
    groupX = groupExec ? "x" : "-";
  }

  // その他の実行ビット文字（stickyが立っている場合）
  let othersX: string;
  if (perms.special.sticky) {
    othersX = othersExec ? "t" : "T";
  } else {
    othersX = othersExec ? "x" : "-";
  }

  return (
    bitToChar(perms.owner.read, "r") +
    bitToChar(perms.owner.write, "w") +
    ownerX +
    bitToChar(perms.group.read, "r") +
    bitToChar(perms.group.write, "w") +
    groupX +
    bitToChar(perms.others.read, "r") +
    bitToChar(perms.others.write, "w") +
    othersX
  );
}

/**
 * シンボリック表記（9文字）から8進数文字列に変換する
 * @param symbolic - シンボリック表記（例: "rwxr-xr-x"）
 * @returns 8進数文字列（例: "755"）、無効な場合はnull
 * @example
 * symbolicToOctal("rwxr-xr-x") // "755"
 * symbolicToOctal("rw-r--r--") // "644"
 * symbolicToOctal("rwsr-xr-x") // "4755"
 */
export function symbolicToOctal(symbolic: string): string | null {
  if (symbolic.length !== 9) return null;

  const ownerR = symbolic[0] === "r";
  const ownerW = symbolic[1] === "w";
  const ownerXChar = symbolic[2];
  const groupR = symbolic[3] === "r";
  const groupW = symbolic[4] === "w";
  const groupXChar = symbolic[5];
  const othersR = symbolic[6] === "r";
  const othersW = symbolic[7] === "w";
  const othersXChar = symbolic[8];

  // 有効な文字かチェック
  const validChars = /^[rwxsStT-]$/;
  for (const char of symbolic) {
    if (!validChars.test(char)) return null;
  }

  const ownerX = ownerXChar === "x" || ownerXChar === "s";
  const groupX = groupXChar === "x" || groupXChar === "s";
  const othersX = othersXChar === "x" || othersXChar === "t";

  const setuid = ownerXChar === "s" || ownerXChar === "S";
  const setgid = groupXChar === "s" || groupXChar === "S";
  const sticky = othersXChar === "t" || othersXChar === "T";

  const specialVal = (setuid ? 4 : 0) + (setgid ? 2 : 0) + (sticky ? 1 : 0);
  const ownerVal = (ownerR ? 4 : 0) + (ownerW ? 2 : 0) + (ownerX ? 1 : 0);
  const groupVal = (groupR ? 4 : 0) + (groupW ? 2 : 0) + (groupX ? 1 : 0);
  const othersVal = (othersR ? 4 : 0) + (othersW ? 2 : 0) + (othersX ? 1 : 0);

  if (specialVal === 0) {
    return `${ownerVal}${groupVal}${othersVal}`;
  }
  return `${specialVal}${ownerVal}${groupVal}${othersVal}`;
}
