import { useId } from 'react';

import RangeInput from './RangeInput';

function miredsToKelvin(mireds) {
  return 1000000 / mireds;
}

function kelvinToMireds(kelvin) {
  return 1000000 / kelvin;
}

export default function ColorTemperatureInput({value, onChange}) {
  const min = 2400;
  const max = 6500;

  return <>
    <RangeInput
      min={min}
      max={max}
      value={miredsToKelvin(value)}
      onChange={(value) => onChange(kelvinToMireds(value))}
    />
  </>;
}
