interface Eye3DCanvasProps {
  className?: string;
}

export default function Eye3DCanvas({
  className = '',
}: Eye3DCanvasProps) {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* 
        BioDigital widget untuk Mata (Eye) 
      */}
      <iframe
        id="biodigital-eye-widget"
        src="https://human.biodigital.com/viewer/?id=52CO&ui-anatomy-descriptions=true&ui-anatomy-labels=true&ui-audio=true&ui-chapter-list=false&ui-fullscreen=true&ui-help=true&ui-info=true&ui-label-list=true&ui-layers=true&ui-loader=circle&ui-media-controls=full&ui-menu=true&ui-nav=true&ui-search=true&ui-tools=true&ui-tutorial=false&ui-undo=true&ui-whiteboard=true&initial.none=true&disable-scroll=false&uaid=Lka7U&paid=o_0b4e4ad7"
        width="100%"
        height="100%"
        className="w-full h-full border-0"
        allowFullScreen
        title="BioDigital 3D Eye"
      />
    </div>
  );
}
