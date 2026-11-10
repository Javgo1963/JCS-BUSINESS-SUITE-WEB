"use client";

import {
  Camera,
  ImagePlus,
  LoaderCircle,
} from "lucide-react";

import {
  doc,
  updateDoc,
} from "firebase/firestore";

import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import {
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import {
  db,
  storage,
} from "@/core/firebase/firebase";

// =======================================================
// MARK: - Types
// =======================================================

interface JCSUserAvatarPickerProps {
  firebaseUID: string;

  displayName?: string;
  imageURL?: string;

  disabled?: boolean;
  editable?: boolean;

  size?: "small" | "medium" | "large";

  className?: string;

  onUpdated?: (
    imageURL: string
  ) => void | Promise<void>;
}

// =======================================================
// MARK: - Constants
// =======================================================

const MAXIMUM_FILE_SIZE =
  8 * 1024 * 1024;

const OUTPUT_IMAGE_SIZE =
  720;

const JPEG_QUALITY =
  0.86;

// =======================================================
// MARK: - Helpers
// =======================================================

function cleanText(
  value:
    | string
    | null
    | undefined
): string {
  return value?.trim() ?? "";
}

function firstInitial(
  displayName?: string
): string {
  const normalized =
    cleanText(
      displayName
    );

  return (
    normalized
      .charAt(0)
      .toUpperCase() ||
    "U"
  );
}

function createImageElement(
  source: string
): Promise<HTMLImageElement> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const image =
        new Image();

      image.onload = () => {
        resolve(image);
      };

      image.onerror = () => {
        reject(
          new Error(
            "The selected image could not be loaded."
          )
        );
      };

      image.src = source;
    }
  );
}

async function compressImage(
  file: File
): Promise<Blob> {
  const objectURL =
    URL.createObjectURL(
      file
    );

  try {
    const image =
      await createImageElement(
        objectURL
      );

    const sourceWidth =
      image.naturalWidth;

    const sourceHeight =
      image.naturalHeight;

    const squareSize =
      Math.min(
        sourceWidth,
        sourceHeight
      );

    const sourceX =
      Math.max(
        0,
        (
          sourceWidth -
          squareSize
        ) / 2
      );

    const sourceY =
      Math.max(
        0,
        (
          sourceHeight -
          squareSize
        ) / 2
      );

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      OUTPUT_IMAGE_SIZE;

    canvas.height =
      OUTPUT_IMAGE_SIZE;

    const context =
      canvas.getContext(
        "2d"
      );

    if (!context) {
      throw new Error(
        "The image processor is not available."
      );
    }

    context.drawImage(
      image,

      sourceX,
      sourceY,
      squareSize,
      squareSize,

      0,
      0,
      OUTPUT_IMAGE_SIZE,
      OUTPUT_IMAGE_SIZE
    );

    return await new Promise<Blob>(
      (
        resolve,
        reject
      ) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(
                new Error(
                  "The profile image could not be prepared."
                )
              );

              return;
            }

            resolve(blob);
          },
          "image/jpeg",
          JPEG_QUALITY
        );
      }
    );
  } finally {
    URL.revokeObjectURL(
      objectURL
    );
  }
}

// =======================================================
// MARK: - Component
// =======================================================

export default function JCSUserAvatarPicker({
  firebaseUID,

  displayName,
  imageURL,

  disabled = false,
  editable = true,

  size = "medium",

  className = "",

  onUpdated,
}: JCSUserAvatarPickerProps) {
  const inputReference =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    localImageURL,
    setLocalImageURL,
  ] = useState(
    cleanText(
      imageURL
    )
  );

  const [
    isUploading,
    setIsUploading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const canEdit =
    editable &&
    !disabled &&
    Boolean(
      cleanText(
        firebaseUID
      )
    );

  const initial =
    firstInitial(
      displayName
    );

  const openPhotoPicker =
    (): void => {
      if (
        !canEdit ||
        isUploading
      ) {
        return;
      }

      inputReference
        .current
        ?.click();
    };

  const handleFileSelection =
    async (
      event:
        ChangeEvent<HTMLInputElement>
    ): Promise<void> => {
      const selectedFile =
        event.target
          .files?.[0];

      event.target.value =
        "";

      if (!selectedFile) {
        return;
      }

      setErrorMessage("");

      if (
        !selectedFile.type.startsWith(
          "image/"
        )
      ) {
        setErrorMessage(
          "Please select an image file."
        );

        return;
      }

      if (
        selectedFile.size >
        MAXIMUM_FILE_SIZE
      ) {
        setErrorMessage(
          "The selected image must be smaller than 8 MB."
        );

        return;
      }

      const normalizedUID =
        cleanText(
          firebaseUID
        );

      if (!normalizedUID) {
        setErrorMessage(
          "The authenticated user could not be identified."
        );

        return;
      }

      try {
        setIsUploading(true);

        const compressedImage =
          await compressImage(
            selectedFile
          );

        const storageReference =
          ref(
            storage,
            [
              "users",
              normalizedUID,
              "image.jpg",
            ].join("/")
          );

        await uploadBytes(
          storageReference,
          compressedImage,
          {
            contentType:
              "image/jpeg",

            customMetadata: {
              firebaseUID:
                normalizedUID,

              imagePurpose:
                "profile-avatar",
            },
          }
        );

        const downloadURL =
          await getDownloadURL(
            storageReference
          );

        const userReference =
          doc(
            db,
            "users",
            normalizedUID
          );

        await updateDoc(
          userReference,
          {
            profileImageURL:
              downloadURL,

            profileImageUpdatedAt:
              new Date(),
          }
        );

        setLocalImageURL(
          downloadURL
        );

        await onUpdated?.(
          downloadURL
        );
      } catch (
        error: unknown
      ) {
        console.error(
          "Unable to update profile image:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "The profile image could not be updated."
        );
      } finally {
        setIsUploading(
          false
        );
      }
    };

  const combinedClassName = [
    "jcs-user-avatar-picker",

    `jcs-user-avatar-picker--${size}`,

    canEdit
      ? "jcs-user-avatar-picker--editable"
      : "",

    isUploading
      ? "jcs-user-avatar-picker--uploading"
      : "",

    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
  <div className="jcs-user-avatar-picker-wrapper">
    {canEdit ? (
     <div
  className={combinedClassName}
  role="button"
  tabIndex={isUploading ? -1 : 0}
  aria-label="Choose profile photo"
  title="Choose profile photo"
  aria-disabled={isUploading}
  onClick={isUploading ? undefined : openPhotoPicker}
  onKeyDown={(event) => {
    if (!isUploading && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openPhotoPicker();
    }
  }}
>
        {localImageURL ? (
          <img
            src={localImageURL}
            alt={`${displayName ?? "User"} profile`}
          />
        ) : (
          <span className="jcs-user-avatar-picker__initial">
            {initial}
          </span>
        )}

        <span className="jcs-user-avatar-picker__edit">
  {isUploading ? (
    <LoaderCircle
      size={14}
      strokeWidth={2}
      className="jcs-user-avatar-picker__spinner"
    />
  ) : size === "large" ? (
    <ImagePlus
      size={14}
      strokeWidth={2}
    />
  ) : (
    <Camera
      size={13}
      strokeWidth={2}
    />
  )}
</span>
</div>
) : (
  <span
    className={combinedClassName}
    aria-label={`${displayName ?? "User"} profile photo`}
  >
    {localImageURL ? (
      <img
        src={localImageURL}
        alt={`${displayName ?? "User"} profile`}
      />
    ) : (
          <span className="jcs-user-avatar-picker__initial">
            {initial}
          </span>
        )}
      </span>
    )}

    <input
      ref={inputReference}
      type="file"
      accept="image/*"
      className="jcs-user-avatar-picker__input"
      aria-hidden="true"
      tabIndex={-1}
      onChange={(event) => {
        void handleFileSelection(event);
      }}
    />

    {errorMessage && (
      <span
        className="jcs-user-avatar-picker__error"
        role="alert"
      >
        {errorMessage}
      </span>
    )}
  </div>
  );
}