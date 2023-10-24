import RangeInput from './RangeInput';

export default function ESPHomeWebBrightnessInput({value, onChange}) {
  return <RangeInput
    min="0" 
    max="255" 
    value={value}
    onChange={onChange}
  />;
}
