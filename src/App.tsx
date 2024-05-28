/* eslint-disable require-await */
/* eslint-disable multiline-ternary */
import { useCallback, useEffect, useState } from 'react';

import { drawDOM, exportImage } from '@progress/kendo-drawing';
import Form, { Field } from 'rc-field-form';
import Select from 'rc-select';
import { QRCode } from 'react-qrcode-logo';
import { encodeVietQr } from 'vn-qr-pay';

import { BanksOptions, formatedCurrency, normalizeNumber } from '@/utils';
import { compress, decompress } from '@/utils/lama';

import './App.css';

function App() {
  const [form] = Form.useForm();
  const [qrValue, setQrValue] = useState(
    '00020101021238540010A00000072701240006970407011078682551970208QRIBFTTA5303704540410005802VN62280824Give Hung a cup of coffe6304BF2C',
  );
  const [logo, setLogo] = useState('https://cdn.jsdelivr.net/gh/hunghg255/static/logo-h.png');
  const [bg, setBg] = useState('');
  const bankSelected = Form.useWatch(['bank'], form);
  const name = Form.useWatch(['name'], form);
  const account = Form.useWatch(['account'], form);
  const amount = Form.useWatch(['amount'], form);
  const qr_type = Form.useWatch(['qr_type'], form);
  const message = Form.useWatch(['message'], form);

  const bankInfo = BanksOptions?.find((item) => item?.value === bankSelected);

  useEffect(() => {
    const data = window.location.hash.replace('#', '');
    if (data) {
      decompress(data, (decompressed: any) => {
        const d: any = JSON.parse(decompressed);
        if (d?.allValues) {
          form.setFields(
            Object.keys(d?.allValues).map((key) => ({ name: key, value: d?.allValues[key] })),
          );
        }
        if (d?.qrValue) {
          setQrValue(d?.qrValue);
        }
        if (d?.bg) {
          setBg(d?.bg);
        }
        if (d?.logo) {
          setLogo(d?.logo);
        }
      });
    }
  }, []);

  const onFieldsChange = () => {
    const values = form.getFieldsValue();

    if (values?.qr_type === 1 && values?.url) {
      setQrValue(values?.url);
      return;
    }

    if (values?.bank && values?.account) {
      const qrValue = encodeVietQr({
        bank: values.bank,
        account: values.account,
        amount: values?.amount ?? '0',
        additionalData: {
          purpose: values.message,
        },
      });

      setQrValue(qrValue);
    }
  };

  const onChangeLogo = (e: any) => {
    const file = e.target.files[0];
    // convert file to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    // eslint-disable-next-line unicorn/prefer-add-event-listener
    reader.onload = () => {
      setLogo(reader.result as string);
    };
  };

  const onChangeBg = (e: any) => {
    const file = e.target.files[0];
    // convert file to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    // eslint-disable-next-line unicorn/prefer-add-event-listener
    reader.onload = () => {
      setBg(reader.result as string);
    };
  };

  const onDownload = useCallback(async () => {
    drawDOM(document.querySelector('#qrCode') as HTMLElement, {})
      .then((g) => exportImage(g))
      .then((data) => {
        // base 6pdf download
        const downloadLink = document.createElement('a');
        const fileName = 'qrcode.png';

        downloadLink.href = data;
        downloadLink.download = fileName;
        downloadLink.click();
      });
  }, []);

  const onCopyLink = async () => {
    const allValues = form.getFieldsValue();

    compress(
      JSON.stringify({
        qrValue,
        logo,
        bg,
        allValues,
      }),
      (compressed: any) => {
        navigator.clipboard.writeText(`${window.location.origin}/#${compressed}`);
      },
    );
  };

  return (
    <div className='App'>
      <div className='qrCode' id='qrCode'>
        <div className='qrBorder'>
          <QRCode
            value={qrValue}
            logoImage={logo}
            size={240}
            fgColor={bg ? 'black' : 'white'}
            bgColor={bg ? 'transparent' : 'black'}
            qrStyle='dots'
            logoWidth={50}
            logoHeight={50}
            logoPadding={10}
            logoPaddingStyle='circle'
            removeQrCodeBehindLogo={true}
            enableCORS={true}
          />

          {bg && <img src={bg} alt='' className='imgBg' />}
        </div>

        <div className='bankInfoWrap'>
          <div className='bankImgWrap'>
            {bankInfo?.label && (
              <>
                <img className='bankImg' src={bankInfo?.icon} alt='' />
                <p>{bankInfo?.shortName}</p>
              </>
            )}
          </div>

          <div className='bankInfo'>
            {name && (
              <p className='userName'>
                <img
                  src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZD0iTTEyIDExcS44MjUgMCAxLjQxMy0uNTg4UTE0IDkuODI1IDE0IDl0LS41ODctMS40MTNRMTIuODI1IDcgMTIgN3EtLjgyNSAwLTEuNDEyLjU4N1ExMCA4LjE3NSAxMCA5cTAgLjgyNS41ODggMS40MTJRMTEuMTc1IDExIDEyIDExWm0wIDJxLTEuNjUgMC0yLjgyNS0xLjE3NVE4IDEwLjY1IDggOXEwLTEuNjUgMS4xNzUtMi44MjVRMTAuMzUgNSAxMiA1cTEuNjUgMCAyLjgyNSAxLjE3NVExNiA3LjM1IDE2IDlxMCAxLjY1LTEuMTc1IDIuODI1UTEzLjY1IDEzIDEyIDEzWm0wIDExcS0yLjQ3NSAwLTQuNjYyLS45MzhxLTIuMTg4LS45MzctMy44MjUtMi41NzRRMS44NzUgMTguODUuOTM4IDE2LjY2M1EwIDE0LjQ3NSAwIDEydC45MzgtNC42NjNxLjkzNy0yLjE4NyAyLjU3NS0zLjgyNVE1LjE1IDEuODc1IDcuMzM4LjkzOFE5LjUyNSAwIDEyIDB0NC42NjMuOTM4cTIuMTg3LjkzNyAzLjgyNSAyLjU3NHExLjYzNyAxLjYzOCAyLjU3NCAzLjgyNVEyNCA5LjUyNSAyNCAxMnQtLjkzOCA0LjY2M3EtLjkzNyAyLjE4Ny0yLjU3NCAzLjgyNXEtMS42MzggMS42MzctMy44MjUgMi41NzRRMTQuNDc1IDI0IDEyIDI0Wm0wLTJxMS44IDAgMy4zNzUtLjU3NVQxOC4yNSAxOS44cS0uODI1LS45MjUtMi40MjUtMS42MTJxLTEuNi0uNjg4LTMuODI1LS42ODh0LTMuODI1LjY4OHEtMS42LjY4Ny0yLjQyNSAxLjYxMnExLjMgMS4wNSAyLjg3NSAxLjYyNVQxMiAyMlptLTcuNy0zLjZxMS4yLTEuMyAzLjIyNS0yLjFxMi4wMjUtLjggNC40NzUtLjhxMi40NSAwIDQuNDYzLjhxMi4wMTIuOCAzLjIxMiAyLjFxMS4xLTEuMzI1IDEuNzEzLTIuOTVRMjIgMTMuODI1IDIyIDEycTAtMi4wNzUtLjc4OC0zLjg4N3EtLjc4Ny0xLjgxMy0yLjE1LTMuMTc1cS0xLjM2Mi0xLjM2My0zLjE3NS0yLjE1MVExNC4wNzUgMiAxMiAycS0yLjA1IDAtMy44NzUuNzg3cS0xLjgyNS43ODgtMy4xODcgMi4xNTFRMy41NzUgNi4zIDIuNzg4IDguMTEzUTIgOS45MjUgMiAxMnEwIDEuODI1LjYgMy40NjNxLjYgMS42MzcgMS43IDIuOTM3WiIvPjwvc3ZnPg=='
                  alt=''
                />
                <span>{name}</span>
              </p>
            )}
            {account && (
              <p className='accountNumber'>
                <img
                  src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZD0iTTUgMTZ2LTVxMC0uNDI1LjI4OC0uNzEyVDYgMTBxLjQyNSAwIC43MTMuMjg4VDcgMTF2NXEwIC40MjUtLjI4OC43MTNUNiAxN3EtLjQyNSAwLS43MTItLjI4OFQ1IDE2bTYgMHYtNXEwLS40MjUuMjg4LS43MTJUMTIgMTBxLjQyNSAwIC43MTMuMjg4VDEzIDExdjVxMCAuNDI1LS4yODguNzEzVDEyIDE3cS0uNDI1IDAtLjcxMi0uMjg4VDExIDE2bS04IDVxLS40MjUgMC0uNzEyLS4yODhUMiAyMHEwLS40MjUuMjg4LS43MTJUMyAxOWgxOHEuNDI1IDAgLjcxMy4yODhUMjIgMjBxMCAuNDI1LS4yODguNzEzVDIxIDIxem0xNC01di01cTAtLjQyNS4yODgtLjcxMlQxOCAxMHEuNDI1IDAgLjcxMy4yODhUMTkgMTF2NXEwIC40MjUtLjI4OC43MTNUMTggMTdxLS40MjUgMC0uNzEyLS4yODhUMTcgMTZtNC04SDIuOXEtLjM3NSAwLS42MzgtLjI2MlQyIDcuMXYtLjU1cTAtLjI3NS4xMzgtLjQ3NVQyLjUgNS43NWw4LjYtNC4zcS40MjUtLjIuOS0uMnQuOS4ybDguNTUgNC4yNzVxLjI3NS4xMjUuNDEzLjM3NXQuMTM3LjUyNVY3cTAgLjQyNS0uMjg3LjcxM1QyMSA4TTYuNDUgNmgxMS4xem0wIDBoMTEuMUwxMiAzLjI1eiIvPjwvc3ZnPg=='
                  alt=''
                />

                <span>{account}</span>
              </p>
            )}
            {amount && (
              <p className='money'>
                <img
                  src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxnIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41Ij48cGF0aCBkPSJNMy4xNzIgMjAuODI4QzQuMzQzIDIyIDYuMjI5IDIyIDEwIDIyaDRjMy43NzEgMCA1LjY1NyAwIDYuODI4LTEuMTcyQzIyIDE5LjY1NyAyMiAxNy43NzEgMjIgMTRjMC0xLjE3IDAtMi4xNTgtLjAzNS0zbS0xLjEzNy0zLjgyOEMxOS42NTcgNiAxNy43NzEgNiAxNCA2aC00QzYuMjI5IDYgNC4zNDMgNiAzLjE3MiA3LjE3MkMyIDguMzQzIDIgMTAuMjI5IDIgMTRjMCAxLjE3IDAgMi4xNTguMDM1IDNNMTIgMmMxLjg4NiAwIDIuODI4IDAgMy40MTQuNTg2QzE2IDMuMTcyIDE2IDQuMTE0IDE2IDZNOC41ODYgMi41ODZDOCAzLjE3MiA4IDQuMTE0IDggNiIvPjxwYXRoIGQ9Ik0xMiAxNy4zMzNjMS4xMDUgMCAyLS43NDYgMi0xLjY2NmMwLS45Mi0uODk1LTEuNjY3LTItMS42NjdzLTItLjc0Ni0yLTEuNjY3YzAtLjkyLjg5NS0xLjY2NiAyLTEuNjY2bTAgNi42NjZjLTEuMTA1IDAtMi0uNzQ2LTItMS42NjZtMiAxLjY2NlYxOG0wLTh2LjY2N20wIDBjMS4xMDUgMCAyIC43NDYgMiAxLjY2NiIvPjwvZz48L3N2Zz4='
                  alt=''
                />

                <span> {formatedCurrency.format(amount)}</span>
              </p>
            )}
            {message && (
              <p className='note'>
                <img
                  src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZD0iTTUuOTUgMTlxLTIuNS0uMTI1LTMuNzI1LTEuMDVUMSAxNS4yNzVxMC0xLjYyNSAxLjMzOC0yLjYzN3QzLjcxMi0xLjIxM3EuOTc1LS4wNzUgMS40NjMtLjMxMlQ4IDEwLjQ1cTAtLjY1LS43MzctLjk3NVQ0LjgyNSA5TDUgN3EyLjU3NS4yIDMuNzg4IDEuMDM4VDEwIDEwLjQ1cTAgMS4zMjUtLjk2MiAyLjA3NXQtMi44MzguOXEtMS42LjEyNS0yLjQuNTg4VDMgMTUuMjc1cTAgLjg3NS43IDEuMjYzVDYuMDUgMTd6bTcuOTI1LS43NUw5Ljc1IDE0LjEyNUwxOC4zNzUgNS41cS41LS41IDEuMTg4LS41dDEuMTg3LjVsMS43NSAxLjc1cS41LjUuNSAxLjE4OHQtLjUgMS4xODd6TTguOTc1IDIwcS0uNDI1LjEtLjc1LS4yMjVUOCAxOS4wMjVsLjc3NS0zLjc3NWwzLjk1IDMuOTV6Ii8+PC9zdmc+'
                  alt=''
                />

                <span>{message}</span>
              </p>
            )}
          </div>
        </div>

        {/* {name && <p>{name}</p>}
        {account && <p>STK: {account}</p>}
        {amount && <p>Số tiền: {formatedCurrency.format(amount)}</p>}
        {message && <p>Lời nhắn: {message}</p>} */}
      </div>

      <button onClick={onDownload}>Download</button>
      <button
        onClick={onCopyLink}
        style={{
          marginLeft: '20px',
        }}
      >
        Copy Link
      </button>
      <br />
      <br />

      <div className='wrap'>
        <Form
          onFieldsChange={onFieldsChange}
          form={form}
          initialValues={{
            qr_type: 0,
          }}
        >
          <div className='mb-24'>
            <label htmlFor=''>Kiểu QR </label>
            <Field name={'qr_type'}>
              <Select
                className='select'
                placeholder='Loại QR'
                options={[
                  { value: 0, label: 'Ngân hàng' },
                  { value: 1, label: 'URL' },
                ]}
              />
            </Field>
          </div>

          {qr_type === 1 ? (
            <>
              <div className='mb-24'>
                <label htmlFor=''>URL</label>

                <Field name={'url'}>
                  <input className='input-text' placeholder='URL' />
                </Field>
              </div>
            </>
          ) : (
            <>
              <div className='mb-24'>
                <label htmlFor=''>Ngân hàng</label>
                <Field name={'bank'}>
                  <Select className='select' placeholder='Chọn ngân hàng' showSearch>
                    {BanksOptions.map((item, index) => {
                      return (
                        <Select.Option key={index} value={item.value}>
                          <div className='bankItem'>
                            <img src={item.icon} alt='' />
                            <span>{item.label}</span>
                          </div>
                        </Select.Option>
                      );
                    })}
                  </Select>
                </Field>
              </div>

              <div className='mb-24'>
                <label htmlFor=''>Tên tài khoản</label>
                <Field name={'name'}>
                  <input type='text' className='input-text' placeholder='Tên tài khoản' />
                </Field>
              </div>

              <div className='mb-24'>
                <label htmlFor=''>Số tài khoản</label>
                <Field name={'account'} normalize={normalizeNumber}>
                  <input type='tel' className='input-text' placeholder='Số tài khoản' />
                </Field>
              </div>

              <div className='mb-24'>
                <label htmlFor=''>Số tiền</label>

                <Field name={'amount'} normalize={normalizeNumber}>
                  <input type='tel' className='input-text' placeholder='Số tiền' />
                </Field>
              </div>

              <div className='mb-24'>
                <label htmlFor=''>Lời nhắn</label>

                <Field name={'message'}>
                  <input className='input-text' placeholder='Lời nhắn' />
                </Field>
              </div>
            </>
          )}

          <div className='mb-24'>
            <label htmlFor=''>Logo</label>
            <input
              type='file'
              className='input-text'
              onChange={onChangeLogo}
              accept='.png, .jpeg, .jpg'
            />
          </div>

          <div className='mb-24'>
            <label htmlFor=''>Background</label>
            <input
              type='file'
              className='input-text'
              onChange={onChangeBg}
              accept='.png, .jpeg, .jpg'
            />
          </div>
        </Form>
      </div>

      <div className='result'></div>
    </div>
  );
}

export default App;
