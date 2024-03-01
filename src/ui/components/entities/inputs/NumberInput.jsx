import ResponsiveInput from './ResponsiveInput';

import { numberInput }  from './NumberInput.module.css';
import css from '../../../css';

export default function NumberInput({value, onChange, min, max, step, className, ...props}) {
  return (
    <ResponsiveInput
      {...props}
      type="number"
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      step={step}
      className={css(numberInput, className)}
    />
  );
}

