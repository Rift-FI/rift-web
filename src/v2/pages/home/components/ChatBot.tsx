import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { RiRobot3Fill } from "react-icons/ri";

export default function ChatBot() {
  const navigate = useNavigate();

  const onUseChatBot = () => {
    navigate("/app/agent");
  };

  return (
    <motion.div
      initial={{ y: 4, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      onClick={onUseChatBot}
      className="fixed bottom-18 right-2 w-13 h-13 rounded-[0.75rem] flex flex-row items-center justify-center bg-surface-subtle border-1 border-surface-alt/25 cursor-pointer"
    >
      <RiRobot3Fill className="text-3xl text-accent-primary" />
    </motion.div>
  );
}
