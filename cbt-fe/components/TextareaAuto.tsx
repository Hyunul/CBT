import { useEffect, useRef, TextareaHTMLAttributes } from 'react';

export default function TextareaAuto(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const element = textareaRef.current;
    if (element) {
      element.style.height = 'auto';
      element.style.height = element.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [props.value]);

  return (
    <textarea
      {...props}
      ref={textareaRef}
      rows={1}
      onChange={(e) => {
        adjustHeight();
        if (props.onChange) props.onChange(e);
      }}
      className={`resize-none overflow-hidden ${props.className || ''}`}
    />
  );
}
