interface Adrenal3DCanvasProps {
  className?: string;
}

export default function Adrenal3DCanvas({
  className = '',
}: Adrenal3DCanvasProps) {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* 
        BioDigital widget untuk Kelenjar Adrenal / Sistem Endokrin
      */}
      <iframe
        id="biodigital-adrenal-widget"
        src="https://human.biodigital.com/widget/?be=2XJT&background.colors=0,0,0,1,0,0,0,1&initial.hand-hint=true&ui-fullscreen=true&ui-center=false&ui-dissect=true&ui-zoom=true&ui-help=true&ui-tools-display=primary&ui-info=true&uaid=3bFRw"
        width="100%"
        height="100%"
        className="w-full h-full border-0"
        allowFullScreen
        title="BioDigital 3D Adrenal"
      />
    </div>
  );
}
