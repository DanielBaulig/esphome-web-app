import { toggle } from './ToggleInput.module.css';

export default function ToggleInput({checked, onChange}) {
  return <label className={toggle}>
    <input
      type="checkbox"
      className={toggle}
      checked={checked}
      onChange={onChange}
    />
  </label>;
}
