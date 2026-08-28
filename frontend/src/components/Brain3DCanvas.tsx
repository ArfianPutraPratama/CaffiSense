interface Brain3DCanvasProps {
  className?: string;
}

export default function Brain3DCanvas({
  className = '',
}: Brain3DCanvasProps) {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <iframe
        id="biodigital-brain-widget"
        src="https://human.biodigital.com/widget/?be=2REV&background.colors=255,255,255,1,51,64,77,1&initial.hand-hint=true&ui-fullscreen=true&ui-center=false&ui-dissect=true&ui-zoom=true&ui-help=true&ui-tools-display=primary&ui-info=true&uaid=3bHQC"
        width="100%"
        height="100%"
        className="w-full h-full border-0"
        allowFullScreen
        title="BioDigital 3D Brain"
      />
    </div>
  );
}
