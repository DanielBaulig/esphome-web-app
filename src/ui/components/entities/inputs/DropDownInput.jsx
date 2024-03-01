export default function DropDownInput({options, value, ...props}) {
  return (
    <select value={value} {...props}>
      {options.map((o) => <option value={o} key={o}>{o}</option>)};
    </select>
  );
}
