/**
 * EXIF メタデータ解析ユーティリティ
 *
 * JPEG/TIFF ファイルから EXIF メタデータを読み取り、
 * プライバシー保護のために EXIF データを除去する機能を提供します。
 */

/** EXIF データ型の定義 */
const EXIF_TYPES = {
  BYTE: 1,
  ASCII: 2,
  SHORT: 3,
  LONG: 4,
  RATIONAL: 5,
  UNDEFINED: 7,
  SLONG: 9,
  SRATIONAL: 10,
} as const;

/** IFD タグの定義 */
const TAGS: Record<number, string> = {
  // 基本情報
  0x010f: 'メーカー',
  0x0110: 'モデル',
  0x0112: '向き',
  0x011a: 'X解像度',
  0x011b: 'Y解像度',
  0x0128: '解像度単位',
  0x0131: 'ソフトウェア',
  0x0132: '更新日時',
  0x013b: '作成者',
  0x013e: '白色点',
  0x013f: '原色色度',
  0x0213: 'YCbCr配置',
  0x0214: '基準黒白',
  0x8298: '著作権',
  // Exif IFD ポインタ
  0x8769: 'ExifIFDポインタ',
  0x8825: 'GPSIFDポインタ',
};

/** Exif IFD タグの定義 */
const EXIF_TAGS: Record<number, string> = {
  0x829a: '露出時間',
  0x829d: 'F値',
  0x8822: '露出プログラム',
  0x8824: 'スペクトル感度',
  0x8827: 'ISO感度',
  0x8828: 'オプトカル条件',
  0x9000: 'Exifバージョン',
  0x9003: '撮影日時',
  0x9004: 'デジタル化日時',
  0x9101: 'コンポーネント設定',
  0x9102: '平均輝度',
  0x9201: 'シャッタースピード',
  0x9202: '絞り値',
  0x9203: '輝度値',
  0x9204: '露出補正値',
  0x9205: '最大絞り値',
  0x9206: '被写体距離',
  0x9207: '測光モード',
  0x9208: '光源',
  0x9209: 'フラッシュ',
  0x920a: '焦点距離',
  0x9286: 'ユーザーコメント',
  0x9290: 'サブ秒時刻',
  0x9291: '撮影サブ秒時刻',
  0x9292: 'デジタル化サブ秒時刻',
  0xa000: 'FlashPixバージョン',
  0xa001: '色空間',
  0xa002: '有効画像幅',
  0xa003: '有効画像高さ',
  0xa004: '関連音声ファイル',
  0xa005: '相互運用IFDポインタ',
  0xa20e: '焦点面X解像度',
  0xa20f: '焦点面Y解像度',
  0xa210: '焦点面解像度単位',
  0xa215: '露出インデックス',
  0xa217: '撮影方法',
  0xa300: 'ファイルソース',
  0xa301: 'シーンタイプ',
  0xa302: 'CFAパターン',
  0xa401: 'カスタム画像処理',
  0xa402: '露出モード',
  0xa403: 'ホワイトバランス',
  0xa404: 'デジタルズーム倍率',
  0xa405: '35mm換算焦点距離',
  0xa406: 'シーン撮影タイプ',
  0xa407: 'ゲインコントロール',
  0xa408: 'コントラスト',
  0xa409: '彩度',
  0xa40a: 'シャープネス',
  0xa40b: 'デバイス設定説明',
  0xa40c: '被写体距離範囲',
  0xa420: '画像固有ID',
  0xa430: 'カメラオーナー名',
  0xa431: 'ボディシリアル番号',
  0xa432: 'レンズ仕様',
  0xa433: 'レンズメーカー',
  0xa434: 'レンズモデル',
  0xa435: 'レンズシリアル番号',
};

/** GPS タグの定義 */
const GPS_TAGS: Record<number, string> = {
  0x0000: 'GPSバージョン',
  0x0001: '緯度基準',
  0x0002: '緯度',
  0x0003: '経度基準',
  0x0004: '経度',
  0x0005: '高度基準',
  0x0006: '高度',
  0x0007: 'GPS時刻',
  0x0008: 'GPS衛星',
  0x0009: 'GPS状態',
  0x000a: '測位方法',
  0x000b: 'GPS精度',
  0x000c: '速度単位',
  0x000d: '速度',
  0x000e: '移動方位基準',
  0x000f: '移動方位',
  0x0010: 'イメージ方向基準',
  0x0011: 'イメージ方向',
  0x0012: '地図基準系',
  0x0013: '目標地点基準',
  0x0014: '目標地点緯度',
  0x0015: '目標地点緯度基準',
  0x0016: '目標地点経度',
  0x001b: 'GPS処理方法',
  0x001c: 'GPS地域情報',
  0x001d: 'GPS日付',
  0x001e: 'GPS測位精度',
  0x001f: 'GPS水平精度',
};

/** 露出プログラムの値ラベル */
const EXPOSURE_PROGRAMS: Record<number, string> = {
  0: '未定義',
  1: 'マニュアル',
  2: '通常プログラム',
  3: '絞り優先',
  4: 'シャッター優先',
  5: '被写界深度優先',
  6: 'スポーツ',
  7: 'ポートレート',
  8: '風景',
};

/** 測光モードの値ラベル */
const METERING_MODES: Record<number, string> = {
  0: '未知',
  1: '平均',
  2: '中央部重点平均',
  3: 'スポット',
  4: 'マルチスポット',
  5: '多分割',
  6: '部分',
  255: 'その他',
};

/** 向きの値ラベル */
const ORIENTATIONS: Record<number, string> = {
  1: '正常',
  2: '水平反転',
  3: '180度回転',
  4: '垂直反転',
  5: '左上から右下に反転して90度時計回り',
  6: '90度時計回り',
  7: '右上から左下に反転して90度時計回り',
  8: '90度反時計回り',
};

/** EXIF エントリの型 */
export interface ExifEntry {
  /** タグ名 */
  tag: string;
  /** タグの数値 ID */
  tagId: number;
  /** 値（表示用） */
  value: string;
  /** カテゴリ */
  category: 'basic' | 'camera' | 'datetime' | 'gps' | 'other';
}

/** GPS 座標の型 */
export interface GpsCoordinate {
  /** 緯度 (度) */
  latitude: number | null;
  /** 経度 (度) */
  longitude: number | null;
  /** Google Maps の URL */
  mapsUrl: string | null;
}

/** EXIF 解析結果の型 */
export interface ExifData {
  /** EXIF エントリの配列 */
  entries: ExifEntry[];
  /** GPS 座標情報 */
  gps: GpsCoordinate;
  /** EXIF が存在するかどうか */
  hasExif: boolean;
}

/**
 * バイト列から 16 ビット整数を読み取る
 * @param view - DataView
 * @param offset - オフセット
 * @param littleEndian - リトルエンディアンかどうか
 */
function readUint16(view: DataView, offset: number, littleEndian: boolean): number {
  return view.getUint16(offset, littleEndian);
}

/**
 * バイト列から 32 ビット整数を読み取る
 * @param view - DataView
 * @param offset - オフセット
 * @param littleEndian - リトルエンディアンかどうか
 */
function readUint32(view: DataView, offset: number, littleEndian: boolean): number {
  return view.getUint32(offset, littleEndian);
}

/**
 * IFD エントリの値を読み取る
 * @param view - DataView
 * @param offset - 値オフセット
 * @param type - データ型
 * @param count - 要素数
 * @param tiffBase - TIFF データの開始位置
 * @param littleEndian - リトルエンディアンかどうか
 */
function readValue(
  view: DataView,
  offset: number,
  type: number,
  count: number,
  tiffBase: number,
  littleEndian: boolean
): string {
  const typeSize: Record<number, number> = {
    [EXIF_TYPES.BYTE]: 1,
    [EXIF_TYPES.ASCII]: 1,
    [EXIF_TYPES.SHORT]: 2,
    [EXIF_TYPES.LONG]: 4,
    [EXIF_TYPES.RATIONAL]: 8,
    [EXIF_TYPES.UNDEFINED]: 1,
    [EXIF_TYPES.SLONG]: 4,
    [EXIF_TYPES.SRATIONAL]: 8,
  };

  const size = (typeSize[type] ?? 1) * count;
  let dataOffset: number;

  if (size <= 4) {
    dataOffset = offset;
  } else {
    dataOffset = tiffBase + readUint32(view, offset, littleEndian);
  }

  try {
    if (type === EXIF_TYPES.ASCII) {
      const chars: string[] = [];
      for (let i = 0; i < count; i++) {
        const code = view.getUint8(dataOffset + i);
        if (code === 0) break;
        chars.push(String.fromCharCode(code));
      }
      return chars.join('').trim();
    }

    if (type === EXIF_TYPES.SHORT) {
      if (count === 1) return String(readUint16(view, dataOffset, littleEndian));
      const vals: number[] = [];
      for (let i = 0; i < Math.min(count, 4); i++) {
        vals.push(readUint16(view, dataOffset + i * 2, littleEndian));
      }
      return vals.join(', ');
    }

    if (type === EXIF_TYPES.LONG) {
      if (count === 1) return String(readUint32(view, dataOffset, littleEndian));
      const vals: number[] = [];
      for (let i = 0; i < Math.min(count, 4); i++) {
        vals.push(readUint32(view, dataOffset + i * 4, littleEndian));
      }
      return vals.join(', ');
    }

    if (type === EXIF_TYPES.RATIONAL) {
      const results: string[] = [];
      for (let i = 0; i < Math.min(count, 4); i++) {
        const num = readUint32(view, dataOffset + i * 8, littleEndian);
        const den = readUint32(view, dataOffset + i * 8 + 4, littleEndian);
        if (den === 0) {
          results.push('0');
        } else if (num % den === 0) {
          results.push(String(num / den));
        } else {
          results.push(`${num}/${den}`);
        }
      }
      return results.join(', ');
    }

    if (type === EXIF_TYPES.SRATIONAL) {
      const results: string[] = [];
      for (let i = 0; i < Math.min(count, 4); i++) {
        const num = view.getInt32(dataOffset + i * 8, littleEndian);
        const den = view.getInt32(dataOffset + i * 8 + 4, littleEndian);
        if (den === 0) {
          results.push('0');
        } else {
          results.push((num / den).toFixed(2));
        }
      }
      return results.join(', ');
    }

    if (type === EXIF_TYPES.SLONG) {
      if (count === 1) return String(view.getInt32(dataOffset, littleEndian));
    }

    if (type === EXIF_TYPES.BYTE) {
      if (count === 1) return String(view.getUint8(dataOffset));
      const vals: number[] = [];
      for (let i = 0; i < Math.min(count, 8); i++) {
        vals.push(view.getUint8(dataOffset + i));
      }
      return vals.join('.');
    }
  } catch {
    // 範囲外アクセスは無視
  }

  return '(解析不可)';
}

/**
 * 有理数の配列を度数に変換する（GPS 座標用）
 * @param view - DataView
 * @param offset - データオフセット
 * @param littleEndian - リトルエンディアンかどうか
 * @returns 度数
 */
function rationalsToDegrees(view: DataView, offset: number, littleEndian: boolean): number {
  const deg = readUint32(view, offset, littleEndian) / readUint32(view, offset + 4, littleEndian);
  const min = readUint32(view, offset + 8, littleEndian) / readUint32(view, offset + 12, littleEndian);
  const sec = readUint32(view, offset + 16, littleEndian) / readUint32(view, offset + 20, littleEndian);
  return deg + min / 60 + sec / 3600;
}

/**
 * IFD を解析してエントリを返す
 * @param view - DataView
 * @param ifdOffset - IFD のオフセット（TIFF ベースからの相対位置）
 * @param tiffBase - TIFF データの絶対開始位置
 * @param littleEndian - リトルエンディアンかどうか
 * @param tagMap - タグ名マップ
 * @param category - カテゴリ
 */
function parseIFD(
  view: DataView,
  ifdOffset: number,
  tiffBase: number,
  littleEndian: boolean,
  tagMap: Record<number, string>,
  category: ExifEntry['category']
): { entries: ExifEntry[]; exifIFDOffset: number | null; gpsIFDOffset: number | null } {
  const entries: ExifEntry[] = [];
  let exifIFDOffset: number | null = null;
  let gpsIFDOffset: number | null = null;

  try {
    const entryCount = readUint16(view, tiffBase + ifdOffset, littleEndian);
    const ifdStart = tiffBase + ifdOffset + 2;

    for (let i = 0; i < entryCount; i++) {
      const entryOffset = ifdStart + i * 12;
      if (entryOffset + 12 > view.byteLength) break;

      const tagId = readUint16(view, entryOffset, littleEndian);
      const type = readUint16(view, entryOffset + 2, littleEndian);
      const count = readUint32(view, entryOffset + 4, littleEndian);
      const valueOffset = entryOffset + 8;

      if (tagId === 0x8769) {
        exifIFDOffset = readUint32(view, valueOffset, littleEndian);
        continue;
      }
      if (tagId === 0x8825) {
        gpsIFDOffset = readUint32(view, valueOffset, littleEndian);
        continue;
      }

      const tagName = tagMap[tagId];
      if (!tagName) continue;

      const rawValue = readValue(view, valueOffset, type, count, tiffBase, littleEndian);
      let displayValue = rawValue;

      // 特定タグの値を人間が読みやすい形式に変換
      if (tagId === 0x0112 && category === 'basic') {
        displayValue = ORIENTATIONS[parseInt(rawValue)] ?? rawValue;
      } else if (tagId === 0x8822) {
        displayValue = EXPOSURE_PROGRAMS[parseInt(rawValue)] ?? rawValue;
      } else if (tagId === 0x9207) {
        displayValue = METERING_MODES[parseInt(rawValue)] ?? rawValue;
      } else if (tagId === 0xa001) {
        displayValue = parseInt(rawValue) === 1 ? 'sRGB' : parseInt(rawValue) === 65535 ? '未較正' : rawValue;
      } else if (tagId === 0xa402) {
        const modes: Record<number, string> = { 0: '自動', 1: 'マニュアル', 2: '自動ブラケット' };
        displayValue = modes[parseInt(rawValue)] ?? rawValue;
      } else if (tagId === 0xa403) {
        displayValue = parseInt(rawValue) === 0 ? '自動' : 'マニュアル';
      } else if (tagId === 0x9209) {
        const flashVal = parseInt(rawValue);
        if (!isNaN(flashVal)) {
          const fired = (flashVal & 0x01) !== 0;
          displayValue = fired ? 'フラッシュ発光' : 'フラッシュ未発光';
        }
      } else if (tagId === 0x829a) {
        // 露出時間を分数形式に変換
        if (rawValue.includes('/')) {
          const parts = rawValue.split('/');
          const num = parseInt(parts[0] ?? '0');
          const den = parseInt(parts[1] ?? '1');
          if (num !== 0 && den !== 0) {
            if (den / num >= 1) {
              displayValue = `1/${Math.round(den / num)} 秒`;
            } else {
              displayValue = `${(num / den).toFixed(2)} 秒`;
            }
          }
        }
      } else if (tagId === 0x829d) {
        // F値に f/ プレフィックスを追加
        if (rawValue.includes('/')) {
          const parts = rawValue.split('/');
          const num = parseFloat(parts[0] ?? '0');
          const den = parseFloat(parts[1] ?? '1');
          if (den !== 0) {
            displayValue = `f/${(num / den).toFixed(1)}`;
          }
        }
      } else if (tagId === 0x920a) {
        // 焦点距離に mm を追加
        if (rawValue.includes('/')) {
          const parts = rawValue.split('/');
          const num = parseFloat(parts[0] ?? '0');
          const den = parseFloat(parts[1] ?? '1');
          if (den !== 0) {
            displayValue = `${(num / den).toFixed(1)} mm`;
          }
        }
      } else if (tagId === 0xa405) {
        displayValue = `${rawValue} mm`;
      } else if (tagId === 0x0128 || tagId === 0xa210) {
        const units: Record<number, string> = { 1: '単位なし', 2: 'インチ', 3: 'センチメートル' };
        displayValue = units[parseInt(rawValue)] ?? rawValue;
      }

      // カテゴリを決定
      let entryCategory: ExifEntry['category'] = category;
      if (tagId === 0x9003 || tagId === 0x9004 || tagId === 0x0132) {
        entryCategory = 'datetime';
      } else if (tagId === 0x010f || tagId === 0x0110 || tagId === 0x0131 ||
                 tagId === 0xa430 || tagId === 0xa431 || tagId === 0xa432 ||
                 tagId === 0xa433 || tagId === 0xa434 || tagId === 0xa435) {
        entryCategory = 'camera';
      }

      entries.push({
        tag: tagName,
        tagId,
        value: displayValue,
        category: entryCategory,
      });
    }
  } catch {
    // 解析エラーは無視
  }

  return { entries, exifIFDOffset, gpsIFDOffset };
}

/**
 * GPS IFD を解析して座標情報を返す
 * @param view - DataView
 * @param gpsIFDOffset - GPS IFD のオフセット
 * @param tiffBase - TIFF データの開始位置
 * @param littleEndian - リトルエンディアンかどうか
 */
function parseGpsIFD(
  view: DataView,
  gpsIFDOffset: number,
  tiffBase: number,
  littleEndian: boolean
): { entries: ExifEntry[]; gps: GpsCoordinate } {
  const entries: ExifEntry[] = [];
  let latitude: number | null = null;
  let longitude: number | null = null;
  let latRef = 'N';
  let lonRef = 'E';

  try {
    const entryCount = readUint16(view, tiffBase + gpsIFDOffset, littleEndian);
    const ifdStart = tiffBase + gpsIFDOffset + 2;

    for (let i = 0; i < entryCount; i++) {
      const entryOffset = ifdStart + i * 12;
      if (entryOffset + 12 > view.byteLength) break;

      const tagId = readUint16(view, entryOffset, littleEndian);
      const type = readUint16(view, entryOffset + 2, littleEndian);
      const count = readUint32(view, entryOffset + 4, littleEndian);
      const valueOffset = entryOffset + 8;

      const tagName = GPS_TAGS[tagId];
      if (!tagName) continue;

      if (tagId === 0x0001) {
        // 緯度基準
        const ref = String.fromCharCode(view.getUint8(valueOffset));
        latRef = ref;
        entries.push({ tag: tagName, tagId, value: ref === 'N' ? '北緯' : '南緯', category: 'gps' });
        continue;
      }
      if (tagId === 0x0003) {
        // 経度基準
        const ref = String.fromCharCode(view.getUint8(valueOffset));
        lonRef = ref;
        entries.push({ tag: tagName, tagId, value: ref === 'E' ? '東経' : '西経', category: 'gps' });
        continue;
      }

      if (tagId === 0x0002 && type === EXIF_TYPES.RATIONAL && count === 3) {
        // 緯度
        const dataOffset = tiffBase + readUint32(view, valueOffset, littleEndian);
        const deg = rationalsToDegrees(view, dataOffset, littleEndian);
        latitude = deg;
        entries.push({
          tag: tagName,
          tagId,
          value: `${deg.toFixed(6)}°`,
          category: 'gps',
        });
        continue;
      }
      if (tagId === 0x0004 && type === EXIF_TYPES.RATIONAL && count === 3) {
        // 経度
        const dataOffset = tiffBase + readUint32(view, valueOffset, littleEndian);
        const deg = rationalsToDegrees(view, dataOffset, littleEndian);
        longitude = deg;
        entries.push({
          tag: tagName,
          tagId,
          value: `${deg.toFixed(6)}°`,
          category: 'gps',
        });
        continue;
      }
      if (tagId === 0x0006 && type === EXIF_TYPES.RATIONAL) {
        // 高度
        const dataOffset = tiffBase + readUint32(view, valueOffset, littleEndian);
        const num = readUint32(view, dataOffset, littleEndian);
        const den = readUint32(view, dataOffset + 4, littleEndian);
        const altitude = den !== 0 ? (num / den).toFixed(1) : '0';
        entries.push({ tag: tagName, tagId, value: `${altitude} m`, category: 'gps' });
        continue;
      }

      const rawValue = readValue(view, valueOffset, type, count, tiffBase, littleEndian);
      entries.push({ tag: tagName, tagId, value: rawValue, category: 'gps' });
    }
  } catch {
    // GPS 解析エラーは無視
  }

  // GPS 座標に符号を適用
  if (latitude !== null && latRef === 'S') latitude = -latitude;
  if (longitude !== null && lonRef === 'W') longitude = -longitude;

  const mapsUrl =
    latitude !== null && longitude !== null
      ? `https://www.google.com/maps?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`
      : null;

  return { entries, gps: { latitude, longitude, mapsUrl } };
}

/**
 * JPEG ファイルから APP1 セグメントのオフセットと長さを取得する
 * @param buffer - ArrayBuffer
 * @returns APP1 セグメントの情報（見つからない場合は null）
 */
function findApp1Segment(buffer: ArrayBuffer): { offset: number; length: number } | null {
  const view = new DataView(buffer);

  // JPEG ヘッダー確認
  if (view.getUint16(0) !== 0xffd8) return null;

  let offset = 2;
  while (offset < buffer.byteLength - 4) {
    const marker = view.getUint16(offset);
    const segmentLength = view.getUint16(offset + 2);

    if (marker === 0xffe1) {
      // APP1 セグメント発見
      // "Exif\0\0" を確認
      if (offset + 10 < buffer.byteLength) {
        const exifHeader = String.fromCharCode(
          view.getUint8(offset + 4),
          view.getUint8(offset + 5),
          view.getUint8(offset + 6),
          view.getUint8(offset + 7)
        );
        if (exifHeader === 'Exif') {
          return { offset, length: segmentLength + 2 };
        }
      }
    }

    // 次のセグメントへ
    if (marker === 0xffda) break; // SOS マーカーで終了
    offset += 2 + segmentLength;
  }

  return null;
}

/**
 * ArrayBuffer から EXIF データを解析する
 * @param buffer - 画像ファイルの ArrayBuffer
 * @returns EXIF 解析結果
 */
export function parseExif(buffer: ArrayBuffer): ExifData {
  const view = new DataView(buffer);
  const noExif: ExifData = {
    entries: [],
    gps: { latitude: null, longitude: null, mapsUrl: null },
    hasExif: false,
  };

  // JPEG ヘッダー確認
  if (buffer.byteLength < 4 || view.getUint16(0) !== 0xffd8) return noExif;

  let offset = 2;
  let tiffBase = -1;

  // APP1 セグメントを探す
  while (offset < buffer.byteLength - 4) {
    const marker = view.getUint16(offset);

    if (marker === 0xffe1) {
      const segmentLength = view.getUint16(offset + 2);
      // "Exif\0\0" 確認
      if (offset + 10 < buffer.byteLength) {
        const e = view.getUint8(offset + 4);
        const x = view.getUint8(offset + 5);
        const i1 = view.getUint8(offset + 6);
        const f = view.getUint8(offset + 7);
        if (e === 0x45 && x === 0x78 && i1 === 0x69 && f === 0x66) {
          tiffBase = offset + 10; // "Exif\0\0" の後
          break;
        }
      }
      offset += 2 + segmentLength;
    } else if ((marker & 0xff00) === 0xff00) {
      if (marker === 0xffda) break;
      if (offset + 4 > buffer.byteLength) break;
      const segmentLength = view.getUint16(offset + 2);
      offset += 2 + segmentLength;
    } else {
      break;
    }
  }

  if (tiffBase < 0) return noExif;

  // TIFF ヘッダー解析
  if (tiffBase + 8 > buffer.byteLength) return noExif;

  const byteOrder = view.getUint16(tiffBase);
  let littleEndian: boolean;

  if (byteOrder === 0x4949) {
    littleEndian = true; // "II" = Intel = リトルエンディアン
  } else if (byteOrder === 0x4d4d) {
    littleEndian = false; // "MM" = Motorola = ビッグエンディアン
  } else {
    return noExif;
  }

  // 0x002A マジックナンバー確認
  if (readUint16(view, tiffBase + 2, littleEndian) !== 0x002a) return noExif;

  // 第一 IFD へのオフセット
  const ifd0Offset = readUint32(view, tiffBase + 4, littleEndian);

  // IFD0 を解析
  const { entries: ifd0Entries, exifIFDOffset, gpsIFDOffset } = parseIFD(
    view,
    ifd0Offset,
    tiffBase,
    littleEndian,
    { ...TAGS },
    'basic'
  );

  let allEntries: ExifEntry[] = [...ifd0Entries];
  let gps: GpsCoordinate = { latitude: null, longitude: null, mapsUrl: null };

  // Exif IFD を解析
  if (exifIFDOffset !== null) {
    const { entries: exifEntries } = parseIFD(
      view,
      exifIFDOffset,
      tiffBase,
      littleEndian,
      EXIF_TAGS,
      'other'
    );
    allEntries = [...allEntries, ...exifEntries];
  }

  // GPS IFD を解析
  if (gpsIFDOffset !== null) {
    const { entries: gpsEntries, gps: gpsData } = parseGpsIFD(
      view,
      gpsIFDOffset,
      tiffBase,
      littleEndian
    );
    allEntries = [...allEntries, ...gpsEntries];
    gps = gpsData;
  }

  return {
    entries: allEntries,
    gps,
    hasExif: allEntries.length > 0,
  };
}

/**
 * JPEG ファイルから EXIF データを除去した新しい Blob を返す
 * @param buffer - 元画像の ArrayBuffer
 * @returns EXIF を除去した Blob（元がJPEGでない場合は null）
 */
export function stripExif(buffer: ArrayBuffer): Blob | null {
  const view = new DataView(buffer);

  // JPEG 確認
  if (buffer.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null;

  const segments: ArrayBuffer[] = [];
  // JPEG SOI マーカー
  segments.push(buffer.slice(0, 2));

  let offset = 2;
  while (offset < buffer.byteLength - 2) {
    if (view.getUint8(offset) !== 0xff) break;

    const marker = view.getUint16(offset);

    // SOS (Start of Scan) 以降はそのまま追加
    if (marker === 0xffda) {
      segments.push(buffer.slice(offset));
      break;
    }

    // マーカーオンリーセグメント（長さフィールドなし）
    if (marker === 0xffd8 || marker === 0xffd9 || (marker >= 0xffd0 && marker <= 0xffd7)) {
      segments.push(buffer.slice(offset, offset + 2));
      offset += 2;
      continue;
    }

    if (offset + 4 > buffer.byteLength) break;
    const segmentLength = view.getUint16(offset + 2);

    // APP1 (EXIF) セグメントをスキップ
    if (marker === 0xffe1 && offset + 10 < buffer.byteLength) {
      const e = view.getUint8(offset + 4);
      const x = view.getUint8(offset + 5);
      const i1 = view.getUint8(offset + 6);
      const f = view.getUint8(offset + 7);
      if (e === 0x45 && x === 0x78 && i1 === 0x69 && f === 0x66) {
        offset += 2 + segmentLength;
        continue;
      }
    }

    segments.push(buffer.slice(offset, offset + 2 + segmentLength));
    offset += 2 + segmentLength;
  }

  const totalLength = segments.reduce((sum, seg) => sum + seg.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const seg of segments) {
    result.set(new Uint8Array(seg), pos);
    pos += seg.byteLength;
  }

  return new Blob([result], { type: 'image/jpeg' });
}

/**
 * EXIF エントリをカテゴリ別にグループ化する
 * @param entries - EXIF エントリの配列
 * @returns カテゴリ別にグループ化されたオブジェクト
 */
export function groupEntriesByCategory(entries: ExifEntry[]): {
  camera: ExifEntry[];
  datetime: ExifEntry[];
  gps: ExifEntry[];
  basic: ExifEntry[];
  other: ExifEntry[];
} {
  return {
    camera: entries.filter((e) => e.category === 'camera'),
    datetime: entries.filter((e) => e.category === 'datetime'),
    gps: entries.filter((e) => e.category === 'gps'),
    basic: entries.filter((e) => e.category === 'basic'),
    other: entries.filter((e) => e.category === 'other'),
  };
}

/**
 * JPEG ファイルかどうかを確認する
 * @param file - ファイル
 * @returns JPEG の場合は true
 */
export function isJpegFile(file: File): boolean {
  return file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') ||
    file.name.toLowerCase().endsWith('.jpeg');
}

/**
 * APP1 セグメントの有無を確認する（エクスポートされた関数）
 * @param buffer - ArrayBuffer
 * @returns APP1 セグメントが存在する場合は true
 */
export { findApp1Segment };
