export default function FileUploader({ onSelect }) {
  return (
    <div>
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onSelect) onSelect(file);
        }}
      />
    </div>
  );
}

