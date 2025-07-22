import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { p2pApi } from "../../lib/prediction-market";

export const useP2PListings = (marketId: string) => {
  return useQuery({
    queryKey: ["p2p-listings", marketId],
    queryFn: () =>
      p2pApi.getListings(marketId).then((res) => res.data.data.listings),
    enabled: !!marketId,
    staleTime: 1000 * 30, // 30 seconds
  });
};

export const useAllP2PListings = (marketIds: string[]) => {
  return useQuery({
    queryKey: ["all-p2p-listings", marketIds],
    queryFn: async () => {
      if (!marketIds.length) return [];

      try {
        // Use the correct endpoint: /markets/:marketId/listings for each market
        const allListings = await Promise.all(
          marketIds.map(async (marketId) => {
            try {
              const response = await p2pApi.getListings(marketId);
              return response.data.data.listings || [];
            } catch (error) {
              console.warn(
                `Failed to fetch listings for market ${marketId}:`,
                error
              );
              return [];
            }
          })
        );

        // Flatten all listings into a single array
        return allListings.flat();
      } catch (error) {
        console.warn("Failed to fetch all P2P listings:", error);
        return [];
      }
    },
    enabled: marketIds.length > 0,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });
};

export const useUserListings = (address?: string) => {
  return useQuery({
    queryKey: ["user-listings", address],
    queryFn: () =>
      address
        ? p2pApi
            .getUserListings(address)
            .then((res) => res.data.data || res.data || [])
        : [],
    enabled: !!address,
    staleTime: 1000 * 60, // 1 minute
  });
};

// For now, keep using the direct API calls but these should be updated
// to use the transaction hooks when the user actually triggers the action
export const useCreateListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      marketId: string;
      askPrice: number;
      duration: number;
    }) => {
      // Note: In a real implementation, this should call the transaction hook
      // The transaction hooks should be called from the component level
      console.log(
        "Creating listing - this should use transaction hook from component"
      );
      return p2pApi.createListing(data);
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["p2p-listings", variables.marketId],
      });
      queryClient.invalidateQueries({ queryKey: ["user-listings"] });
    },
  });
};

export const usePurchaseListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listingId: string) => {
      // Note: In a real implementation, this should call the transaction hook
      // The transaction hooks should be called from the component level
      console.log(
        "Purchasing listing - this should use transaction hook from component"
      );
      return p2pApi.purchaseListing(listingId);
    },
    onSuccess: () => {
      // Invalidate all listing queries
      queryClient.invalidateQueries({ queryKey: ["p2p-listings"] });
      queryClient.invalidateQueries({ queryKey: ["user-listings"] });
      queryClient.invalidateQueries({ queryKey: ["markets"] });
    },
  });
};

export const useCancelListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listingId: string) => p2pApi.cancelListing(listingId),
    onSuccess: () => {
      // Invalidate all listing queries
      queryClient.invalidateQueries({ queryKey: ["p2p-listings"] });
      queryClient.invalidateQueries({ queryKey: ["user-listings"] });
    },
  });
};
