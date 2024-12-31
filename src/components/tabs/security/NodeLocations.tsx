import { useState } from "react";
import Map, { Marker } from "react-map-gl";
import * as maplibregl from "maplibre-gl";
import { Database } from "../../../assets/icons";
import { colors } from "../../../constants";

type locationType = {
  id: number;
  latitude: number;
  longitude: number;
};

export const NodeLocations = () => {
  const [viewport, setViewport] = useState({
    latitude: 50.0,
    longitude: 10.0,
    zoom: 6,
  });

  const locations: locationType[] = [
    { id: 1, latitude: 52.82, longitude: 14.4 },
    { id: 2, latitude: 52.62, longitude: 13.5 },
    { id: 3, latitude: 52.52, longitude: 13.6 },
    { id: 4, latitude: 52.42, longitude: 12.7 },
  ];

  const handleViewportChange = (event: any) => {
    const { latitude, longitude, zoom } = event.viewState;
    setViewport({
      latitude,
      longitude,
      zoom,
    });
  };

  const centerCoordinates = {
    latitude: (locations[0].latitude + locations[1].latitude) / 2,
    longitude: (locations[0].longitude + locations[1].longitude) / 2,
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "20rem",
        overflow: "hidden",
      }}
    >
      <Map
        mapLib={maplibregl as any}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        initialViewState={{
          latitude: centerCoordinates.latitude,
          longitude: centerCoordinates.longitude,
          zoom: 6,
        }}
        latitude={viewport.latitude}
        longitude={viewport.longitude}
        zoom={viewport.zoom}
        onMove={handleViewportChange}
        style={{ width: "100%", height: "100%" }}
      >
        {locations.map((loc) => (
          <Marker
            key={loc.id}
            latitude={loc.latitude}
            longitude={loc.longitude}
            anchor="center"
          >
            <div
              style={{
                width: "1.75rem",
                height: "1.75rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "0.25rem",
                backgroundColor: colors.accent,
                cursor: "crosshair",
              }}
            >
              <Database color={colors.danger} />
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
};
