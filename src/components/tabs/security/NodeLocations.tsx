import { useEffect, useState } from "react";
import { useSpring, easings } from "@react-spring/web";
import { Map, Marker } from "pigeon-maps";
import { Database } from "../../../assets/icons";
import { colors } from "../../../constants";

export type locationType = {
  id: number;
  latitude: number;
  longitude: number;
  nodeDisabled: boolean;
};

interface props {
  nodeLocations: locationType[];
  selectedLocation: locationType;
}

export const NodeLocations = ({ nodeLocations, selectedLocation }: props) => {
  const [zoom, setZoom] = useState(4);
  const initialCenter = [
    nodeLocations.reduce((sum, loc) => sum + loc.latitude, 0) /
      nodeLocations.length,
    nodeLocations.reduce((sum, loc) => sum + loc.longitude, 0) /
      nodeLocations.length,
  ];

  const [{ center }, api] = useSpring(() => ({
    center: initialCenter,
    config: { duration: 800, easing: easings.easeInOutElastic },
  }));

  const tilesProvider = (x: number, y: number, z: number) =>
    `https://basemaps.cartocdn.com/dark_all/${z}/${x}/${y}@2x.png`;

  const onLocationChange = (latitude: number, longitude: number) => {
    api.start({ center: [latitude, longitude] });
    setZoom(6);
  };

  useEffect(() => {
    onLocationChange(selectedLocation?.latitude, selectedLocation?.longitude);
  }, [selectedLocation?.id]);

  return (
    <div
      style={{
        width: "100vw",
        height: "20rem",
        overflow: "hidden",
      }}
    >
      <Map
        center={[center.get()[0], center.get()[1]]}
        zoom={zoom}
        minZoom={4}
        maxZoom={6}
        animate
        attribution={false}
        limitBounds="edge"
        metaWheelZoom
        provider={tilesProvider}
      >
        {nodeLocations.map((loc) => (
          <Marker
            key={loc?.id}
            width={50}
            anchor={[loc?.latitude, loc?.longitude]}
          >
            <div
              style={{
                width: "1.75rem",
                height: "1.75rem",
                padding: "0.25rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                backgroundColor:
                  selectedLocation?.id == loc?.id
                    ? colors.textsecondary
                    : colors.accent,
                cursor: "crosshair",
              }}
            >
              <Database width={14} height={18} color={colors.danger} />
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
};
