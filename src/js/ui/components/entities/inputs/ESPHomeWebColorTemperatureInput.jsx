import { useId } from 'react';

import RangeInput from './RangeInput';

function miredsToKelvin(mireds) {
  return 1000000 / mireds;
}

function kelvinToMireds(kelvin) {
  return 1000000 / kelvin;
}

export default function ESPHomeWebColorTemperatureInput({value, onChange}) {
  const listId = useId();


  return <>
    <datalist id={listId}>
      <option value="2700" label="Warm"></option>
      <option value="3600" label="Cool"></option>
      <option value="5200" label="Daylight"></option>
    </datalist>
    <RangeInput
      list={listId}
      min="2400" 
      max="6500" 
      value={miredsToKelvin(value)}
      onChange={(value) => onChange(kelvinToMireds(value))}
    />
  </>;
}
