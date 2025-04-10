import './JournalForm.css';
const ALLOWED_COLORS = [
    "#EA3232", // red
    "#F19748", // orange
    "#EAD04B", // yellow
    "#55A973", // green
    "#2D8FB6", // blue
    "#6A54B4", // purple
    "#FF8E9F", // pink
    "#151414", // black
    "#E7E5E5", // default gray
  ];
  
  function ColorPicker({ selectedColor, setSelectedColor }) {
    return (
      <div className="color-picker">
        {ALLOWED_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`color-button ${selectedColor === color ? "selected" : ""
            }`}
            style={{ backgroundColor: color }}
            onClick={() => setSelectedColor(color)}
          />
        ))}
      </div>
    );
  }

  export default ColorPicker