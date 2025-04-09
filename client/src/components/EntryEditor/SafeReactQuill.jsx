// components/SafeReactQuill.jsx
import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function SafeReactQuill({ value, onChange, modules, formats }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <ReactQuill
      value={value}
      onChange={onChange}
      modules={modules}
      formats={formats}
    />
  );
}
