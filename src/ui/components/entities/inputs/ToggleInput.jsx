import { useId } from 'react';
import { toggle } from './ToggleInput.module.css';

export default function ToggleInput({checked, onChange}) {
  const id = useId();
  return <span className={toggle}>
    <input
      type="checkbox"
      className={toggle}
      checked={checked}
      onChange={onChange}
      id={id}
    />
    <label htmlFor={id}></label>
  </span>;
}
