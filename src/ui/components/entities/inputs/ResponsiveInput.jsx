import {useState, useRef, useEffect} from 'react';

// React does weird things with input elements and mapps their `input`
// events onto the onChange handler while dropping the native change events
// entirely.
// However, the input spec says that input events fire while the user
// interacts with the input element and the change event fires when the
// interaction completes. E.g.
// - Input fires while typing into a text input and change fires when the
// element blurs.
// - Input fires while dragging around a range input and change fires when
// the control nob is released
// - Input fires while clicking and dragging around a color input and change
// fires when the color input is closed.
// ResponsiveInput is a wrapper around Reacts input element that will
// control the input element and update it's current state, but only report
// the change up using onChange once the interaction has completed.
export default function ResponsiveInput({onChange, value, ...props}) {
  const [interactionValue, setValue] = useState(value);
  const interactingRef = useRef(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const input = inputRef.current;
    const listener = (event) => {
      interactingRef.current = false;
      onChange(event.target.value);
    }
    input.addEventListener('change', listener);
    return () => {
      input.removeEventListener('change', listener);
    }
  }, [inputRef.current]);

  return <input 
    {...props}
    ref={inputRef}
    value={interactingRef.current ? interactionValue : value}
    onChange={(event) => {
      interactingRef.current = true;
      setValue(event.target.value)
    }}
  />;
}
