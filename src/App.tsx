import { useCallback, useState } from 'react';

import * as htmlToImage from 'html-to-image';
import html2canvas from 'html2canvas';
import Form, { Field } from 'rc-field-form';
import Select from 'rc-select';
import { QRCode } from 'react-qrcode-logo';
import { genCodeVietQr } from 'vn-qr-pay';

import { BanksOptions, formatedCurrency, normalizeNumber } from '@/utils';
import './App.css';

function App() {
  const [form] = Form.useForm();
  const [qrValue, setQrValue] = useState(
    '00020101021238540010A00000072701240006970407011078682551970208QRIBFTTA5303704540410005802VN62280824Give Hung a cup of coffe6304BF2C',
  );
  const [logo, setLogo] = useState('https://cdn.jsdelivr.net/gh/hunghg255/static/logo-h.png');
  const [bg, setBg] = useState('');
  const bankSelected = Form.useWatch(['bank'], form);
  const account = Form.useWatch(['account'], form);
  const amount = Form.useWatch(['amount'], form);

  const bankInfo = BanksOptions?.find((item) => item?.value === bankSelected);

  const onFieldsChange = () => {
    const values = form.getFieldsValue();

    if (values?.bank && values?.account) {
      const qrValue = genCodeVietQr({
        bank: values.bank,
        account: values.account,
        amount: values?.amount ?? '0',
        message: values.message,
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

  const onDownload = useCallback(() => {
    // @ts-expect-error
    html2canvas(document.querySelector('#qrCode')).then(function (canvas) {
      const rEle = document.querySelector('.result');
      rEle?.classList.add('active');
      // @ts-expect-error
      rEle.append(canvas); // if you want see your screenshot in body.

      htmlToImage
        // @ts-expect-error
        .toPng(rEle.querySelector('canvas'), { cacheBust: true })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = 'qr-payment.png';
          link.href = dataUrl;
          link.click();
          setTimeout(() => {
            rEle?.classList.remove('active');
            canvas.remove();
          }, 50);
        })
        .catch((error) => {
          console.log(error);
        });
    });
  }, []);

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
        {account && <p>STK: {account}</p>}
        {amount && <p>Số tiền: {formatedCurrency.format(amount)}</p>}
      </div>

      <button onClick={onDownload}>Download</button>
      <br />
      <br />

      <div className='wrap'>
        <Form onFieldsChange={onFieldsChange} form={form}>
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
