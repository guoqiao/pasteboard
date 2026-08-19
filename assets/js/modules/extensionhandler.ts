/**
 * Extension handler module, listens to messages posted
 * from the browser extension
 */

const extensionHandler = (pasteboard: any) => {
  return {
    init: () => {
      $(window).on("extensionimageloaded", (e, data: any) => {
        if (!data.imageData) return;
        pasteboard.fileHandler.readData(data.imageData, { extension: true });
      });
    },
  };
};

window.moduleLoader.addModule("extensionHandler", extensionHandler);