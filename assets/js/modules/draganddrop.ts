/**
 * Drag and Drop module, handles drag / drop events
 * and sends the dropped image to the editor.
 */

const dragAndDrop = (pasteboard: any) => {
  const $body = $("body");
  const $dropArea = $("<div>").addClass("drop-area");

  const onDragStart = () => {
    $body.addClass("dragging");
  };

  const onDragEnd = () => {
    $body.removeClass("dragging");
  };

  const onDragOver = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    e.originalEvent.dataTransfer.dropEffect = "copy";
  };

  const onDragDrop = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    $body.removeClass("dragging");

    // Look for files
    const files = e.originalEvent.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (/image/.test(file.type)) {
        pasteboard.fileHandler.readFile(file, { drop: true });
        return;
      }
    }

    // Look for HTML data
    const htmlData = e.originalEvent.dataTransfer.getData("text/html");
    if (htmlData) {
      let foundImage = false;
      // Loop through everything in the dragged in HTML data to search for images
      $(htmlData).each(function (this: HTMLElement) {
        let img: HTMLImageElement | undefined;
        if (this.tagName === "IMG" && (this as HTMLImageElement).src) {
          img = this as HTMLImageElement;
        } else {
          img = $(this).find("img")[0] as HTMLImageElement;
        }

        if (img) {
          // Base64 encoded
          if (/^data:image/i.test(img.src)) {
            pasteboard.fileHandler.readData(img.src, { drop: true });
            foundImage = true;
            return false;
          }
          // External image URL
          if (/^http(s?):\/\//i.test(img.src)) {
            pasteboard.fileHandler.readExternalImage(img.src, { drop: true });
            foundImage = true;
            return false;
          }
        }
      });
      if (foundImage) return;
    }

    // Look for plain text data
    const textData = e.originalEvent.dataTransfer.getData("text/plain");
    if (textData) {
      // Base64 encoded
      if (/^data:image/i.test(textData)) {
        pasteboard.fileHandler.readData(textData, { drop: true });
        return;
      }

      // External image URL
      if (/^http(s?):\/\//i.test(textData)) {
        pasteboard.fileHandler.readExternalImage(textData, { drop: true });
        return;
      }
    }

    $(pasteboard).trigger("noimagefound", { drop: true });
  };

  const self = {
    isSupported: () => !!(Modernizr.draganddrop && pasteboard.fileHandler.isSupported()),
    // Initializes the module
    init: () => {
      if (!self.isSupported()) {
        $("html").addClass("no-draganddrop-pb"); // add -pb to prevent conflict with Modernizr
        return;
      }

      $body.prepend($dropArea);
      $dropArea.on({
        "dragenter.dragevent": onDragStart,
        "dragleave.dragevent": onDragEnd,
        "dragover.dragevent": onDragOver,
        "drop.dragevent": onDragDrop,
      });
    },

    // Hides the elements related to the module
    // and stops event listeners
    hide: () => {
      $dropArea.off(".dragevent");
      $dropArea.detach();
    },
  };

  return self;
};

window.moduleLoader.addModule("dragAndDrop", dragAndDrop);