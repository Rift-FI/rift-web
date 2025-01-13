import { JSX, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import "mapbox-gl/dist/mapbox-gl.css";
import Map, { Marker } from "react-map-gl";
import { useAppDrawer } from "../../hooks/drawer";
import { AppDrawer } from "../../components/global/AppDrawer";
import { SnackBar } from "../../components/global/SnackBar";
import { Node, TEE } from "../../assets/icons";
import { colors } from "../../constants";
import nodetees from "../../components/tabs/security/nodestees.json";
import "../../styles/pages/nodesteeselector.css";

export type locationType = {
  id: number;
  latitude: number;
  longitude: number;
  isNode: boolean;
  isAvailable: boolean;
  countryFlag: string;
};

const MAPBOXKEY =
  "pk.eyJ1IjoidGhmYWxhbiIsImEiOiJjbTVzYjlnZTIwa2JzMmpvaGZxajVkcGxkIn0.de7xmTPseu14twqLV7m4Rw";

export default function NodesTeeSelector(): JSX.Element {
  const navigate = useNavigate();
  const { type } = useParams();
  const { openAppDrawer } = useAppDrawer();

  const selectorLocations = Locations.filter((_loc) =>
    type == "nodes" ? _loc?.isNode : !_loc?.isNode
  );

  const [viewState, setViewState] = useState({
    latitude: selectorLocations[0]?.latitude,
    longitude: selectorLocations[0]?.longitude,
    zoom: 6,
    bearing: 0,
    pitch: 30,
  });

  const goBack = () => {
    navigate(-1);
  };

  const onselectNodeTee = (index: number) => {
    if (type == "nodes") {
      const selectednode = nodetees.NODES[index];
      localStorage.setItem("electing", "nodes");
      localStorage.setItem("selectednode", JSON.stringify(selectednode));
      openAppDrawer("nodeteeselector");
    } else {
      const selectedtee = nodetees.TEES[index];
      localStorage.setItem("electing", "tee");
      localStorage.setItem("selectedtee", JSON.stringify(selectedtee));
      openAppDrawer("nodeteeselector");
    }
  };

  const onMapLoad = (event: any) => {
    const map = event.target;

    map.setLayoutProperty("water", "visibility", "none");

    map.setLayoutProperty("building", "visibility", "none");
  };

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.onClick(goBack);
    }

    return () => {
      backButton.offClick(goBack);
      backButton.unmount();
    };
  }, []);

  return (
    <section id="nodesteeselector">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOXKEY}
        onLoad={onMapLoad}
        initialViewState={{ fitBoundsOptions: { maxZoom: 6, minZoom: 4 } }}
        mapStyle="mapbox://styles/mapbox/dark-v10"
        style={{ width: "100%", height: "100%", overflow: "hidden" }}
      >
        {selectorLocations.map((loc, idx) => (
          <Marker
            key={loc?.id}
            longitude={loc?.longitude}
            latitude={loc?.latitude}
            anchor="bottom"
          >
            <button
              disabled={!loc?.isAvailable}
              onClick={() => onselectNodeTee(idx)}
              className="node_tee"
            >
              {loc?.isNode ? (
                <span className="node">
                  <Node
                    color={
                      loc?.isAvailable ? colors.textprimary : colors.primary
                    }
                    width={18}
                    height={18}
                  />
                </span>
              ) : (
                <span className="tee">
                  <TEE
                    color={
                      loc?.isAvailable ? colors.textprimary : colors.primary
                    }
                    width={18}
                    height={20}
                  />
                </span>
              )}
            </button>
          </Marker>
        ))}
      </Map>

      <AppDrawer />
      <SnackBar />
    </section>
  );
}

const Locations: locationType[] = [
  {
    id: 1,
    latitude: 22.396427,
    longitude: 114.109497,
    isNode: false,
    isAvailable: true,
    countryFlag: "🇭🇰",
  }, // hong kong
  {
    id: 12,
    latitude: 22.3419101,
    longitude: 114.1697932,
    isNode: true,
    isAvailable: true,
    countryFlag: "🇭🇰",
  }, // hong kong 2
  {
    id: 2,
    latitude: 1.352083,
    longitude: 103.819839,
    isNode: true,
    isAvailable: false,
    countryFlag: "🇸🇬",
  }, // singapore
  {
    id: 22,
    latitude: 1.3660403,
    longitude: 103.8503053,
    isNode: false,
    isAvailable: false,
    countryFlag: "🇸🇬",
  }, // singapore 2
  {
    id: 3,
    latitude: 23.697809,
    longitude: 120.960518,
    isNode: false,
    isAvailable: false,
    countryFlag: "🇹🇼",
  }, // taiwan
  {
    id: 32,
    latitude: 23.9921626,
    longitude: 120.2983413,
    isNode: false,
    isAvailable: true,
    countryFlag: "🇹🇼",
  }, // taiwan 2
  {
    id: 4,
    latitude: 35.689487,
    longitude: 139.691711,
    isNode: true,
    isAvailable: true,
    countryFlag: "🇯🇵",
  }, // tokyo
  {
    id: 42,
    latitude: 34.6777117,
    longitude: 135.4036361,
    isNode: true,
    isAvailable: false,
    countryFlag: "🇯🇵",
  }, // tokyo 2
];
