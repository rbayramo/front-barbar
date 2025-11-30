import React from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const InternationalPhoneInput = ({ value, onChange, ...props }) => {
  return (
    <PhoneInput
      international
      defaultCountry="AZ"
      value={value}
      onChange={onChange}
      {...props}
    />
  );
};

export default InternationalPhoneInput;
