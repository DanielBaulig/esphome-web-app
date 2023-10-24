import { colorModeInput } from './ESPHomeWebColorModeInput.module.css';
export default function ESPHomeWebColorModeInput({colorMode, onChange, colorModes={rgb: 'RGB', color_temp: 'Temperature'}}) {
  return <>
    {Object.keys(colorModes).map((mode) => <label className={colorModeInput} key={mode}>
      {colorModes[mode]}
      <input 
        type="radio" 
        defaultChecked={mode == colorMode ? "checked" : ""}
        onChange={(event) => onChange(event.target.value)}
        name="colorMode" 
        value={mode}
      />
    </label>)}
  </>;
}
