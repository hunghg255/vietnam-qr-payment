import { useCallback, useRef, useState } from 'react';

import * as htmlToImage from 'html-to-image';
import html2canvas from 'html2canvas';
import Form, { Field } from 'rc-field-form';
import Select from 'rc-select';
import { QRCode } from 'react-qrcode-logo';
import { genCodeVietQr } from 'vn-qr-pay';

import { BanksOptions, normalizeNumber } from '@/utils';
import './App.css';

function App() {
  const [form] = Form.useForm();
  const ref = useRef<any>(null);
  const [qrValue, setQrValue] = useState(
    '00020101021238540010A00000072701240006970407011078682551970208QRIBFTTA5303704540410005802VN62280824Give Hung a cup of coffe6304BF2C',
  );
  const [logo, setLogo] = useState('https://cdn.jsdelivr.net/gh/hunghg255/static/logo-h.png');
  const bankSelected = Form.useWatch(['bank'], form);
  const account = Form.useWatch(['account'], form);

  const bankInfo = BanksOptions?.find((item) => item?.value === bankSelected);

  const onFieldsChange = () => {
    const values = form.getFieldsValue();

    if (values?.bank && values?.account && values?.amount) {
      const qrValue = genCodeVietQr({
        bank: values.bank,
        account: values.account,
        amount: values.amount,
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

  const onDownload = useCallback(() => {
    if (ref.current === null) {
      return;
    }

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
          link.download = 'demo.png';
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
  }, [ref]);

  return (
    <div className='App'>
      <div className='qrCode' id='qrCode'>
        <QRCode
          ref={ref}
          value={qrValue}
          logoImage={logo}
          size={350}
          fgColor='white'
          bgColor='black'
          qrStyle='dots'
          logoWidth={50}
          logoHeight={50}
          logoPadding={10}
          logoPaddingStyle='circle'
          removeQrCodeBehindLogo={true}
          enableCORS={true}
        />
        {account && <p>Tài khoản: {account}</p>}
        {bankInfo?.label && <p>{bankInfo?.label}</p>}
      </div>

      <button onClick={onDownload}>Download</button>
      <br />
      <br />

      <div className='wrap'>
        <Form onFieldsChange={onFieldsChange} form={form}>
          <div className='mb-24'>
            <label htmlFor=''>Chọn logo</label>
            <input
              type='file'
              className='input-text'
              onChange={onChangeLogo}
              accept='.png, .jpeg, .jpg'
            />
          </div>

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
              <input type='tel' className='input-text' />
            </Field>
          </div>

          <div className='mb-24'>
            <label htmlFor=''>Số tiền</label>

            <Field name={'amount'} normalize={normalizeNumber}>
              <input type='tel' className='input-text' />
            </Field>
          </div>

          <div className='mb-24'>
            <label htmlFor=''>Tin nhắn</label>

            <Field name={'message'}>
              <input className='input-text' />
            </Field>
          </div>
        </Form>
      </div>

      <div className='result'></div>
    </div>
  );
}

export default App;
