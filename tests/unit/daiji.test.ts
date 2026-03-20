import { describe, it, expect } from 'vitest';
import { toDaiji, fromDaiji } from '../../app/utils/daiji';

describe('toDaiji - アラビア数字 → 大字', () => {
  it('零を正しく変換する', () => {
    expect(toDaiji('0')).toBe('零');
    expect(toDaiji('00')).toBe('零');
  });

  it('一桁の数字を正しく変換する', () => {
    expect(toDaiji('1')).toBe('壱');
    expect(toDaiji('2')).toBe('弐');
    expect(toDaiji('3')).toBe('参');
    expect(toDaiji('4')).toBe('肆');
    expect(toDaiji('5')).toBe('伍');
    expect(toDaiji('6')).toBe('陸');
    expect(toDaiji('7')).toBe('漆');
    expect(toDaiji('8')).toBe('捌');
    expect(toDaiji('9')).toBe('玖');
  });

  it('十・百・千を正しく変換する', () => {
    expect(toDaiji('10')).toBe('壱拾');
    expect(toDaiji('100')).toBe('壱佰');
    expect(toDaiji('1000')).toBe('壱仟');
  });

  it('複合数を正しく変換する', () => {
    expect(toDaiji('11')).toBe('壱拾壱');
    expect(toDaiji('99')).toBe('玖拾玖');
    expect(toDaiji('123')).toBe('壱佰弐拾参');
    expect(toDaiji('1234')).toBe('壱仟弐佰参拾肆');
    expect(toDaiji('9999')).toBe('玖仟玖佰玖拾玖');
  });

  it('万単位を正しく変換する', () => {
    expect(toDaiji('10000')).toBe('壱萬');
    expect(toDaiji('12345')).toBe('壱萬弐仟参佰肆拾伍');
    expect(toDaiji('100000')).toBe('壱拾萬');
    expect(toDaiji('1000000')).toBe('壱佰萬');
    expect(toDaiji('9999999')).toBe('玖佰玖拾玖萬玖仟玖佰玖拾玖');
  });

  it('億・兆・京単位を正しく変換する', () => {
    expect(toDaiji('100000000')).toBe('壱億');
    expect(toDaiji('1000000000000')).toBe('壱兆');
    expect(toDaiji('10000000000000000')).toBe('壱京');
  });

  it('中間に0があるグループを正しくスキップする', () => {
    expect(toDaiji('100000001')).toBe('壱億壱');
    expect(toDaiji('10001')).toBe('壱萬壱');
  });

  it('負の数を正しく変換する', () => {
    expect(toDaiji('-1')).toBe('マイナス壱');
    expect(toDaiji('-1234')).toBe('マイナス壱仟弐佰参拾肆');
  });

  it('先頭ゼロを正規化する', () => {
    expect(toDaiji('001')).toBe('壱');
    expect(toDaiji('000123')).toBe('壱佰弐拾参');
  });

  it('無効な入力にnullを返す', () => {
    expect(toDaiji('')).toBeNull();
    expect(toDaiji('abc')).toBeNull();
    expect(toDaiji('12.34')).toBeNull();
    expect(toDaiji('1'.repeat(21))).toBeNull(); // 21桁以上
  });
});

describe('fromDaiji - 大字 → アラビア数字', () => {
  it('零を正しく変換する', () => {
    expect(fromDaiji('零')).toBe('0');
    expect(fromDaiji('〇')).toBe('0');
  });

  it('一桁の大字を正しく変換する', () => {
    expect(fromDaiji('壱')).toBe('1');
    expect(fromDaiji('弐')).toBe('2');
    expect(fromDaiji('参')).toBe('3');
    expect(fromDaiji('肆')).toBe('4');
    expect(fromDaiji('伍')).toBe('5');
    expect(fromDaiji('陸')).toBe('6');
    expect(fromDaiji('漆')).toBe('7');
    expect(fromDaiji('捌')).toBe('8');
    expect(fromDaiji('玖')).toBe('9');
  });

  it('位単位を含む大字を正しく変換する', () => {
    expect(fromDaiji('壱拾')).toBe('10');
    expect(fromDaiji('壱佰')).toBe('100');
    expect(fromDaiji('壱仟')).toBe('1000');
  });

  it('複合大字を正しく変換する', () => {
    expect(fromDaiji('壱佰弐拾参')).toBe('123');
    expect(fromDaiji('壱仟弐佰参拾肆')).toBe('1234');
    expect(fromDaiji('玖仟玖佰玖拾玖')).toBe('9999');
  });

  it('万単位を含む大字を正しく変換する', () => {
    expect(fromDaiji('壱萬')).toBe('10000');
    expect(fromDaiji('壱萬弐仟参佰肆拾伍')).toBe('12345');
  });

  it('億・兆・京単位を含む大字を正しく変換する', () => {
    expect(fromDaiji('壱億')).toBe('100000000');
    expect(fromDaiji('壱兆')).toBe('1000000000000');
    expect(fromDaiji('壱京')).toBe('10000000000000000');
  });

  it('通常の漢数字も受け付ける', () => {
    expect(fromDaiji('一')).toBe('1');
    expect(fromDaiji('二')).toBe('2');
    expect(fromDaiji('十')).toBe('10');
    expect(fromDaiji('百')).toBe('100');
    expect(fromDaiji('千')).toBe('1000');
    expect(fromDaiji('万')).toBe('10000');
  });

  it('負の大字を正しく変換する', () => {
    expect(fromDaiji('マイナス壱')).toBe('-1');
    expect(fromDaiji('マイナス壱仟弐佰参拾肆')).toBe('-1234');
  });

  it('toDaiji との往復変換が一致する', () => {
    const testValues = ['1', '10', '100', '1000', '9999', '10000', '99999', '1234567'];
    for (const val of testValues) {
      const daiji = toDaiji(val);
      expect(daiji).not.toBeNull();
      expect(fromDaiji(daiji!)).toBe(val);
    }
  });

  it('無効な入力にnullを返す', () => {
    expect(fromDaiji('')).toBeNull();
    expect(fromDaiji('abc')).toBeNull();
  });
});
