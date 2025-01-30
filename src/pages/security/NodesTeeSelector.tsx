import { CSSProperties, JSX, useEffect, useState, MouseEvent } from "react";
import { useParams, useNavigate } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import { Popover } from "@mui/material";
import "mapbox-gl/dist/mapbox-gl.css";
import Map, { Marker } from "react-map-gl";
import { useAppDrawer } from "../../hooks/drawer";
import { Node, TEE, Filter } from "../../assets/icons";
import { colors } from "../../constants";
import nodetees from "../../components/tabs/security/nodestees.json";
import "../../styles/pages/nodesteeselector.scss";

export type locationType = {
  id: number;
  latitude: number;
  longitude: number;
  isNode: boolean;
  isMyNode: boolean;
  isMyTee: boolean;
  isAvailable: boolean;
  countryFlag: string;
  nodeTeeIdx: number;
};
type filtersType = "mynodes" | "allnodes" | "mytee" | "alltee";

const MAPBOXKEY =
  "pk.eyJ1Ijoic3RjLXBrbXQiLCJhIjoiY202MmN0eTZ0MG5wazJsc2V3bWwwN2c5ZSJ9.4vlL7NMqmcOxjT6dgQOwjw";

export default function NodesTeeSelector(): JSX.Element {
  const navigate = useNavigate();
  const { type } = useParams();
  const { openAppDrawer, drawerOpen } = useAppDrawer();

  const [selectedFilter, setSelectedFilter] = useState<filtersType>(
    type == "nodes" ? "allnodes" : "alltee"
  );

  const selectorLocations = (): locationType[] => {
    switch (selectedFilter) {
      case "allnodes":
        return Locations.filter((item) => item.isNode);
      case "mynodes":
        return Locations.filter((item) => item.isNode && item.isMyNode);
      case "alltee":
        return Locations.filter((item) => !item.isNode);
      case "mytee":
        return Locations.filter((item) => !item.isNode && item.isMyTee);
      default:
        return Locations;
    }
  };

  const [viewState, setViewState] = useState({
    latitude: selectorLocations()[0]?.latitude,
    longitude: selectorLocations()[0]?.longitude,
    zoom: 6,
    bearing: 0,
    pitch: 30,
  });
  const [filtersEl, setFiltersEl] = useState<HTMLButtonElement | null>(null);

  const filtersOpen = Boolean(filtersEl);
  const filtersPopoVrId = filtersOpen ? "filters-popover" : undefined;

  const openFilters = (event: MouseEvent<HTMLButtonElement>) => {
    setFiltersEl(event.currentTarget);
  };

  const closeFilters = () => {
    setFiltersEl(null);
  };

  const goBack = () => {
    navigate("/security/setup");
  };

  const onselectNodeTee = (index: number) => {
    if (selectedFilter == "allnodes" || selectedFilter == "mynodes") {
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
  }, [drawerOpen]);

  return (
    <section id="nodesteeselector">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOXKEY}
        initialViewState={{ fitBoundsOptions: { maxZoom: 6, minZoom: 4 } }}
        mapStyle="mapbox://styles/stc-pkmt/cm5xmsgdf00c701qt7xhfcxzr"
        style={{ width: "100%", height: "100%", overflow: "hidden" }}
      >
        <div className="filters">
          <button className="filterbtn" onClick={openFilters}>
            {selectedFilter == "allnodes"
              ? "all nodes"
              : selectedFilter == "mynodes"
              ? "my nodes"
              : selectedFilter == "mytee"
              ? "my tEE"
              : "all tEEs"}
            <span className="icon">
              <Filter width={14} height={8} color={colors.textprimary} />
            </span>
          </button>
          <Popover
            id={filtersPopoVrId}
            open={filtersOpen}
            anchorEl={filtersEl}
            onClose={closeFilters}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            elevation={0}
            slotProps={{
              paper: { style: popOverStyles },
            }}
          >
            <p className="selectortitle">Nodes</p>

            <button
              className="filterctr"
              onClick={() => {
                setSelectedFilter("mynodes");
                closeFilters();
              }}
            >
              <span className="radioctr">
                <span
                  style={{
                    backgroundColor:
                      selectedFilter == "mynodes"
                        ? colors.accent
                        : colors.divider,
                  }}
                />
              </span>
              <p>
                My Nodes
                <span>Nodes your'e currently using</span>
              </p>
            </button>

            <button
              className="filterctr"
              onClick={() => {
                setSelectedFilter("allnodes");
                closeFilters();
              }}
            >
              <span className="radioctr">
                <span
                  style={{
                    backgroundColor:
                      selectedFilter == "allnodes"
                        ? colors.accent
                        : colors.divider,
                  }}
                />
              </span>
              <p>
                All Nodes
                <span>All Nodes</span>
              </p>
            </button>

            <p className="selectortitle">TEEs</p>

            <button
              className="filterctr"
              onClick={() => {
                setSelectedFilter("mytee");
                closeFilters();
              }}
            >
              <span className="radioctr">
                <span
                  style={{
                    backgroundColor:
                      selectedFilter == "mytee"
                        ? colors.accent
                        : colors.divider,
                  }}
                />
              </span>
              <p>
                My TEE
                <span>TEE your'e currently using</span>
              </p>
            </button>

            <button
              className="filterctr"
              onClick={() => {
                setSelectedFilter("alltee");
                closeFilters();
              }}
            >
              <span className="radioctr">
                <span
                  style={{
                    backgroundColor:
                      selectedFilter == "alltee"
                        ? colors.accent
                        : colors.divider,
                  }}
                />
              </span>
              <p>
                All TEEs
                <span>All Trusted Execution Environments</span>
              </p>
            </button>
          </Popover>
        </div>

        {selectorLocations().map((loc) => (
          <Marker
            key={loc?.id}
            longitude={loc?.longitude}
            latitude={loc?.latitude}
            anchor="bottom"
          >
            <button
              disabled={!loc?.isAvailable}
              onClick={() => {
                onselectNodeTee(loc?.nodeTeeIdx);
                localStorage.setItem("disableElect", selectedFilter);
              }}
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
    </section>
  );
}

const Locations: locationType[] = [
  {
    id: 1,
    latitude: 22.396427,
    longitude: 114.109497,
    isNode: false,
    isMyNode: false,
    isMyTee: false,
    isAvailable: true,
    countryFlag: "🇭🇰",
    nodeTeeIdx: 0,
  }, // hong kong
  {
    id: 12,
    latitude: 22.3419101,
    longitude: 114.1697932,
    isNode: true,
    isMyNode: true,
    isMyTee: false,
    isAvailable: true,
    countryFlag: "🇭🇰",
    nodeTeeIdx: 0,
  }, // hong kong 2
  {
    id: 2,
    latitude: 1.352083,
    longitude: 103.819839,
    isNode: true,
    isMyNode: true,
    isMyTee: false,
    isAvailable: true,
    countryFlag: "🇸🇬",
    nodeTeeIdx: 3,
  }, // singapore
  {
    id: 22,
    latitude: 1.3660403,
    longitude: 103.8503053,
    isNode: false,
    isMyNode: false,
    isMyTee: false,
    isAvailable: false,
    countryFlag: "🇸🇬",
    nodeTeeIdx: -1,
  }, // singapore 2
  {
    id: 3,
    latitude: 23.697809,
    longitude: 120.960518,
    isNode: false,
    isMyNode: false,
    isMyTee: false,
    isAvailable: false,
    countryFlag: "🇹🇼",
    nodeTeeIdx: -1,
  }, // taiwan
  {
    id: 32,
    latitude: 23.9921626,
    longitude: 120.2983413,
    isNode: false,
    isMyNode: false,
    isMyTee: true,
    isAvailable: true,
    countryFlag: "🇹🇼",
    nodeTeeIdx: 1,
  }, // taiwan 2
  {
    id: 4,
    latitude: 35.689487,
    longitude: 139.691711,
    isNode: true,
    isMyNode: true,
    isMyTee: false,
    isAvailable: true,
    countryFlag: "🇯🇵",
    nodeTeeIdx: 2,
  }, // tokyo
  {
    id: 42,
    latitude: 34.6777117,
    longitude: 135.4036361,
    isNode: true,
    isMyNode: false,
    isMyTee: false,
    isAvailable: false,
    countryFlag: "🇯🇵",
    nodeTeeIdx: -1,
  }, // tokyo 2
  {
    id: 3,
    latitude: 24.5150286,
    longitude: 120.7769183,
    isNode: true,
    isMyNode: true,
    isMyTee: false,
    isAvailable: true,
    countryFlag: "🇹🇼",
    nodeTeeIdx: 4,
  }, // taiwan 3
  {
    id: 32,
    latitude: 22.3908737,
    longitude: 119.9689656,
    isNode: true,
    isMyNode: false,
    isMyTee: false,
    isAvailable: false,
    countryFlag: "🇹🇼",
    nodeTeeIdx: 1,
  }, // taiwan 4
];

const popOverStyles: CSSProperties = {
  width: "13.5rem",
  height: "14.5rem",
  padding: "0.375rem",
  marginTop: 6,
  border: `1px solid ${colors.divider}`,
  borderRadius: "0.5rem",
  backgroundColor: colors.primary,
};
