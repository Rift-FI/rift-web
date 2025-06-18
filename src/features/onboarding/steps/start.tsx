import sphrLogo from "../../../assets/images/icons/sphere.png"
import { useFlow } from "../context"
import ActionButton from "@/components/ui/action-button"


export default function Start() {
  const flow = useFlow()

  const handleNext = () => {
    flow.goToNext()
  }

  const handleLogin = () => {
    flow.goToNext('login-phone')
  }
  return (
    <div className="w-full h-full flex flex-col p-5 items-center justify-between" >

      <div />
      <div className="flex flex-col items-center gap-5" >

        <div className="flex flex-col" >

          <div className="w-[150px] h-[150px] rounded-full overflow-hidden" >
            <img
              alt="sphere-logo"
              src={sphrLogo}
              className="w-[150px] h-[150px]"
            />
          </div>

        </div>
        <div>
          <p className="font-semibold text-text-default text-3xl text-center" >
            <span>Your Secure</span>  <br /> <span>Telegram Wallet</span>
          </p>
        </div>

        <p className="text-muted-foreground text-center" >
          Create your <span className="font-semibold" >secure</span> telegram wallet
        </p>

        <div className="flex flex-col items-center gap-2" >

          <ActionButton onClick={handleNext} variant={'secondary'} >
            <p className=" text-text-default text-md" >
              Create a New Wallet
            </p>
          </ActionButton>

          <ActionButton onClick={handleLogin} variant={'ghost'} >
            <p className=" text-text-default text-md" >
              Login
            </p>
          </ActionButton>
        </div>

      </div>
      <div className="flex flex-col items-center w-4/5" >
        <p className="text-muted-foreground text-center" >
          By using Sphere Wallet, you agree to accept our <span className="font-semibold cursor-pointer" >Terms of Use</span> and <span className="font-semibold cursor-pointer" >Privacy Policy</span>
        </p>
      </div>
    </div>
  )
}