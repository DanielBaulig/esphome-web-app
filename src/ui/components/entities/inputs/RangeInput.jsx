import {useId} from 'react';

import ResponsiveInput from './ResponsiveInput';

export default function RangeInput({min, max, value, onChange, label, list}) {
  const id = useId();

  return <>
    <label htmlFor={id}>{label}</label>
    <ResponsiveInput 
      id={id} 
      type="range" 
      min={min}
      max={max}
      value={value}
      onChange={onChange}
      list={list}
    />
  </>;
}
