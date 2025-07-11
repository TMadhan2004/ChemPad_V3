import React from 'react';

// Define a type for SVG icon props
interface SvgIconProps {
  width?: string;
  height?: string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Create a component for each SVG icon
export const SelectBoxIcon: React.FC<SvgIconProps> = ({ width = '24px', height = '24px', color = '#424242', className, style }) => (
  <svg viewBox="0 0 24 24" width={width} height={height} fill="none" stroke={color} strokeMiterlimit="10" strokeWidth="1.5px" transform="scale(0.8)" className={className} style={style}>
    <g fill="none">
      <rect x="2" y="2" width="4" height="4" rx="1"/>
      <rect x="18" y="2" width="4" height="4" rx="1"/>
      <rect x="2" y="18" width="4" height="4" rx="1"/>
      <line x1="4" y1="9" x2="4" y2="15" />
      <line x1="20" y1="9" x2="20" y2="11"/>
      <line x1="15" y1="4" x2="9" y2="4"/>
      <line x1="11" y1="20" x2="9" y2="20"/>
      <path d="M14.33,22h-.09a.35.35,0,0,1-.24-.32v-10a.34.34,0,0,1,.33-.34.32.32,0,0,1,.21.08l7.34,6a.33.33,0,0,1-.21.59H17.18l-2.57,3.85A.35.35,0,0,1,14.33,22Z"/>
    </g>
  </svg>
);

export const SelectLassoIcon: React.FC<SvgIconProps> = ({ width = '24px', height = '24px', color = '#424242', className, style }) => (
  <svg viewBox="0 0 24 24" width={width} height={height} fill="none" stroke={color} strokeMiterlimit="10" strokeWidth="1.5px" className={className} style={style}>
    <path d="M3,14.24C3,18.5,6.5,22,10.76,22h0A7.76,7.76,0,0,0,18.52,14.24h0c0-4.26-3.5-7.76-7.76-7.76h0A7.76,7.76,0,0,0,3,14.24Z" fill="none" stroke={color} strokeMiterlimit="10" strokeWidth="1.5px" strokeDasharray="3"/>
  </svg>
);

export const ChainIcon: React.FC<SvgIconProps> = ({ width = '24px', height = '24px', color = '#424242', className, style }) => (
  <svg width={width} height={height} viewBox="-40 -40 215 106" stroke={color} transform="rotate(-0)" className={className} style={style}>
    <path d="M 0 0 L 45 26 L 90 0 L 135 26" strokeLinecap="round" fill="none" strokeWidth="16" />
  </svg>
);

export const ChargePlusIcon: React.FC<SvgIconProps> = ({ width = '24px', height = '24px', color = '#424242', className, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className} style={style}>
    <circle cx="12" cy="12" r="10" fill="none" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

export const ChargeMinusIcon: React.FC<SvgIconProps> = ({ width = '24px', height = '24px', color = '#424242', className, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className} style={style}>
    <circle cx="12" cy="12" r="10" fill="none" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

export const PeriodicTableIcon: React.FC<SvgIconProps> = ({ width = '24px', height = '24px', color = '#424242', className, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" className={className} style={style}>
    <rect x="2" y="2" width="20" height="20" rx="2" fill="none" />
    <line x1="8" y1="2" x2="8" y2="22" />
    <line x1="16" y1="2" x2="16" y2="22" />
    <line x1="2" y1="8" x2="22" y2="8" />
    <line x1="2" y1="16" x2="22" y2="16" />
    <text x="4" y="6" fontSize="5" fontWeight="bold" fill={color}>H</text>
    <text x="12" y="6" fontSize="5" fontWeight="bold" fill={color}>C</text>
    <text x="20" y="6" fontSize="5" fontWeight="bold" fill={color}>N</text>
    <text x="4" y="14" fontSize="5" fontWeight="bold" fill={color}>O</text>
    <text x="12" y="14" fontSize="5" fontWeight="bold" fill={color}>P</text>
    <text x="20" y="14" fontSize="5" fontWeight="bold" fill={color}>S</text>
    <text x="4" y="21" fontSize="5" fontWeight="bold" fill={color}>F</text>
    <text x="12" y="21" fontSize="5" fontWeight="bold" fill={color}>Cl</text>
    <text x="19" y="21" fontSize="5" fontWeight="bold" fill={color}>Br</text>
  </svg>
);

export const BondSingleIcon: React.FC<SvgIconProps> = ({ width = '24px', height = '24px', color = '#424242', className, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className} style={style}>
    <line x1="4" y1="12" x2="20" y2="12" />
  </svg>
);

export const BondDoubleIcon: React.FC<SvgIconProps> = ({ width = '24px', height = '24px', color = '#424242', className, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className} style={style}>
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
  </svg>
);

export const BondTripleIcon: React.FC<SvgIconProps> = ({ width = '24px', height = '24px', color = '#424242', className, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className} style={style}>
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);

export const BondSingleOrDoubleIcon: React.FC<SvgIconProps> = ({ width = '24px', height = '24px', color = '#424242', className, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className} style={style}>
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" strokeDasharray="4 2" />
  </svg>
);

export const BondWedgeFrontIcon: React.FC<SvgIconProps> = ({ width = '24px', height = '24px', color = '#424242', className, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" className={className} style={style}>
    <polygon points="4,12 20,6 20,18" fill={color} />
  </svg>
);

export const BondWedgeBackIcon: React.FC<SvgIconProps> = ({ width = '24px', height = '24px', color = '#424242', className, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1" className={className} style={style}>
    <path d="M4,12 L20,6 L20,18 Z" strokeDasharray="2 2" />
  </svg>
);

export const ClearCanvasIcon: React.FC<SvgIconProps> = ({ width = '24px', height = '24px', color = '#424242', className, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" className={className} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" fill="none" />
    <line x1="7" y1="7" x2="17" y2="17" />
    <line x1="7" y1="17" x2="17" y2="7" />
  </svg>
);

export const EraseIcon: React.FC<SvgIconProps> = ({ width = '24px', height = '24px', color = '#424242', className, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" className={className} style={style}>
    <path d="M18,14l-8,8H3v-3l9.5-9.5L18,14z" fill="none" />
    <path d="M20.5,6.5L17.5,3.5c-0.8-0.8-2-0.8-2.8,0l-4,4l5.5,5.5l4.3-4.3C21.3,8,21.3,6.8,20.5,6.5z" fill="none" />
    <line x1="10.5" y1="5.5" x2="18.5" y2="13.5" />
  </svg>
);

export const CopyIcon: React.FC<SvgIconProps> = ({ width = '24px', height = '24px', color = '#424242', className, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" className={className} style={style}>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16,8V6a2,2,0,0,0-2-2H6A2,2,0,0,0,4,6v8a2,2,0,0,0,2,2h2" />
  </svg>
);

export const PasteIcon: React.FC<SvgIconProps> = ({ width = '24px', height = '24px', color = '#424242', className, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" className={className} style={style}>
    <path d="M16,4h2a2,2,0,0,1,2,2V20a2,2,0,0,1-2,2H6a2,2,0,0,1-2-2V6A2,2,0,0,1,6,4H8" />
    <rect x="8" y="2" width="8" height="4" rx="1" />
  </svg>
);

export const UndoIcon: React.FC<SvgIconProps> = ({ width = '24px', height = '24px', color = '#424242', className, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" className={className} style={style}>
    <path d="M9,10H4V5" />
    <path d="M4,10a8,8,0,0,1,16,0c0,4.42-3.58,8-8,8a7.92,7.92,0,0,1-6-2.78" />
  </svg>
);

export const RedoIcon: React.FC<SvgIconProps> = ({ width = '24px', height = '24px', color = '#424242', className, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" className={className} style={style}>
    <path d="M15,10h5V5" />
    <path d="M20,10a8,8,0,0,0-16,0c0,4.42,3.58,8,8,8a7.92,7.92,0,0,0,6-2.78" />
  </svg>
);

export const ExportIcon: React.FC<SvgIconProps> = ({ width = '24px', height = '24px', color = '#424242', className, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" className={className} style={style}>
    <path d="M12,3v12" />
    <path d="M8,7l4-4l4,4" />
    <path d="M20,15v4a2,2,0,0,1-2,2H6a2,2,0,0,1-2-2V15" />
  </svg>
);

export const ImportIcon: React.FC<SvgIconProps> = ({ width = '24px', height = '24px', color = '#424242', className, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" className={className} style={style}>
    <path d="M12,21V9" />
    <path d="M8,17l4,4l4-4" />
    <path d="M20,9V5a2,2,0,0,0-2-2H6A2,2,0,0,0,4,5V9" />
  </svg>
);

export const RectangleIcon: React.FC<SvgIconProps> = ({ width = '24px', height = '24px', color = '#424242', className, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" className={className} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);
