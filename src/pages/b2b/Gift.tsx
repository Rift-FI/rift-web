import telegramPremiumBg from "../../public/premium.avif";

function Gift() {
  return (
    <div className="mx-2">
      <h1 className="text-textprimary text-xl font-bold text-center mt-1">
        Gift Your Customers
      </h1>
      <p className="text-xs text-textsecondary text-center leading-relaxed pb-2 border-b-[1px] border-gray-500">
        Bundle and send gifts to your customers in bulk easily.
      </p>
      <div
        className="rounded-xl"
        style={{
          backgroundImage: `url(${telegramPremiumBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "200px",
          width: "100%",
          borderRadius: "10px",
          marginTop: "10px",
        }}
      ></div>
    </div>
  );
}

export default Gift;
