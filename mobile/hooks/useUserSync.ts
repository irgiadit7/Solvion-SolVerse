import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useApiClient, userApi } from "../utils/api";

export const useUserSync = () => {
  const { isSignedIn } = useAuth();
  const {user} = useUser();
  const api = useApiClient();

  const syncUserMutation = useMutation({
    mutationFn: (userData: any) => userApi.syncUser(api, userData),
    onSuccess: (response: any) =>
      console.log("User synced successfully:", response.data.user),
   onError: (error: any) => {
      console.error("User sync failed:", error.response?.data || error.message)
    }
  });

  // auto-sync user when signed in
  useEffect(() => {
    // if user is signed in and user is not synced yet, sync user
    if (isSignedIn && user) {

      const userData = {
        email: user.primaryEmailAddress?.emailAddress,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePic: user.imageUrl,
      };
      syncUserMutation.mutate(userData)
    }
  }, [isSignedIn, user]);

  return{
    isSyncing: syncUserMutation.isPending,
  };
};
