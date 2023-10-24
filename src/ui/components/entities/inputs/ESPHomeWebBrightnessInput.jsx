import RangeInput from './RangeInput';

export default function ESPHomeWebBrightnessInput({value, onChange}) {
  return <RangeInput
    label="Brightness"
    min="0" 
    max="255" 
    value={value}
    onChange={onChange}
  />;
}
