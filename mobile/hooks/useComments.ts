import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { useApiClient } from "../utils/api";

interface CreateCommentParams {
  postId: string;
  content: string;
  base64Image: string | null;
}

export const useComments = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const createCommentMutation = useMutation({
    mutationFn: async ({
      postId,
      content,
      base64Image,
    }: CreateCommentParams) => {
      const response = await api.post(`/comments/${postId}`, {
        content,
        base64Image,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: any) => {
      console.error(
    "DETAIL ERROR DARI SERVER:",
    JSON.stringify(error.response?.data, null, 2)
  );
  const message = error.response?.data?.message || "Gagal memposting komentar. Coba lagi.";
  Alert.alert("Error", message)
    },
  });


  const createComment = (
    postId: string,
    content: string,
    base64Image: string | null
  ) => {
    if (!content.trim() && !base64Image) {
      Alert.alert(
        "Komentar Kosong",
        "Silakan tulis sesuatu atau pilih gambar!"
      );
      return;
    }
    createCommentMutation.mutate({
      postId,
      content: content.trim(),
      base64Image,
    });
  };

  return {
    createComment,
    isCreatingComment: createCommentMutation.isPending,
  };
};