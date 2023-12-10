/* eslint-disable multiline-ternary */
import { useCallback, useEffect, useState } from 'react';

import { toPng } from 'dom-to-images';
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
    const url = await toPng(document.querySelector('#qrCode') as HTMLElement);
    const link = document.createElement('a');
    link.download = 'qr-payment.png';
    link.href = url;
    link.click();
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
        {bankInfo?.label && (
          <p className='bankInfoLabel'>
            <img src={bankInfo?.icon} alt='' />
            <span>{bankInfo?.shortName}</span>
          </p>
        )}
        {name && <p>{name}</p>}
        {account && <p>STK: {account}</p>}
        {amount && <p>Số tiền: {formatedCurrency.format(amount)}</p>}
        {message && <p>Lời nhắn: {message}</p>}
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
