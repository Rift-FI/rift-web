import { JSX } from "react";
import { useNavigate, useParams } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import "../../styles/pages/transactions/sendcrypto.scss";

export default function SendCrypto(): JSX.Element {
  const navigate = useNavigate();
  const { srccurrency, intent } = useParams();
  const { switchtab } = useTabs();

  const prev_page = localStorage.getItem("prev_page");

  const goBack = () => {
    if (prev_page == null) {
      switchtab("home");
      navigate("/app");
    } else if (prev_page == "send-options") {
      navigate(`/send-crypto-methods/${srccurrency}/${intent}`);
    } else {
      navigate(prev_page);
    }
  };

  useBackButton(goBack);

  return (
    <section id="sendcrypto">
      send crypto to address here
      {srccurrency}
      <br />
      {intent}
    </section>
  );
}
