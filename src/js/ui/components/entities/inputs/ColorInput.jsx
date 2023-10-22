import {useId, useState, useRef, useEffect} from 'react';
import ResponsiveInput from './ResponsiveInput';

export default function ColorInput({color, label, onChange}) {
  const id = useId();

  return <>
    <label htmlFor="">{label}</label>
    <ResponsiveInput 
      id={id}
      value={color}
      type="color"
      onChange={onChange}
    />
  </>;
}
