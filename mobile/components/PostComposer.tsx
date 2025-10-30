import { useCreatePost } from "@/hooks/useCreatePost";
import { useUser } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
} from "react-native";
import * as ImageManipulator from "expo-image-manipulator";

const PostComposer = () => {
  const {
    content,
    setContent,
    selectedImage,
    setSelectedImage,
    isCreating,
    pickImageFromGallery,
    takePhoto,
    removeImage,
    createPost,
  } = useCreatePost();

  const { user } = useUser();
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<{
    label: string;
    ratio: number;
  } | null>(null);

  const screenWidth = Dimensions.get("window").width;

  const aspectRatios = [
    { label: "Original", ratio: 0 }, // 0 berarti original
    { label: "Square", ratio: 1 }, // 1:1
    { label: "Portrait", ratio: 4 / 5 }, // 4:5
    { label: "Landscape", ratio: 16 / 9 }, // 16:9
  ];

  const handleImageSelected = (imageUri: string) => {
    setTempImage(imageUri);
    setShowCropModal(true);
  };

  const handleCropImage = async () => {
    if (!tempImage) return;

    try {
      if (!selectedAspectRatio || selectedAspectRatio.ratio === 0) {
        // Jika Original, langsung gunakan tanpa crop
        setSelectedImage(tempImage);
        setShowCropModal(false);
        setTempImage(null);
        return;
      }

      // Dapatkan dimensi gambar asli
      const imageInfo = await ImageManipulator.manipulateAsync(
        tempImage,
        [],
        { base64: false }
      );

      const { width, height } = imageInfo;
      const targetRatio = selectedAspectRatio.ratio;

      // Hitung crop area berdasarkan aspect ratio yang dipilih
      let cropWidth, cropHeight, originX, originY;

      const currentRatio = width / height;

      if (currentRatio > targetRatio) {
        // Gambar lebih lebar, crop dari samping
        cropHeight = height;
        cropWidth = height * targetRatio;
        originX = (width - cropWidth) / 2;
        originY = 0;
      } else {
        // Gambar lebih tinggi, crop dari atas/bawah
        cropWidth = width;
        cropHeight = width / targetRatio;
        originX = 0;
        originY = (height - cropHeight) / 2;
      }

      // Lakukan crop
      const croppedImage = await ImageManipulator.manipulateAsync(
        tempImage,
        [
          {
            crop: {
              originX: Math.max(0, originX),
              originY: Math.max(0, originY),
              width: cropWidth,
              height: cropHeight,
            },
          },
          // Resize untuk optimasi
          { resize: { width: 1200 } },
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      setSelectedImage(croppedImage.uri);
      setShowCropModal(false);
      setTempImage(null);
    } catch (error) {
      console.error("Error cropping image:", error);
      // Jika gagal, gunakan gambar original
      setSelectedImage(tempImage);
      setShowCropModal(false);
      setTempImage(null);
    }
  };

  const handleCancelCrop = () => {
    setShowCropModal(false);
    setTempImage(null);
    setSelectedAspectRatio(null);
  };

  // Preview dimensi untuk setiap aspect ratio
  const getPreviewDimensions = (ratio: number) => {
    const previewWidth = screenWidth - 100;
    if (ratio === 0) {
      return { width: previewWidth, height: previewWidth * 0.75 }; // Default preview
    }
    return { width: previewWidth, height: previewWidth / ratio };
  };

  return (
    <>
      <View className="border-b border-gray-100 p-4 bg-white">
        <View className="flex-row">
          <Image
            source={{ uri: user?.imageUrl }}
            className="w-12 h-12 rounded-full mr-3"
          />
          <View className="flex-1">
            <TextInput
              className="text-gray-900 text-lg"
              placeholder="What's happening?"
              placeholderTextColor="#657786"
              multiline
              value={content}
              onChangeText={setContent}
              maxLength={280}
            />
          </View>
        </View>

        {selectedImage && (
          <View className="mt-3 ml-15">
            <View className="relative">
              <Image
                source={{ uri: selectedImage }}
                className="w-full rounded-2xl"
                resizeMode="cover"
                style={{ aspectRatio: undefined }}
              />
              <TouchableOpacity
                className="absolute top-2 right-2 w-8 h-8 bg-black bg-opacity-60 rounded-full items-center justify-center"
                onPress={removeImage}
              >
                <Feather name="x" size={16} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                className="absolute bottom-2 right-2 px-3 py-2 bg-black bg-opacity-60 rounded-lg flex-row items-center"
                onPress={() => {
                  setTempImage(selectedImage);
                  setShowCropModal(true);
                }}
              >
                <Feather name="crop" size={14} color="white" />
                <Text className="text-white text-xs ml-1 font-semibold">Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View className="flex-row justify-between items-center mt-3">
          <View className="flex-row">
            <TouchableOpacity
              className="mr-4"
              onPress={async () => {
                const imageUri = await pickImageFromGallery();
                if (imageUri) handleImageSelected(imageUri);
              }}
            >
              <Feather name="image" size={20} color="#1DA1F2" />
            </TouchableOpacity>
            <TouchableOpacity
              className="mr-4"
              onPress={async () => {
                const imageUri = await takePhoto();
                if (imageUri) handleImageSelected(imageUri);
              }}
            >
              <Feather name="camera" size={20} color="#1DA1F2" />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center">
            {content.length > 0 && (
              <Text
                className={`text-sm mr-3 ${
                  content.length > 260 ? "text-red-500" : "text-gray-500"
                }`}
              >
                {280 - content.length}
              </Text>
            )}

            <TouchableOpacity
              className={`px-6 py-2 rounded-full ${
                content.trim() || selectedImage ? "bg-blue-500" : "bg-gray-300"
              }`}
              onPress={createPost}
              disabled={isCreating || !(content.trim() || selectedImage)}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text
                  className={`font-semibold ${
                    content.trim() || selectedImage ? "text-white" : "text-gray-500"
                  }`}
                >
                  Post
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* CROP MODAL */}
      <Modal
        visible={showCropModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelCrop}
      >
        <View className="flex-1 bg-white">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
            <TouchableOpacity onPress={handleCancelCrop}>
              <Text className="text-blue-500 text-base">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold">Edit Photo</Text>
            <TouchableOpacity onPress={handleCropImage}>
              <Text className="text-blue-500 text-base font-semibold">Done</Text>
            </TouchableOpacity>
          </View>

          {/* Image Preview */}
          <View className="flex-1 items-center justify-center bg-gray-900 p-4">
            {tempImage && selectedAspectRatio && (
              <View
                style={{
                  ...getPreviewDimensions(selectedAspectRatio.ratio),
                  maxWidth: screenWidth - 32,
                  overflow: "hidden",
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: "#1DA1F2",
                }}
              >
                <Image
                  source={{ uri: tempImage }}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  resizeMode="cover"
                />
              </View>
            )}
            {tempImage && !selectedAspectRatio && (
              <Image
                source={{ uri: tempImage }}
                className="w-full h-full"
                resizeMode="contain"
              />
            )}
          </View>

          {/* Aspect Ratio Options */}
          <View className="bg-white px-4 py-4 border-t border-gray-200">
            <Text className="text-sm font-semibold text-gray-700 mb-3">
              Choose aspect ratio
            </Text>
            <View className="flex-row justify-between">
              {aspectRatios.map((aspect) => (
                <TouchableOpacity
                  key={aspect.label}
                  onPress={() => setSelectedAspectRatio(aspect)}
                  className={`flex-1 mx-1 py-3 rounded-lg items-center ${
                    selectedAspectRatio?.label === aspect.label
                      ? "bg-blue-500"
                      : "bg-gray-100"
                  }`}
                >
                  <View className="mb-1">
                    {aspect.ratio === 0 && (
                      <View className="w-8 h-8 border-2 border-gray-400 rounded" />
                    )}
                    {aspect.ratio === 1 && (
                      <View className="w-8 h-8 border-2 border-gray-400 rounded" />
                    )}
                    {aspect.ratio === 4 / 5 && (
                      <View className="w-6 h-8 border-2 border-gray-400 rounded" />
                    )}
                    {aspect.ratio === 16 / 9 && (
                      <View className="w-8 h-5 border-2 border-gray-400 rounded" />
                    )}
                  </View>
                  <Text
                    className={`text-xs font-medium ${
                      selectedAspectRatio?.label === aspect.label
                        ? "text-white"
                        : "text-gray-700"
                    }`}
                  >
                    {aspect.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default PostComposer;