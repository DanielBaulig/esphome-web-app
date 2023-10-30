import ColorInput from './ColorInput';

function hexToRGB(hex) {
  const parts = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return {
    red: parseInt(parts[1], 16),
    green: parseInt(parts[2], 16),
    blue: parseInt(parts[3], 16),
  };
}

function rgbToHex(red, green, blue) {
  const colors = [red, green, blue].map((c) => {
    const hex = c.toString(16);
    return `${hex.length == 1 ? '0' : ''}${hex}`;
  });
  return `#${colors.join('')}`;
}

export default function RGBInput({red, green, blue, onChange}) {
  const hex = rgbToHex(red, green, blue);

  return <ColorInput 
    color={hex} 
    onChange={(value) => onChange(hexToRGB(value))} 
  />;
}
