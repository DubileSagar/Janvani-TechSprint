import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/auth';
import { dbService } from '../api/db';
import { useLanguage } from '../context/LanguageContext';

const SignupForm = ({ onSignup, onSendOtp, isLoading, error, onLoginWithGoogle, onLoginWithApple }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [otp, setOtp] = React.useState('')
  const [otpSent, setOtpSent] = React.useState(false)
  const [step, setStep] = React.useState(1);
  const [localIsLoading, setLocalIsLoading] = React.useState(false);

  const handleSendOtp = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('handleSendOtp called');

    if (!phone || !name || !email) {
      alert(t('auth_enter_name_phone_email') || "Please enter Name, Phone, and Email");
      return;
    }

    setLocalIsLoading(true);
    try {

      const exists = await dbService.checkUserExists(phone);
      if (exists) {
        alert(t('auth_account_exists'));
        navigate('/');
        setLocalIsLoading(false);
        return;
      }

      console.log('Calling onSendOtp with email...');
      // Pass email for OTP, phone for record
      await onSendOtp({ email, phone });
      console.log('onSendOtp success, updating state...');


      setStep(2);
      setOtpSent(true);
      console.log('State updated: step=2, otpSent=true');
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert(`${t('auth_signup_failed')} ${error.message}`);
    } finally {
      setLocalIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      alert(t('auth_otp_input'));
      return;
    }

    setLocalIsLoading(true);
    try {
      // Pass all details including email
      await onSignup({ name, phone, email, otp });


      try {
        await dbService.createUser(phone, name);
      } catch (dbErr) {
        console.error("Failed to create user profile in DB:", dbErr);

      }


    } catch (error) {
      console.error(error);
      alert(`${t('auth_signup_failed')} ${error.message}`);
    } finally {
      setLocalIsLoading(false);
    }
  };

  return (
    <StyledWrapper>
      <div className="form">
        <h1 className="title">{t('gov_title_jh')}</h1>
        <p className="subtitle">{t('gov_subtitle')}</p>
        <div className="flex-column">
          <label>{t('profile_name')}</label></div>
        <div className="inputForm">
          <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 12 16">
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
          </svg>
          <input type="text" className="input" placeholder={t('auth_name_placeholder')} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex-column">
          <label>{t('phone_label')}</label></div>
        <div className="inputForm">
          <svg height={20} viewBox="0 0 384 512" width={20} xmlns="http://www.w3.org/2000/svg"><path d="M320 0H64C28.7 0 0 28.7 0 64v384c0 35.3 28.7 64 64 64h256c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64zM192 480c-17.7 0-32-14.3-32-32h64c0 17.7-14.3 32-32 32zM320 384H64V64h256v320z" /></svg>
          <input type="tel" className="input" placeholder={t('auth_mobile_input')} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div className="flex-column">
          <label>Email ID <span style={{ fontSize: '0.8em', color: '#666' }}>(Required for OTP)</span></label></div>
        <div className="inputForm">
          <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          <input type="email" className="input" placeholder="Enter Email ID" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div style={{ fontSize: '12px', color: '#e65100', background: '#fff3e0', padding: '8px', borderRadius: '4px', marginTop: '5px' }}>
          <strong>Note:</strong> As this is a prototype, verification OTP will be sent to your <strong>Email ID</strong>, but your account will be linked to your Phone Number.
        </div>

        {otpSent && (
          <>
            <div className="flex-column">
              <label>OTP</label></div>
            <div className="inputForm">
              <svg height={20} viewBox="0 0 448 512" width={20} xmlns="http://www.w3.org/2000/svg"><path d="M400 0H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V48c0-26.5-21.5-48-48-48zM224 464c-17.7 0-32-14.3-32-32h64c0 17.7-14.3 32-32 32zm80-208h-64v64h-32v-64h-64v-32h64v-64h32v64h64v32z" /></svg>
              <input type="text" className="input" placeholder={t('auth_otp_input')} value={otp} onChange={(e) => setOtp(e.target.value)} />
            </div>
          </>
        )}
        {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>{error}</div>}
        {!otpSent ? (
          <button type="button" className="button-submit" onClick={handleSendOtp} disabled={localIsLoading || !name || !phone}>
            {localIsLoading ? t('auth_sending_otp') : t('send_otp_btn')}
          </button>
        ) : (
          <button type="button" className="button-submit" onClick={handleVerifyOtp} disabled={localIsLoading || !otp}>
            {localIsLoading ? t('auth_verifying') : t('verify_btn')}
          </button>
        )}
        <p className="p">{t('auth_have_account')} <span className="span"><Link to="/">{t('auth_signin')}</Link></span></p>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f0f2f5;
  background-image: linear-gradient(135deg, #e0f7fa 0%, #e8f5e9 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('/src/assets/hero-bg.jpg');
    background-size: cover;
    background-position: center;
    opacity: 0.15;
    z-index: 0;
  }

  .form {
    display: flex;
    flex-direction: column;
    background-color: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    gap: 15px;
    padding: 40px 30px;
    width: 100%;
    max-width: 400px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border-top: 5px solid #138808; 
    z-index: 1;
    animation: slideUp 0.5s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .title {
    color: #138808;
    text-align: center;
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 10px;
    font-family: 'Merriweather', serif;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  .subtitle {
    text-align: center;
    color: #555;
    font-size: 14px;
    margin-bottom: 20px;
    font-weight: 500;
  }

  .flex-column > label {
    color: #333;
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 5px;
    display: block;
  }

  .inputForm {
    border: 1px solid #ccc;
    border-radius: 6px;
    height: 48px;
    display: flex;
    align-items: center;
    padding-left: 12px;
    transition: all 0.2s ease;
    background-color: #fafafa;
  }

  .inputForm:focus-within {
    border-color: #138808;
    box-shadow: 0 0 0 3px rgba(19, 136, 8, 0.1);
    background-color: #fff;
  }

  .input {
    margin-left: 10px;
    border: none;
    background-color: transparent;
    width: 100%;
    height: 100%;
    font-size: 16px;
    color: #333;
  }

  .input:focus {
    outline: none;
  }

  .button-submit {
    margin-top: 20px;
    background-color: #138808;
    border: none;
    color: white;
    font-size: 16px;
    font-weight: 600;
    border-radius: 6px;
    height: 48px;
    width: 100%;
    cursor: pointer;
    transition: background-color 0.2s;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .button-submit:hover {
    background-color: #0f6b06;
  }

  .button-submit:disabled {
    background-color: #9ccc9c;
    cursor: not-allowed;
  }

  .span {
    font-size: 14px;
    color: #FF9933; 
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
  }
  
  .span:hover {
    text-decoration: underline;
  }

  .p {
    text-align: center;
    color: #666;
    font-size: 14px;
    margin-top: 15px;
  }

  
  @media (max-width: 480px) {
    .form {
      padding: 30px 20px;
    }
    .title {
      font-size: 24px;
    }
  }
`;

export default SignupForm;
