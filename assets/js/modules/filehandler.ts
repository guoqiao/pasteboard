/**
 * File handler module, takes care of reading and
 * uploading files.
 */

const fileHandler = (pasteboard: any) => {
  const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB
  let preuploadXHR: XMLHttpRequest | null = null;
  let currentFile: any = null;
  let currentUploadLoaded = 0;
  let currentUploadRatio = 0;

  // Checks the size of the file. If the size
  // exceeds the limit, trigger an error event
  const checkFileSize = (file: any, action: any) => {
    if (file.size > FILE_SIZE_LIMIT) {
      $(pasteboard).trigger("filetoolarge", {
        size: file.size,
        action,
      });
      return false;
    }
    return true;
  };

  // Creates an XHR object and sends the given FormData to the url
  const sendFileXHR = (url: string, formData: FormData) => {
    const onProgress = (e: any) => {
      currentUploadLoaded = e.loaded;
      currentUploadRatio = e.loaded / e.total;
    };
    const onError = (e: any) => {
      log("Error: ", e);
    };

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", onProgress);
    xhr.addEventListener("error", onError);
    xhr.open("POST", url);
    xhr.send(formData);
    return xhr;
  };

  // Crops an image and returns the new file with the callback
  // (If no crop settings are given, the callback is called with
  // the current, uncropped file)
  const cropImage = (
    cropSettings: any,
    callback: (file: Blob, doServerCrop?: boolean) => void
  ) => {
    if (!cropSettings) {
      callback(currentFile);
      return;
    }

    const canvas = document.createElement("canvas");
    if (!canvas.toBlob) {
      callback(currentFile, true);
      return;
    }

    canvas.width = cropSettings.width;
    canvas.height = cropSettings.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(pasteboard.imageEditor.getImage(), -cropSettings.x, -cropSettings.y);
    canvas.toBlob((blob) => callback(blob as Blob));
  };

  const self = {
    isSupported: () => !!(window.FileReader || window.URL || window.webkitURL),
    getCurrentUploadLoaded: () => currentUploadLoaded,
    getCurrentUploadRatio: () => currentUploadRatio,
    getFileSizeLimit: () => FILE_SIZE_LIMIT,

    // Reads a file and sends it over to the image editor.
    readFile: (file: File, action: any) => {
      currentFile = file;
      if (!checkFileSize(currentFile, action)) return;

      // Try creating a file URL first
      const url = window.URL || window.webkitURL;
      if (url) {
        const objectURL = url.createObjectURL(file);

        // Opera just returns the file again, why?
        if (typeof objectURL === "string") {
          $(pasteboard).trigger("imageinserted", {
            image: objectURL,
            action,
            size: currentFile.size,
          });
          return;
        }
      }

      // Else create a data URL
      if (window.FileReader) {
        const fileReader = new FileReader();
        fileReader.onload = (e: any) => {
          $(pasteboard).trigger("imageinserted", {
            image: e.target.result,
            action,
            size: currentFile.size,
          });
        };
        fileReader.readAsDataURL(file);
      }
    },

    // Capture an image from the input video
    readVideo: (video: HTMLVideoElement) => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")!.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        currentFile = blob;
        if (checkFileSize(currentFile, { webcam: true })) {
          $(pasteboard).trigger("imageinserted", {
            image: canvas.toDataURL("image/png"),
            action: { webcam: true },
            size: currentFile.size,
          });
        }
      });
    },

    // Converts the given data into a file, and sends the data
    // to the image editor
    readData: (data: string, action: any) => {
      currentFile = dataURLtoBlob(data);
      if (!checkFileSize(currentFile, action)) return;
      $(pasteboard).trigger("imageinserted", {
        image: data,
        action,
        size: currentFile.size,
      });
    },

    // Reads data from an external image url and creates a file
    readExternalImage: (url: string, action: any) => {
      // Use a local proxy to access the image to avoid going against
      // canvas cross origin policies.
      const proxyURL = "/imageproxy/" + encodeURIComponent(url);
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");

        if (!canvas.toBlob) {
          $(pasteboard).trigger("noimagefound", action);
          return;
        }

        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d")!;
        context.drawImage(image, 0, 0);
        canvas.toBlob((blob) => {
          currentFile = blob;
          if (checkFileSize(currentFile, action)) {
            $(pasteboard).trigger("imageinserted", {
              image: proxyURL,
              action,
              size: currentFile.size,
            });
          }
        });
      };

      image.onerror = () => {
        $(pasteboard).trigger("noimagefound", action);
      };

      image.src = proxyURL;
    },

    // Converts the data to a file object and uploads
    // it to the server, while tracking the progress.
    preuploadFile: () => {
      const id = pasteboard.socketConnection.getID();
      $(pasteboard.socketConnection).off("idReceive");
      if (id) {
        const fd = new FormData();
        fd.append("id", pasteboard.socketConnection.getID());
        fd.append("file", currentFile);
        preuploadXHR = sendFileXHR("/preupload", fd);
      } else {
        $(pasteboard.socketConnection).on("idReceive", self.preuploadFile);
      }
    },

    // Aborts the preupload
    abortPreupload: () => {
      if (preuploadXHR) {
        preuploadXHR.abort();
        $(pasteboard.socketConnection).off("idReceive");
        preuploadXHR = null;
      }
    },

    // Clears partially or preuploaded files from the server
    clearFile: () => {
      $.post("/clearfile", {
        id: pasteboard.socketConnection.getID(),
      });
    },

    // Uploads the file. If the file is already preuploaded, just
    // send the client ID so that the server can upload the file to
    // the cloud.
    uploadFile: (cropSettings: any, callback: (result: any) => void) => {
      if (preuploadXHR) {
        // The image is already uploaded
        if (preuploadXHR.readyState === 4) {
          const postData: any = {
            id: pasteboard.socketConnection.getID(),
          };
          if (cropSettings) {
            postData.cropImage = true;
            postData.crop = cropSettings;
          }

          preuploadXHR = null;
          const xhr = $.post("/upload", postData).error((error) => log(error));

          callback({ xhr, inProgress: false });
        } else {
          // The image is preuploading
          if (cropSettings) {
            // Estimate if it's faster to wait for the
            // preupload to finish and crop the image server-side,
            // or send a new cropped image instead
            const remainingSize = currentFile.size - currentUploadLoaded;

            // Crop the image and check the file size
            cropImage(cropSettings, (blob) => {
              // Add 10% to the cropped size when comparing
              // to make sure we'll benefit from reuploading
              // the cropped part (might need some tweaking)
              if (blob.size * 1.1 < remainingSize) {
                // Reupload cropped part
                currentFile = blob;
                preuploadXHR!.abort();
                preuploadXHR = null;
                self.uploadFile(null, callback);
              } else {
                callback({ xhr: preuploadXHR, inProgress: true, preuploading: true });
              }
            });
          } else {
            callback({ xhr: preuploadXHR, inProgress: true, preuploading: true });
          }
        }
      } else {
        // Force upload
        $(pasteboard.socketConnection).off("idReceive");

        // This only crops if we have crop settings
        cropImage(cropSettings, (file, doServerCrop) => {
          const fd = new FormData();
          fd.append("file", file);
          // Couldn't crop on client
          if (doServerCrop) {
            fd.append("cropImage", "true");
            for (const key of Object.keys(cropSettings)) {
              fd.append(`crop[${key}]`, cropSettings[key]);
            }
          }

          callback({ xhr: sendFileXHR("/upload", fd), inProgress: true });
        });
      }
    },
  };

  return self;
};

window.moduleLoader.addModule("fileHandler", fileHandler);