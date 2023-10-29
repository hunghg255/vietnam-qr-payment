/* eslint-disable unicorn/prefer-add-event-listener */
/* eslint-disable unicorn/prefer-code-point */
// @ts-ignore
/* eslint-disable n/no-callback-literal */
export const decompress = (base64: any, cb: any) => {
  const req = new XMLHttpRequest();
  req.open('GET', 'data:application/octet;base64,' + base64);
  req.responseType = 'arraybuffer';
  req.addEventListener('load', (e) => {
    // @ts-ignore
    window.LZMA.decompress(new Uint8Array(e.target.response), (result, err) => {
      cb(result, err);
    });
  });
  req.send();
};

// Transform a plain text string into a compressed base64 string
export const compress = (str: any, cb: any) => {
  if (str.length === 0) {
    cb('');
    return;
  }
  // @ts-ignore
  window.LZMA.compress(str, 1, (compressed, err) => {
    if (err) {
      cb(compressed, err);
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      // @ts-ignore
      cb(reader.result.slice(reader.result.indexOf(',') + 1));
    });
    reader.readAsDataURL(new Blob([new Uint8Array(compressed)]));
  });
};
