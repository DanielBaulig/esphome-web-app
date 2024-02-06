import { toggle } from './ToggleInput.module.css';

export default function ToggleInput({value, onChange}) {
  return <label className={toggle}>
    <input
      type="checkbox"
      className={toggle}
      checked={value}
      onChange={onChange}
    />
  </label>;
}
