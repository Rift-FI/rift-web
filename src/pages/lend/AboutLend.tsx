import { JSX, useState, useRef, useEffect } from "react";
import { openLink } from "@telegram-apps/sdk-react";
import {
  faArrowRight,
  faArrowUpRightFromSquare,
  faCircleQuestion,
  faFlag,
  faLock,
  faLink,
  faCreditCard,
  faClock,
  faShare,
  faShieldHalved,
  faGears,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router";
import { BottomButtonContainer } from "../../components/Bottom";
import { SubmitButton } from "../../components/global/Buttons";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import "../../styles/pages/lend/aboutlend.scss";

interface Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  speedX: number;
  speedY: number;
  life: number;
}

interface Key {
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export default function AboutLend(): JSX.Element {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"keys" | "crypto">("keys");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  const startLend = () => {
    localStorage.setItem("firsttimelend", "false");
    navigate("/lend");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    // Animation variables
    const particles: Particle[] = [];
    const keys: Key[] = [];
    let frame = 0;

    // Create initial keys
    for (let i = 0; i < 3; i++) {
      keys.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        rotation: Math.random() * Math.PI * 2,
        scale: 0.5 + Math.random() * 0.5,
      });
    }

    // Draw a key
    const drawKey = (x: number, y: number, rotation: number, scale: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);

      // Draw key with wobble effect
      ctx.beginPath();
      const wobble = Math.sin(frame * 0.05) * 2;

      // Key head
      ctx.arc(0, 0, 20 + wobble, 0, Math.PI * 2);

      // Key stem
      ctx.moveTo(0, 20);
      ctx.lineTo(0, 60 + wobble);

      // Key teeth
      ctx.moveTo(0, 50);
      ctx.lineTo(15, 50 + wobble);
      ctx.moveTo(0, 40);
      ctx.lineTo(-10, 40 + wobble);

      ctx.strokeStyle = filter === "keys" ? "#3498db" : "#e74c3c";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    };

    // Create particle effect
    const createParticle = (x: number, y: number) => {
      particles.push({
        x,
        y,
        radius: Math.random() * 3 + 1,
        color: filter === "keys" ? "#3498db" : "#e74c3c",
        speedX: (Math.random() - 0.5) * 4,
        speedY: (Math.random() - 0.5) * 4,
        life: 1,
      });
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.life -= 0.01;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.life * 255).toString(16);
        ctx.fill();
      }

      // Update and draw keys
      keys.forEach((key, i) => {
        key.rotation += 0.01;
        key.y += Math.sin(frame * 0.05 + i) * 0.5;

        drawKey(key.x, key.y, key.rotation, key.scale);

        // Create particles around keys
        if (Math.random() < 0.1) {
          createParticle(key.x, key.y);
        }
      });

      // Draw connecting lines between keys
      ctx.beginPath();
      keys.forEach((key, i) => {
        if (i === 0) {
          ctx.moveTo(key.x, key.y);
        } else {
          ctx.lineTo(key.x, key.y);
        }
      });
      ctx.strokeStyle = filter === "keys" ? "#3498db33" : "#e74c3c33";
      ctx.stroke();

      frame++;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("resize", setCanvasSize);
    };
  }, [filter]);

  const keySteps = [
    { icon: faLink, title: "Create a Scoped Lending Link" },
    { icon: faCreditCard, title: "Choose a payment option" },
    { icon: faClock, title: "Set Expiry" },
    { icon: faShare, title: "Share the link" },
    { icon: faShieldHalved, title: "Track and Revoke Access" },
  ];

  const cryptoSteps = [
    { icon: faLink, title: "Create a Scoped Lending Link" },
    { icon: faGears, title: "Set a usage restriction" },
    { icon: faChartLine, title: "Profits distribution" },
    { icon: faShare, title: "Share the link" },
  ];

  return (
    <section id="aboutlend">
      <div className="header">
        <p className="title">
          Lend
          <span>Secure Web2 Keys & Crypto Lending</span>
        </p>

        <p className="desc">
          Share access to your Web2 Keys and Crypto assets securely while
          staying in control.
        </p>
      </div>

      <div className="howitworks">
        <FaIcon faIcon={faCircleQuestion} color={colors.accent} fontsize={18} />
        <span>How it works</span>
      </div>

      <div className="filters">
        <button
          className={`filter-btn ${filter === "keys" ? "active" : ""}`}
          onClick={() => setFilter("keys")}
        >
          <FaIcon
            faIcon={faLock}
            color={filter === "keys" ? colors.accent : colors.textsecondary}
            fontsize={16}
          />
          Lend Web2 Keys
        </button>
        <button
          className={`filter-btn ${filter === "crypto" ? "active" : ""}`}
          onClick={() => setFilter("crypto")}
        >
          <FaIcon
            faIcon={faFlag}
            color={filter === "crypto" ? colors.accent : colors.textsecondary}
            fontsize={16}
          />
          Lend Crypto
        </button>
      </div>

      {filter === "keys" ? (
        <div className="steps">
          {keySteps.map((step, index) => (
            <div key={index} className="step">
              <div className="step-icon">
                <FaIcon
                  faIcon={step.icon}
                  color={colors.accent}
                  fontsize={20}
                />
                <div className="step-number">{index + 1}</div>
              </div>
              <div className="step-content">
                <h3>{step.title}</h3>
              </div>
            </div>
          ))}
          <p className="supported-keys">
            Supported Web2 Keys: OpenAi, AirWallex, Polymarket
          </p>
        </div>
      ) : (
        <div className="steps">
          {cryptoSteps.map((step, index) => (
            <div key={index} className="step">
              <div className="step-icon">
                <FaIcon
                  faIcon={step.icon}
                  color={colors.accent}
                  fontsize={20}
                />
                <div className="step-number">{index + 1}</div>
              </div>
              <div className="step-content">
                <h3>{step.title}</h3>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        className="learn-more"
        onClick={() =>
          openLink(
            "https://2fa-distributed-login-gm9b.vercel.app/lend-to-spend.html"
          )
        }
      >
        Learn More
        <FaIcon
          faIcon={faArrowUpRightFromSquare}
          color={colors.accent}
          fontsize={14}
        />
      </button>

      <BottomButtonContainer>
        <SubmitButton
          text="Start Lending"
          icon={<FaIcon faIcon={faArrowRight} color={colors.textprimary} />}
          sxstyles={{
            padding: "0.75rem 1.5rem",
            borderRadius: "1.5rem",
            backgroundColor: colors.success,
            fontSize: "1.125rem",
            fontWeight: "600",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
          onclick={startLend}
        />
      </BottomButtonContainer>
    </section>
  );
}
