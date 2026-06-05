"use client";

import { useState, useEffect } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEditor = any;

export default function RichTextEditor({ value, onChange, placeholder, height = 300 }: Props) {
  const [EditorComponent, setEditorComponent] = useState<AnyEditor>(null);
  const [ClassicEditorClass, setClassicEditorClass] = useState<AnyEditor>(null);

  useEffect(() => {
    Promise.all([
      import("@ckeditor/ckeditor5-react"),
      import("@ckeditor/ckeditor5-build-classic"),
    ]).then(([ckReact, ckBuild]) => {
      setEditorComponent(() => ckReact.CKEditor);
      setClassicEditorClass(() => ckBuild.default);
    });
  }, []);

  if (!EditorComponent || !ClassicEditorClass) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={8}
        style={{ minHeight: height }}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
      />
    );
  }

  return (
    <div className="ckeditor-wrapper rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
      <style>{`
        .ckeditor-wrapper .ck.ck-toolbar { border: none; border-bottom: 1px solid #e5e7eb; background: #f9fafb; }
        .ckeditor-wrapper .ck.ck-editor__editable { min-height: ${height}px; font-size: 14px; padding: 12px 16px; border: none !important; box-shadow: none !important; }
        .ckeditor-wrapper .ck.ck-editor__editable:focus { outline: none; }
      `}</style>
      <EditorComponent
        editor={ClassicEditorClass}
        data={value}
        config={{
          placeholder,
          toolbar: [
            "heading", "|",
            "bold", "italic", "underline", "|",
            "bulletedList", "numberedList", "|",
            "blockQuote", "link", "|",
            "insertTable", "|",
            "undo", "redo",
          ],
        }}
        onChange={(_event: unknown, editor: { getData: () => string }) => {
          onChange(editor.getData());
        }}
      />
    </div>
  );
}
