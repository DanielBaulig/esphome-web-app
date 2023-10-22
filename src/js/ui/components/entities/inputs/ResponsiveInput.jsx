import {useState, useRef, useEffect} from 'react';

export default function ResponsiveInput({onChange, value, ...props}) {
  const [currentValue, setValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    const input = inputRef.current;
    const listener = (event) => onChange(event.target.value);
    input.addEventListener('change', listener);
    return () => {
      input.removeEventListener('change', listener);
    }
  }, [inputRef.current]);

  return <input 
    {...props}
    ref={inputRef}
    value={currentValue}
    onChange={(event) => setValue(event.target.value)}
  />;
}
