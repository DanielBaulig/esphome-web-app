import { toggle } from './ToggleInput.module.css';

export default function ToggleInput({value, onChange}) {
  return <label className={toggle}><input type="checkbox" className={toggle}
    value={value}
    onChange={onChange}
  /></label>;
}
