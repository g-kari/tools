import { describe, expect, it } from 'vitest';
import {
  isImageFile,
  getExtensionFromMimeType,
  getFilenameWithoutExtension,
  getExtension,
} from '../../app/utils/image';

describe('isImageFile', () => {
  it('image/png は画像ファイルとして認識される', () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    expect(isImageFile(file)).toBe(true);
  });

  it('image/jpeg は画像ファイルとして認識される', () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    expect(isImageFile(file)).toBe(true);
  });

  it('image/webp は画像ファイルとして認識される', () => {
    const file = new File([''], 'test.webp', { type: 'image/webp' });
    expect(isImageFile(file)).toBe(true);
  });

  it('image/gif は画像ファイルとして認識される', () => {
    const file = new File([''], 'test.gif', { type: 'image/gif' });
    expect(isImageFile(file)).toBe(true);
  });

  it('image/svg+xml は画像ファイルとして認識される', () => {
    const file = new File([''], 'test.svg', { type: 'image/svg+xml' });
    expect(isImageFile(file)).toBe(true);
  });

  it('text/plain は画像ファイルとして認識されない', () => {
    const file = new File([''], 'test.txt', { type: 'text/plain' });
    expect(isImageFile(file)).toBe(false);
  });

  it('application/pdf は画像ファイルとして認識されない', () => {
    const file = new File([''], 'test.pdf', { type: 'application/pdf' });
    expect(isImageFile(file)).toBe(false);
  });

  it('空のMIMEタイプは画像ファイルとして認識されない', () => {
    const file = new File([''], 'test');
    expect(isImageFile(file)).toBe(false);
  });
});

describe('getExtensionFromMimeType', () => {
  it('image/png は .png を返す', () => {
    expect(getExtensionFromMimeType('image/png')).toBe('.png');
  });

  it('image/jpeg は .jpg を返す', () => {
    expect(getExtensionFromMimeType('image/jpeg')).toBe('.jpg');
  });

  it('image/webp は .webp を返す', () => {
    expect(getExtensionFromMimeType('image/webp')).toBe('.webp');
  });

  it('image/gif は .gif を返す', () => {
    expect(getExtensionFromMimeType('image/gif')).toBe('.gif');
  });

  it('image/svg+xml は .svg を返す', () => {
    expect(getExtensionFromMimeType('image/svg+xml')).toBe('.svg');
  });

  it('image/bmp は .bmp を返す', () => {
    expect(getExtensionFromMimeType('image/bmp')).toBe('.bmp');
  });

  it('image/tiff は .tiff を返す', () => {
    expect(getExtensionFromMimeType('image/tiff')).toBe('.tiff');
  });

  it('未知のMIMEタイプはデフォルト .png を返す', () => {
    expect(getExtensionFromMimeType('image/unknown')).toBe('.png');
  });

  it('画像以外のMIMEタイプはデフォルト .png を返す', () => {
    expect(getExtensionFromMimeType('text/plain')).toBe('.png');
  });

  it('空文字列はデフォルト .png を返す', () => {
    expect(getExtensionFromMimeType('')).toBe('.png');
  });
});

describe('getFilenameWithoutExtension', () => {
  it('拡張子を除いたファイル名を返す', () => {
    expect(getFilenameWithoutExtension('image.png')).toBe('image');
  });

  it('jpeg 拡張子を除く', () => {
    expect(getFilenameWithoutExtension('photo.jpeg')).toBe('photo');
  });

  it('複数のドットがあるファイル名では末尾の拡張子のみ除く', () => {
    expect(getFilenameWithoutExtension('my.photo.backup.png')).toBe('my.photo.backup');
  });

  it('拡張子がないファイル名はそのまま返す', () => {
    expect(getFilenameWithoutExtension('README')).toBe('README');
  });

  it('ドットで始まるファイル名（隠しファイル）は空文字列を返す（拡張子として扱われる）', () => {
    // .gitignore は正規表現 /\.[^/.]+$/ により拡張子 .gitignore として処理される
    expect(getFilenameWithoutExtension('.gitignore')).toBe('');
  });

  it('空文字列は空文字列を返す', () => {
    expect(getFilenameWithoutExtension('')).toBe('');
  });

  it('パスを含むファイル名では最後の拡張子のみ除く', () => {
    expect(getFilenameWithoutExtension('path/to/image.png')).toBe('path/to/image');
  });
});

describe('getExtension', () => {
  it('.png 拡張子を取得する', () => {
    expect(getExtension('image.png')).toBe('.png');
  });

  it('.jpg 拡張子を取得する', () => {
    expect(getExtension('photo.jpg')).toBe('.jpg');
  });

  it('.webp 拡張子を取得する', () => {
    expect(getExtension('image.webp')).toBe('.webp');
  });

  it('複数のドットがあるファイル名では末尾の拡張子を取得する', () => {
    expect(getExtension('my.photo.backup.png')).toBe('.png');
  });

  it('拡張子がないファイル名はデフォルト .png を返す', () => {
    expect(getExtension('README')).toBe('.png');
  });

  it('空文字列はデフォルト .png を返す', () => {
    expect(getExtension('')).toBe('.png');
  });

  it('ドットで始まる隠しファイルはデフォルト .png を返す', () => {
    // .gitignore のような場合、拡張子なしとして扱う
    expect(getExtension('.gitignore')).toBe('.gitignore');
  });

  it('大文字の拡張子もそのまま取得する', () => {
    expect(getExtension('IMAGE.PNG')).toBe('.PNG');
  });
});
