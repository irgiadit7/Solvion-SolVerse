import { useComments } from "@/hooks/useComments";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Post } from "@/types";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
// import * as FileSystem from "expo-file-system"; // <-- Hapus ini, sudah tidak dipakai

interface CommentsModalProps {
  selectedPost: Post;
  onClose: () => void;
}

const CommentsModal = ({ selectedPost, onClose }: CommentsModalProps) => {
  // --- STATE & HOOKS (Sudah Benar) ---
  const { createComment, isCreatingComment } = useComments();
  const { currentUser } = useCurrentUser();

  const [commentText, setCommentText] = useState("");
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(
    null
  );
  const [imageRatio, setImageRatio] = useState(1);
  // --- BATAS STATE & HOOKS ---

  const handleClose = () => {
    onClose();
    setCommentText("");
    removeSelectedImage();
  };

  useEffect(() => {
    if (selectedPost?.image) {
      Image.getSize(selectedPost.image, (width, height) => {
        if (height > 0) {
          setImageRatio(width / height);
        }
      });
    }
  }, [selectedPost?.image]);

  // --- FUNGSI IMAGE PICKER (Yang Diperbaiki) ---
  const handleImagePicker = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Izin dibutuhkan",
        "Izin untuk mengakses galeri foto dibutuhkan!"
      );
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    if (pickerResult.canceled) {
      return;
    }

    if (pickerResult.assets && pickerResult.assets.length > 0) {
      const asset = pickerResult.assets[0];
      const uri = asset.uri;
      const base64 = asset.base64;

      setSelectedImageUri(uri);

      if (base64) {
        setSelectedImageBase64(`data:image/jpeg;base64,${base64}`);
      } else {
        console.error("ImagePicker did not return base64 data.");
        Alert.alert("Error", "Gagal memproses data gambar.");
      }
    } // <-- INI ADALAH '}' YANG SEBELUMNYA HILANG
  }; // <-- Kurung kurawal penutup untuk 'handleImagePicker'

  const removeSelectedImage = () => {
    setSelectedImageUri(null);
    setSelectedImageBase64(null);
  };
  // --- BATAS FUNGSI IMAGE PICKER ---

  // --- FUNGSI SUBMIT (Sudah Benar) ---
  const handleCommentSubmit = () => {
    if (!selectedPost) return;

    createComment(selectedPost._id, commentText, selectedImageBase64);

    setCommentText("");
    removeSelectedImage();
  };
  // --- BATAS FUNGSI SUBMIT ---

  return (
    <Modal
      visible={!!selectedPost}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      {/* MODAL HEADER (Tidak Berubah) */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={handleClose}>
          <Text className="text-blue-500 text-lg">Close</Text>
        </TouchableOpacity>
        <Text className="text-lg font-semibold">Comments</Text>
        <View className="w-12" />
      </View>

      {selectedPost && (
        <ScrollView className="flex-1">
          {/* ORIGINAL POST (Tidak Berubah) */}
          <View className="border-b border-gray-100 bg-white p-4">
            <View className="flex-row">
              <Image
                // Tambahkan '?' untuk jaga-jaga
                source={{ uri: selectedPost.user?.profilePicture }}
                className="size-12 rounded-full mr-3"
              />
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Text className="font-bold text-gray-900 mr-1">
                    {selectedPost.user?.firstName} {selectedPost.user?.lastName}
                  </Text>
                  <Text className="text-gray-500 ml-1">
                    @{selectedPost.user?.username}
                  </Text>
                </View>
                {selectedPost.content && (
                  <Text className="text-gray-900 text-base leading-5 mb-3">
                    {selectedPost.content}
                  </Text>
                )}
                {selectedPost.image && (
                  <Image
                    source={{ uri: selectedPost.image }}
                    className="w-full rounded-2xl mb-3"
                    style={{ aspectRatio: imageRatio }}
                    resizeMode="contain"
                  />
                )}
              </View>
            </View>
          </View>

          {/* --- AREA COMMENTS LIST DENGAN CONSOLE.LOG --- */}
          {selectedPost.comments.map((comment) => {
            // INI LOG UNTUK DEBUGGING
            console.log("DATA KOMENTAR DARI POST:", comment);

            return (
              <View
                key={comment._id}
                className="border-b border-gray-100 bg-white p-4"
              >
                <View className="flex-row">
                  <Image
                    source={{ uri: comment.user?.profilePicture }}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Text className="font-bold text-gray-900 mr-1">
                        {comment.user?.firstName} {comment.user?.lastName}
                      </Text>
                      <Text className="text-gray-500 text-sm ml-1">
                        @{comment.user?.username}
                      </Text>
                    </View>

                    {/* Tampilkan teks jika ada */}
                    {comment.content && (
                      <Text className="text-gray-900 text-base leading-5 mb-2">
                        {comment.content}
                      </Text>
                    )}

                    {/* Tampilkan gambar jika ada */}
                    {comment.image && (
                      <Image
                        source={{ uri: comment.image }}
                        className="w-full max-h-64 rounded-lg mt-1"
                        resizeMode="cover"
                      />
                    )}
                  </View>
                </View>
              </View>
            );
          })}
          {/* --- BATAS AREA COMMENTS LIST --- */}

          {/* --- ADD COMMENT INPUT (Sudah Benar) --- */}
          <View className="p-4 border-t border-gray-100">
            <View className="flex-row">
              <Image
                source={{ uri: currentUser?.profilePicture }}
                className="size-10 rounded-full mr-3"
              />

              <View className="flex-1">
                <TextInput
                  className="border border-gray-200 rounded-lg p-3 text-base mb-3"
                  placeholder="Tulis komentar..."
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                {selectedImageUri && (
                  <View className="relative w-24 h-24 mb-3">
                    <Image
                      source={{ uri: selectedImageUri }}
                      className="w-24 h-24 rounded-lg"
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={removeSelectedImage}
                      className="absolute -top-2 -right-2 bg-black/60 p-1 rounded-full"
                    >
                      <Feather name="x" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                )}

                <View className="flex-row justify-between items-center">
                  <TouchableOpacity
                    onPress={handleImagePicker}
                    className="p-2"
                  >
                    <Feather name="image" size={24} color="#6B7280" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    className={`px-4 py-2 rounded-lg ${
                      commentText.trim() || selectedImageUri
                        ? "bg-blue-500"
                        : "bg-gray-300"
                    }`}
                    onPress={handleCommentSubmit}
                    disabled={
                      isCreatingComment ||
                      (!commentText.trim() && !selectedImageUri)
                    }
                  >
                    {isCreatingComment ? (
                      <ActivityIndicator size={"small"} color={"white"} />
                    ) : (
                      <Text
                        className={`font-semibold ${
                          commentText.trim() || selectedImageUri
                            ? "text-white"
                            : "text-gray-500"
                        }`}
                      >
                        Reply
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          {/* --- BATAS PERUBAHAN INPUT --- */}
        </ScrollView>
      )}
    </Modal>
  );
};

export default CommentsModal;