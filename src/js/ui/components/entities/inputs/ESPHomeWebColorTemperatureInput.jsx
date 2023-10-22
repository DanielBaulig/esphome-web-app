import RangeInput from './RangeInput';

function miredsToKelvin(mireds) {
  return 1000000 / mireds;
}

function kelvinToMireds(kelvin) {
  return 1000000 / kelvin;
}

export default function ESPHomeWebColorTemperatureInput({value, onChange}) {
  return <RangeInput
    label="Color Temperature (Kelvin)"
    min="2000" 
    max="6500" 
    value={miredsToKelvin(value)}
    onChange={(value) => onChange(kelvinToMireds(value))}
  />;
}
