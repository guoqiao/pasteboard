/**
 * Copy and Paste module, handles paste events
 * and sends the pasted image to the editor.
 *
 * This technique is described in a blog post I've written:
 * http://joelb.me/blog/2011/code-snippet-accessing-clipboard-images-with-javascript/
 */

const copyAndPaste = (pasteboard: any) => {
  const pasteArea = $("<div>").addClass("pastearea").attr("contenteditable", "");

  const usePasteArea = (() => {
    return $.browser.mozilla;
  })();

  const onPaste = (e: any) => {
    if (usePasteArea) {
      setTimeout(parsePaste, 1);
    } else {
      const items = e.originalEvent.clipboardData.items;
      if (!items) {
        $("html").addClass("no-copyandpaste");
        return;
      }

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (/image/.test(item.type)) {
          pasteboard.fileHandler.readFile(item.getAsFile(), { paste: true });
          return;
        }
      }

      $(pasteboard).trigger("noimagefound", { paste: true });
    }
  };

  const parsePaste = () => {
    const child = pasteArea[0].childNodes[0];
    pasteArea.html("");

    if (child && (child as HTMLElement).tagName === "IMG") {
      const src = (child as HTMLImageElement).src;
      // Base64 encoded
      if (/^data:image/i.test(src)) {
        pasteboard.fileHandler.readData(src, { paste: true });
        return;
      }
      // External image URL
      if (/^http(s?):\/\//i.test(src)) {
        pasteboard.fileHandler.readExternalImage(src, { paste: true });
        return;
      }
    }

    $(pasteboard).trigger("noimagefound", { paste: true });
  };

  const focusPasteArea = () => {
    pasteArea.focus();
  };

  const self = {
    isSupported: () => "onpaste" in document,
    // Initializes the module
    init: () => {
      if (!self.isSupported()) {
        $("html").addClass("no-copyandpaste");
        return;
      }

      // Clipboard fallback
      if (usePasteArea) {
        pasteArea.appendTo("body").focus();
        $(document).on("click", focusPasteArea);
      }

      $(window).on("paste", onPaste);
    },

    // Hides the elements related to the module
    // and stops event listeners
    hide: () => {
      pasteArea.remove();
      $(window).off("paste", onPaste);
      $(document).off("click", focusPasteArea);
    },
  };

  return self;
};

window.moduleLoader.addModule("copyAndPaste", copyAndPaste);