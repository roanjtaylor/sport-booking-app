declare module "react-leaflet" {
  import { ReactNode } from "react";
  import {
    Map as LeafletMap,
    MapOptions,
    LatLngTuple,
    LatLngBounds,
    ControlPosition,
    MarkerOptions,
    PolylineOptions,
    CircleOptions,
    PathOptions,
  } from "leaflet";

  export interface MapContainerProps extends MapOptions {
    center: LatLngTuple;
    zoom: number;
    children?: ReactNode;
    style?: React.CSSProperties;
    className?: string;
  }

  export interface TileLayerProps {
    attribution?: string;
    url: string;
    zIndex?: number;
  }

  export interface MarkerProps extends MarkerOptions {
    position: LatLngTuple;
    children?: ReactNode;
    eventHandlers?: any;
  }

  export interface PopupProps {
    position?: LatLngTuple;
    children?: ReactNode;
    onClose?: () => void;
  }

  export function MapContainer(props: MapContainerProps): JSX.Element;
  export function TileLayer(props: TileLayerProps): JSX.Element;
  export function Marker(props: MarkerProps): JSX.Element;
  export function Popup(props: PopupProps): JSX.Element;
  export function useMap(): LeafletMap;
}
