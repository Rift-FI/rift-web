import { JSX, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import Map, { Marker } from "react-map-gl";
import { locationType } from "../../pages/security/NodesTeeSelector";
import { Node } from "../../assets/icons/security";
import { colors } from "../../constants";
import "../../styles/components/security/minimap.scss";

interface props {
  selectorLocations: locationType[];
}

const MAPBOXKEY =
  "pk.eyJ1Ijoic3RjLXBrbXQiLCJhIjoiY202MmN0eTZ0MG5wazJsc2V3bWwwN2c5ZSJ9.4vlL7NMqmcOxjT6dgQOwjw";

export const MiniMap = ({ selectorLocations }: props): JSX.Element => {
  const [viewState, setViewState] = useState({
    latitude: selectorLocations[0]?.latitude,
    longitude: selectorLocations[0]?.longitude,
    zoom: 6,
    bearing: 0,
    pitch: 30,
  });

  return (
    <Map
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      mapboxAccessToken={MAPBOXKEY}
      initialViewState={{ fitBoundsOptions: { maxZoom: 6, minZoom: 4 } }}
      mapStyle="mapbox://styles/stc-pkmt/cm5xmsgdf00c701qt7xhfcxzr"
      style={{
        width: "100%",
        height: "20rem",
        borderRadius: "0.5rem",
        overflow: "hidden",
      }}
    >
      {selectorLocations?.map((loc) => (
        <Marker
          key={loc?.id}
          longitude={loc?.longitude}
          latitude={loc?.latitude}
          anchor="bottom"
        >
          <button disabled={!loc?.isAvailable} className="node_tee">
            <span className="node">
              <Node
                color={loc?.isAvailable ? colors.textprimary : colors.primary}
                width={18}
                height={18}
              />
            </span>
          </button>
        </Marker>
      ))}
    </Map>
  );
};
