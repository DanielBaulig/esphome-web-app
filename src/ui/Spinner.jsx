import { spinner } from './Spinner.module.css';

export default function Spinner({className}) {
  return <div className={`${spinner} ${className}`}>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
  </div>;
}
