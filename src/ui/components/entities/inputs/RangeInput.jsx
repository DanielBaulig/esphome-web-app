import {useId} from 'react';

import ResponsiveInput from './ResponsiveInput';

export default function RangeInput({label, ...props}) {
  const id = useId();

  return <>
    <label htmlFor={id}>{label}</label>
    <ResponsiveInput
      id={id}
      type="range"
      {...props}
    />
  </>;
}
