import { zodResolver } from "@hookform/resolvers/zod";
import { createContext, ReactNode, useContext, useState, } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import z from "zod";

const stateSchema = z.object({
    requestAmount: z.string().optional(),
    requestToken: z.string().optional(),
    requestTokenChain: z.string().optional(),
    searchfilter: z.string().optional(),
    currentStep: z.enum(['MY-ADDRESS', 'TOKEN-SELECT', 'TOKEN-AMOUNT']),
})

type State = z.infer<typeof stateSchema>

type receiveCtxType = {
    state: UseFormReturn<State> | null,
    switchCurrentStep: (nextstep: State['currentStep']) => void,
    closeAndReset: () => void
};

const buyContext = createContext<receiveCtxType>({
    state: null,
    switchCurrentStep: () => { },
    closeAndReset: () => { },
});

interface providerprops {
    children: ReactNode;
    onClose?: () => void
};

export const ReceiveCryptoProvider = ({ children, onClose }: providerprops) => {
    const form = useForm<State>({
        resolver: zodResolver(stateSchema),
        defaultValues: {
            currentStep: 'MY-ADDRESS',
        }
    });

    const onSwitchCurrentStep = (nextstep: State['currentStep']) => {
        form.setValue('currentStep', nextstep);
    };

    const onCloseAndReset = () => {
        onClose?.();
        form.reset();
    };

    return (
        <buyContext.Provider
            value={{
                state: form,
                switchCurrentStep: onSwitchCurrentStep,
                closeAndReset: onCloseAndReset
            }}
        >
            {children}
        </buyContext.Provider>
    )
}

export const useReceiveCrypto = () => {
    const context = useContext(buyContext);
    const currentStep = context.state?.watch("currentStep");

    return {
        ...context,
        currentStep
    };
};


